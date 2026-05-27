import {
  getDefaultBookAdapter,
  getDefaultBookDownloader,
} from '@server/api/downloaders/factory';
import type { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type { BookDownloaderSettings } from '@server/lib/settings';
import logger from '@server/logger';
import {
  mapReadingMediaDetails,
  mapReadingMediaResults,
} from '@server/models/ReadingMedia';
import { Router } from 'express';
import { mapReadingRouteError } from './errors';

export interface ReadingMediaRouteConfig {
  mediaSubtype: BookDownloaderSettings['mediaSubtype'];
  mediaType: MediaType;
  routeLabel: string;
  notConfiguredMessage: string;
  searchErrorMessage: string;
  detailErrorMessage: string;
}

export const createReadingMediaRoutes = (
  config: ReadingMediaRouteConfig
): Router => {
  const router = Router();

  router.get('/config/status', (_req, res) => {
    const configured = !!getDefaultBookDownloader(config.mediaSubtype);

    return res.status(200).json({ configured });
  });

  router.get('/search', async (req, res, next) => {
    const query = req.query.query as string;

    if (!query?.trim()) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
      const { adapter } = getDefaultBookAdapter(config.mediaSubtype);
      const results = await adapter.search(query.trim());
      const media = await Media.getRelatedMediaByMetadataId(
        req.user,
        results.map((result) => ({
          metadataId: result.id,
          mediaType: config.mediaType,
        }))
      );

      return res.status(200).json({
        page: 1,
        totalPages: 1,
        totalResults: results.length,
        results: mapReadingMediaResults(results, media),
      });
    } catch (error) {
      const mapped = mapReadingRouteError(error, {
        label: config.routeLabel,
        query,
        notConfiguredMessage: config.notConfiguredMessage,
      });

      if (mapped) {
        return next(mapped);
      }

      logger.debug(
        'Something went wrong retrieving reading media search results',
        {
          label: config.routeLabel,
          errorMessage: error instanceof Error ? error.message : String(error),
          query,
        }
      );

      return next({
        status: 500,
        message: config.searchErrorMessage,
      });
    }
  });

  router.get('/:mediaId', async (req, res, next) => {
    const mediaId = decodeURIComponent(req.params.mediaId);

    try {
      const { adapter } = getDefaultBookAdapter(config.mediaSubtype);
      const details = await adapter.getDetails(mediaId);
      const mediaRepository = getRepository(Media);

      const media = await mediaRepository.findOne({
        where: { metadataId: mediaId, mediaType: config.mediaType },
        relations: { requests: true },
      });

      return res
        .status(200)
        .json(mapReadingMediaDetails(details, media, mediaId));
    } catch (error) {
      const mapped = mapReadingRouteError(error, {
        label: config.routeLabel,
        mediaId,
        notConfiguredMessage: config.notConfiguredMessage,
      });

      if (mapped) {
        return next(mapped);
      }

      logger.debug('Something went wrong retrieving reading media details', {
        label: config.routeLabel,
        errorMessage: error instanceof Error ? error.message : String(error),
        mediaId,
      });

      return next({
        status: 500,
        message: config.detailErrorMessage,
      });
    }
  });

  return router;
};
