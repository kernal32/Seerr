import { COMICVINE_VOLUME_RESOURCE } from './constants';

/** Strip Comic Vine resource prefix (e.g. 4050-12345 → 12345). */
export const normalizeComicVineVolumeId = (id: string): string => {
  const trimmed = id.trim();
  const prefixed = `${COMICVINE_VOLUME_RESOURCE}-`;

  if (trimmed.startsWith(prefixed)) {
    return trimmed.slice(prefixed.length);
  }

  return trimmed;
};

export const comicVineVolumeApiId = (id: string): string => {
  const normalized = normalizeComicVineVolumeId(id);

  return `${COMICVINE_VOLUME_RESOURCE}-${normalized}`;
};

export const normalizeComicVinePublisherId = (id: string): string => {
  const trimmed = id.trim();
  const prefixed = '4010-';

  if (trimmed.startsWith(prefixed)) {
    return trimmed.slice(prefixed.length);
  }

  return trimmed;
};
