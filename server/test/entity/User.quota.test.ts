import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import { setupTestDb } from '@server/test/db';

setupTestDb();

describe('User.getQuota', () => {
  it('returns numeric quota values when user overrides are corrupted strings', async () => {
    const settings = getSettings();
    settings.main.defaultQuotas = {
      movie: { quotaLimit: 5, quotaDays: 7 },
      tv: { quotaLimit: 2, quotaDays: 7 },
    };

    const userRepository = getRepository(User);
    const user = await userRepository.findOneOrFail({
      where: { email: 'friend@seerr.dev' },
    });

    await userRepository.query(
      `UPDATE user SET movieQuotaLimit = ?, movieQuotaDays = ?, tvQuotaLimit = ?, tvQuotaDays = ? WHERE id = ?`,
      [
        'movieQuotaLimit',
        'movieQuotaDays',
        'tvQuotaLimit',
        'tvQuotaDays',
        user.id,
      ]
    );

    const reloadedUser = await userRepository.findOneOrFail({
      where: { id: user.id },
    });
    const quota = await reloadedUser.getQuota();

    assert.strictEqual(quota.movie.limit, 5);
    assert.strictEqual(quota.movie.days, 7);
    assert.strictEqual(quota.tv.limit, 2);
    assert.strictEqual(quota.tv.days, 7);
    assert.strictEqual(typeof quota.movie.remaining, 'number');
    assert.strictEqual(quota.movie.restricted, false);
  });

  it('treats corrupted default quota settings as unlimited', async () => {
    const settings = getSettings();
    settings.main.defaultQuotas = {
      movie: {
        quotaLimit: 'movieQuotaLimit' as unknown as number,
        quotaDays: 'movieQuotaDays' as unknown as number,
      },
      tv: {
        quotaLimit: 'tvQuotaLimit' as unknown as number,
        quotaDays: 'tvQuotaDays' as unknown as number,
      },
    };

    const userRepository = getRepository(User);
    const user = await userRepository.findOneOrFail({
      where: { email: 'friend@seerr.dev' },
    });

    const quota = await user.getQuota();

    assert.strictEqual(quota.movie.limit, undefined);
    assert.strictEqual(quota.movie.days, undefined);
    assert.strictEqual(quota.movie.restricted, false);
    assert.strictEqual(quota.tv.limit, undefined);
    assert.strictEqual(quota.tv.restricted, false);
  });
});
