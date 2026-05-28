import type { ReadarrAddBookPayload, ReadarrLookupBook } from './types';

export const buildReadarrAddPayload = (
  book: ReadarrLookupBook,
  options: {
    qualityProfileId: number;
    metadataProfileId: number;
    rootFolderPath: string;
    searchOnAdd: boolean;
    tags?: number[];
  }
): ReadarrAddBookPayload => {
  const foreignAuthorId = book.author?.foreignAuthorId;

  if (!foreignAuthorId) {
    throw new Error(
      'Bookshelf lookup result is missing author foreignAuthorId'
    );
  }

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
