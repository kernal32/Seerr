import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { inferMediaSubtypeFromNytList } from '@server/api/metadata/nyt/constants';
import {
  getEnabledNytLists,
  getNytApiKey,
} from '@server/api/metadata/nyt/getReadingDiscoverSettings';
import * as settingsModule from '@server/lib/settings';

describe('inferMediaSubtypeFromNytList', () => {
  it('maps audio lists to audiobook', () => {
    assert.equal(inferMediaSubtypeFromNytList('audio-fiction'), 'audiobook');
    assert.equal(
      inferMediaSubtypeFromNytList('audio-nonfiction'),
      'audiobook'
    );
  });

  it('maps print lists to book', () => {
    assert.equal(
      inferMediaSubtypeFromNytList('hardcover-fiction'),
      'book'
    );
    assert.equal(
      inferMediaSubtypeFromNytList('combined-print-and-e-book-fiction'),
      'book'
    );
  });
});

describe('getReadingDiscoverSettings helpers', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('returns NYT API key when configured', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      readingDiscover: {
        nytApiKey: 'test-key',
        nytEnabled: true,
        lists: [],
        hardcoverPopularEnabled: false,
        hardcoverTrendingEnabled: true,
      },
    }));

    assert.equal(getNytApiKey(), 'test-key');
  });

  it('returns enabled lists filtered by subtype', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      readingDiscover: {
        nytApiKey: 'test-key',
        nytEnabled: true,
        lists: [
          {
            listName: 'hardcover-fiction',
            displayName: 'Hardcover Fiction',
            mediaSubtype: 'book',
            enabled: true,
          },
          {
            listName: 'audio-fiction',
            displayName: 'Audio Fiction',
            mediaSubtype: 'audiobook',
            enabled: true,
          },
          {
            listName: 'paperback-nonfiction',
            displayName: 'Paperback Nonfiction',
            mediaSubtype: 'book',
            enabled: false,
          },
        ],
        hardcoverPopularEnabled: false,
        hardcoverTrendingEnabled: true,
      },
    }));

    assert.equal(getEnabledNytLists('book').length, 1);
    assert.equal(getEnabledNytLists('audiobook').length, 1);
    assert.equal(getEnabledNytLists().length, 2);
  });

  it('returns no lists when NYT is disabled', () => {
    mock.method(settingsModule, 'getSettings', () => ({
      readingDiscover: {
        nytApiKey: 'test-key',
        nytEnabled: false,
        lists: [
          {
            listName: 'hardcover-fiction',
            displayName: 'Hardcover Fiction',
            mediaSubtype: 'book',
            enabled: true,
          },
        ],
        hardcoverPopularEnabled: false,
        hardcoverTrendingEnabled: true,
      },
    }));

    assert.equal(getEnabledNytLists('book').length, 0);
  });
});
