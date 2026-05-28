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
        fallbackAuthorName: 'James S. A. Corey',
      }
    );

    assert.equal(payload.author.foreignAuthorId, 'james-s-a-corey');
    assert.equal(payload.author.authorName, 'James S. A. Corey');
    assert.equal(payload.foreignBookId, '30421421');
    assert.equal(payload.addOptions?.searchForNewBook, true);
  });

  it('passes through lookup author and editions without hc stripping', () => {
    const payload = buildReadarrAddPayload(
      {
        foreignBookId: '999',
        title: 'Test Book',
        author: {
          foreignAuthorId: '12345',
          authorName: 'Test Author',
        },
        editions: [
          { foreignEditionId: '888', monitored: false },
          { foreignEditionId: '777', monitored: true },
        ],
      },
      {
        qualityProfileId: 2,
        metadataProfileId: 1,
        rootFolderPath: '/books',
        searchOnAdd: false,
      }
    );

    assert.equal(payload.author.foreignAuthorId, '12345');
    assert.equal(payload.editions?.[1]?.monitored, true);
    assert.equal(payload.editions?.[1]?.manualAdd, true);
  });

  it('creates edition from foreignEditionId when editions array is empty', () => {
    const payload = buildReadarrAddPayload(
      {
        foreignBookId: '555',
        title: 'Solo Edition',
        foreignEditionId: '444',
        author: { foreignAuthorId: '333', authorName: 'Author' },
      },
      {
        qualityProfileId: 1,
        metadataProfileId: 1,
        rootFolderPath: '/books',
        searchOnAdd: true,
      }
    );

    assert.equal(payload.editions?.length, 1);
    assert.equal(payload.editions?.[0]?.foreignEditionId, '444');
    assert.equal(payload.editions?.[0]?.monitored, true);
  });
});
