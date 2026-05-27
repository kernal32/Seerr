import type { AllSettings } from '@server/lib/settings';

const migrateReadingDiscover = (settings: AllSettings): AllSettings => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0009_add_reading_discover')
  ) {
    return settings;
  }

  if (!settings.readingDiscover) {
    settings.readingDiscover = {
      nytApiKey: '',
      nytEnabled: false,
      lists: [],
      hardcoverPopularEnabled: false,
      hardcoverTrendingEnabled: true,
    };
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0009_add_reading_discover');

  return settings;
};

export default migrateReadingDiscover;
