import Mylar3Client from '@server/api/downloaders/mylar3/client';
import {
  resolveComicMediaStatusAfterPoll,
  resolveMissingComicMediaStatus,
} from '@server/api/downloaders/mylar3/processComicStatus';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type { ComicDownloaderSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

type SyncStatus = {
  running: boolean;
};

class Mylar3Scanner {
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
      logger.info('Starting Mylar3 scan for processing comics', {
        label: 'Mylar3Scan',
      });

      const settings = getSettings();
      const downloaders = settings.comicDownloaders.filter(
        (downloader) =>
          downloader.syncEnabled && downloader.provider === 'mylar3'
      );

      for (const server of downloaders) {
        if (!this.running) {
          throw new Error('Job aborted');
        }

        await this.processServer(server);
      }
    } catch (e) {
      logger.error('Mylar3 scan failed', {
        label: 'Mylar3Scan',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    } finally {
      this.running = false;
      logger.info('Mylar3 scan complete', { label: 'Mylar3Scan' });
    }
  }

  private async processServer(server: ComicDownloaderSettings): Promise<void> {
    const mediaRepository = getRepository(Media);
    const processingMedia = await mediaRepository.find({
      where: {
        mediaType: MediaType.COMIC,
        status: MediaStatus.PROCESSING,
        serviceId: server.id,
      },
    });

    if (processingMedia.length === 0) {
      return;
    }

    const client = new Mylar3Client(server);

    for (const media of processingMedia) {
      if (!this.running) {
        return;
      }

      if (media.externalServiceId == null) {
        logger.debug('Skipping processing comic without externalServiceId', {
          label: 'Mylar3Scan',
          mediaId: media.id,
          metadataId: media.metadataId,
        });
        continue;
      }

      try {
        const comic = await client.getComic(String(media.externalServiceId));
        const nextStatus = resolveComicMediaStatusAfterPoll(
          media.status,
          comic.issues
        );

        if (nextStatus !== media.status) {
          media.status = nextStatus;
          await mediaRepository.save(media);
          logger.info('Comic is now available in Mylar3', {
            label: 'Mylar3Scan',
            mediaId: media.id,
            metadataId: media.metadataId,
            externalServiceId: media.externalServiceId,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.toLowerCase().includes('not found')) {
          const nextStatus = resolveMissingComicMediaStatus(media.status);

          if (nextStatus !== media.status) {
            media.status = nextStatus;
            await mediaRepository.save(media);
            logger.info(
              'Comic not found in Mylar3, resetting status to UNKNOWN',
              {
                label: 'Mylar3Scan',
                mediaId: media.id,
                externalServiceId: media.externalServiceId,
              }
            );
          }
          continue;
        }

        logger.debug('Failed to check comic status in Mylar3', {
          label: 'Mylar3Scan',
          mediaId: media.id,
          externalServiceId: media.externalServiceId,
          errorMessage: message,
        });
      }
    }
  }
}

export const mylar3Scanner = new Mylar3Scanner();
