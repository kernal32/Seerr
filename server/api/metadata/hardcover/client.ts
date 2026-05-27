import type { MediaDetails, SearchResult } from '@server/api/downloaders/types';
import type { MediaType } from '@server/constants/media';
import axios from 'axios';
import { HARDCOVER_GRAPHQL_URL, HARDCOVER_ID_PREFIX } from './constants';
import { normalizeHardcoverApiToken } from './normalizeToken';
import {
  hardcoverAuthorFromBook,
  hardcoverBookMatchesMediaType,
  hardcoverForeignBookId,
  parseHardcoverBookSearchResults,
  type HardcoverSearchBook,
} from './parseSearchResults';

interface HardcoverGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const mapHardcoverBook = (
  book: HardcoverSearchBook,
  mediaType: MediaType
): SearchResult => {
  const author = hardcoverAuthorFromBook(book);
  const releaseYear = book.release_year;

  return {
    id: hardcoverForeignBookId(book),
    title: book.title,
    subtitle: author?.name,
    year:
      releaseYear !== undefined && releaseYear !== null
        ? String(releaseYear).slice(0, 4)
        : undefined,
    coverUrl: book.image_url,
    overview: book.description,
    mediaType,
    foreignAuthorId: author?.foreignAuthorId,
  };
};

const safeMapHardcoverBook = (
  book: HardcoverSearchBook,
  mediaType: MediaType
): SearchResult | null => {
  try {
    return mapHardcoverBook(book, mediaType);
  } catch {
    return null;
  }
};

class HardcoverClient {
  private readonly token: string;

  constructor(token: string) {
    this.token = normalizeHardcoverApiToken(token);
  }

  public async search(
    term: string,
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType
  ): Promise<SearchResult[]> {
    const response = await this.query<{
      search: { results: unknown };
    }>(
      `query SearchBooks($query: String!, $queryType: String!, $perPage: Int!) {
        search(query: $query, query_type: $queryType, per_page: $perPage) {
          results
        }
      }`,
      {
        query: term.trim(),
        queryType: 'Book',
        perPage: 20,
      }
    );

    const parsed = parseHardcoverBookSearchResults(response.search.results);

    return parsed
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);
  }

  public async getDetails(
    foreignId: string,
    mediaType: MediaType
  ): Promise<MediaDetails> {
    const lookupId = foreignId.startsWith(HARDCOVER_ID_PREFIX)
      ? foreignId.slice(HARDCOVER_ID_PREFIX.length)
      : foreignId;
    const numericId = Number(lookupId);
    const useNumericId =
      !Number.isNaN(numericId) && String(numericId) === lookupId;

    const response = await this.query<{
      books: HardcoverSearchBook[];
    }>(
      useNumericId
        ? `query GetBook($id: Int!) {
            books(where: {id: {_eq: $id}}, limit: 1) {
              id
              title
              slug
              description
              release_year
              image { url }
              contributions {
                author { id name slug }
              }
            }
          }`
        : `query GetBook($slug: String!) {
            books(where: {slug: {_eq: $slug}}, limit: 1) {
              id
              title
              slug
              description
              release_year
              image { url }
              contributions {
                author { id name slug }
              }
            }
          }`,
      useNumericId ? { id: numericId } : { slug: lookupId }
    );

    const book = response.books[0];

    if (!book) {
      throw new Error('Book not found');
    }

    const mapped = mapHardcoverBook(
      {
        ...book,
        image_url: extractHardcoverImageUrl(book),
      },
      mediaType
    );

    return {
      ...mapped,
      author: mapped.subtitle,
    };
  }

  private async query<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<T> {
    const response = await axios.post<HardcoverGraphQLResponse<T>>(
      HARDCOVER_GRAPHQL_URL,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data.errors?.length) {
      throw new Error(
        response.data.errors.map((error) => error.message).join('; ')
      );
    }

    if (!response.data.data) {
      throw new Error('Hardcover returned an empty response');
    }

    return response.data.data;
  }
}

const extractHardcoverImageUrl = (
  book: HardcoverSearchBook
): string | undefined => {
  if (book.image_url?.trim()) {
    return book.image_url.trim();
  }

  if (
    book.image &&
    typeof book.image === 'object' &&
    'url' in book.image &&
    typeof book.image.url === 'string'
  ) {
    return book.image.url.trim() || undefined;
  }

  return undefined;
};

export default HardcoverClient;
