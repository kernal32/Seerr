import { isBinderyMetadataSearchUnavailable } from '@server/api/downloaders/bindery/metadataErrors';
import type { BinderyBookSearchResult } from '@server/api/downloaders/bindery/types';
import { buildReadarrAddPayload } from '@server/api/downloaders/readarr/buildAddPayload';
import ReadarrClient from '@server/api/downloaders/readarr/client';
import { isBookshelfDuplicateEditionError } from '@server/api/downloaders/readarr/formatClientError';
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
import { hardcoverClientForDownloader } from '@server/api/downloaders/hardcoverClientForDownloader';
import HardcoverClient from '@server/api/metadata/hardcover/client';
import { HARDCOVER_ID_PREFIX } from '@server/api/metadata/hardcover/constants';
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
    this.hardcover = hardcoverClientForDownloader(settings);
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
    if (id.startsWith(HARDCOVER_ID_PREFIX)) {
      if (this.hardcover) {
        return this.hardcover.getDetails(id, this.mediaType);
      }

      throw new Error(
        'Hardcover API token is not configured on the book downloader.'
      );
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

  private async buildLookupTerms(
    metadataId: string,
    title?: string,
    foreignAuthorId?: string
  ): Promise<string[]> {
    const terms = buildReadarrLookupTerms(metadataId, title);

    if (this.hardcover && metadataId.startsWith(HARDCOVER_ID_PREFIX)) {
      try {
        const hints = await this.hardcover.getBookshelfLookupHints(
          metadataId,
          this.mediaSubtype
        );

        for (const term of hints.terms) {
          if (!terms.includes(term)) {
            terms.unshift(term);
          }
        }
      } catch {
        // Hardcover edition hints are optional enrichment for Bookshelf lookup
      }
    }

    if (
      foreignAuthorId &&
      title?.trim() &&
      !terms.some((term) => term.includes(title.trim()))
    ) {
      terms.push(title.trim());
    }

    return terms;
  }

  private async resolveLookupBook(
    metadataId: string,
    title: string | undefined,
    foreignAuthorId?: string
  ): Promise<ReadarrLookupBook | null> {
    const terms = await this.buildLookupTerms(
      metadataId,
      title,
      foreignAuthorId
    );

    for (const term of terms) {
      const results = await this.client.lookupBooks(term);
      const match = pickReadarrLookupBook(results, metadataId, foreignAuthorId);

      if (match) {
        return match;
      }
    }

    return null;
  }

  private async resolveExistingLibraryBook(
    metadataId: string,
    title: string | undefined,
    foreignAuthorId: string | undefined,
    foreignBookId: string
  ): Promise<AddResult | null> {
    const lookupMatch = await this.resolveLookupBook(
      metadataId,
      title,
      foreignAuthorId
    );

    if (lookupMatch?.id) {
      return {
        externalServiceId: lookupMatch.id,
        externalServiceSlug: lookupMatch.foreignBookId,
      };
    }

    const libraryBooks = await this.client.getLibraryBooks();
    const libraryMatch = libraryBooks.find(
      (book) => book.foreignBookId === foreignBookId
    );

    if (libraryMatch) {
      return {
        externalServiceId: libraryMatch.id,
        externalServiceSlug: libraryMatch.foreignBookId,
      };
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
        `Book not found in Bookshelf metadata for "${payload.metadataId}". Try searching for the title in Bookshelf manually to confirm the Hardcover edition exists.`
      );
    }

    const addPayload = buildReadarrAddPayload(lookup, {
      qualityProfileId,
      metadataProfileId,
      rootFolderPath,
      searchOnAdd: payload.searchOnAdd ?? true,
      tags: payload.tags,
      fallbackForeignAuthorId: payload.foreignAuthorId,
      fallbackAuthorName: payload.authorName,
    });

    try {
      const added = await this.client.addBook(addPayload);

      return {
        externalServiceId: added.id,
        externalServiceSlug: added.foreignBookId,
      };
    } catch (error) {
      if (!isBookshelfDuplicateEditionError(error)) {
        throw error;
      }

      const existing = await this.resolveExistingLibraryBook(
        payload.metadataId,
        payload.title,
        payload.foreignAuthorId,
        lookup.foreignBookId
      );

      if (existing) {
        return existing;
      }

      throw new Error(
        `Bookshelf already has this edition but Bookarr could not resolve the existing library book for "${payload.metadataId}". Open the title in Bookshelf and retry the request.`
      );
    }
  }
}

export default ReadarrAdapter;
