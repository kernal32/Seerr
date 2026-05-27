import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import PageTitle from '@app/components/Common/PageTitle';
import useSettings from '@app/hooks/useSettings';
import useToasts from '@app/hooks/useToasts';
import { Permission, useUser } from '@app/hooks/useUser';
import { MediaStatus, MediaType } from '@server/constants/media';
import type { ReadingMediaDetailsResult } from '@server/models/ReadingMedia';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { MessageDescriptor } from 'react-intl';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

export interface ReadingDetailsProps {
  apiBasePath: string;
  enabled: boolean;
  mediaId: string;
  mediaType: MediaType.BOOK | MediaType.AUDIOBOOK;
  messages: {
    request: MessageDescriptor;
    requestSuccess: MessageDescriptor;
    requestError: MessageDescriptor;
    overview: MessageDescriptor;
  };
}

const ReadingDetails = ({
  apiBasePath,
  enabled,
  mediaId,
  mediaType,
  messages,
}: ReadingDetailsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const { hasPermission } = useUser();
  const { currentSettings } = useSettings();

  const { data, error, mutate } = useSWR<ReadingMediaDetailsResult>(
    mediaId ? `${apiBasePath}/${encodeURIComponent(mediaId)}` : null
  );

  const submitRequest = async () => {
    if (!data) {
      return;
    }

    try {
      const foreignAuthorId =
        (router.query.authorId as string) ?? data.foreignAuthorId;

      if (!foreignAuthorId) {
        addToast(
          intl.formatMessage(messages.requestError) +
            ' (missing author metadata)',
          {
            appearance: 'error',
            autoDismiss: true,
          }
        );
        return;
      }

      await axios.post('/api/v1/request', {
        mediaType,
        mediaId: 0,
        metadataId: data.id,
        foreignAuthorId,
        authorName: data.author ?? data.subtitle,
      });
      addToast(intl.formatMessage(messages.requestSuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      mutate();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : intl.formatMessage(messages.requestError);
      addToast(message, {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  if (error || !data) {
    return null;
  }

  const isEnabled =
    mediaType === MediaType.BOOK
      ? currentSettings.booksEnabled
      : currentSettings.audiobooksEnabled;

  const canRequest =
    enabled &&
    isEnabled &&
    hasPermission(Permission.REQUEST) &&
    data.mediaInfo?.status !== MediaStatus.AVAILABLE;

  return (
    <>
      <PageTitle title={data.title} />
      <div className="media-header">
        <div className="media-poster">
          {data.coverUrl ? (
            <img alt="" src={data.coverUrl} />
          ) : (
            <div className="media-poster-empty" />
          )}
        </div>
        <div className="media-title">
          <Header>{data.title}</Header>
          {data.subtitle && (
            <span className="media-status mb-4 block text-gray-400">
              {data.subtitle}
            </span>
          )}
          {canRequest && (
            <Button buttonType="primary" onClick={submitRequest}>
              {intl.formatMessage(messages.request)}
            </Button>
          )}
        </div>
      </div>
      {data.overview && (
        <div className="media-overview mt-8">
          <h2 className="heading">{intl.formatMessage(messages.overview)}</h2>
          <p>{data.overview}</p>
        </div>
      )}
    </>
  );
};

export default ReadingDetails;
