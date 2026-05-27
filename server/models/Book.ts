import type {
  ReadingMediaDetailsResult,
  ReadingMediaResult,
} from '@server/models/ReadingMedia';
import {
  mapReadingMediaDetails,
  mapReadingMediaResults,
} from '@server/models/ReadingMedia';

export type BookResult = ReadingMediaResult;
export type BookDetailsResult = ReadingMediaDetailsResult;

export const mapBookResults = mapReadingMediaResults;
export const mapBookDetails = mapReadingMediaDetails;
