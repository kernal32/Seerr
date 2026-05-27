import ExternalAPI from '@server/api/externalapi';
import ServarrBase from '@server/api/servarr/base';
import type { BookDownloaderSettings } from '@server/lib/settings';
import type {
  BinderyAddBookResponse,
  BinderyBook,
  BinderyBookSearchResult,
  BinderyQualityProfile,
  BinderyRootFolder,
  BinderySystemStatus,
} from './types';

class BinderyClient extends ExternalAPI {
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

  public getSystemStatus(): Promise<BinderySystemStatus> {
    return this.get<BinderySystemStatus>('/system/status');
  }

  public async searchBooks(term: string): Promise<BinderyBookSearchResult[]> {
    const data = await this.get<BinderyBookSearchResult[] | { error: string }>(
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

  public getBook(id: number): Promise<BinderyBook> {
    return this.get<BinderyBook>(`/book/${id}`);
  }

  public lookupBookByForeignId(
    foreignBookId: string
  ): Promise<BinderyBookSearchResult | null> {
    return this.searchBooks(foreignBookId).then((results) => {
      const match =
        results.find((result) => result.foreignBookId === foreignBookId) ??
        results[0];

      return match ?? null;
    });
  }

  public addBook(payload: {
    foreignBookId: string;
    foreignAuthorId: string;
    authorName?: string;
    searchOnAdd?: boolean;
  }): Promise<BinderyAddBookResponse> {
    return this.post<BinderyAddBookResponse>('/author/book', payload);
  }

  public getRootFolders(): Promise<BinderyRootFolder[]> {
    return this.get<BinderyRootFolder[]>('/rootfolder');
  }

  public getQualityProfiles(): Promise<BinderyQualityProfile[]> {
    return this.get<BinderyQualityProfile[]>('/qualityprofile');
  }
}

export default BinderyClient;
