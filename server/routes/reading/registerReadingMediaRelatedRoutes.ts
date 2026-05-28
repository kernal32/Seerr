import HardcoverClient from '@server/api/metadata/hardcover/client';
import { HARDCOVER_ID_PREFIX } from '@server/api/metadata/hardcover/constants';
import { getHardcoverApiToken } from '@server/api/metadata/hardcover/getHardcoverToken';
import type { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import type { BookDownloaderSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { mapReadingMediaResults } from '@server/models/ReadingMedia';
import type { NextFunction, Request, Response, Router } from 'express';

const RELATED_LIST_LIMIT = 20;

const createRelatedListHandler =
  (
    mediaSubtype: BookDownloaderSettings['mediaSubtype'],
    mediaType: MediaType,
    fetchResults: (
      client: HardcoverClient,
      mediaId: string,
      authorName: string | undefined,
      foreignAuthorId: string | undefined
    ) => Promise<Awaited<ReturnType<HardcoverClient['getBooksByAuthor']>>>
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

    const mediaId = decodeURIComponent(
      String(
        req.params.mediaId ?? req.params.bookId ?? req.params.audiobookId ?? ''
      )
    );

    if (!mediaId.startsWith(HARDCOVER_ID_PREFIX)) {
      return res.status(200).json({
        page: 1,
        totalPages: 1,
        totalResults: 0,
        results: [],
      });
    }

    try {
      const client = new HardcoverClient(token);
      const authorName =
        typeof req.query.authorName === 'string'
          ? req.query.authorName
          : undefined;
      const foreignAuthorId =
        typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
      const results = await fetchResults(
        client,
        mediaId,
        authorName,
        foreignAuthorId
      );
      const media = await Media.getRelatedMediaByMetadataId(
        req.user,
        results.map((result) => ({
          metadataId: result.id,
          mediaType,
        }))
      );

      return res.status(200).json({
        page: 1,
        totalPages: 1,
        totalResults: results.length,
        results: mapReadingMediaResults(results, media),
      });
    } catch (error) {
      logger.warn('Something went wrong retrieving related reading media', {
        label: 'Hardcover',
        mediaSubtype,
        mediaId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return res.status(200).json({
        page: 1,
        totalPages: 1,
        totalResults: 0,
        results: [],
      });
    }
  };

export const registerReadingMediaRelatedRoutes = (
  router: Router,
  config: {
    mediaSubtype: BookDownloaderSettings['mediaSubtype'];
    mediaType: MediaType;
  }
): void => {
  router.get(
    '/:mediaId/author-books',
    createRelatedListHandler(
      config.mediaSubtype,
      config.mediaType,
      async (client, mediaId, authorName, foreignAuthorId) => {
        if (!authorName?.trim()) {
          return [];
        }

        let resolvedAuthorId = foreignAuthorId?.trim();

        if (!resolvedAuthorId) {
          try {
            const details = await client.getDetails(mediaId, config.mediaType);
            resolvedAuthorId = details.foreignAuthorId;
          } catch {
            resolvedAuthorId = undefined;
          }
        }

        return client.getBooksByAuthor(
          authorName.trim(),
          mediaId,
          config.mediaSubtype,
          config.mediaType,
          RELATED_LIST_LIMIT,
          resolvedAuthorId
        );
      }
    )
  );

  router.get(
    '/:mediaId/similar',
    createRelatedListHandler(
      config.mediaSubtype,
      config.mediaType,
      async (client, mediaId) =>
        client.getSimilarBooks(
          mediaId,
          config.mediaSubtype,
          config.mediaType,
          RELATED_LIST_LIMIT
        )
    )
  );
};
