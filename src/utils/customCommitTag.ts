/** Docker/local builds that are not tracked against upstream Seerr releases. */
const CUSTOM_COMMIT_TAGS = new Set(['local', 'private']);

export const isCustomCommitTag = (commitTag?: string): boolean =>
  !!commitTag && CUSTOM_COMMIT_TAGS.has(commitTag);
