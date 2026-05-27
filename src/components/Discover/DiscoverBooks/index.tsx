import DiscoverReadingMedia from '@app/components/Discover/DiscoverReadingMedia';
import useSettings from '@app/hooks/useSettings';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.Discover.DiscoverBooks', {
  discoverbooks: 'Books',
  searchplaceholder: 'Search for books…',
  search: 'Search',
  noresults: 'No books found.',
  metadataUnavailable:
    'Book metadata search is temporarily unavailable. Add a Hardcover API token on your book downloader in Settings, or fix Bindery/OpenLibrary access.',
  downloaderUnavailable:
    'Book search is unavailable. Configure a book downloader in Settings.',
});

const DiscoverBooks = () => {
  const { currentSettings } = useSettings();

  return (
    <DiscoverReadingMedia
      apiBasePath="/api/v1/book"
      detailPathPrefix="/book"
      discoverPath="/discover/books"
      discoverListBasePath="/api/v1/discover/books"
      mediaType={MediaType.BOOK}
      enabled={currentSettings.booksEnabled}
      mediaTypeLabel="Books"
      messages={{
        title: messages.discoverbooks,
        searchplaceholder: messages.searchplaceholder,
        search: messages.search,
        noresults: messages.noresults,
        metadataUnavailable: messages.metadataUnavailable,
        downloaderUnavailable: messages.downloaderUnavailable,
      }}
    />
  );
};

export default DiscoverBooks;
