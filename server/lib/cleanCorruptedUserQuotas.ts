import dataSource, { isPgsql } from '@server/datasource';
import logger from '@server/logger';

const QUOTA_COLUMNS = [
  'movieQuotaLimit',
  'movieQuotaDays',
  'tvQuotaLimit',
  'tvQuotaDays',
] as const;

/**
 * Null out corrupted text quota values left over from Overseerr migrations.
 * Safe to run on every startup for SQLite deployments.
 */
const cleanCorruptedUserQuotas = async (): Promise<void> => {
  if (isPgsql) {
    return;
  }

  const dbConnection = dataSource.isInitialized
    ? dataSource
    : await dataSource.initialize();

  try {
    for (const column of QUOTA_COLUMNS) {
      await dbConnection.query(
        `UPDATE user SET ${column} = NULL WHERE typeof(${column}) = 'text'`
      );
    }
  } catch (error) {
    logger.error('Failed to clean up corrupted user quota values', {
      label: 'Quota Cleanup',
      error: (error as Error).message,
    });
  }
};

export default cleanCorruptedUserQuotas;
