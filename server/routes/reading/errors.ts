import logger from '@server/logger';
import axios from 'axios';

interface ReadingRouteErrorContext {
  label: string;
  query?: string;
  mediaId?: string;
  notConfiguredMessage: string;
}

const extractUpstreamError = (data: unknown): string | undefined => {
  if (data && typeof data === 'object' && 'error' in data) {
    const error = (data as { error?: unknown }).error;

    return typeof error === 'string' ? error : undefined;
  }

  return undefined;
};

export const mapReadingRouteError = (
  error: unknown,
  context: ReadingRouteErrorContext
): { status: number; message: string } | null => {
  if (
    error instanceof Error &&
    error.message.includes('No default book downloader')
  ) {
    return { status: 503, message: context.notConfiguredMessage };
  }

  if (
    error instanceof Error &&
    error.message.includes('Hardcover API token is not configured')
  ) {
    return {
      status: 503,
      message: 'Hardcover API token is not configured on the book downloader.',
    };
  }

  if (error instanceof Error && error.message.includes('Book not found')) {
    return { status: 404, message: 'Reading media not found.' };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const upstreamError = extractUpstreamError(error.response?.data);

    if (status === 502) {
      logger.warn('Metadata search unavailable from book downloader', {
        label: context.label,
        query: context.query,
        mediaId: context.mediaId,
        status,
      });

      return {
        status: 502,
        message: upstreamError
          ? `Metadata search unavailable: ${upstreamError}`
          : 'Metadata search unavailable.',
      };
    }

    if (status === 401) {
      logger.warn('Metadata provider authentication failed', {
        label: context.label,
        query: context.query,
        mediaId: context.mediaId,
        status,
      });

      return {
        status: 503,
        message:
          upstreamError === 'Unable to verify token'
            ? 'Hardcover metadata authentication failed.'
            : 'Book downloader authentication failed.',
      };
    }
  }

  if (
    error instanceof Error &&
    (error.message.includes('Unable to verify token') ||
      error.message.includes('Hardcover returned an empty response'))
  ) {
    logger.warn('Hardcover metadata search failed', {
      label: context.label,
      query: context.query,
      mediaId: context.mediaId,
      errorMessage: error.message,
    });

    return {
      status: 503,
      message: 'Hardcover metadata authentication failed.',
    };
  }

  if (error instanceof Error && error.message.includes('metadata provider')) {
    logger.warn('Metadata search unavailable from book downloader', {
      label: context.label,
      query: context.query,
      mediaId: context.mediaId,
      errorMessage: error.message,
    });

    return {
      status: 502,
      message: `Metadata search unavailable: ${error.message}`,
    };
  }

  return null;
};
