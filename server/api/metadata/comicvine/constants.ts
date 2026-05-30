export const COMICVINE_API_BASE = 'https://comicvine.gamespot.com/api';
export const COMICVINE_VOLUME_RESOURCE = '4050';

export const COMICVINE_VOLUME_FIELD_LIST =
  'id,name,deck,start_year,publisher,image';

/** Built-in publisher sliders for comic discover (Comic Vine publisher IDs). */
export const COMIC_DISCOVER_PUBLISHERS = [
  { id: 31, slug: 'marvel' },
  { id: 10, slug: 'dc' },
  { id: 513, slug: 'image' },
] as const;
