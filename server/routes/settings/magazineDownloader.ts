import type { MagazineDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { Router } from 'express';

const magazineDownloaderRoutes = Router();

magazineDownloaderRoutes.get('/', (_req, res) => {
  res.status(200).json(getSettings().magazineDownloaders);
});

magazineDownloaderRoutes.post('/', async (req, res) => {
  const settings = getSettings();
  const newDownloader = req.body as MagazineDownloaderSettings;
  const lastItem =
    settings.magazineDownloaders[settings.magazineDownloaders.length - 1];
  newDownloader.id = lastItem ? lastItem.id + 1 : 0;

  if (req.body.isDefault) {
    settings.magazineDownloaders
      .filter((instance) => instance.isDefault)
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.magazineDownloaders = [
    ...settings.magazineDownloaders,
    newDownloader,
  ];
  await settings.save();

  return res.status(201).json(newDownloader);
});

magazineDownloaderRoutes.post('/test', async (_req, res, next) => {
  next({
    status: 501,
    message:
      'Magazine downloader test is not available until LazyLibrarian adapter ships.',
  });
});

magazineDownloaderRoutes.put<
  { id: string },
  MagazineDownloaderSettings,
  MagazineDownloaderSettings
>('/:id', async (req, res, next) => {
  const settings = getSettings();
  const index = settings.magazineDownloaders.findIndex(
    (instance) => instance.id === Number(req.params.id)
  );

  if (index === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  if (req.body.isDefault) {
    settings.magazineDownloaders
      .filter((instance) => instance.isDefault)
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.magazineDownloaders[index] = {
    ...req.body,
    id: Number(req.params.id),
  } as MagazineDownloaderSettings;

  await settings.save();

  return res.status(200).json(settings.magazineDownloaders[index]);
});

magazineDownloaderRoutes.delete<{ id: string }>(
  '/:id',
  async (req, res, next) => {
    const settings = getSettings();
    const index = settings.magazineDownloaders.findIndex(
      (instance) => instance.id === Number(req.params.id)
    );

    if (index === -1) {
      return next({ status: 404, message: 'Settings instance not found' });
    }

    const removed = settings.magazineDownloaders.splice(index, 1);
    await settings.save();

    return res.status(200).json(removed[0]);
  }
);

export default magazineDownloaderRoutes;
