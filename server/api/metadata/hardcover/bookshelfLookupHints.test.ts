import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildBookshelfLookupTermsFromHardcover } from './bookshelfLookupHints';

describe('buildBookshelfLookupTermsFromHardcover', () => {
  it('prefers audiobook edition ids for audiobook subtype', () => {
    const terms = buildBookshelfLookupTermsFromHardcover(
      {
        id: 100,
        title: 'Leviathan Wakes',
        editions: [
          { id: 30421421, edition_format: 'Audiobook' },
          { id: 30421422, edition_format: 'Hardcover' },
        ],
      },
      'audiobook',
      'James S. A. Corey'
    );

    assert.ok(terms[0] === 'edition:30421421');
    assert.ok(terms.includes('Leviathan Wakes James S. A. Corey'));
  });

  it('falls back to all editions when no format match', () => {
    const terms = buildBookshelfLookupTermsFromHardcover(
      {
        id: 55,
        title: 'Dune',
        editions: [{ id: 999, edition_format: null }],
      },
      'book'
    );

    assert.ok(terms.includes('edition:999'));
    assert.ok(terms.includes('edition:55'));
  });
});
