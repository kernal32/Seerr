import type { MediaDetails, SearchResult } from '@server/api/downloaders/types';
import { MediaType } from '@server/constants/media';
import axios from 'axios';
import {
  COMICVINE_API_BASE,
  COMICVINE_VOLUME_FIELD_LIST,
} from './constants';
import {
  comicVineVolumeApiId,
  normalizeComicVinePublisherId,
  normalizeComicVineVolumeId,
} from './normalizeId';
import type {
  ComicVineApiResponse,
  ComicVineImage,
  ComicVineSearchResponse,
  ComicVineVolume,
  ComicVineVolumesListResponse,
} from './types';

export interface ComicVineListVolumesOptions {
  filter?: string;
  sort: string;
  limit: number;
  offset: number;
}

export interface ComicVineListVolumesResult {
  results: SearchResult[];
  totalResults: number;
}
import { formatComicVineDescription } from './formatDescription';

const pickCoverUrl = (image?: ComicVineImage): string | undefined =>
  image?.super_url ??
  image?.medium_url ??
  image?.screen_large_url ??
  image?.thumb_url;

const mapVolumeToSearchResult = (volume: {
  id: number;
  name: string;
  deck?: string;
  start_year?: string;
  publisher?: { id: number; name: string };
  image?: ComicVineImage;
}): SearchResult => ({
  id: normalizeComicVineVolumeId(String(volume.id)),
  title: volume.name,
  subtitle: volume.publisher?.name,
  year: volume.start_year,
  coverUrl: pickCoverUrl(volume.image),
  overview: volume.deck,
  mediaType: MediaType.COMIC,
  foreignAuthorId: volume.publisher
    ? normalizeComicVinePublisherId(String(volume.publisher.id))
    : undefined,
});

class ComicVineClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  public async listVolumes(
    options: ComicVineListVolumesOptions
  ): Promise<ComicVineListVolumesResult> {
    const response = await axios.get<ComicVineVolumesListResponse>(
      `${COMICVINE_API_BASE}/volumes/`,
      {
        params: {
          api_key: this.apiKey,
          format: 'json',
          field_list: COMICVINE_VOLUME_FIELD_LIST,
          sort: options.sort,
          limit: options.limit,
          offset: options.offset,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        timeout: 15000,
      }
    );

    if (response.data.status_code !== 1) {
      throw new Error(response.data.error || 'Comic Vine volume list failed');
    }

    return {
      results: (response.data.results ?? []).map(mapVolumeToSearchResult),
      totalResults: response.data.number_of_total_results ?? 0,
    };
  }

  public async search(term: string, limit = 20): Promise<SearchResult[]> {
    const response = await axios.get<ComicVineSearchResponse>(
      `${COMICVINE_API_BASE}/search/`,
      {
        params: {
          api_key: this.apiKey,
          format: 'json',
          query: term.trim(),
          resources: 'volume',
          limit,
        },
        timeout: 15000,
      }
    );

    if (response.data.status_code !== 1) {
      throw new Error(response.data.error || 'Comic Vine search failed');
    }

    return (response.data.results ?? []).map(mapVolumeToSearchResult);
  }

  public async getVolume(id: string): Promise<MediaDetails> {
    const apiId = comicVineVolumeApiId(id);
    const response = await axios.get<ComicVineApiResponse<ComicVineVolume>>(
      `${COMICVINE_API_BASE}/volume/${apiId}/`,
      {
        params: {
          api_key: this.apiKey,
          format: 'json',
        },
        timeout: 15000,
      }
    );

    if (response.data.status_code !== 1 || !response.data.results) {
      throw new Error(response.data.error || 'Comic Vine volume not found');
    }

    const volume = response.data.results;
    const mapped = mapVolumeToSearchResult(volume);

    return {
      ...mapped,
      overview: formatComicVineDescription(
        volume.description ?? volume.deck ?? mapped.overview ?? ''
      ),
      author: volume.publisher?.name,
      publisher: volume.publisher?.name,
    };
  }
}

export default ComicVineClient;
