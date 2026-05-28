import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildReadarrAddPayload } from './buildAddPayload';
import { toBookshelfForeignId } from './normalizeForeignId';

describe('toBookshelfForeignId', () => {
  it('strips hc: prefix', () => {
    assert.equal(toBookshelfForeignId('hc:leviathan-wakes'), 'leviathan-wakes');
    assert.equal(toBookshelfForeignId('hc:12345'), '12345');
    assert.equal(toBookshelfForeignId('999'), '999');
  });
});

describe('buildReadarrAddPayload', () => {
  it('uses fallback author id from Hardcover when lookup omits author', () => {
    const payload = buildReadarrAddPayload(
      {
        foreignBookId: '30421421',
        title: 'Leviathan Wakes',
      },
      {
        qualityProfileId: 1,
        metadataProfileId: 1,
        rootFolderPath: '/downloads/audiobooks',
        searchOnAdd: true,
        fallbackForeignAuthorId: 'hc:james-s-a-corey',
      }
    );

    assert.equal(payload.author.foreignAuthorId, 'james-s-a-corey');
    assert.equal(payload.foreignBookId, '30421421');
    assert.equal(payload.addOptions?.searchForNewBook, true);
  });
});
