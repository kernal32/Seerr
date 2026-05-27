import { MediaType } from '@server/constants/media';
import { createReadingMediaRoutes } from '@server/routes/reading/createReadingMediaRoutes';

const bookRoutes = createReadingMediaRoutes({
  mediaSubtype: 'book',
  mediaType: MediaType.BOOK,
  routeLabel: 'API',
  notConfiguredMessage: 'No book downloader configured.',
  searchErrorMessage: 'Unable to retrieve book search results.',
  detailErrorMessage: 'Unable to retrieve book.',
});

export default bookRoutes;
