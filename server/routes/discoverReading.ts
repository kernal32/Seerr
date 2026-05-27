import { readingMediaTypeForSubtype } from '@server/api/downloaders/factory';
import { getHardcoverApiToken } from '@server/api/metadata/hardcover/getHardcoverToken';
import NytBooksClient from '@server/api/metadata/nyt/client';
import { encodeNytListSlug } from '@server/api/metadata/nyt/encodeNytListSlug';
import {
  getNytApiKey,
  getReadingDiscoverList,
} from '@server/api/metadata/nyt/getReadingDiscoverSettings';
import { resolveNytBooksToSearchResults } from '@server/api/metadata/nyt/resolveToHardcover';
import type { BookDownloaderSettings } from '@server/lib/settings';
import logger from '@server/logger';
import Media from '@server/entity/Media';
import {
  mapReadingMediaResults,
  type ReadingMediaResult,
} from '@server/models/ReadingMedia';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import HardcoverClient from '@server/api/metadata/hardcover/client';

const discoverReadingRoutes = Router();

const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

const ListSlugParamsSchema = z.object({
  listSlug: z.string().min(1),
});

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<
  string,
  {
    expiresAt: number;
    payload: {
      page: number;
      totalPages: number;
      totalResults: number;
      results: ReadingMediaResult[];
    };
  }
>();

type ReadingListKind = 'popular' | 'trending';

const PER_PAGE = 20;

const paginateResults = <T>(items: T[], page: number) => {
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PER_PAGE));
  const start = (page - 1) * PER_PAGE;

  return {
    page,
    totalPages,
    totalResults,
    results: items.slice(start, start + PER_PAGE),
  };
};

const createReadingListHandler =
  (
    mediaSubtype: BookDownloaderSettings['mediaSubtype'],
    listKind: ReadingListKind
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = getHardcoverApiToken(mediaSubtype);

    if (!token) {
      return next({
        status: 503,
        message:
          'Hardcover API token is not configured on the book downloader.',
      });
    }

    try {
      const { page } = PageQuerySchema.parse(req.query);
      const mediaType = readingMediaTypeForSubtype(mediaSubtype);
      const sort =
        listKind === 'popular'
          ? ('activities_count:desc' as const)
          : ('users_read_count:desc' as const);
      const cacheKey = `${mediaSubtype}:${listKind}:${page}`;
      const cached = cache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return res.status(200).json(cached.payload);
      }

      const client = new HardcoverClient(token);
      const ranked = await client.getRankedBooks(
        sort,
        mediaSubtype,
        mediaType,
        page,
        PER_PAGE
      );

      const media = await Media.getRelatedMediaByMetadataId(
        req.user,
        ranked.results.map((result) => ({
          metadataId: result.id,
          mediaType,
        }))
      );

      const payload = {
        page: ranked.page,
        totalPages: ranked.totalPages,
        totalResults: ranked.totalResults,
        results: mapReadingMediaResults(ranked.results, media),
      };

      cache.set(cacheKey, {
        expiresAt: Date.now() + 15 * 60 * 1000,
        payload,
      });

      return res.status(200).json(payload);
    } catch (error) {
      logger.debug('Something went wrong retrieving reading discover list', {
        label: 'Hardcover',
        mediaSubtype,
        listKind,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return next({
        status: 500,
        message: 'Unable to retrieve reading media discover list.',
      });
    }
  };

const createNytListHandler =
  (mediaSubtype: BookDownloaderSettings['mediaSubtype']) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = getNytApiKey();

    if (!apiKey) {
      return next({
        status: 503,
        message: 'NYT Books API key is not configured.',
      });
    }

    try {
      const { listSlug: requestedSlug } = ListSlugParamsSchema.parse(req.params);
      const listConfig = getReadingDiscoverList(requestedSlug, mediaSubtype);

      if (!listConfig) {
        return next({
          status: 404,
          message: 'NYT bestseller list is not enabled.',
        });
      }

      const { page } = PageQuerySchema.parse(req.query);
      const mediaType = readingMediaTypeForSubtype(mediaSubtype);
      const encodedListSlug = encodeNytListSlug(listConfig.listName);
      const cacheKey = `nyt:${mediaSubtype}:${encodedListSlug}:${page}`;
      const cached = cache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return res.status(200).json(cached.payload);
      }

      const nytClient = new NytBooksClient(apiKey);
      const listResult = await nytClient.getListBooks(encodedListSlug);
      const hardcoverToken = getHardcoverApiToken(mediaSubtype);
      const resolved = await resolveNytBooksToSearchResults(
        listResult.books,
        mediaSubtype,
        mediaType,
        hardcoverToken
      );
      const paged = paginateResults(resolved, page);

      const media = await Media.getRelatedMediaByMetadataId(
        req.user,
        paged.results.map((result) => ({
          metadataId: result.id,
          mediaType,
        }))
      );

      const payload = {
        ...paged,
        results: mapReadingMediaResults(paged.results, media),
      };

      cache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        payload,
      });

      return res.status(200).json(payload);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error('Something went wrong retrieving NYT discover list', {
        label: 'NYT Books',
        mediaSubtype,
        listSlug: req.params.listSlug,
        errorMessage,
      });

      return next({
        status: 500,
        message: 'Unable to retrieve NYT bestseller list.',
      });
    }
  };

discoverReadingRoutes.get(
  '/books/popular',
  createReadingListHandler('book', 'popular')
);
discoverReadingRoutes.get(
  '/books/trending',
  createReadingListHandler('book', 'trending')
);
discoverReadingRoutes.get(
  '/audiobooks/popular',
  createReadingListHandler('audiobook', 'popular')
);
discoverReadingRoutes.get(
  '/audiobooks/trending',
  createReadingListHandler('audiobook', 'trending')
);
discoverReadingRoutes.get('/books/nyt/:listSlug', createNytListHandler('book'));
discoverReadingRoutes.get(
  '/audiobooks/nyt/:listSlug',
  createNytListHandler('audiobook')
);

export default discoverReadingRoutes;
