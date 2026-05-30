import type { ReadarrBook } from '@server/api/downloaders/readarr/types';
import { MediaStatus } from '@server/constants/media';

export const hasBookFiles = (book: ReadarrBook): boolean =>
  (book.statistics?.bookFileCount ?? 0) > 0;

export const resolveBookMediaStatusAfterPoll = (
  currentStatus: MediaStatus,
  book: ReadarrBook
): MediaStatus => {
  if (currentStatus !== MediaStatus.PROCESSING) {
    return currentStatus;
  }

  return hasBookFiles(book) ? MediaStatus.AVAILABLE : MediaStatus.PROCESSING;
};

export const resolveMissingBookMediaStatus = (
  currentStatus: MediaStatus
): MediaStatus => {
  if (currentStatus !== MediaStatus.PROCESSING) {
    return currentStatus;
  }

  return MediaStatus.UNKNOWN;
};
