export interface BinderySystemStatus {
  version: string;
  urlBase?: string;
}

export interface BinderyRootFolder {
  id: number;
  path: string;
}

export interface BinderyQualityProfile {
  id: number;
  name: string;
}

export interface BinderyBookSearchResult {
  foreignBookId: string;
  foreignAuthorId?: string;
  title: string;
  authorName?: string;
  author?: {
    foreignAuthorId: string;
    authorName: string;
  };
  overview?: string;
  description?: string;
  releaseDate?: string;
  imageUrl?: string;
  year?: number;
}

export interface BinderyAddBookResponse {
  id: number;
  foreignBookId: string;
  title: string;
  status: string;
}

export interface BinderyBook {
  id: number;
  foreignBookId: string;
  authorId: number;
  title: string;
  description: string;
  imageUrl: string;
  releaseDate?: string;
  status: string;
  author?: {
    authorName: string;
    foreignAuthorId: string;
  };
}
