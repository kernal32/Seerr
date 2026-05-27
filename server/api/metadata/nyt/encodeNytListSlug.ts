import type { NytOverviewList } from './types';

/** Slug used in /lists/current/{slug}.json — lower case, hyphens, no apostrophes. */
export const encodeNytListSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const nytListSlug = (list: {
  list_name: string;
  list_name_encoded?: string;
}): string => list.list_name_encoded?.trim() || encodeNytListSlug(list.list_name);

/** Match a stored or URL slug to an overview row (NYT encoded slugs often differ from display-name slugs). */
export const matchNytOverviewList = (
  requestedSlug: string,
  lists: NytOverviewList[]
): NytOverviewList | undefined => {
  const normalized = encodeNytListSlug(requestedSlug);

  return lists.find((list) => {
    const encoded = nytListSlug(list);
    const fromDisplayName = encodeNytListSlug(list.list_name);

    if (encoded === normalized || encoded === requestedSlug) {
      return true;
    }

    if (fromDisplayName === normalized) {
      return true;
    }

    // Monthly lists: young-adult-paperback → young-adult-paperback-monthly
    return encoded.startsWith(`${normalized}-`);
  });
};
