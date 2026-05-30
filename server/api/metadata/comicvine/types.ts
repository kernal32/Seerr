export interface ComicVineImage {
  icon_url?: string;
  medium_url?: string;
  screen_url?: string;
  screen_large_url?: string;
  small_url?: string;
  super_url?: string;
  thumb_url?: string;
  tiny_url?: string;
}

export interface ComicVinePublisher {
  id: number;
  name: string;
}

export interface ComicVineVolume {
  id: number;
  name: string;
  deck?: string;
  description?: string;
  start_year?: string;
  publisher?: ComicVinePublisher;
  image?: ComicVineImage;
  count_of_issues?: number;
}

export interface ComicVineSearchVolumeResult {
  id: number;
  name: string;
  deck?: string;
  start_year?: string;
  publisher?: ComicVinePublisher;
  image?: ComicVineImage;
}

export interface ComicVineApiResponse<T> {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: T;
}

export interface ComicVineSearchResponse {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: ComicVineSearchVolumeResult[];
}

export interface ComicVineVolumesListResponse {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: ComicVineSearchVolumeResult[];
}
