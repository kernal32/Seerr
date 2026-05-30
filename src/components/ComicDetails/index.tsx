import ReadingDetails from '@app/components/ReadingDetails';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.ComicDetails', {
  request: 'Request',
  requestSuccess: 'Comic request submitted.',
  requestError: 'Failed to submit comic request.',
  overview: 'Overview',
  moreByAuthor: 'More from {author}',
  similarBooks: 'Similar Comics',
  manage: 'Manage Comic',
});

interface ComicDetailsProps {
  comicId: string;
}

const ComicDetails = ({ comicId }: ComicDetailsProps) => {
  return (
    <ReadingDetails
      apiBasePath="/api/v1/comic"
      enabled
      mediaId={comicId}
      mediaType={MediaType.COMIC}
      messages={messages}
    />
  );
};

export default ComicDetails;
