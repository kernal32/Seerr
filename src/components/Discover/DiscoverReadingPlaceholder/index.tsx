import Header from '@app/components/Common/Header';
import PageTitle from '@app/components/Common/PageTitle';
import defineMessages from '@app/utils/defineMessages';
import { useIntl } from 'react-intl';

const messages = defineMessages(
  'components.Discover.DiscoverReadingPlaceholder',
  {
    comingsoon: 'Coming Soon',
    description:
      'Search and request {mediaType} will be available once a downloader is configured in Settings.',
  }
);

interface DiscoverReadingPlaceholderProps {
  mediaTypeLabel: string;
}

const DiscoverReadingPlaceholder = ({
  mediaTypeLabel,
}: DiscoverReadingPlaceholderProps) => {
  const intl = useIntl();

  return (
    <>
      <PageTitle title={mediaTypeLabel} />
      <div className="mt-8">
        <Header>{mediaTypeLabel}</Header>
        <div className="rounded-lg bg-gray-800 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-white">
            {intl.formatMessage(messages.comingsoon)}
          </h2>
          <p className="text-gray-400">
            {intl.formatMessage(messages.description, {
              mediaType: mediaTypeLabel.toLowerCase(),
            })}
          </p>
        </div>
      </div>
    </>
  );
};

export default DiscoverReadingPlaceholder;
