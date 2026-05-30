import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { getBookDownloaderDisplayName, getComicDownloaderDisplayName } from '@server/api/downloaders/factory';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import type { BookDownloaderSettings, ComicDownloaderSettings } from '@server/lib/settings';

const bookDownloader = (): BookDownloaderSettings =>
  ({
    id: 3,
    name: 'Bookshelf',
    hostname: 'bookshelf.local',
    port: 8787,
    apiKey: 'key',
    useSsl: false,
    baseUrl: '',
    externalUrl: '',
    activeProfileId: 1,
    activeProfileName: 'Default',
    activeDirectory: '/books',
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

describe('getBookDownloaderDisplayName', () => {
  it('maps readarr provider to Bookshelf', () => {
    assert.equal(getBookDownloaderDisplayName('readarr'), 'Bookshelf');
  });

  it('maps bindery provider to Bindery', () => {
    assert.equal(getBookDownloaderDisplayName('bindery'), 'Bindery');
  });
});

describe('getComicDownloaderDisplayName', () => {
  it('maps mylar3 provider to Mylar3', () => {
    assert.equal(getComicDownloaderDisplayName('mylar3'), 'Mylar3');
  });
});

describe('Media.setServiceUrl for reading media', () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('builds Bookshelf web URL from externalServiceId', async () => {
    const settingsModule = await import('@server/lib/settings');
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [bookDownloader()],
    }));

    const media = new Media();
    media.mediaType = MediaType.AUDIOBOOK;
    media.serviceId = 3;
    media.externalServiceId = 42;
    media.setServiceUrl();

    assert.equal(
      media.serviceUrl,
      'http://bookshelf.local:8787/book/42'
    );
  });

  it('prefers externalUrl when configured', async () => {
    const downloader = bookDownloader();
    downloader.externalUrl = 'https://books.example.com';

    const settingsModule = await import('@server/lib/settings');
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [downloader],
    }));

    const media = new Media();
    media.mediaType = MediaType.BOOK;
    media.serviceId = 3;
    media.externalServiceId = 99;
    media.setServiceUrl();

    assert.equal(media.serviceUrl, 'https://books.example.com/book/99');
  });

  it('builds Mylar3 web URL from externalServiceSlug', async () => {
    const comicDownloader = (): ComicDownloaderSettings =>
      ({
        id: 1,
        name: 'Mylar3',
        hostname: 'mylar.local',
        port: 8090,
        apiKey: 'key',
        useSsl: false,
        baseUrl: '',
        externalUrl: 'https://mylar.example.com',
        activeProfileId: 0,
        activeProfileName: '',
        activeDirectory: '',
        tags: [],
        is4k: false,
        isDefault: true,
        syncEnabled: true,
        preventSearch: false,
        tagRequests: false,
        overrideRule: [],
        provider: 'mylar3',
      }) as ComicDownloaderSettings;

    const settingsModule = await import('@server/lib/settings');
    mock.method(settingsModule, 'getSettings', () => ({
      comicDownloaders: [comicDownloader()],
    }));

    const media = new Media();
    media.mediaType = MediaType.COMIC;
    media.serviceId = 1;
    media.externalServiceId = 3727;
    media.externalServiceSlug = '3727';
    media.setServiceUrl();

    assert.equal(
      media.serviceUrl,
      'https://mylar.example.com/comicDetails?ComicID=3727'
    );
  });
});
