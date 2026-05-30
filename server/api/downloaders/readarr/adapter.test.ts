import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import ReadarrClient from '@server/api/downloaders/readarr/client';
import { ReadarrAdapter } from '@server/api/downloaders/readarr/adapter';
import type {
  ReadarrAddBookResponse,
  ReadarrBook,
  ReadarrLookupBook,
} from '@server/api/downloaders/readarr/types';
import type { BookDownloaderSettings } from '@server/lib/settings';

const duplicateEditionError = () =>
  new Error(
    'Bookshelf returned HTTP 409: {"message":"constraint failed\\nUNIQUE constraint failed: Editions.ForeignEditionId"}'
  );

let lookupBooksImpl: (term: string) => Promise<ReadarrLookupBook[]> =
  async () => [];
let addBookImpl: () => Promise<ReadarrAddBookResponse> = async () => ({
  id: 99,
  foreignBookId: '12345',
  title: 'Test Book',
});
let getLibraryBooksImpl: () => Promise<ReadarrBook[]> = async () => [];

Object.defineProperty(ReadarrClient.prototype, 'lookupBooks', {
  set() {},
  get() {
    return async (term: string) => lookupBooksImpl(term);
  },
  configurable: true,
});

Object.defineProperty(ReadarrClient.prototype, 'addBook', {
  set() {},
  get() {
    return async () => addBookImpl();
  },
  configurable: true,
});

Object.defineProperty(ReadarrClient.prototype, 'getLibraryBooks', {
  set() {},
  get() {
    return async () => getLibraryBooksImpl();
  },
  configurable: true,
});

const baseSettings = (): BookDownloaderSettings =>
  ({
    id: 0,
    name: 'Bookshelf',
    hostname: '127.0.0.1',
    port: 8787,
    apiKey: 'test-key',
    useSsl: false,
    baseUrl: '',
    activeProfileId: 1,
    activeProfileName: 'Default',
    activeMetadataProfileId: 1,
    activeDirectory: '/audiobooks',
    tags: [],
    is4k: false,
    isDefault: true,
    syncEnabled: true,
    preventSearch: false,
    tagRequests: false,
    overrideRule: [],
    provider: 'readarr',
    mediaSubtype: 'audiobook',
  }) as BookDownloaderSettings;

describe('ReadarrAdapter.addToLibrary duplicate edition recovery', () => {
  beforeEach(() => {
    lookupBooksImpl = async () => [
      {
        foreignBookId: '12345',
        title: 'Test Book',
        foreignAuthorId: 'author-1',
      },
    ];
    addBookImpl = async () => ({
      id: 99,
      foreignBookId: '12345',
      title: 'Test Book',
    });
    getLibraryBooksImpl = async () => [];
  });

  it('returns existing lookup id when Bookshelf reports duplicate edition conflict', async () => {
    addBookImpl = async () => {
      throw duplicateEditionError();
    };

    lookupBooksImpl = async () => [
      {
        id: 42,
        foreignBookId: '12345',
        title: 'Test Book',
        foreignAuthorId: 'author-1',
      },
    ];

    const adapter = new ReadarrAdapter(baseSettings());
    const result = await adapter.addToLibrary({
      metadataId: 'hc:12345',
      title: 'Test Book',
      foreignAuthorId: 'author-1',
      searchOnAdd: false,
    });

    assert.deepEqual(result, {
      externalServiceId: 42,
      externalServiceSlug: '12345',
    });
  });

  it('falls back to library search when duplicate conflict lookup has no id', async () => {
    addBookImpl = async () => {
      throw duplicateEditionError();
    };

    lookupBooksImpl = async () => [
      {
        foreignBookId: '12345',
        title: 'Test Book',
        foreignAuthorId: 'author-1',
      },
    ];

    getLibraryBooksImpl = async () => [
      {
        id: 77,
        foreignBookId: '12345',
        title: 'Test Book',
      },
    ];

    const adapter = new ReadarrAdapter(baseSettings());
    const result = await adapter.addToLibrary({
      metadataId: 'hc:12345',
      title: 'Test Book',
      foreignAuthorId: 'author-1',
      searchOnAdd: false,
    });

    assert.deepEqual(result, {
      externalServiceId: 77,
      externalServiceSlug: '12345',
    });
  });

  it('throws enriched error when duplicate conflict cannot be resolved', async () => {
    addBookImpl = async () => {
      throw duplicateEditionError();
    };

    lookupBooksImpl = async () => [
      {
        foreignBookId: '12345',
        title: 'Test Book',
        foreignAuthorId: 'author-1',
      },
    ];
    getLibraryBooksImpl = async () => [];

    const adapter = new ReadarrAdapter(baseSettings());

    await assert.rejects(
      () =>
        adapter.addToLibrary({
          metadataId: 'hc:12345',
          title: 'Test Book',
          foreignAuthorId: 'author-1',
          searchOnAdd: false,
        }),
      /could not resolve the existing library book/
    );
  });

  it('rethrows non-duplicate Bookshelf errors unchanged', async () => {
    addBookImpl = async () => {
      throw new Error('Bookshelf returned HTTP 500: internal error');
    };

    const adapter = new ReadarrAdapter(baseSettings());

    await assert.rejects(
      () =>
        adapter.addToLibrary({
          metadataId: 'hc:12345',
          title: 'Test Book',
          foreignAuthorId: 'author-1',
          searchOnAdd: false,
        }),
      /HTTP 500/
    );
  });
});
