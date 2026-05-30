import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ReadarrBook } from '@server/api/downloaders/readarr/types';
import { MediaStatus } from '@server/constants/media';
import {
  hasBookFiles,
  resolveBookMediaStatusAfterPoll,
  resolveMissingBookMediaStatus,
} from '@server/lib/scanners/readarr/processBookStatus';

const bookWithFiles = (fileCount: number): ReadarrBook => ({
  id: 1,
  foreignBookId: 'hc:1',
  title: 'Test Book',
  statistics: { bookFileCount: fileCount },
});

describe('processBookStatus', () => {
  it('detects when Bookshelf reports book files', () => {
    assert.equal(hasBookFiles(bookWithFiles(1)), true);
    assert.equal(hasBookFiles(bookWithFiles(0)), false);
  });

  it('marks PROCESSING media AVAILABLE when Bookshelf has files', () => {
    assert.equal(
      resolveBookMediaStatusAfterPoll(
        MediaStatus.PROCESSING,
        bookWithFiles(1)
      ),
      MediaStatus.AVAILABLE
    );
  });

  it('keeps PROCESSING when Bookshelf has no files yet', () => {
    assert.equal(
      resolveBookMediaStatusAfterPoll(
        MediaStatus.PROCESSING,
        bookWithFiles(0)
      ),
      MediaStatus.PROCESSING
    );
  });

  it('does not change non-processing media', () => {
    assert.equal(
      resolveBookMediaStatusAfterPoll(
        MediaStatus.AVAILABLE,
        bookWithFiles(0)
      ),
      MediaStatus.AVAILABLE
    );
  });

  it('resets missing PROCESSING books to UNKNOWN', () => {
    assert.equal(
      resolveMissingBookMediaStatus(MediaStatus.PROCESSING),
      MediaStatus.UNKNOWN
    );
  });
});
