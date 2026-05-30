import {
  getDefaultComicAdapter,
  getDefaultComicDownloader,
} from '@server/api/downloaders/factory';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import {
  mapReadingMediaDetails,
  mapReadingMediaResults,
} from '@server/models/ReadingMedia';
import { Router } from 'express';
import { mapReadingRouteError } from './errors';

export const createComicMediaRoutes = (): Router => {
  const router = Router();

  router.get('/config/status', (_req, res) => {
    const configured = !!getDefaultComicDownloader();

    return res.status(200).json({ configured });
  });

  router.get('/search', async (req, res, next) => {
    const query = req.query.query as string;

    if (!query?.trim()) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
      const { adapter } = getDefaultComicAdapter();
      const results = await adapter.search(query.trim());
      const media = await Media.getRelatedMediaByMetadataId(
        req.user,
        results.map((result) => ({
          metadataId: result.id,
          mediaType: MediaType.COMIC,
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
        label: 'API',
        query,
        notConfiguredMessage: 'No comic downloader configured.',
      });

      if (mapped) {
        return next(mapped);
      }

      logger.debug(
        'Something went wrong retrieving comic search results',
        {
          label: 'API',
          errorMessage: error instanceof Error ? error.message : String(error),
          query,
        }
      );

      return next({
        status: 500,
        message: 'Unable to retrieve comic search results.',
      });
    }
  });

  router.get('/:mediaId', async (req, res, next) => {
    const mediaId = decodeURIComponent(req.params.mediaId);

    try {
      const { adapter } = getDefaultComicAdapter();
      const details = await adapter.getDetails(mediaId);
      const mediaRepository = getRepository(Media);

      const media = await mediaRepository.findOne({
        where: { metadataId: mediaId, mediaType: MediaType.COMIC },
        relations: {
          requests: { requestedBy: true, modifiedBy: true },
        },
      });

      return res
        .status(200)
        .json(mapReadingMediaDetails(details, media, mediaId));
    } catch (error) {
      const mapped = mapReadingRouteError(error, {
        label: 'API',
        mediaId,
        notConfiguredMessage: 'No comic downloader configured.',
      });

      if (mapped) {
        return next(mapped);
      }

      logger.debug('Something went wrong retrieving comic details', {
        label: 'API',
        errorMessage: error instanceof Error ? error.message : String(error),
        mediaId,
      });

      return next({
        status: 500,
        message: 'Unable to retrieve comic.',
      });
    }
  });

  return router;
};
