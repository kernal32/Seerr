import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { getHardcoverApiToken } from '@server/api/metadata/hardcover/getHardcoverToken';
import * as settingsModule from '@server/lib/settings';

describe('getHardcoverApiToken', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('returns token from default book downloader', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [
        {
          id: 0,
          isDefault: true,
          is4k: false,
          mediaSubtype: 'book',
          hardcoverApiToken: 'Bearer test-token',
        },
      ],
    }));

    assert.equal(getHardcoverApiToken('book'), 'test-token');
  });

  it('falls back to any downloader with a token for the subtype', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [
        {
          id: 0,
          isDefault: true,
          is4k: false,
          mediaSubtype: 'audiobook',
          hardcoverApiToken: '',
        },
        {
          id: 1,
          isDefault: false,
          is4k: false,
          mediaSubtype: 'audiobook',
          hardcoverApiToken: 'audiobook-token',
        },
      ],
    }));

    assert.equal(getHardcoverApiToken('audiobook'), 'audiobook-token');
  });

  it('falls back to the book downloader token for audiobook lookups', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [
        {
          id: 0,
          isDefault: true,
          is4k: false,
          mediaSubtype: 'book',
          hardcoverApiToken: 'book-token',
        },
        {
          id: 1,
          isDefault: true,
          is4k: false,
          mediaSubtype: 'audiobook',
          hardcoverApiToken: '',
        },
      ],
    }));

    assert.equal(getHardcoverApiToken('audiobook'), 'book-token');
  });

  it('returns undefined when no token is configured', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      bookDownloaders: [
        {
          id: 0,
          isDefault: true,
          is4k: false,
          mediaSubtype: 'book',
        },
      ],
    }));

    assert.equal(getHardcoverApiToken('book'), undefined);
  });
});
