import { HARDCOVER_ID_PREFIX } from './constants';

interface HardcoverSearchAuthor {
  id?: number | string;
  name?: string;
  slug?: string;
}

interface HardcoverSearchContribution {
  author?: HardcoverSearchAuthor;
}

export interface HardcoverSearchBook {
  id?: number | string;
  title: string;
  slug?: string;
  description?: string;
  release_year?: number | string | null;
  image?: { url?: string } | string | null;
  image_url?: string;
  cached_image?: { url?: string } | string | null;
  author_names?: string[];
  contributions?: HardcoverSearchContribution[];
  has_audiobook?: boolean | string | number;
  has_ebook?: boolean | string | number;
  genres?: string[] | string;
  moods?: string[] | string;
  tags?: string[] | string;
  series_names?: string[] | string;
}

const truthy = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 't', 'yes', 'y'].includes(value.toLowerCase());
  }

  return false;
};

const extractImageUrl = (book: HardcoverSearchBook): string | undefined => {
  if (book.image_url?.trim()) {
    return book.image_url.trim();
  }

  for (const candidate of [book.image, book.cached_image]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (
      candidate &&
      typeof candidate === 'object' &&
      'url' in candidate &&
      typeof candidate.url === 'string' &&
      candidate.url.trim()
    ) {
      return candidate.url.trim();
    }
  }

  return undefined;
};

const documentFromHit = (hit: unknown): HardcoverSearchBook | null => {
  if (!hit || typeof hit !== 'object') {
    return null;
  }

  if ('document' in hit && hit.document && typeof hit.document === 'object') {
    return hit.document as HardcoverSearchBook;
  }

  return hit as HardcoverSearchBook;
};

export const parseHardcoverBookSearchResults = (
  results: unknown
): HardcoverSearchBook[] => {
  if (!results) {
    return [];
  }

  if (typeof results === 'string') {
    try {
      return parseHardcoverBookSearchResults(JSON.parse(results));
    } catch {
      return [];
    }
  }

  let rawItems: unknown[] = [];

  if (Array.isArray(results)) {
    rawItems = results;
  } else if (typeof results === 'object' && results !== null) {
    if ('hits' in results && Array.isArray(results.hits)) {
      rawItems = results.hits;
    } else {
      return [];
    }
  }

  const books: HardcoverSearchBook[] = [];

  for (const item of rawItems) {
    const document = documentFromHit(item);

    if (!document?.title?.trim()) {
      continue;
    }

    books.push({
      ...document,
      title: document.title.trim(),
      description: document.description?.trim(),
      slug: document.slug?.trim(),
      image_url: extractImageUrl(document),
      has_audiobook: truthy(document.has_audiobook),
      has_ebook: truthy(document.has_ebook),
    });
  }

  return books;
};

export const hardcoverBookMatchesMediaType = (
  book: HardcoverSearchBook,
  mediaSubtype: 'book' | 'audiobook'
): boolean => {
  const hasAudiobook = book.has_audiobook;
  const hasEbook = book.has_ebook;

  // GraphQL book queries omit format flags — do not exclude unknown rows.
  if (hasAudiobook === undefined && hasEbook === undefined) {
    return true;
  }

  if (mediaSubtype === 'audiobook') {
    return truthy(hasAudiobook);
  }

  return truthy(hasEbook) || !truthy(hasAudiobook);
};

export const hardcoverAuthorFromBook = (
  book: HardcoverSearchBook
): { name: string; foreignAuthorId?: string } | undefined => {
  const contribution = book.contributions?.find((entry) =>
    entry.author?.name?.trim()
  )?.author;

  if (contribution?.name?.trim()) {
    const slug = contribution.slug?.trim();
    const id = contribution.id;

    return {
      name: contribution.name.trim(),
      foreignAuthorId:
        slug !== undefined && slug !== ''
          ? `${HARDCOVER_ID_PREFIX}${slug}`
          : id !== undefined && String(id).trim() !== ''
            ? `${HARDCOVER_ID_PREFIX}${id}`
            : undefined,
    };
  }

  const fallbackName = book.author_names?.find((name) => name.trim())?.trim();

  if (fallbackName) {
    return { name: fallbackName };
  }

  return undefined;
};

export const hardcoverForeignBookId = (book: HardcoverSearchBook): string => {
  const slug = book.slug?.trim();

  if (slug) {
    return `${HARDCOVER_ID_PREFIX}${slug}`;
  }

  if (book.id !== undefined && String(book.id).trim() !== '') {
    return `${HARDCOVER_ID_PREFIX}${book.id}`;
  }

  throw new Error('Hardcover search result is missing slug and id');
};

export const safeHardcoverForeignBookId = (
  book: HardcoverSearchBook
): string | undefined => {
  try {
    return hardcoverForeignBookId(book);
  } catch {
    return undefined;
  }
};
