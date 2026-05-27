/** Client-side mirror of server/api/metadata/nyt/encodeNytListSlug.ts */
export const encodeNytListSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
