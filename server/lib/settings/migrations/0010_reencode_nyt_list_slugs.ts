import type { AllSettings } from '@server/lib/settings';
import { encodeNytListSlug } from '@server/api/metadata/nyt/encodeNytListSlug';

const reencodeNytListSlugs = (settings: AllSettings): AllSettings => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0010_reencode_nyt_list_slugs')
  ) {
    return settings;
  }

  if (settings.readingDiscover?.lists?.length) {
    settings.readingDiscover.lists = settings.readingDiscover.lists.map(
      (list) => ({
        ...list,
        listName: encodeNytListSlug(list.listName),
      })
    );
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0010_reencode_nyt_list_slugs');

  return settings;
};

export default reencodeNytListSlugs;
