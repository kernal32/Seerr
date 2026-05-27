import NytBooksClient from '@server/api/metadata/nyt/client';
import { inferMediaSubtypeFromNytList } from '@server/api/metadata/nyt/constants';
import { nytListSlug } from '@server/api/metadata/nyt/encodeNytListSlug';
import {
  getSettings,
  type ReadingDiscoverSettings,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { Router } from 'express';
import { z } from 'zod';

const readingDiscoverSettingsRoutes = Router();

const ReadingDiscoverBodySchema = z.object({
  nytApiKey: z.string().optional(),
  nytEnabled: z.boolean(),
  lists: z.array(
    z.object({
      listName: z.string().min(1),
      displayName: z.string().min(1),
      mediaSubtype: z.enum(['book', 'audiobook']),
      enabled: z.boolean(),
    })
  ),
  hardcoverPopularEnabled: z.boolean(),
  hardcoverTrendingEnabled: z.boolean(),
});

readingDiscoverSettingsRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.readingDiscover);
});

readingDiscoverSettingsRoutes.put('/', async (req, res, next) => {
  try {
    const body = ReadingDiscoverBodySchema.parse(req.body);
    const settings = getSettings();
    const current = settings.readingDiscover;

    settings.readingDiscover = {
      ...current,
      nytApiKey:
        body.nytApiKey !== undefined && body.nytApiKey !== ''
          ? body.nytApiKey
          : current.nytApiKey,
      nytEnabled: body.nytEnabled,
      lists: body.lists,
      hardcoverPopularEnabled: body.hardcoverPopularEnabled,
      hardcoverTrendingEnabled: body.hardcoverTrendingEnabled,
    };

    await settings.save();

    return res.status(200).json(settings.readingDiscover);
  } catch (error) {
    logger.error('Failed to save reading discover settings', {
      label: 'ReadingDiscover',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return next({
      status: 400,
      message: 'Invalid reading discover settings.',
    });
  }
});

readingDiscoverSettingsRoutes.post('/test', async (req, res, next) => {
  const apiKey = (req.body as { nytApiKey?: string }).nytApiKey?.trim();

  if (!apiKey) {
    return next({
      status: 400,
      message: 'NYT Books API key is required.',
    });
  }

  try {
    const client = new NytBooksClient(apiKey);
    await client.testConnection();

    return res.status(200).json({ success: true });
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.status
        ? `NYT Books API returned HTTP ${error.response.status}`
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    logger.error('Failed to test NYT Books API connection', {
      label: 'NYT Books',
      errorMessage: message,
    });

    return res.status(500).json({
      success: false,
      message,
    });
  }
});

readingDiscoverSettingsRoutes.get('/nyt-lists', async (_req, res, next) => {
  const settings = getSettings();
  const apiKey = settings.readingDiscover.nytApiKey?.trim();

  if (!apiKey) {
    return next({
      status: 400,
      message: 'Save an NYT Books API key before loading lists.',
    });
  }

  try {
    const client = new NytBooksClient(apiKey);
    const lists = await client.getOverview();

    return res.status(200).json(
      lists.map((list) => ({
        listName: nytListSlug(list),
        displayName: list.display_name,
        mediaSubtype: inferMediaSubtypeFromNytList(nytListSlug(list)),
        bookCount: list.books.length,
      }))
    );
  } catch (error) {
    logger.error('Failed to load NYT bestseller lists', {
      label: 'NYT Books',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return next({
      status: 500,
      message: 'Unable to load NYT bestseller lists.',
    });
  }
});

export type { ReadingDiscoverSettings };

export default readingDiscoverSettingsRoutes;
