import { getSettings } from '@server/lib/settings';
import type {
  BookDownloaderSubtype,
  ReadingDiscoverListConfig,
} from '@server/lib/settings';
import { encodeNytListSlug } from './encodeNytListSlug';

export const getNytApiKey = (): string | undefined => {
  const key = getSettings().readingDiscover.nytApiKey?.trim();
  return key || undefined;
};

export const getEnabledNytLists = (
  mediaSubtype?: BookDownloaderSubtype
): ReadingDiscoverListConfig[] => {
  const { nytEnabled, lists } = getSettings().readingDiscover;

  if (!nytEnabled) {
    return [];
  }

  return lists.filter(
    (list) =>
      list.enabled &&
      (mediaSubtype === undefined || list.mediaSubtype === mediaSubtype)
  );
};

export const getReadingDiscoverList = (
  listName: string,
  mediaSubtype: BookDownloaderSubtype
): ReadingDiscoverListConfig | undefined => {
  const normalized = encodeNytListSlug(listName);

  return getEnabledNytLists(mediaSubtype).find(
    (list) => encodeNytListSlug(list.listName) === normalized
  );
};
