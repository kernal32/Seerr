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
  safeHardcoverForeignBookId,
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
    const parsed = await this.searchIndexedBooks(term);

    return parsed
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);
  }

  private async searchIndexedBooks(
    term: string,
    options?: {
      fields?: string;
      sort?: string;
      perPage?: number;
      page?: number;
    }
  ): Promise<HardcoverSearchBook[]> {
    const perPage = options?.perPage ?? 20;
    const page = options?.page ?? 1;
    const query = term.trim();

    if (options?.fields || options?.sort) {
      const response = await this.query<{
        search: { results: unknown };
      }>(
        `query SearchBooks($query: String!, $queryType: String!, $perPage: Int!, $page: Int!, $fields: String, $sort: String) {
          search(
            query: $query
            query_type: $queryType
            per_page: $perPage
            page: $page
            fields: $fields
            sort: $sort
          ) {
            results
          }
        }`,
        {
          query,
          queryType: 'Book',
          perPage,
          page,
          fields: options.fields,
          sort: options.sort,
        }
      );

      return parseHardcoverBookSearchResults(response.search.results);
    }

    const response = await this.query<{
      search: { results: unknown };
    }>(
      `query SearchBooks($query: String!, $queryType: String!, $perPage: Int!, $page: Int!) {
        search(query: $query, query_type: $queryType, per_page: $perPage, page: $page) {
          results
        }
      }`,
      {
        query,
        queryType: 'Book',
        perPage,
        page,
      }
    );

    return parseHardcoverBookSearchResults(response.search.results);
  }

  public async findBookByIsbn(
    isbn: string,
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType
  ): Promise<SearchResult | null> {
    const results = await this.search(isbn, mediaSubtype, mediaType);
    return results[0] ?? null;
  }

  public async getBooksByAuthor(
    authorName: string,
    excludeBookId: string,
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType,
    limit = 20,
    foreignAuthorId?: string
  ): Promise<SearchResult[]> {
    const authorSlug = foreignAuthorId?.startsWith(HARDCOVER_ID_PREFIX)
      ? foreignAuthorId.slice(HARDCOVER_ID_PREFIX.length)
      : undefined;

    if (authorSlug) {
      const bySlug = await this.getBooksByAuthorSlug(
        authorSlug,
        excludeBookId,
        mediaSubtype,
        mediaType,
        limit
      );

      if (bySlug.length > 0) {
        return bySlug;
      }
    }

    const books = await this.searchIndexedBooks(authorName, {
      sort: 'users_read_count:desc',
      perPage: limit + 5,
    });

    return books
      .filter((book) => safeHardcoverForeignBookId(book) !== excludeBookId)
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .slice(0, limit)
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);
  }

  private async getBooksByAuthorSlug(
    authorSlug: string,
    excludeBookId: string,
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType,
    limit: number
  ): Promise<SearchResult[]> {
    const response = await this.query<{ books: HardcoverSearchBook[] }>(
      `query AuthorBooks($slug: String!, $limit: Int!) {
        books(
          where: { contributions: { author: { slug: { _eq: $slug } } } }
          limit: $limit
          order_by: { users_read_count: desc }
        ) {
          id
          title
          slug
          description
          release_year
          image { url }
          contributions { author { id name slug } }
        }
      }`,
      { slug: authorSlug, limit: limit + 5 }
    );

    return response.books
      .map((book) => ({
        ...book,
        image_url: extractHardcoverImageUrl(book),
      }))
      .filter((book) => safeHardcoverForeignBookId(book) !== excludeBookId)
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .slice(0, limit)
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);
  }

  /** Hardcover search index — genres/moods from the source book, ranked by popularity. */
  public async getSimilarBooks(
    bookForeignId: string,
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType,
    limit = 20
  ): Promise<SearchResult[]> {
    const lookupId = bookForeignId.startsWith(HARDCOVER_ID_PREFIX)
      ? bookForeignId.slice(HARDCOVER_ID_PREFIX.length)
      : bookForeignId;

    let sourceHits = await this.searchIndexedBooks(lookupId, {
      perPage: 10,
    });
    let sourceBook =
      sourceHits.find((book) => {
        const id = safeHardcoverForeignBookId(book);
        return (
          id === bookForeignId ||
          book.slug === lookupId ||
          String(book.id) === lookupId
        );
      }) ?? sourceHits[0];

    if (!sourceBook) {
      try {
        const details = await this.getDetails(bookForeignId, mediaType);
        sourceHits = await this.searchIndexedBooks(details.title, {
          perPage: 10,
        });
        sourceBook =
          sourceHits.find(
            (book) => safeHardcoverForeignBookId(book) === bookForeignId
          ) ?? sourceHits[0];
      } catch {
        return [];
      }
    }

    const styleQuery = firstSearchFacet(sourceBook, [
      'genres',
      'moods',
      'tags',
      'series_names',
    ]);

    if (!styleQuery) {
      if (sourceBook?.title?.trim()) {
        const byTitle = await this.searchIndexedBooks(sourceBook.title, {
          sort: 'users_read_count:desc',
          perPage: limit + 5,
        });

        return byTitle
          .filter((book) => safeHardcoverForeignBookId(book) !== bookForeignId)
          .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
          .slice(0, limit)
          .map((book) => safeMapHardcoverBook(book, mediaType))
          .filter((result): result is SearchResult => result !== null);
      }

      return [];
    }

    const books = await this.searchIndexedBooks(styleQuery, {
      sort: 'users_read_count:desc',
      perPage: limit + 5,
    });

    return books
      .filter((book) => safeHardcoverForeignBookId(book) !== bookForeignId)
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .slice(0, limit)
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);
  }

  public async getRankedBooks(
    sort: 'activities_count:desc' | 'users_read_count:desc',
    mediaSubtype: 'book' | 'audiobook',
    mediaType: MediaType,
    page: number,
    perPage: number
  ): Promise<{
    page: number;
    totalPages: number;
    totalResults: number;
    results: SearchResult[];
  }> {
    const response = await this.query<{
      search: { results: unknown };
    }>(
      `query RankedBooks($query: String!, $queryType: String!, $perPage: Int!, $page: Int!, $sort: String!) {
        search(
          query: $query
          query_type: $queryType
          per_page: $perPage
          page: $page
          sort: $sort
        ) {
          results
        }
      }`,
      {
        query: '',
        queryType: 'Book',
        perPage,
        page,
        sort,
      }
    );

    const parsed = parseHardcoverBookSearchResults(response.search.results);
    const results = parsed
      .filter((book) => hardcoverBookMatchesMediaType(book, mediaSubtype))
      .map((book) => safeMapHardcoverBook(book, mediaType))
      .filter((result): result is SearchResult => result !== null);

    const totalPages = results.length === perPage ? page + 4 : page;
    const totalResults = (page - 1) * perPage + results.length;

    return {
      page,
      totalPages,
      totalResults,
      results,
    };
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

const firstSearchFacet = (
  book: HardcoverSearchBook | undefined,
  keys: ('genres' | 'moods' | 'tags' | 'series_names')[]
): string | undefined => {
  if (!book) {
    return undefined;
  }

  for (const key of keys) {
    const value = book[key];

    if (Array.isArray(value)) {
      const match = value.find((entry) => String(entry).trim());

      if (match) {
        return String(match).trim();
      }
    }

    if (typeof value === 'string' && value.trim()) {
      return value.split(',')[0]?.trim() || undefined;
    }
  }

  return undefined;
};

export default HardcoverClient;
