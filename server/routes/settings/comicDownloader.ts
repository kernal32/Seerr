import type { ComicDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
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

  if (req.body.isDefault) {
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

comicDownloaderRoutes.post('/test', async (_req, res, next) => {
  next({
    status: 501,
    message:
      'Comic downloader test is not available until Kapowarr adapter ships.',
  });
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
