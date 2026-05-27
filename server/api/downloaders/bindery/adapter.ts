import BinderyClient from '@server/api/downloaders/bindery/client';
import { isBinderyMetadataSearchUnavailable } from '@server/api/downloaders/bindery/metadataErrors';
import type { BinderyBookSearchResult } from '@server/api/downloaders/bindery/types';
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
  result: BinderyBookSearchResult
): BinderyBookSearchResult => ({
  ...result,
  authorName: result.authorName ?? result.author?.authorName,
  foreignAuthorId: result.foreignAuthorId ?? result.author?.foreignAuthorId,
});

const mapSearchResult = (
  result: BinderyBookSearchResult,
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

export class BinderyAdapter implements DownloaderAdapter {
  private client: BinderyClient;

  private hardcover?: HardcoverClient;

  private mediaType: MediaType;

  private mediaSubtype: BookDownloaderSettings['mediaSubtype'];

  constructor(settings: BookDownloaderSettings) {
    this.client = new BinderyClient(settings, BinderyClient.buildUrl(settings));
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
      const lookup = await this.client.lookupBookByForeignId(id);

      if (!lookup) {
        throw new Error('Book not found');
      }

      return {
        ...mapSearchResult(lookup, this.mediaType),
        author: lookup.authorName,
        foreignAuthorId: lookup.foreignAuthorId,
      };
    } catch (error) {
      if (this.hardcover && isBinderyMetadataSearchUnavailable(error)) {
        return this.hardcover.getDetails(id, this.mediaType);
      }

      throw error;
    }
  }

  public async addToLibrary(payload: AddPayload): Promise<AddResult> {
    if (!payload.foreignAuthorId) {
      throw new Error('foreignAuthorId is required to add a book');
    }

    const added = await this.client.addBook({
      foreignBookId: payload.metadataId,
      foreignAuthorId: payload.foreignAuthorId,
      authorName: payload.authorName,
      searchOnAdd: payload.searchOnAdd ?? true,
    });

    return {
      externalServiceId: added.id,
      externalServiceSlug: added.foreignBookId,
    };
  }
}

export default BinderyAdapter;
