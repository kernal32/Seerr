import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { getComicVineApiKey } from '@server/api/metadata/comicvine/getComicVineApiKey';
import * as factoryModule from '@server/api/downloaders/factory';

describe('getComicVineApiKey', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('returns the Comic Vine key from the default comic downloader', () => {
    mock.method(factoryModule, 'getDefaultComicDownloader', () => ({
      id: 0,
      isDefault: true,
      is4k: false,
      comicVineApiKey: '  cv-key-123  ',
    }));

    assert.equal(getComicVineApiKey(), 'cv-key-123');
  });

  it('returns undefined when no downloader or key is configured', () => {
    mock.method(factoryModule, 'getDefaultComicDownloader', () => undefined);

    assert.equal(getComicVineApiKey(), undefined);

    mock.method(factoryModule, 'getDefaultComicDownloader', () => ({
      id: 0,
      comicVineApiKey: '   ',
    }));

    assert.equal(getComicVineApiKey(), undefined);
  });
});
