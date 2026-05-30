import { getDefaultComicDownloader } from '@server/api/downloaders/factory';

export const getComicVineApiKey = (): string | undefined => {
  const downloader = getDefaultComicDownloader();
  const apiKey = downloader?.comicVineApiKey?.trim();

  return apiKey || undefined;
};
