import NytBooksClient from '@server/api/metadata/nyt/client';
import {
  matchNytOverviewList,
  nytListSlug,
} from '@server/api/metadata/nyt/encodeNytListSlug';
import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';

const syncNytListSlugsFromOverview = async (
  settings: AllSettings
): Promise<AllSettings> => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0011_sync_nyt_list_slugs_from_overview')
  ) {
    return settings;
  }

  const apiKey = settings.readingDiscover?.nytApiKey?.trim();
  const lists = settings.readingDiscover?.lists;

  if (apiKey && lists?.length) {
    try {
      const client = new NytBooksClient(apiKey);
      const overviewLists = await client.getOverview();

      settings.readingDiscover.lists = lists.map((list) => {
        const match = matchNytOverviewList(list.listName, overviewLists);

        if (!match) {
          return list;
        }

        return {
          ...list,
          listName: nytListSlug(match),
        };
      });
    } catch (error) {
      logger.warn('Could not sync NYT list slugs from overview during migration', {
        label: 'Settings Migrator',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0011_sync_nyt_list_slugs_from_overview');

  return settings;
};

export default syncNytListSlugsFromOverview;
