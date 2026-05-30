import axios from 'axios';
import type { ComicDownloaderSettings } from '@server/lib/settings';

export interface Mylar3ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface Mylar3ApiFailureResponse {
  success: false;
  error?: string;
  data?: string;
}

export type Mylar3ApiResponse<T = unknown> =
  | Mylar3ApiSuccessResponse<T>
  | Mylar3ApiFailureResponse;

export interface Mylar3ComicRecord {
  ComicID: string;
  ComicName?: string;
  ComicYear?: string;
  ComicPublisher?: string;
  Status?: string;
}

export interface Mylar3IssueRecord {
  IssueID?: string;
  Issue_Number?: string;
  Status?: string;
}

export interface Mylar3GetComicResponse {
  comic: Mylar3ComicRecord[];
  issues: Mylar3IssueRecord[];
  annuals?: Mylar3IssueRecord[];
}

class Mylar3Client {
  private readonly settings: ComicDownloaderSettings;

  private readonly baseUrl: string;

  constructor(settings: ComicDownloaderSettings) {
    this.settings = settings;
    this.baseUrl = Mylar3Client.buildUrl(settings);
  }

  public static buildUrl(
    settings: Pick<
      ComicDownloaderSettings,
      'hostname' | 'port' | 'useSsl' | 'baseUrl'
    >
  ): string {
    if (settings.baseUrl) {
      return settings.baseUrl.replace(/\/$/, '');
    }

    const protocol = settings.useSsl ? 'https' : 'http';

    return `${protocol}://${settings.hostname}:${settings.port}`;
  }

  private async request<T>(
    cmd: string,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<T> {
    const response = await axios.get<Mylar3ApiResponse<T>>(
      `${this.baseUrl}/api`,
      {
        params: {
          cmd,
          apikey: this.settings.apiKey,
          ...params,
        },
        timeout: 30000,
      }
    );

    const payload = response.data;

    if (!payload.success) {
      const message =
        typeof payload.data === 'string'
          ? payload.data
          : payload.error ?? `Mylar3 ${cmd} failed`;

      throw new Error(message);
    }

    return payload.data;
  }

  public testConnection(): Promise<unknown> {
    return this.request('getIndex');
  }

  public addComic(comicId: string): Promise<string> {
    return this.request<string>('addComic', { id: comicId });
  }

  public getComic(comicId: string): Promise<Mylar3GetComicResponse> {
    return this.request<Mylar3GetComicResponse>('getComic', { id: comicId });
  }

  public deleteComic(
    comicId: string,
    deleteDirectory = false
  ): Promise<string> {
    return this.request<string>('delComic', {
      id: comicId,
      directory: deleteDirectory ? 'true' : 'false',
    });
  }
}

export default Mylar3Client;
