import { sliderTitles } from '@app/components/Discover/constants';
import ReadingMediaSlider from '@app/components/Discover/ReadingMediaSlider';
import useSettings from '@app/hooks/useSettings';
import { encodeNytListSlug } from '@app/utils/encodeNytListSlug';
import { MediaType } from '@server/constants/media';
import { useIntl } from 'react-intl';

interface ReadingDiscoverSlidersProps {
  mediaSubtype: 'book' | 'audiobook';
  mediaType: typeof MediaType.BOOK | typeof MediaType.AUDIOBOOK;
  discoverListBasePath: string;
  discoverPath: string;
}

const ReadingDiscoverSliders = ({
  mediaSubtype,
  mediaType,
  discoverListBasePath,
  discoverPath,
}: ReadingDiscoverSlidersProps) => {
  const intl = useIntl();
  const { currentSettings } = useSettings();
  const readingDiscover = currentSettings.readingDiscover;
  const nytLists =
    readingDiscover?.nytEnabled && readingDiscover.lists.length > 0
      ? readingDiscover.lists.filter(
          (list) => list.enabled && list.mediaSubtype === mediaSubtype
        )
      : [];

  const showHardcoverPopular =
    readingDiscover?.hardcoverPopularEnabled ?? !readingDiscover?.nytEnabled;
  const showHardcoverTrending =
    readingDiscover?.hardcoverTrendingEnabled ?? true;

  return (
    <>
      {nytLists.map((list) => (
        <ReadingMediaSlider
          key={`nyt-${list.listName}`}
          hideWhenEmpty
          linkUrl={discoverPath}
          mediaType={mediaType}
          sliderKey={`nyt-${mediaSubtype}-${list.listName}`}
          title={list.displayName}
          url={`${discoverListBasePath}/nyt/${encodeURIComponent(encodeNytListSlug(list.listName))}`}
        />
      ))}
      {showHardcoverPopular && (
        <ReadingMediaSlider
          hideWhenEmpty
          linkUrl={discoverPath}
          mediaType={mediaType}
          sliderKey={`${discoverListBasePath}-popular`}
          title={intl.formatMessage(
            mediaType === MediaType.AUDIOBOOK
              ? sliderTitles.popularaudiobooks
              : sliderTitles.popularbooks
          )}
          url={`${discoverListBasePath}/popular`}
        />
      )}
      {showHardcoverTrending && (
        <ReadingMediaSlider
          hideWhenEmpty
          mediaType={mediaType}
          sliderKey={`${discoverListBasePath}-trending`}
          title={intl.formatMessage(
            mediaType === MediaType.AUDIOBOOK
              ? sliderTitles.trendingaudiobooks
              : sliderTitles.trendingbooks
          )}
          url={`${discoverListBasePath}/trending`}
        />
      )}
    </>
  );
};

export default ReadingDiscoverSliders;
