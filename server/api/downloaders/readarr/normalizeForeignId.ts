import { HARDCOVER_ID_PREFIX } from '@server/api/metadata/hardcover/constants';

/** Bookarr stores Hardcover ids as hc:{slug|id}; Bookshelf expects the raw metadata id. */
export const toBookshelfForeignId = (id: string): string =>
  id.startsWith(HARDCOVER_ID_PREFIX)
    ? id.slice(HARDCOVER_ID_PREFIX.length)
    : id;
