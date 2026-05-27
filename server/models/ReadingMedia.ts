import type { MediaDetails, SearchResult } from '@server/api/downloaders/types';
import type { MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';

export interface ReadingMediaResult extends SearchResult {
  foreignAuthorId?: string;
  mediaInfo?: {
    status?: MediaStatus;
    downloadStatus?: unknown[];
    requests?: unknown[];
  };
}

export interface ReadingMediaDetailsResult extends MediaDetails {
  id: string;
  foreignAuthorId?: string;
  mediaInfo?: Media;
}

export const mapReadingMediaResults = (
  results: SearchResult[],
  media: Media[]
): ReadingMediaResult[] =>
  results.map((result) => {
    const mediaInfo = media.find(
      (item) =>
        item.metadataId === result.id && item.mediaType === result.mediaType
    );

    return {
      ...result,
      mediaInfo: mediaInfo
        ? {
            status: mediaInfo.status,
            downloadStatus: [],
            requests: mediaInfo.requests,
          }
        : undefined,
    };
  });

export const mapReadingMediaDetails = (
  details: MediaDetails,
  media: Media | null | undefined,
  id: string
): ReadingMediaDetailsResult => ({
  ...details,
  id,
  foreignAuthorId: details.foreignAuthorId,
  mediaInfo: media ?? undefined,
});
