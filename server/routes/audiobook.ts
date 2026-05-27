import { MediaType } from '@server/constants/media';
import { createReadingMediaRoutes } from '@server/routes/reading/createReadingMediaRoutes';

const audiobookRoutes = createReadingMediaRoutes({
  mediaSubtype: 'audiobook',
  mediaType: MediaType.AUDIOBOOK,
  routeLabel: 'API',
  notConfiguredMessage: 'No audiobook downloader configured.',
  searchErrorMessage: 'Unable to retrieve audiobook search results.',
  detailErrorMessage: 'Unable to retrieve audiobook.',
});

export default audiobookRoutes;
