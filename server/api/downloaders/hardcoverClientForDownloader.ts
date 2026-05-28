import HardcoverClient from '@server/api/metadata/hardcover/client';
import { getHardcoverApiToken } from '@server/api/metadata/hardcover/getHardcoverToken';
import { normalizeHardcoverApiToken } from '@server/api/metadata/hardcover/normalizeToken';
import type { BookDownloaderSettings } from '@server/lib/settings';

export const hardcoverClientForDownloader = (
  settings: BookDownloaderSettings
): HardcoverClient | undefined => {
  const token = settings.hardcoverApiToken?.trim()
    ? normalizeHardcoverApiToken(settings.hardcoverApiToken)
    : getHardcoverApiToken(settings.mediaSubtype);

  if (!token) {
    return undefined;
  }

  return new HardcoverClient(token);
};
