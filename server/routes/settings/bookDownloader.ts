import BinderyClient from '@server/api/downloaders/bindery/client';
import type { BookDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { Router } from 'express';

const bookDownloaderRoutes = Router();

bookDownloaderRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.bookDownloaders);
});

bookDownloaderRoutes.post('/', async (req, res) => {
  const settings = getSettings();
  const newDownloader = req.body as BookDownloaderSettings;
  const lastItem =
    settings.bookDownloaders[settings.bookDownloaders.length - 1];
  newDownloader.id = lastItem ? lastItem.id + 1 : 0;
  newDownloader.is4k = false;

  const sameSubtypeDownloaders = settings.bookDownloaders.filter(
    (instance) => instance.mediaSubtype === newDownloader.mediaSubtype
  );

  if (sameSubtypeDownloaders.length === 0) {
    newDownloader.isDefault = true;
  } else if (req.body.isDefault) {
    settings.bookDownloaders
      .filter(
        (instance) =>
          instance.isDefault &&
          instance.mediaSubtype === newDownloader.mediaSubtype
      )
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.bookDownloaders = [...settings.bookDownloaders, newDownloader];
  await settings.save();

  return res.status(201).json(newDownloader);
});

bookDownloaderRoutes.post<
  undefined,
  Record<string, unknown>,
  BookDownloaderSettings
>('/test', async (req, res, next) => {
  try {
    const client = new BinderyClient(
      req.body,
      BinderyClient.buildUrl(req.body)
    );

    await client.getSystemStatus();
    const profiles = await client.getQualityProfiles();
    const folders = await client.getRootFolders();

    return res.status(200).json({
      profiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
      urlBase: req.body.baseUrl ?? '',
    });
  } catch (e) {
    const message =
      axios.isAxiosError(e) && e.response?.status
        ? `Bindery returned HTTP ${e.response.status}`
        : e instanceof Error
          ? e.message
          : 'Unknown error';

    logger.error('Failed to test book downloader', {
      label: 'Bindery',
      message,
    });

    next({ status: 500, message: 'Failed to connect to book downloader' });
  }
});

bookDownloaderRoutes.put<
  { id: string },
  BookDownloaderSettings,
  BookDownloaderSettings
>('/:id', async (req, res, next) => {
  const settings = getSettings();
  const index = settings.bookDownloaders.findIndex(
    (instance) => instance.id === Number(req.params.id)
  );

  if (index === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  if (req.body.isDefault) {
    settings.bookDownloaders
      .filter(
        (instance) =>
          instance.isDefault && instance.mediaSubtype === req.body.mediaSubtype
      )
      .forEach((instance) => {
        instance.isDefault = false;
      });
  }

  settings.bookDownloaders[index] = {
    ...req.body,
    id: Number(req.params.id),
    is4k: false,
  } as BookDownloaderSettings;

  await settings.save();

  return res.status(200).json(settings.bookDownloaders[index]);
});

bookDownloaderRoutes.delete<{ id: string }>('/:id', async (req, res, next) => {
  const settings = getSettings();
  const index = settings.bookDownloaders.findIndex(
    (instance) => instance.id === Number(req.params.id)
  );

  if (index === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  const removed = settings.bookDownloaders.splice(index, 1);
  await settings.save();

  return res.status(200).json(removed[0]);
});

export default bookDownloaderRoutes;
