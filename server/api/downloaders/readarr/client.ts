import ExternalAPI from '@server/api/externalapi';
import ServarrBase from '@server/api/servarr/base';
import type { BookDownloaderSettings } from '@server/lib/settings';
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

  public lookupBooks(term: string): Promise<ReadarrLookupBook[]> {
    return this.get<ReadarrLookupBook[]>('/book/lookup', {
      params: { term },
    });
  }

  public addBook(
    payload: ReadarrAddBookPayload
  ): Promise<ReadarrAddBookResponse> {
    return this.post<ReadarrAddBookResponse>(
      '/book',
      // REASON: ExternalAPI.post expects Record<string, unknown>; Servarr body has no index signature
      payload as unknown as Record<string, unknown>
    );
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
}

export default ReadarrClient;
