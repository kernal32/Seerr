export interface ReadarrSystemStatus {
  version: string;
  urlBase?: string;
}

export interface ReadarrRootFolder {
  id: number;
  path: string;
}

export interface ReadarrProfile {
  id: number;
  name: string;
}

export interface ReadarrBookSearchResult {
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

export interface ReadarrLookupEdition {
  foreignEditionId: string;
  monitored?: boolean;
  title?: string;
}

export interface ReadarrLookupBook {
  id?: number;
  foreignBookId: string;
  title: string;
  foreignAuthorId?: string;
  author?: {
    foreignAuthorId: string;
    authorName?: string;
  };
  editions?: ReadarrLookupEdition[];
}

export interface ReadarrAddBookAuthor {
  foreignAuthorId: string;
  qualityProfileId: number;
  metadataProfileId: number;
  rootFolderPath: string;
  monitored: boolean;
  addOptions?: {
    searchForMissingBooks?: boolean;
  };
}

export interface ReadarrAddBookPayload {
  foreignBookId: string;
  monitored: boolean;
  author: ReadarrAddBookAuthor;
  editions?: {
    foreignEditionId: string;
    monitored: boolean;
    manualAdd?: boolean;
  }[];
  addOptions?: {
    searchForNewBook?: boolean;
  };
  tags?: number[];
}

export interface ReadarrAddBookResponse {
  id: number;
  foreignBookId: string;
  title: string;
}

export interface ReadarrBook {
  id: number;
  foreignBookId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  releaseDate?: string;
  author?: {
    authorName: string;
    foreignAuthorId: string;
  };
}
