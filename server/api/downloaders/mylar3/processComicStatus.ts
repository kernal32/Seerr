import { MediaStatus } from '@server/constants/media';
import type { Mylar3IssueRecord } from './client';

export const hasDownloadedComicIssues = (
  issues: Mylar3IssueRecord[] | undefined
): boolean =>
  (issues ?? []).some(
    (issue) => issue.Status?.toLowerCase() === 'downloaded'
  );

export const resolveComicMediaStatusAfterPoll = (
  currentStatus: MediaStatus,
  issues: Mylar3IssueRecord[] | undefined
): MediaStatus => {
  if (currentStatus !== MediaStatus.PROCESSING) {
    return currentStatus;
  }

  return hasDownloadedComicIssues(issues)
    ? MediaStatus.AVAILABLE
    : MediaStatus.PROCESSING;
};

export const resolveMissingComicMediaStatus = (
  currentStatus: MediaStatus
): MediaStatus => {
  if (currentStatus !== MediaStatus.PROCESSING) {
    return currentStatus;
  }

  return MediaStatus.UNKNOWN;
};
