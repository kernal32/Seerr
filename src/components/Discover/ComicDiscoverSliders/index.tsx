import { sliderTitles } from '@app/components/Discover/constants';
import ReadingMediaSlider from '@app/components/Discover/ReadingMediaSlider';
import { COMIC_DISCOVER_PUBLISHERS } from '@server/api/metadata/comicvine/constants';
import { MediaType } from '@server/constants/media';
import { useIntl } from 'react-intl';

interface ComicDiscoverSlidersProps {
  discoverPath?: string;
}

const ComicDiscoverSliders = ({ discoverPath }: ComicDiscoverSlidersProps) => {
  const intl = useIntl();
  const discoverListBasePath = '/api/v1/discover/comics';

  const publisherTitles: Record<(typeof COMIC_DISCOVER_PUBLISHERS)[number]['slug'], string> = {
    marvel: intl.formatMessage(sliderTitles.marvelComics),
    dc: intl.formatMessage(sliderTitles.dcComics),
    image: intl.formatMessage(sliderTitles.imageComics),
  };

  return (
    <>
      <ReadingMediaSlider
        hideWhenEmpty
        linkUrl={discoverPath}
        mediaType={MediaType.COMIC}
        sliderKey={`${discoverListBasePath}-recent`}
        title={intl.formatMessage(sliderTitles.recentComics)}
        url={`${discoverListBasePath}/recent`}
      />
      {COMIC_DISCOVER_PUBLISHERS.map((publisher) => (
        <ReadingMediaSlider
          key={`publisher-${publisher.id}`}
          hideWhenEmpty
          linkUrl={discoverPath}
          mediaType={MediaType.COMIC}
          sliderKey={`${discoverListBasePath}-publisher-${publisher.id}`}
          title={publisherTitles[publisher.slug]}
          url={`${discoverListBasePath}/publisher/${publisher.id}`}
        />
      ))}
    </>
  );
};

export default ComicDiscoverSliders;
