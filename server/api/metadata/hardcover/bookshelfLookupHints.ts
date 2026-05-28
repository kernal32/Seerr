export interface HardcoverEditionHint {
  id?: number | string;
  edition_format?: string | null;
}

export interface HardcoverBookLookupHint {
  id?: number | string;
  title?: string;
  editions?: HardcoverEditionHint[];
  contributions?: { author?: { name?: string } }[];
}

const isAudiobookEdition = (format?: string | null): boolean => {
  const normalized = format?.toLowerCase() ?? '';

  return (
    normalized.includes('audio') ||
    normalized.includes('spoken') ||
    normalized.includes('mp3')
  );
};

const isEbookEdition = (format?: string | null): boolean => {
  const normalized = format?.toLowerCase() ?? '';

  if (!normalized) {
    return false;
  }

  if (isAudiobookEdition(normalized)) {
    return false;
  }

  return (
    normalized.includes('ebook') ||
    normalized.includes('kindle') ||
    normalized.includes('digital') ||
    normalized.includes('epub') ||
    normalized.includes('e-book')
  );
};

export const buildBookshelfLookupTermsFromHardcover = (
  book: HardcoverBookLookupHint,
  mediaSubtype: 'book' | 'audiobook',
  authorName?: string
): string[] => {
  const terms: string[] = [];
  const editions = book.editions ?? [];

  const matchingEditions = editions.filter((edition) => {
    if (mediaSubtype === 'audiobook') {
      return isAudiobookEdition(edition.edition_format);
    }

    return isEbookEdition(edition.edition_format) || !isAudiobookEdition(edition.edition_format);
  });

  const editionPool =
    matchingEditions.length > 0 ? matchingEditions : editions;

  for (const edition of editionPool) {
    if (edition.id !== undefined && String(edition.id).trim() !== '') {
      terms.push(`edition:${edition.id}`);
    }
  }

  if (book.id !== undefined && String(book.id).trim() !== '') {
    terms.push(`edition:${book.id}`);
  }

  const title = book.title?.trim();

  if (title) {
    terms.push(title);

    if (authorName?.trim()) {
      terms.push(`${title} ${authorName.trim()}`);
    }
  }

  return [...new Set(terms)];
};
