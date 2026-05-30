import { Mylar3Adapter } from '@server/api/downloaders/mylar3/adapter';
import type { ComicDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const comicDownloaderRoutes = Router();

comicDownloaderRoutes.get('/', (_req, res) => {
  res.status(200).json(getSettings().comicDownloaders);
});

comicDownloaderRoutes.post('/', async (req, res) => {
  const settings = getSettings();
  const newDownloader = req.body as ComicDownloaderSettings;
  const lastItem =
    settings.comicDownloaders[settings.comicDownloaders.length - 1];
  newDownloader.id = lastItem ? lastItem.id + 1 : 0;
  newDownloader.is4k = false;
  newDownloader.provider = newDownloader.provider ?? 'mylar3';

  if (settings.comicDownloaders.length === 0) {
    newDownloader.isDefault = true;
  } else if (req.body.isDefault) {
    settings.comicDownloaders
      .filter((instance) => instance.isDefault)
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.comicDownloaders = [...settings.comicDownloaders, newDownloader];
  await settings.save();

  return res.status(201).json(newDownloader);
});

comicDownloaderRoutes.post<
  undefined,
  Record<string, unknown>,
  ComicDownloaderSettings
>('/test', async (req, res, next) => {
  try {
    const adapter = new Mylar3Adapter({
      ...req.body,
      provider: req.body.provider ?? 'mylar3',
    });

    await adapter.testConnection();

    return res.status(200).json({
      urlBase: req.body.baseUrl ?? '',
      comicVineConfigured: Boolean(req.body.comicVineApiKey?.trim()),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';

    logger.error('Failed to test comic downloader', {
      label: 'Comic Downloader',
      message,
    });

    next({ status: 500, message: 'Failed to connect to comic downloader' });
  }
});

comicDownloaderRoutes.put<
  { id: string },
  ComicDownloaderSettings,
  ComicDownloaderSettings
>('/:id', async (req, res, next) => {
  const settings = getSettings();
  const index = settings.comicDownloaders.findIndex(
    (instance) => instance.id === Number(req.params.id)
  );

  if (index === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  if (req.body.isDefault) {
    settings.comicDownloaders
      .filter((instance) => instance.isDefault)
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.comicDownloaders[index] = {
    ...req.body,
    id: Number(req.params.id),
    is4k: false,
    provider: req.body.provider ?? 'mylar3',
  } as ComicDownloaderSettings;

  await settings.save();

  return res.status(200).json(settings.comicDownloaders[index]);
});

comicDownloaderRoutes.delete<{ id: string }>('/:id', async (req, res, next) => {
  const settings = getSettings();
  const index = settings.comicDownloaders.findIndex(
    (instance) => instance.id === Number(req.params.id)
  );

  if (index === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  const removed = settings.comicDownloaders.splice(index, 1);
  await settings.save();

  return res.status(200).json(removed[0]);
});

export default comicDownloaderRoutes;
