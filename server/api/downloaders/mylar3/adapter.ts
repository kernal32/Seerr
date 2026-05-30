import ComicVineClient from '@server/api/metadata/comicvine/client';
import { normalizeComicVineVolumeId } from '@server/api/metadata/comicvine/normalizeId';
import type {
  AddPayload,
  AddResult,
  DownloaderAdapter,
  MediaDetails,
  RemoveFromLibraryPayload,
  SearchResult,
} from '@server/api/downloaders/types';
import { MediaStatus } from '@server/constants/media';
import type { ComicDownloaderSettings } from '@server/lib/settings';
import Mylar3Client from './client';
import { hasDownloadedComicIssues } from './processComicStatus';

export class Mylar3Adapter implements DownloaderAdapter {
  private client: Mylar3Client;

  private settings: ComicDownloaderSettings;

  private comicVine?: ComicVineClient;

  constructor(settings: ComicDownloaderSettings) {
    this.settings = settings;
    this.client = new Mylar3Client(settings);

    if (settings.comicVineApiKey?.trim()) {
      this.comicVine = new ComicVineClient(settings.comicVineApiKey);
    }
  }

  public async testConnection(): Promise<void> {
    await this.client.testConnection();
  }

  public async search(term: string): Promise<SearchResult[]> {
    if (!this.comicVine) {
      throw new Error(
        'Comic Vine API key is not configured on the comic downloader.'
      );
    }

    return this.comicVine.search(term);
  }

  public async getDetails(id: string): Promise<MediaDetails> {
    if (!this.comicVine) {
      throw new Error(
        'Comic Vine API key is not configured on the comic downloader.'
      );
    }

    return this.comicVine.getVolume(id);
  }

  public async addToLibrary(payload: AddPayload): Promise<AddResult> {
    const comicId = normalizeComicVineVolumeId(payload.metadataId);

    await this.client.addComic(comicId);

    const numericId = Number(comicId);

    return {
      externalServiceId: Number.isNaN(numericId) ? 0 : numericId,
      externalServiceSlug: comicId,
    };
  }

  public async removeFromLibrary(
    payload: RemoveFromLibraryPayload
  ): Promise<void> {
    await this.client.deleteComic(String(payload.externalServiceId), false);
  }

  public async getAvailability(externalServiceId: number): Promise<MediaStatus> {
    const response = await this.client.getComic(String(externalServiceId));

    return hasDownloadedComicIssues(response.issues)
      ? MediaStatus.AVAILABLE
      : MediaStatus.PROCESSING;
  }
}
