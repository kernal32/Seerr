import ReadingDetails from '@app/components/ReadingDetails';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.AudiobookDetails', {
  request: 'Request',
  requestSuccess: 'Audiobook request submitted.',
  requestError: 'Failed to submit audiobook request.',
  overview: 'Overview',
  moreByAuthor: 'More by {author}',
  similarBooks: 'Similar Audiobooks',
  manage: 'Manage Audiobook',
});

interface AudiobookDetailsProps {
  audiobookId: string;
}

const AudiobookDetails = ({ audiobookId }: AudiobookDetailsProps) => {
  return (
    <ReadingDetails
      apiBasePath="/api/v1/audiobook"
      enabled
      mediaId={audiobookId}
      mediaType={MediaType.AUDIOBOOK}
      messages={messages}
    />
  );
};

export default AudiobookDetails;
