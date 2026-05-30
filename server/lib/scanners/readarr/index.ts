import ReadarrClient from '@server/api/downloaders/readarr/client';
import { resolveBookMediaStatusAfterPoll, resolveMissingBookMediaStatus } from '@server/lib/scanners/readarr/processBookStatus';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type { BookDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

type SyncStatus = {
  running: boolean;
};

class ReadarrScanner {
  private running = false;

  public status(): SyncStatus {
    return { running: this.running };
  }

  public cancel(): void {
    this.running = false;
  }

  public async run(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      logger.info('Starting Readarr scan for processing reading media', {
        label: 'ReadarrScan',
      });

      const settings = getSettings();
      const downloaders = settings.bookDownloaders.filter(
        (downloader) =>
          downloader.syncEnabled && downloader.provider === 'readarr'
      );

      for (const server of downloaders) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        await this.processServer(server);
      }
    } catch (e) {
      logger.error('Readarr scan failed', {
        label: 'ReadarrScan',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    } finally {
      this.running = false;
      logger.info('Readarr scan complete', { label: 'ReadarrScan' });
    }
  }

  private async processServer(server: BookDownloaderSettings): Promise<void> {
    const mediaRepository = getRepository(Media);
    const mediaType =
      server.mediaSubtype === 'audiobook'
        ? MediaType.AUDIOBOOK
        : MediaType.BOOK;

    const processingMedia = await mediaRepository.find({
      where: {
        mediaType,
        status: MediaStatus.PROCESSING,
        serviceId: server.id,
      },
    });

    if (processingMedia.length === 0) {
      return;
    }

    const client = new ReadarrClient(
      server,
      ReadarrClient.buildUrl(server)
    );

    for (const media of processingMedia) {
      if (!this.running) {
        return;
      }

      if (media.externalServiceId == null) {
        logger.debug('Skipping processing book without externalServiceId', {
          label: 'ReadarrScan',
          mediaId: media.id,
          metadataId: media.metadataId,
        });
        continue;
      }

      try {
        const book = await client.getBook(media.externalServiceId);
        const nextStatus = resolveBookMediaStatusAfterPoll(media.status, book);

        if (nextStatus !== media.status) {
          media.status = nextStatus;
          await mediaRepository.save(media);
          logger.info('Book is now available in Bookshelf', {
            label: 'ReadarrScan',
            mediaId: media.id,
            metadataId: media.metadataId,
            externalServiceId: media.externalServiceId,
          });
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          const nextStatus = resolveMissingBookMediaStatus(media.status);

          if (nextStatus !== media.status) {
            media.status = nextStatus;
            await mediaRepository.save(media);
            logger.info(
              'Book not found in Bookshelf, resetting status to UNKNOWN',
              {
                label: 'ReadarrScan',
                mediaId: media.id,
                externalServiceId: media.externalServiceId,
              }
            );
          }
          continue;
        }

        logger.debug('Failed to check book status in Bookshelf', {
          label: 'ReadarrScan',
          mediaId: media.id,
          externalServiceId: media.externalServiceId,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

export const readarrScanner = new ReadarrScanner();
