import DiscoverReadingMedia from '@app/components/Discover/DiscoverReadingMedia';
import useSettings from '@app/hooks/useSettings';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.Discover.DiscoverComics', {
  discovercomics: 'Comics',
  searchplaceholder: 'Search for comics…',
  search: 'Search',
  noresults: 'No comics found.',
  metadataUnavailable:
    'Comic metadata search is temporarily unavailable. Add a Comic Vine API key on your comic downloader in Settings.',
  downloaderUnavailable:
    'Comic search is unavailable. Configure a comic downloader in Settings.',
});

const DiscoverComics = () => {
  const { currentSettings } = useSettings();

  return (
    <DiscoverReadingMedia
      apiBasePath="/api/v1/comic"
      detailPathPrefix="/comic"
      discoverPath="/discover/comics"
      discoverListBasePath="/api/v1/discover/comics"
      mediaType={MediaType.COMIC}
      enabled={currentSettings.comicsEnabled}
      mediaTypeLabel="Comics"
      messages={{
        title: messages.discovercomics,
        searchplaceholder: messages.searchplaceholder,
        search: messages.search,
        noresults: messages.noresults,
        metadataUnavailable: messages.metadataUnavailable,
        downloaderUnavailable: messages.downloaderUnavailable,
      }}
    />
  );
};

export default DiscoverComics;
