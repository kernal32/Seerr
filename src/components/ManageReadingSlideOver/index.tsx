import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import SlideOver from '@app/components/Common/SlideOver';
import RequestBlock from '@app/components/RequestBlock';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ServerIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  DocumentMinusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import type {
  BookDownloaderSettings,
  ComicDownloaderSettings,
} from '@server/lib/settings';
import type { ReadingMediaDetailsResult } from '@server/models/ReadingMedia';
import axios from 'axios';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.ManageReadingSlideOver', {
  manageModalTitle: 'Manage {mediaType}',
  manageModalRequests: 'Requests',
  manageModalMedia: 'Media',
  manageModalAdvanced: 'Advanced',
  manageModalClearMedia: 'Clear Data',
  manageModalClearMediaWarning:
    '* This will irreversibly remove all data for this {mediaType}, including any requests.',
  manageModalRemoveMediaWarning:
    '* This will remove this {mediaType} from {arr}. Downloaded files on disk will not be deleted.',
  openarr: 'Open in {arr}',
  removearr: 'Remove from {arr}',
  markavailable: 'Mark as Available',
  book: 'book',
  audiobook: 'audiobook',
  comic: 'comic',
});

const getDownloaderDisplayName = (provider?: string): string => {
  switch (provider) {
    case 'readarr':
      return 'Bookshelf';
    case 'bindery':
      return 'Bindery';
    case 'mylar3':
      return 'Mylar3';
    default:
      return provider ?? 'Downloader';
  }
};

interface ManageReadingSlideOverProps {
  show?: boolean;
  onClose: () => void;
  revalidate: () => void;
  data: ReadingMediaDetailsResult;
  mediaType: MediaType.BOOK | MediaType.AUDIOBOOK | MediaType.COMIC;
}

const ManageReadingSlideOver = ({
  show,
  onClose,
  revalidate,
  data,
  mediaType,
}: ManageReadingSlideOverProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { data: bookDownloaderData } = useSWR<BookDownloaderSettings[]>(
    hasPermission(Permission.ADMIN) && mediaType !== MediaType.COMIC
      ? '/api/v1/settings/bookDownloader'
      : null
  );
  const { data: comicDownloaderData } = useSWR<ComicDownloaderSettings[]>(
    hasPermission(Permission.ADMIN) && mediaType === MediaType.COMIC
      ? '/api/v1/settings/comicDownloader'
      : null
  );

  const mediaTypeLabel =
    mediaType === MediaType.AUDIOBOOK
      ? intl.formatMessage(messages.audiobook)
      : mediaType === MediaType.COMIC
        ? intl.formatMessage(messages.comic)
        : intl.formatMessage(messages.book);

  const requests =
    data.mediaInfo?.requests?.filter(
      (request) => request.status !== MediaRequestStatus.DECLINED
    ) ?? [];

  const linkedDownloader =
    mediaType === MediaType.COMIC
      ? comicDownloaderData?.find(
          (downloader) => downloader.id === data.mediaInfo?.serviceId
        )
      : bookDownloaderData?.find(
          (downloader) => downloader.id === data.mediaInfo?.serviceId
        );
  const downloaderName = getDownloaderDisplayName(linkedDownloader?.provider);

  const deleteMedia = async () => {
    if (data.mediaInfo) {
      await axios.delete(`/api/v1/media/${data.mediaInfo.id}`);
      revalidate();
      onClose();
    }
  };

  const deleteMediaFile = async () => {
    if (data.mediaInfo) {
      await axios.delete(`/api/v1/media/${data.mediaInfo.id}/file`);
      await axios.delete(`/api/v1/media/${data.mediaInfo.id}`);
      revalidate();
      onClose();
    }
  };

  const isDefaultDownloader = () => {
    if (!data.mediaInfo) {
      return false;
    }

    if (mediaType === MediaType.COMIC) {
      return (
        comicDownloaderData?.find(
          (downloader) =>
            downloader.isDefault &&
            !downloader.is4k &&
            downloader.id === data.mediaInfo?.serviceId
        ) !== undefined
      );
    }

    const mediaSubtype =
      mediaType === MediaType.AUDIOBOOK ? 'audiobook' : 'book';

    return (
      bookDownloaderData?.find(
        (downloader) =>
          downloader.isDefault &&
          !downloader.is4k &&
          downloader.mediaSubtype === mediaSubtype &&
          downloader.id === data.mediaInfo?.serviceId
      ) !== undefined
    );
  };

  const markAvailable = async () => {
    if (data.mediaInfo) {
      await axios.post(`/api/v1/media/${data.mediaInfo.id}/available`, {
        is4k: false,
      });
      revalidate();
    }
  };

  return (
    <SlideOver
      show={show}
      onClose={onClose}
      title={intl.formatMessage(messages.manageModalTitle, {
        mediaType: mediaTypeLabel,
      })}
      subText={data.title}
    >
      <div className="space-y-6">
        {requests.length > 0 && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {intl.formatMessage(messages.manageModalRequests)}
            </h3>
            <ul className="grid grid-cols-1 gap-2">
              {requests.map((request) => (
                <li key={`manage-request-${request.id}`}>
                  <RequestBlock
                    request={request}
                    onUpdate={() => revalidate()}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasPermission(Permission.ADMIN) && data.mediaInfo?.serviceUrl && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {intl.formatMessage(messages.manageModalMedia)}
            </h3>
            <div className="space-y-2">
              <a
                href={data.mediaInfo.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button buttonType="ghost" className="w-full">
                  <ServerIcon />
                  <span>
                    {intl.formatMessage(messages.openarr, {
                      arr: downloaderName,
                    })}
                  </span>
                </Button>
              </a>
              {isDefaultDownloader() && (
                <div>
                  <ConfirmButton
                    onClick={() => deleteMediaFile()}
                    confirmText={intl.formatMessage(globalMessages.areyousure)}
                    className="w-full"
                  >
                    <TrashIcon />
                    <span>
                      {intl.formatMessage(messages.removearr, {
                        arr: downloaderName,
                      })}
                    </span>
                  </ConfirmButton>
                  <div className="mt-1 text-xs text-gray-400">
                    {intl.formatMessage(messages.manageModalRemoveMediaWarning, {
                      mediaType: mediaTypeLabel,
                      arr: downloaderName,
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {hasPermission(Permission.ADMIN) &&
          data.mediaInfo &&
          data.mediaInfo.status !== MediaStatus.BLOCKLISTED && (
            <div>
              <h3 className="mb-2 text-xl font-bold">
                {intl.formatMessage(messages.manageModalAdvanced)}
              </h3>
              <div className="space-y-2">
                {data.mediaInfo.status !== MediaStatus.AVAILABLE && (
                  <Button
                    onClick={() => markAvailable()}
                    className="w-full"
                    buttonType="success"
                  >
                    <CheckCircleIcon />
                    <span>{intl.formatMessage(messages.markavailable)}</span>
                  </Button>
                )}
                <div>
                  <ConfirmButton
                    onClick={() => deleteMedia()}
                    confirmText={intl.formatMessage(globalMessages.areyousure)}
                    className="w-full"
                  >
                    <DocumentMinusIcon />
                    <span>
                      {intl.formatMessage(messages.manageModalClearMedia)}
                    </span>
                  </ConfirmButton>
                  <div className="mt-1 text-xs text-gray-400">
                    {intl.formatMessage(messages.manageModalClearMediaWarning, {
                      mediaType: mediaTypeLabel,
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </SlideOver>
  );
};

export default ManageReadingSlideOver;
