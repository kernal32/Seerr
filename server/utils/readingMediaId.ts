/**
 * Reading media uses OpenLibrary-style string IDs (metadataId) but Media.tmdbId
 * remains required. Derive a stable placeholder int for DB uniqueness.
 */
export const metadataIdToTmdbPlaceholder = (metadataId: string): number => {
  let hash = 0;

  for (let i = 0; i < metadataId.length; i++) {
    hash = (hash << 5) - hash + metadataId.charCodeAt(i);
    hash |= 0;
  }

  const positive = Math.abs(hash);

  return positive === 0 ? 1 : positive;
};
