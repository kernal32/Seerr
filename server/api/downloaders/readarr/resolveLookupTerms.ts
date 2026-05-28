import { HARDCOVER_ID_PREFIX } from '@server/api/metadata/hardcover/constants';
import type { ReadarrLookupBook } from './types';

/** Build lookup terms for Readarr/Bookshelf GET /book/lookup (Bookshelf: edition:{id} for Hardcover). */
export const buildReadarrLookupTerms = (
  metadataId: string,
  title?: string
): string[] => {
  const terms: string[] = [];

  if (metadataId.startsWith(HARDCOVER_ID_PREFIX)) {
    const rest = metadataId.slice(HARDCOVER_ID_PREFIX.length);

    if (/^\d+$/.test(rest)) {
      terms.push(`edition:${rest}`);
      terms.push(rest);
    }

    if (rest) {
      terms.push(metadataId);
    }
  } else if (metadataId.trim()) {
    terms.push(metadataId);
  }

  const trimmedTitle = title?.trim();

  if (trimmedTitle && !terms.includes(trimmedTitle)) {
    terms.push(trimmedTitle);
  }

  return terms;
};

export const pickReadarrLookupBook = (
  results: ReadarrLookupBook[],
  metadataId: string,
  foreignAuthorId?: string
): ReadarrLookupBook | null => {
  if (!results.length) {
    return null;
  }

  const hcRest = metadataId.startsWith(HARDCOVER_ID_PREFIX)
    ? metadataId.slice(HARDCOVER_ID_PREFIX.length)
    : undefined;

  const exact = results.find(
    (book) =>
      book.foreignBookId === metadataId ||
      (hcRest !== undefined &&
        hcRest !== '' &&
        (book.foreignBookId === hcRest || book.foreignBookId.endsWith(hcRest)))
  );

  if (exact) {
    return exact;
  }

  if (foreignAuthorId) {
    const normalizedAuthorId = foreignAuthorId.startsWith(HARDCOVER_ID_PREFIX)
      ? foreignAuthorId.slice(HARDCOVER_ID_PREFIX.length)
      : foreignAuthorId;

    const byAuthor = results.find((book) => {
      const authorId = book.author?.foreignAuthorId;

      return (
        authorId === foreignAuthorId ||
        authorId === normalizedAuthorId ||
        (authorId?.startsWith(HARDCOVER_ID_PREFIX) &&
          authorId.slice(HARDCOVER_ID_PREFIX.length) === normalizedAuthorId)
      );
    });

    if (byAuthor) {
      return byAuthor;
    }
  }

  return results[0] ?? null;
};
