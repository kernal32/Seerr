import { MediaType } from '@server/constants/media';
import type { BookDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { BinderyAdapter } from './bindery/adapter';
import type { DownloaderAdapter } from './types';

export const getDefaultBookDownloader = (
  mediaSubtype: BookDownloaderSettings['mediaSubtype'] = 'book'
): BookDownloaderSettings | undefined => {
  const settings = getSettings();

  const matchesSubtype = (downloader: BookDownloaderSettings) =>
    !downloader.is4k && downloader.mediaSubtype === mediaSubtype;

  return (
    settings.bookDownloaders.find(
      (downloader) => downloader.isDefault && matchesSubtype(downloader)
    ) ?? settings.bookDownloaders.find(matchesSubtype)
  );
};

export const getBookDownloaderById = (
  id: number
): BookDownloaderSettings | undefined => {
  const settings = getSettings();

  return settings.bookDownloaders.find((downloader) => downloader.id === id);
};

export const getBookDownloaderAdapter = (
  downloaderSettings: BookDownloaderSettings
): DownloaderAdapter => {
  switch (downloaderSettings.provider) {
    case 'bindery':
      return new BinderyAdapter(downloaderSettings);
    default:
      throw new Error(
        `Unsupported book downloader provider: ${downloaderSettings.provider}`
      );
  }
};

export const getDefaultBookAdapter = (
  mediaSubtype: BookDownloaderSettings['mediaSubtype'] = 'book'
): { adapter: DownloaderAdapter; settings: BookDownloaderSettings } => {
  const settings = getDefaultBookDownloader(mediaSubtype);

  if (!settings) {
    throw new Error('No default book downloader configured');
  }

  return {
    settings,
    adapter: getBookDownloaderAdapter(settings),
  };
};

export const readingMediaTypeForSubtype = (
  mediaSubtype: BookDownloaderSettings['mediaSubtype']
): MediaType =>
  mediaSubtype === 'audiobook' ? MediaType.AUDIOBOOK : MediaType.BOOK;
