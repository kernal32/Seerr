import ComicDetails from '@app/components/ComicDetails';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const ComicPage: NextPage = () => {
  const router = useRouter();
  const comicId = router.query.comicId as string;

  if (!comicId) {
    return null;
  }

  return <ComicDetails comicId={comicId} />;
};

export default ComicPage;
