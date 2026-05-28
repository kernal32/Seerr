import type { ReadarrAddBookPayload, ReadarrLookupBook } from './types';
import { toBookshelfForeignId } from './normalizeForeignId';

const resolveForeignAuthorId = (
  lookup: ReadarrLookupBook,
  fallback?: string
): string => {
  const fromLookup =
    lookup.author?.foreignAuthorId ?? lookup.foreignAuthorId ?? undefined;
  const raw = fromLookup ?? fallback;

  if (!raw?.trim()) {
    throw new Error(
      'Bookshelf lookup result is missing author foreignAuthorId'
    );
  }

  if (fromLookup) {
    return fromLookup;
  }

  return toBookshelfForeignId(raw);
};

const resolveAuthorName = (
  lookup: ReadarrLookupBook,
  fallback?: string
): string => {
  const fromLookup =
    lookup.author?.authorName ?? lookup.authorTitle?.trim() ?? undefined;

  if (fromLookup) {
    return fromLookup;
  }

  if (fallback?.trim()) {
    return fallback.trim();
  }

  return 'Unknown Author';
};

const normalizeEditions = (lookup: ReadarrLookupBook) => {
  let editions = [...(lookup.editions ?? [])];

  if (
    editions.length === 0 &&
    lookup.foreignEditionId?.trim()
  ) {
    editions = [
      {
        foreignEditionId: lookup.foreignEditionId,
        monitored: true,
        manualAdd: true,
      },
    ];
  }

  if (editions.length === 0) {
    return undefined;
  }

  if (!editions.some((edition) => edition.monitored)) {
    editions = editions.map((edition, index) => ({
      ...edition,
      monitored: index === 0,
      manualAdd: edition.manualAdd ?? true,
    }));
  } else {
    editions = editions.map((edition) => ({
      ...edition,
      manualAdd: edition.manualAdd ?? edition.monitored ?? false,
    }));
  }

  return editions;
};

/** Merge Bookshelf lookup metadata with profile settings for POST /api/v1/book. */
export const buildReadarrAddPayload = (
  lookup: ReadarrLookupBook,
  options: {
    qualityProfileId: number;
    metadataProfileId: number;
    rootFolderPath: string;
    searchOnAdd: boolean;
    tags?: number[];
    fallbackForeignAuthorId?: string;
    fallbackAuthorName?: string;
  }
): ReadarrAddBookPayload => {
  const foreignAuthorId = resolveForeignAuthorId(
    lookup,
    options.fallbackForeignAuthorId
  );
  const authorName = resolveAuthorName(lookup, options.fallbackAuthorName);
  const editions = normalizeEditions(lookup);
  const monitoredEdition = editions?.find((edition) => edition.monitored);

  const payload: ReadarrAddBookPayload = {
    ...lookup,
    id: 0,
    monitored: true,
    foreignBookId: lookup.foreignBookId,
    foreignEditionId:
      lookup.foreignEditionId ?? monitoredEdition?.foreignEditionId,
    tags: options.tags ?? [],
    author: {
      ...lookup.author,
      authorName,
      foreignAuthorId,
      qualityProfileId: options.qualityProfileId,
      metadataProfileId: options.metadataProfileId,
      rootFolderPath: options.rootFolderPath,
      monitored: true,
      addOptions: {
        searchForMissingBooks: false,
      },
    },
    addOptions: {
      searchForNewBook: options.searchOnAdd,
    },
  };

  if (editions?.length) {
    payload.editions = editions;
  }

  return payload;
};
