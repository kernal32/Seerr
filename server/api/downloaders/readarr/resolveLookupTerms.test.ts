import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildReadarrLookupTerms,
  pickReadarrLookupBook,
} from './resolveLookupTerms';

describe('buildReadarrLookupTerms', () => {
  it('adds edition lookup for numeric hc ids', () => {
    assert.deepEqual(buildReadarrLookupTerms('hc:30421421', 'Lucky'), [
      'edition:30421421',
      '30421421',
      'hc:30421421',
      'Lucky',
    ]);
  });

  it('includes title for slug hc ids', () => {
    assert.deepEqual(buildReadarrLookupTerms('hc:some-slug', 'Dune'), [
      'hc:some-slug',
      'Dune',
    ]);
  });

  it('uses metadata id directly when not hc prefixed', () => {
    assert.deepEqual(buildReadarrLookupTerms('12345'), ['12345']);
  });
});

describe('pickReadarrLookupBook', () => {
  const results = [
    {
      foreignBookId: '999',
      title: 'Nine',
      author: { foreignAuthorId: 'auth-a' },
    },
    {
      foreignBookId: 'hc:target',
      title: 'Target',
      author: { foreignAuthorId: 'hc:author-1' },
    },
  ];

  it('prefers exact foreignBookId match', () => {
    assert.equal(pickReadarrLookupBook(results, '999'), results[0]);
  });

  it('matches hc slug on foreignBookId', () => {
    assert.equal(pickReadarrLookupBook(results, 'hc:target'), results[1]);
  });

  it('falls back to author id match', () => {
    assert.deepEqual(
      pickReadarrLookupBook(
        [{ foreignBookId: 'x', title: 'X', author: { foreignAuthorId: '42' } }],
        'unknown',
        'hc:42'
      ),
      { foreignBookId: 'x', title: 'X', author: { foreignAuthorId: '42' } }
    );
  });
});
