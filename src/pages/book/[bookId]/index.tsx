import BookDetails from '@app/components/BookDetails';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const BookPage: NextPage = () => {
  const router = useRouter();
  const bookId = router.query.bookId as string;

  if (!bookId) {
    return null;
  }

  return <BookDetails bookId={bookId} />;
};

export default BookPage;
