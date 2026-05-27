import AudiobookDetails from '@app/components/AudiobookDetails';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const AudiobookPage: NextPage = () => {
  const router = useRouter();
  const audiobookId = router.query.audiobookId as string;

  if (!audiobookId) {
    return null;
  }

  return <AudiobookDetails audiobookId={audiobookId} />;
};

export default AudiobookPage;
