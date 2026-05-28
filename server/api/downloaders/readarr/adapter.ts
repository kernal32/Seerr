import { isBinderyMetadataSearchUnavailable } from '@server/api/downloaders/bindery/metadataErrors';
import type { BinderyBookSearchResult } from '@server/api/downloaders/bindery/types';
import { buildReadarrAddPayload } from '@server/api/downloaders/readarr/buildAddPayload';
import ReadarrClient from '@server/api/downloaders/readarr/client';
import {
  buildReadarrLookupTerms,
  pickReadarrLookupBook,
} from '@server/api/downloaders/readarr/resolveLookupTerms';
import type {
  ReadarrBookSearchResult,
  ReadarrLookupBook,
} from '@server/api/downloaders/readarr/types';
import type {
  AddPayload,
  AddResult,
  DownloaderAdapter,
  MediaDetails,
  SearchResult,
} from '@server/api/downloaders/types';
import HardcoverClient from '@server/api/metadata/hardcover/client';
import { HARDCOVER_ID_PREFIX } from '@server/api/metadata/hardcover/constants';
import { normalizeHardcoverApiToken } from '@server/api/metadata/hardcover/normalizeToken';
import { MediaType } from '@server/constants/media';
import type { BookDownloaderSettings } from '@server/lib/settings';

const normalizeSearchResult = (
  result: ReadarrBookSearchResult | BinderyBookSearchResult
): ReadarrBookSearchResult => ({
  ...result,
  authorName: result.authorName ?? result.author?.authorName,
  foreignAuthorId: result.foreignAuthorId ?? result.author?.foreignAuthorId,
});

const mapSearchResult = (
  result: ReadarrBookSearchResult,
  mediaType: MediaType
): SearchResult => {
  const normalized = normalizeSearchResult(result);

  return {
    id: normalized.foreignBookId,
    title: normalized.title,
    subtitle: normalized.authorName,
    year: normalized.releaseDate?.slice(0, 4) ?? normalized.year?.toString(),
    coverUrl: normalized.imageUrl,
    overview: normalized.overview ?? normalized.description,
    mediaType,
    foreignAuthorId: normalized.foreignAuthorId,
  };
};

export class ReadarrAdapter implements DownloaderAdapter {
  private client: ReadarrClient;

  private settings: BookDownloaderSettings;

  private hardcover?: HardcoverClient;

  private mediaType: MediaType;

  private mediaSubtype: BookDownloaderSettings['mediaSubtype'];

  constructor(settings: BookDownloaderSettings) {
    this.settings = settings;
    this.client = new ReadarrClient(settings, ReadarrClient.buildUrl(settings));
    this.mediaType =
      settings.mediaSubtype === 'audiobook'
        ? MediaType.AUDIOBOOK
        : MediaType.BOOK;
    this.mediaSubtype = settings.mediaSubtype;

    if (settings.hardcoverApiToken?.trim()) {
      this.hardcover = new HardcoverClient(
        normalizeHardcoverApiToken(settings.hardcoverApiToken)
      );
    }
  }

  public async testConnection(): Promise<void> {
    await this.client.getSystemStatus();
  }

  public async search(term: string): Promise<SearchResult[]> {
    if (this.hardcover) {
      return this.hardcover.search(term, this.mediaSubtype, this.mediaType);
    }

    const results = await this.client.searchBooks(term);

    return results.map((result) => mapSearchResult(result, this.mediaType));
  }

  public async getDetails(id: string): Promise<MediaDetails> {
    if (id.startsWith(HARDCOVER_ID_PREFIX) && this.hardcover) {
      return this.hardcover.getDetails(id, this.mediaType);
    }

    const numericId = Number(id);

    if (!Number.isNaN(numericId) && String(numericId) === id) {
      const book = await this.client.getBook(numericId);

      return {
        id: book.foreignBookId,
        title: book.title,
        subtitle: book.author?.authorName,
        year: book.releaseDate?.slice(0, 4),
        coverUrl: book.imageUrl,
        overview: book.description,
        mediaType: this.mediaType,
        author: book.author?.authorName,
        foreignAuthorId: book.author?.foreignAuthorId,
      };
    }

    try {
      const lookup = await this.resolveLookupBook(id, undefined);

      if (!lookup) {
        throw new Error('Book not found');
      }

      return {
        id: lookup.foreignBookId,
        title: lookup.title,
        subtitle: lookup.author?.authorName,
        mediaType: this.mediaType,
        author: lookup.author?.authorName,
        foreignAuthorId: lookup.author?.foreignAuthorId,
      };
    } catch (error) {
      if (this.hardcover && isBinderyMetadataSearchUnavailable(error)) {
        return this.hardcover.getDetails(id, this.mediaType);
      }

      throw error;
    }
  }

  private async resolveLookupBook(
    metadataId: string,
    title: string | undefined,
    foreignAuthorId?: string
  ): Promise<ReadarrLookupBook | null> {
    const terms = buildReadarrLookupTerms(metadataId, title);

    for (const term of terms) {
      const results = await this.client.lookupBooks(term);
      const match = pickReadarrLookupBook(results, metadataId, foreignAuthorId);

      if (match) {
        return match;
      }
    }

    return null;
  }

  public async addToLibrary(payload: AddPayload): Promise<AddResult> {
    const qualityProfileId = payload.profileId ?? this.settings.activeProfileId;
    const metadataProfileId = this.settings.activeMetadataProfileId;
    const rootFolderPath = payload.rootFolder ?? this.settings.activeDirectory;

    if (!qualityProfileId) {
      throw new Error('Quality profile is required to add a book to Bookshelf');
    }

    if (!metadataProfileId) {
      throw new Error(
        'Metadata profile is required to add a book to Bookshelf'
      );
    }

    if (!rootFolderPath) {
      throw new Error('Root folder is required to add a book to Bookshelf');
    }

    const lookup = await this.resolveLookupBook(
      payload.metadataId,
      payload.title,
      payload.foreignAuthorId
    );

    if (!lookup) {
      throw new Error(
        `Book not found in Bookshelf metadata for "${payload.metadataId}"`
      );
    }

    const addPayload = buildReadarrAddPayload(lookup, {
      qualityProfileId,
      metadataProfileId,
      rootFolderPath,
      searchOnAdd: payload.searchOnAdd ?? true,
      tags: payload.tags,
    });

    const added = await this.client.addBook(addPayload);

    return {
      externalServiceId: added.id,
      externalServiceSlug: added.foreignBookId,
    };
  }
}

export default ReadarrAdapter;
