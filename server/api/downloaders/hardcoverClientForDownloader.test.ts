import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { hardcoverClientForDownloader } from '@server/api/downloaders/hardcoverClientForDownloader';
import * as getHardcoverTokenModule from '@server/api/metadata/hardcover/getHardcoverToken';
import type { BookDownloaderSettings } from '@server/lib/settings';

const baseSettings = (): BookDownloaderSettings =>
  ({
    id: 1,
    name: 'Test',
    hostname: '127.0.0.1',
    port: 8787,
    apiKey: 'key',
    useSsl: false,
    activeProfileId: 1,
    activeProfileName: 'Default',
    activeDirectory: '/books',
    tags: [],
    is4k: false,
    isDefault: true,
    syncEnabled: false,
    preventSearch: false,
    tagRequests: false,
    overrideRule: [],
    provider: 'readarr',
    mediaSubtype: 'audiobook',
  }) as BookDownloaderSettings;

describe('hardcoverClientForDownloader', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('uses instance token when configured', () => {
    const client = hardcoverClientForDownloader({
      ...baseSettings(),
      hardcoverApiToken: 'instance-token',
    });

    assert.ok(client);
  });

  it('falls back to getHardcoverApiToken when instance token is empty', () => {
    mock.method(getHardcoverTokenModule, 'getHardcoverApiToken', () => {
      return 'shared-book-token';
    });

    const client = hardcoverClientForDownloader({
      ...baseSettings(),
      hardcoverApiToken: '',
    });

    assert.ok(client);
  });

  it('returns undefined when no token is available', () => {
    mock.method(getHardcoverTokenModule, 'getHardcoverApiToken', () => {
      return undefined;
    });

    const client = hardcoverClientForDownloader({
      ...baseSettings(),
      hardcoverApiToken: '',
    });

    assert.equal(client, undefined);
  });
});
