export enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  FAILED,
  COMPLETED,
}

export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
  BOOK = 'book',
  AUDIOBOOK = 'audiobook',
  COMIC = 'comic',
  MAGAZINE = 'magazine',
}

const READING_MEDIA_TYPES = new Set<MediaType>([
  MediaType.BOOK,
  MediaType.AUDIOBOOK,
  MediaType.COMIC,
  MediaType.MAGAZINE,
]);

export const isReadingMediaType = (mediaType: MediaType): boolean =>
  READING_MEDIA_TYPES.has(mediaType);

export const isVideoMediaType = (
  mediaType: MediaType
): mediaType is MediaType.MOVIE | MediaType.TV =>
  mediaType === MediaType.MOVIE || mediaType === MediaType.TV;

export enum MediaStatus {
  UNKNOWN = 1,
  PENDING,
  PROCESSING,
  PARTIALLY_AVAILABLE,
  AVAILABLE,
  BLOCKLISTED,
  DELETED,
}
