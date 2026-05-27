import ReadingDetails from '@app/components/ReadingDetails';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.BookDetails', {
  request: 'Request',
  requestSuccess: 'Book request submitted.',
  requestError: 'Failed to submit book request.',
  overview: 'Overview',
  moreByAuthor: 'More by {author}',
  similarBooks: 'Similar Books',
});

interface BookDetailsProps {
  bookId: string;
}

const BookDetails = ({ bookId }: BookDetailsProps) => {
  return (
    <ReadingDetails
      apiBasePath="/api/v1/book"
      enabled
      mediaId={bookId}
      mediaType={MediaType.BOOK}
      messages={messages}
    />
  );
};

export default BookDetails;
