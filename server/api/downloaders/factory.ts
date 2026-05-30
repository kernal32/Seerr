import { MediaType } from '@server/constants/media';
import type {
  BookDownloaderSettings,
  ComicDownloaderSettings,
} from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { BinderyAdapter } from './bindery/adapter';
import { Mylar3Adapter } from './mylar3/adapter';
import { ReadarrAdapter } from './readarr/adapter';
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
    case 'readarr':
      return new ReadarrAdapter(downloaderSettings);
    default:
      throw new Error(
        `Unsupported book downloader provider: ${downloaderSettings.provider}`
      );
  }
};

export const getBookDownloaderDisplayName = (provider: string): string => {
  switch (provider) {
    case 'readarr':
      return 'Bookshelf';
    case 'bindery':
      return 'Bindery';
    default:
      return provider;
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

export const getDefaultComicDownloader = ():
  | ComicDownloaderSettings
  | undefined => {
  const settings = getSettings();

  return (
    settings.comicDownloaders.find(
      (downloader) => downloader.isDefault && !downloader.is4k
    ) ?? settings.comicDownloaders.find((downloader) => !downloader.is4k)
  );
};

export const getComicDownloaderById = (
  id: number
): ComicDownloaderSettings | undefined => {
  const settings = getSettings();

  return settings.comicDownloaders.find((downloader) => downloader.id === id);
};

export const getComicDownloaderAdapter = (
  downloaderSettings: ComicDownloaderSettings
): DownloaderAdapter => {
  switch (downloaderSettings.provider) {
    case 'mylar3':
      return new Mylar3Adapter(downloaderSettings);
    default:
      throw new Error(
        `Unsupported comic downloader provider: ${downloaderSettings.provider}`
      );
  }
};

export const getComicDownloaderDisplayName = (provider: string): string => {
  switch (provider) {
    case 'mylar3':
      return 'Mylar3';
    default:
      return provider;
  }
};

export const getDefaultComicAdapter = (): {
  adapter: DownloaderAdapter;
  settings: ComicDownloaderSettings;
} => {
  const settings = getDefaultComicDownloader();

  if (!settings) {
    throw new Error('No default comic downloader configured');
  }

  return {
    settings,
    adapter: getComicDownloaderAdapter(settings),
  };
};
