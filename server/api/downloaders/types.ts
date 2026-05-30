import type { MediaStatus, MediaType } from '@server/constants/media';

export interface SearchOptions {
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  year?: string;
  coverUrl?: string;
  overview?: string;
  mediaType: MediaType;
  foreignAuthorId?: string;
}

export interface MediaDetails extends SearchResult {
  author?: string;
  publisher?: string;
}

export interface AddPayload {
  metadataId: string;
  title: string;
  rootFolder?: string;
  profileId?: number;
  tags?: number[];
  searchOnAdd?: boolean;
  foreignAuthorId?: string;
  authorName?: string;
}

export interface AddResult {
  externalServiceId: number;
  externalServiceSlug: string;
}

export interface RemoveFromLibraryPayload {
  externalServiceId: number;
  deleteFiles?: boolean;
}

export interface DownloaderAdapter {
  testConnection(): Promise<void>;
  search(term: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDetails(id: string): Promise<MediaDetails>;
  addToLibrary(payload: AddPayload): Promise<AddResult>;
  removeFromLibrary?(payload: RemoveFromLibraryPayload): Promise<void>;
  getAvailability?(externalServiceId: number): Promise<MediaStatus>;
}
