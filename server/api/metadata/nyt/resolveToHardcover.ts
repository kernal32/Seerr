import HardcoverClient from '@server/api/metadata/hardcover/client';
import type { SearchResult } from '@server/api/downloaders/types';
import type { MediaType } from '@server/constants/media';
import type { BookDownloaderSubtype } from '@server/lib/settings';
import type { NytBook } from './types';

const nytBookToFallbackResult = (
  book: NytBook,
  mediaType: MediaType
): SearchResult => ({
  id: `nyt:${book.primary_isbn13 || book.primary_isbn10 || book.title}`,
  title: book.title,
  subtitle: book.author,
  overview: book.description,
  coverUrl: book.book_image,
  mediaType,
});

const resolveSingleNytBook = async (
  book: NytBook,
  client: HardcoverClient | undefined,
  mediaSubtype: BookDownloaderSubtype,
  mediaType: MediaType,
  hardcoverToken: string | undefined
): Promise<SearchResult | null> => {
  try {
    const isbn = book.primary_isbn13?.trim() || book.primary_isbn10?.trim();

    if (client && isbn) {
      const match = await client.findBookByIsbn(isbn, mediaSubtype, mediaType);

      if (match) {
        return match;
      }
    }

    if (client) {
      const query = `${book.title} ${book.author}`.trim();
      const matches = await client.search(query, mediaSubtype, mediaType);

      if (matches[0]) {
        return matches[0];
      }
    }

    if (hardcoverToken) {
      return null;
    }

    return nytBookToFallbackResult(book, mediaType);
  } catch {
    return hardcoverToken ? null : nytBookToFallbackResult(book, mediaType);
  }
};

export const resolveNytBooksToSearchResults = async (
  books: NytBook[],
  mediaSubtype: BookDownloaderSubtype,
  mediaType: MediaType,
  hardcoverToken: string | undefined
): Promise<SearchResult[]> => {
  const client = hardcoverToken
    ? new HardcoverClient(hardcoverToken)
    : undefined;

  const resolved = await Promise.all(
    books.map((book) =>
      resolveSingleNytBook(book, client, mediaSubtype, mediaType, hardcoverToken)
    )
  );

  return resolved.filter((result): result is SearchResult => result !== null);
};
