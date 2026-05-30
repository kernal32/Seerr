import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDownloadedComicIssues,
  resolveComicMediaStatusAfterPoll,
  resolveMissingComicMediaStatus,
} from './processComicStatus';
import { MediaStatus } from '@server/constants/media';

describe('processComicStatus', () => {
  it('detects downloaded issues', () => {
    assert.equal(
      hasDownloadedComicIssues([
        { Status: 'Wanted' },
        { Status: 'Downloaded' },
      ]),
      true
    );
    assert.equal(
      hasDownloadedComicIssues([{ Status: 'Wanted' }, { Status: 'Skipped' }]),
      false
    );
  });

  it('promotes PROCESSING to AVAILABLE when issues downloaded', () => {
    assert.equal(
      resolveComicMediaStatusAfterPoll(MediaStatus.PROCESSING, [
        { Status: 'Downloaded' },
      ]),
      MediaStatus.AVAILABLE
    );
    assert.equal(
      resolveComicMediaStatusAfterPoll(MediaStatus.PROCESSING, [
        { Status: 'Wanted' },
      ]),
      MediaStatus.PROCESSING
    );
  });

  it('resets missing comics to UNKNOWN from PROCESSING', () => {
    assert.equal(
      resolveMissingComicMediaStatus(MediaStatus.PROCESSING),
      MediaStatus.UNKNOWN
    );
    assert.equal(
      resolveMissingComicMediaStatus(MediaStatus.AVAILABLE),
      MediaStatus.AVAILABLE
    );
  });
});
