import type { ReadarrAddBookPayload, ReadarrLookupBook } from './types';
import { toBookshelfForeignId } from './normalizeForeignId';

export const buildReadarrAddPayload = (
  book: ReadarrLookupBook,
  options: {
    qualityProfileId: number;
    metadataProfileId: number;
    rootFolderPath: string;
    searchOnAdd: boolean;
    tags?: number[];
    fallbackForeignAuthorId?: string;
  }
): ReadarrAddBookPayload => {
  const rawAuthorId =
    book.author?.foreignAuthorId ??
    book.foreignAuthorId ??
    options.fallbackForeignAuthorId;

  if (!rawAuthorId) {
    throw new Error(
      'Bookshelf lookup result is missing author foreignAuthorId'
    );
  }

  const foreignAuthorId = toBookshelfForeignId(rawAuthorId);

  const monitoredEdition =
    book.editions?.find((edition) => edition.monitored) ?? book.editions?.[0];

  const payload: ReadarrAddBookPayload = {
    foreignBookId: book.foreignBookId,
    monitored: true,
    tags: options.tags ?? [],
    author: {
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

  if (monitoredEdition?.foreignEditionId) {
    payload.editions = [
      {
        foreignEditionId: monitoredEdition.foreignEditionId,
        monitored: true,
        manualAdd: true,
      },
    ];
  }

  return payload;
};
