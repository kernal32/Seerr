export interface NytBook {
  rank: number;
  rank_last_week?: number;
  weeks_on_list?: number;
  primary_isbn10?: string;
  primary_isbn13?: string;
  publisher?: string;
  description?: string;
  title: string;
  author: string;
  contributor?: string;
  book_image?: string;
  amazon_product_url?: string;
}

export interface NytListResult {
  list_name: string;
  display_name: string;
  published_date?: string;
  bestsellers_date?: string;
  books: NytBook[];
}

export interface NytListResponse {
  status: string;
  num_results: number;
  results: NytListResult;
}

export interface NytOverviewList {
  list_name: string;
  display_name: string;
  list_name_encoded?: string;
  updated?: string;
  books: NytBook[];
}

export interface NytOverviewResponse {
  status: string;
  num_results: number;
  results: {
    published_date?: string;
    bestsellers_date?: string;
    lists: NytOverviewList[];
  };
}
