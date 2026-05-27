import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  encodeNytListSlug,
  matchNytOverviewList,
  nytListSlug,
} from '@server/api/metadata/nyt/encodeNytListSlug';

describe('encodeNytListSlug', () => {
  it('encodes human-readable NYT list names', () => {
    assert.equal(encodeNytListSlug('Hardcover Fiction'), 'hardcover-fiction');
    assert.equal(
      encodeNytListSlug('Combined Print & E-Book Fiction'),
      'combined-print-and-e-book-fiction'
    );
    assert.equal(
      encodeNytListSlug('Combined Print and E-Book Fiction'),
      'combined-print-and-e-book-fiction'
    );
  });

  it('leaves encoded slugs unchanged', () => {
    assert.equal(encodeNytListSlug('hardcover-fiction'), 'hardcover-fiction');
  });

  it('prefers list_name_encoded from overview rows', () => {
    assert.equal(
      nytListSlug({
        list_name: 'Hardcover Fiction',
        list_name_encoded: 'hardcover-fiction',
      }),
      'hardcover-fiction'
    );
  });
});

describe('matchNytOverviewList', () => {
  const overviewLists = [
    {
      list_name: 'Young Adult Paperback',
      display_name: 'Young Adult Paperback',
      list_name_encoded: 'young-adult-paperback-monthly',
      books: [],
    },
    {
      list_name: 'Hardcover Fiction',
      display_name: 'Hardcover Fiction',
      list_name_encoded: 'hardcover-fiction',
      books: [],
    },
  ];

  it('matches monthly lists from display-name slugs', () => {
    const match = matchNytOverviewList(
      'young-adult-paperback',
      overviewLists
    );

    assert.equal(match?.list_name_encoded, 'young-adult-paperback-monthly');
  });

  it('matches encoded slugs directly', () => {
    const match = matchNytOverviewList('hardcover-fiction', overviewLists);

    assert.equal(match?.list_name, 'Hardcover Fiction');
  });
});
