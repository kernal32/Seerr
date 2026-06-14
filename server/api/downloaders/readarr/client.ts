import ExternalAPI from '@server/api/externalapi';
import ServarrBase from '@server/api/servarr/base';
import type { BookDownloaderSettings } from '@server/lib/settings';
import { formatReadarrClientError } from './formatClientError';
import type {
  ReadarrAddBookPayload,
  ReadarrAddBookResponse,
  ReadarrBook,
  ReadarrBookSearchResult,
  ReadarrLookupBook,
  ReadarrProfile,
  ReadarrRootFolder,
  ReadarrSystemStatus,
} from './types';

// Bookshelf/Readarr: POST /api/v1/book — see pennydreadful/bookshelf BookController.AddBook
class ReadarrClient extends ExternalAPI {
  constructor(
    settings: Pick<BookDownloaderSettings, 'apiKey'>,
    baseUrl: string
  ) {
    super(baseUrl, {}, { headers: { 'X-Api-Key': settings.apiKey } });
  }

  public static buildUrl(
    settings: Pick<
      BookDownloaderSettings,
      'hostname' | 'port' | 'useSsl' | 'baseUrl'
    >,
    path = '/api/v1'
  ): string {
    return ServarrBase.buildUrl(settings as BookDownloaderSettings, path);
  }

  public getSystemStatus(): Promise<ReadarrSystemStatus> {
    return this.get<ReadarrSystemStatus>('/system/status');
  }

  public async searchBooks(term: string): Promise<ReadarrBookSearchResult[]> {
    const data = await this.get<ReadarrBookSearchResult[] | { error: string }>(
      '/search/book',
      {
        params: { term },
      }
    );

    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'error' in data
    ) {
      throw new Error(String(data.error));
    }

    return data;
  }

  public getBook(id: number): Promise<ReadarrBook> {
    return this.get<ReadarrBook>(`/book/${id}`);
  }

  // Bookshelf/Readarr: PUT /api/v1/book/{id}
  public async updateBook(book: ReadarrBook): Promise<ReadarrBook> {
    try {
      const response = await this.axios.put<ReadarrBook>(`/book/${book.id}`, book);

      return response.data;
    } catch (error) {
      throw formatReadarrClientError(error);
    }
  }

  // Bookshelf/Readarr: POST /api/v1/command — name BookSearch
  public async bookSearch(bookIds: number[]): Promise<void> {
    try {
      await this.axios.post('/command', {
        name: 'BookSearch',
        bookIds,
      });
    } catch (error) {
      throw formatReadarrClientError(error);
    }
  }

  public getLibraryBooks(): Promise<ReadarrBook[]> {
    return this.get<ReadarrBook[]>('/book');
  }

  public lookupBooks(term: string): Promise<ReadarrLookupBook[]> {
    return this.get<ReadarrLookupBook[]>('/book/lookup', {
      params: { term },
    });
  }

  public async addBook(
    payload: ReadarrAddBookPayload
  ): Promise<ReadarrAddBookResponse> {
    try {
      return await this.post<ReadarrAddBookResponse>(
        '/book',
        // REASON: ExternalAPI.post expects Record<string, unknown>; Servarr body has no index signature
        payload as unknown as Record<string, unknown>
      );
    } catch (error) {
      throw formatReadarrClientError(error);
    }
  }

  public getRootFolders(): Promise<ReadarrRootFolder[]> {
    return this.get<ReadarrRootFolder[]>('/rootfolder');
  }

  public getQualityProfiles(): Promise<ReadarrProfile[]> {
    return this.get<ReadarrProfile[]>('/qualityprofile');
  }

  public getMetadataProfiles(): Promise<ReadarrProfile[]> {
    return this.get<ReadarrProfile[]>('/metadataprofile');
  }

  // Readarr API: DELETE /api/v1/book/{id}
  public async deleteBook(id: number, deleteFiles = false): Promise<void> {
    await this.axios.delete(`/book/${id}`, {
      params: { deleteFiles },
    });
  }
}

export default ReadarrClient;
