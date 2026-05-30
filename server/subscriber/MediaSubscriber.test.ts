import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import { User } from '@server/entity/User';
import { setupTestDb } from '@server/test/db';
import { metadataIdToTmdbPlaceholder } from '@server/utils/readingMediaId';

setupTestDb();

describe('MediaSubscriber reading media completion', () => {
  it('completes approved book request when media becomes AVAILABLE', async () => {
    const userRepository = getRepository(User);
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);

    const requestedBy = await userRepository.findOneOrFail({
      where: { email: 'friend@seerr.dev' },
    });

    const metadataId = 'hc:book-complete';
    const media = await mediaRepository.save(
      new Media({
        mediaType: MediaType.BOOK,
        metadataId,
        tmdbId: metadataIdToTmdbPlaceholder(metadataId),
        status: MediaStatus.PROCESSING,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    const mediaRequest = await requestRepository.save(
      new MediaRequest({
        type: MediaType.BOOK,
        status: MediaRequestStatus.APPROVED,
        media,
        requestedBy,
        is4k: false,
      })
    );

    media.status = MediaStatus.AVAILABLE;
    await mediaRepository.save(media);

    const updatedRequest = await requestRepository.findOneOrFail({
      where: { id: mediaRequest.id },
    });

    assert.strictEqual(updatedRequest.status, MediaRequestStatus.COMPLETED);
  });

  it('completes approved audiobook request when media becomes AVAILABLE', async () => {
    const userRepository = getRepository(User);
    const mediaRepository = getRepository(Media);
    const requestRepository = getRepository(MediaRequest);

    const requestedBy = await userRepository.findOneOrFail({
      where: { email: 'friend@seerr.dev' },
    });

    const metadataId = 'hc:audiobook-complete';
    const media = await mediaRepository.save(
      new Media({
        mediaType: MediaType.AUDIOBOOK,
        metadataId,
        tmdbId: metadataIdToTmdbPlaceholder(metadataId),
        status: MediaStatus.PROCESSING,
        status4k: MediaStatus.UNKNOWN,
      })
    );

    const mediaRequest = await requestRepository.save(
      new MediaRequest({
        type: MediaType.AUDIOBOOK,
        status: MediaRequestStatus.APPROVED,
        media,
        requestedBy,
        is4k: false,
      })
    );

    media.status = MediaStatus.AVAILABLE;
    await mediaRepository.save(media);

    const updatedRequest = await requestRepository.findOneOrFail({
      where: { id: mediaRequest.id },
    });

    assert.strictEqual(updatedRequest.status, MediaRequestStatus.COMPLETED);
  });
});
