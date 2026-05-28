import type { BookDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { normalizeHardcoverApiToken } from './normalizeToken';

const tokenForSubtype = (
  mediaSubtype: BookDownloaderSettings['mediaSubtype']
): string | undefined => {
  const settings = getSettings();
  const matchesSubtype = (downloader: BookDownloaderSettings) =>
    !downloader.is4k && downloader.mediaSubtype === mediaSubtype;

  const downloaders = settings.bookDownloaders.filter(matchesSubtype);
  const defaultDownloader =
    downloaders.find((downloader) => downloader.isDefault) ?? downloaders[0];
  const downloaderWithToken = defaultDownloader?.hardcoverApiToken?.trim()
    ? defaultDownloader
    : downloaders.find((downloader) => downloader.hardcoverApiToken?.trim());

  if (!downloaderWithToken?.hardcoverApiToken?.trim()) {
    return undefined;
  }

  return normalizeHardcoverApiToken(downloaderWithToken.hardcoverApiToken);
};

export const getHardcoverApiToken = (
  mediaSubtype: BookDownloaderSettings['mediaSubtype'] = 'book'
): string | undefined => {
  const token = tokenForSubtype(mediaSubtype);

  if (token) {
    return token;
  }

  // Hardcover metadata is shared — book downloader token works for audiobook lookups.
  if (mediaSubtype === 'audiobook') {
    return tokenForSubtype('book');
  }

  return undefined;
};
