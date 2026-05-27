import { NYT_BOOKS_API_BASE } from './constants';
import { matchNytOverviewList, nytListSlug } from './encodeNytListSlug';
import type {
  NytListResponse,
  NytListResult,
  NytOverviewList,
  NytOverviewResponse,
} from './types';
import axios from 'axios';

const OVERVIEW_CACHE_TTL_MS = 15 * 60 * 1000;
let overviewCache:
  | {
      expiresAt: number;
      lists: NytOverviewList[];
    }
  | undefined;

class NytBooksClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  public async testConnection(): Promise<void> {
    await this.getOverview();
  }

  /** Current week's overview — all lists and books (no pagination since May 2025). */
  public async getOverview(
    publishedDate?: string
  ): Promise<NytOverviewList[]> {
    const response = await axios.get<NytOverviewResponse>(
      `${NYT_BOOKS_API_BASE}/lists/overview.json`,
      {
        params: {
          'api-key': this.apiKey,
          ...(publishedDate ? { published_date: publishedDate } : {}),
        },
        timeout: 30000,
      }
    );

    if (response.data.status !== 'OK' || !response.data.results?.lists) {
      throw new Error('NYT Books API returned an unexpected overview response');
    }

    return response.data.results.lists;
  }

  /** GET /lists/current/{list}.json */
  public async getCurrentList(listName: string): Promise<NytListResult> {
    const response = await axios.get<NytListResponse>(
      `${NYT_BOOKS_API_BASE}/lists/current/${encodeURIComponent(listName)}.json`,
      {
        params: { 'api-key': this.apiKey },
        timeout: 30000,
      }
    );

    if (response.data.status !== 'OK' || !response.data.results?.books) {
      throw new Error(`NYT Books API returned no data for list "${listName}"`);
    }

    return response.data.results;
  }

  private async getOverviewCached(): Promise<NytOverviewList[]> {
    if (overviewCache && overviewCache.expiresAt > Date.now()) {
      return overviewCache.lists;
    }

    const lists = await this.getOverview();
    overviewCache = {
      expiresAt: Date.now() + OVERVIEW_CACHE_TTL_MS,
      lists,
    };

    return lists;
  }

  /**
   * Resolves list books by encoded slug. Falls back to the overview payload when
   * /lists/current/{slug} 404s (e.g. monthly lists use *-monthly encoded slugs).
   */
  public async getListBooks(requestedSlug: string): Promise<NytListResult> {
    const slug = requestedSlug.trim();

    try {
      return await this.getCurrentList(slug);
    } catch (error) {
      const is404 =
        axios.isAxiosError(error) && error.response?.status === 404;

      if (!is404) {
        throw error;
      }
    }

    const overviewLists = await this.getOverviewCached();
    const match = matchNytOverviewList(slug, overviewLists);

    if (!match?.books?.length) {
      throw new Error(`NYT Books API returned no data for list "${slug}"`);
    }

    return {
      list_name: match.list_name,
      display_name: match.display_name,
      books: match.books,
    };
  }
}

export default NytBooksClient;
