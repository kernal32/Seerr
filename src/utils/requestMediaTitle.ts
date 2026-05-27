import { MediaType } from '@server/constants/media';
import type { MovieDetails } from '@server/models/Movie';
import type { ReadingMediaDetailsResult } from '@server/models/ReadingMedia';
import type { TvDetails } from '@server/models/Tv';

export type RequestTitleData =
  | MovieDetails
  | TvDetails
  | ReadingMediaDetailsResult;

export const isReadingMediaRequestType = (
  type: string
): type is MediaType.BOOK | MediaType.AUDIOBOOK =>
  type === MediaType.BOOK || type === MediaType.AUDIOBOOK;

export const getRequestTitleApiUrl = (request: {
  type: string;
  media: { tmdbId: number; metadataId?: string | null };
}): string | null => {
  switch (request.type) {
    case MediaType.MOVIE:
      return `/api/v1/movie/${request.media.tmdbId}`;
    case MediaType.TV:
      return `/api/v1/tv/${request.media.tmdbId}`;
    case MediaType.BOOK:
    case MediaType.AUDIOBOOK:
      if (!request.media.metadataId) {
        return null;
      }

      return request.type === MediaType.BOOK
        ? `/api/v1/book/${encodeURIComponent(request.media.metadataId)}`
        : `/api/v1/audiobook/${encodeURIComponent(request.media.metadataId)}`;
    default:
      return null;
  }
};

export const getRequestDetailPath = (request: {
  type: string;
  media: { tmdbId: number; metadataId?: string | null };
}): string => {
  switch (request.type) {
    case MediaType.MOVIE:
      return `/movie/${request.media.tmdbId}`;
    case MediaType.TV:
      return `/tv/${request.media.tmdbId}`;
    case MediaType.BOOK:
      return request.media.metadataId
        ? `/book/${encodeURIComponent(request.media.metadataId)}`
        : '#';
    case MediaType.AUDIOBOOK:
      return request.media.metadataId
        ? `/audiobook/${encodeURIComponent(request.media.metadataId)}`
        : '#';
    default:
      return '#';
  }
};

export const getRequestDisplayTitle = (
  requestType: string,
  title: RequestTitleData
): string => {
  if (isReadingMediaRequestType(requestType)) {
    return (title as ReadingMediaDetailsResult).title;
  }

  return (title as MovieDetails).title ?? (title as TvDetails).name ?? '';
};

export const getRequestDisplayYear = (
  requestType: string,
  title: RequestTitleData
): string | undefined => {
  if (isReadingMediaRequestType(requestType)) {
    return (title as ReadingMediaDetailsResult).year;
  }

  if ((title as MovieDetails).title !== undefined) {
    return (title as MovieDetails).releaseDate?.slice(0, 4);
  }

  return (title as TvDetails).firstAirDate?.slice(0, 4);
};

export const getRequestPosterSrc = (
  requestType: string,
  title: RequestTitleData
): string => {
  if (isReadingMediaRequestType(requestType)) {
    return (
      (title as ReadingMediaDetailsResult).coverUrl ??
      '/images/seerr_poster_not_found.png'
    );
  }

  const posterPath = (title as MovieDetails | TvDetails).posterPath;

  return posterPath
    ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${posterPath}`
    : '/images/seerr_poster_not_found.png';
};
