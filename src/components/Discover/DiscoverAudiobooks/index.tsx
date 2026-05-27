import DiscoverReadingMedia from '@app/components/Discover/DiscoverReadingMedia';
import useSettings from '@app/hooks/useSettings';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';

const messages = defineMessages('components.Discover.DiscoverAudiobooks', {
  discoveraudiobooks: 'Audiobooks',
  searchplaceholder: 'Search for audiobooks…',
  search: 'Search',
  noresults: 'No audiobooks found.',
  metadataUnavailable:
    'Audiobook metadata search is temporarily unavailable. Add a Hardcover API token on your audiobook downloader in Settings, or fix Bindery/OpenLibrary access.',
  downloaderUnavailable:
    'Audiobook search is unavailable. Configure an audiobook downloader in Settings.',
});

const DiscoverAudiobooks = () => {
  const { currentSettings } = useSettings();

  return (
    <DiscoverReadingMedia
      apiBasePath="/api/v1/audiobook"
      detailPathPrefix="/audiobook"
      discoverPath="/discover/audiobooks"
      discoverListBasePath="/api/v1/discover/audiobooks"
      mediaType={MediaType.AUDIOBOOK}
      enabled={currentSettings.audiobooksEnabled}
      mediaTypeLabel="Audiobooks"
      messages={{
        title: messages.discoveraudiobooks,
        searchplaceholder: messages.searchplaceholder,
        search: messages.search,
        noresults: messages.noresults,
        metadataUnavailable: messages.metadataUnavailable,
        downloaderUnavailable: messages.downloaderUnavailable,
      }}
    />
  );
};

export default DiscoverAudiobooks;
