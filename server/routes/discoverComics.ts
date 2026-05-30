import ComicVineClient from '@server/api/metadata/comicvine/client';
import type { ComicVineListVolumesOptions } from '@server/api/metadata/comicvine/client';
import { getComicVineApiKey } from '@server/api/metadata/comicvine/getComicVineApiKey';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { mapReadingMediaResults } from '@server/models/ReadingMedia';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

const discoverComicsRoutes = Router();

const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

const PublisherParamsSchema = z.object({
  publisherId: z.coerce.number().int().positive(),
});

const CACHE_TTL_MS = 60 * 60 * 1000;
const PER_PAGE = 20;

type DiscoverPayload = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: ReturnType<typeof mapReadingMediaResults>;
};

const cache = new Map<
  string,
  {
    expiresAt: number;
    payload: DiscoverPayload;
  }
>();

const handleComicDiscoverList = async (
  req: Request,
  res: Response,
  next: NextFunction,
  cacheKey: string,
  buildListOptions: (page: number) => ComicVineListVolumesOptions
) => {
  const apiKey = getComicVineApiKey();

  if (!apiKey) {
    return next({
      status: 503,
      message: 'Comic Vine API key is not configured on the comic downloader.',
    });
  }

  try {
    const { page } = PageQuerySchema.parse(req.query);
    const fullCacheKey = `${cacheKey}:${page}`;
    const cached = cache.get(fullCacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json(cached.payload);
    }

    const client = new ComicVineClient(apiKey);
    const listed = await client.listVolumes(buildListOptions(page));
    const totalPages = Math.max(1, Math.ceil(listed.totalResults / PER_PAGE));

    const media = await Media.getRelatedMediaByMetadataId(
      req.user,
      listed.results.map((result) => ({
        metadataId: result.id,
        mediaType: MediaType.COMIC,
      }))
    );

    const payload: DiscoverPayload = {
      page,
      totalPages,
      totalResults: listed.totalResults,
      results: mapReadingMediaResults(listed.results, media),
    };

    cache.set(fullCacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });

    return res.status(200).json(payload);
  } catch (error) {
    logger.debug('Something went wrong retrieving comic discover list', {
      label: 'ComicVine',
      cacheKey,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return next({
      status: 500,
      message: 'Unable to retrieve comic discover list.',
    });
  }
};

discoverComicsRoutes.get('/comics/recent', (req, res, next) =>
  handleComicDiscoverList(req, res, next, 'recent', (page) => ({
    sort: 'date_added:desc',
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  }))
);

discoverComicsRoutes.get('/comics/publisher/:publisherId', (req, res, next) => {
  const { publisherId } = PublisherParamsSchema.parse(req.params);

  return handleComicDiscoverList(
    req,
    res,
    next,
    `publisher:${publisherId}`,
    (page) => ({
      filter: `publisher:${publisherId}`,
      sort: 'name:asc',
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
    })
  );
});

export default discoverComicsRoutes;
