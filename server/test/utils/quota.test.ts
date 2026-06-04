import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseQuotaNumber, resolveQuotaNumber } from '@server/utils/quota';

describe('parseQuotaNumber', () => {
  it('returns undefined for nullish and invalid values', () => {
    assert.strictEqual(parseQuotaNumber(null), undefined);
    assert.strictEqual(parseQuotaNumber(undefined), undefined);
    assert.strictEqual(parseQuotaNumber(''), undefined);
    assert.strictEqual(parseQuotaNumber('movieQuotaLimit'), undefined);
    assert.strictEqual(parseQuotaNumber('movieQuotaDays'), undefined);
    assert.strictEqual(parseQuotaNumber(NaN), undefined);
    assert.strictEqual(parseQuotaNumber(-1), undefined);
  });

  it('parses valid numeric values', () => {
    assert.strictEqual(parseQuotaNumber(0), 0);
    assert.strictEqual(parseQuotaNumber(5), 5);
    assert.strictEqual(parseQuotaNumber('7'), 7);
    assert.strictEqual(parseQuotaNumber('  3  '), 3);
  });
});

describe('resolveQuotaNumber', () => {
  it('prefers a valid user override over defaults', () => {
    assert.strictEqual(resolveQuotaNumber(2, 5), 2);
  });

  it('falls back to defaults when user values are corrupted', () => {
    assert.strictEqual(resolveQuotaNumber('movieQuotaLimit', 5), 5);
    assert.strictEqual(resolveQuotaNumber('movieQuotaDays', 7), 7);
  });

  it('returns undefined when both values are invalid', () => {
    assert.strictEqual(
      resolveQuotaNumber('movieQuotaLimit', 'movieQuotaDays'),
      undefined
    );
  });
});
