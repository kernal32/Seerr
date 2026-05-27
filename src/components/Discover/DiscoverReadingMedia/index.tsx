import Header from '@app/components/Common/Header';
import PageTitle from '@app/components/Common/PageTitle';
import DiscoverReadingPlaceholder from '@app/components/Discover/DiscoverReadingPlaceholder';
import ErrorPage from '@app/pages/_error';
import type { ReadingMediaResult } from '@server/models/ReadingMedia';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MessageDescriptor } from 'react-intl';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

export interface DiscoverReadingMediaProps {
  apiBasePath: string;
  detailPathPrefix: string;
  discoverPath: string;
  enabled: boolean;
  mediaTypeLabel: string;
  messages: {
    title: MessageDescriptor;
    searchplaceholder: MessageDescriptor;
    noresults: MessageDescriptor;
    metadataUnavailable: MessageDescriptor;
    downloaderUnavailable: MessageDescriptor;
  };
}

const DiscoverReadingMedia = ({
  apiBasePath,
  detailPathPrefix,
  discoverPath,
  enabled,
  mediaTypeLabel,
  messages,
}: DiscoverReadingMediaProps) => {
  const intl = useIntl();
  const router = useRouter();
  const query = router.query.query as string | undefined;

  const { data, error, isLoading } = useSWR<{
    results: ReadingMediaResult[];
  }>(
    query && enabled
      ? `${apiBasePath}/search?query=${encodeURIComponent(query)}`
      : null
  );

  if (!enabled) {
    return <DiscoverReadingPlaceholder mediaTypeLabel={mediaTypeLabel} />;
  }

  if (error) {
    const statusCode = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    if (statusCode === 502) {
      return (
        <>
          <PageTitle title={intl.formatMessage(messages.title)} />
          <div className="mb-4">
            <Header>{intl.formatMessage(messages.title)}</Header>
          </div>
          <p className="text-gray-400">
            {intl.formatMessage(messages.metadataUnavailable)}
          </p>
        </>
      );
    }

    if (statusCode === 503) {
      return (
        <>
          <PageTitle title={intl.formatMessage(messages.title)} />
          <div className="mb-4">
            <Header>{intl.formatMessage(messages.title)}</Header>
          </div>
          <p className="text-gray-400">
            {intl.formatMessage(messages.downloaderUnavailable)}
          </p>
        </>
      );
    }

    return <ErrorPage statusCode={statusCode ?? 500} />;
  }

  const title = intl.formatMessage(messages.title);
  const results = data?.results ?? [];

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4">
        <Header>{title}</Header>
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const searchQuery = formData.get('query')?.toString() ?? '';
            router.push({
              pathname: discoverPath,
              query: searchQuery ? { query: searchQuery } : {},
            });
          }}
        >
          <input
            className="w-full max-w-xl rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white"
            defaultValue={query ?? ''}
            name="query"
            placeholder={intl.formatMessage(messages.searchplaceholder)}
            type="search"
          />
        </form>
      </div>
      {query && isLoading && <p className="text-gray-400">Loading…</p>}
      {query && !isLoading && results.length === 0 && (
        <p className="text-gray-400">
          {intl.formatMessage(messages.noresults)}
        </p>
      )}
      {query && results.length > 0 && (
        <ul className="cards-vertical">
          {results.map((item) => (
            <li key={item.id}>
              <Link
                href={{
                  pathname: `${detailPathPrefix}/${encodeURIComponent(item.id)}`,
                  query: item.foreignAuthorId
                    ? { authorId: item.foreignAuthorId }
                    : {},
                }}
                className="block rounded-lg bg-gray-800 p-4 transition hover:bg-gray-700"
              >
                <div className="flex gap-4">
                  {item.coverUrl && (
                    <img
                      alt=""
                      className="h-24 w-16 rounded object-cover"
                      src={item.coverUrl}
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-sm text-gray-400">{item.subtitle}</p>
                    )}
                    {item.year && (
                      <p className="text-sm text-gray-500">{item.year}</p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!query && (
        <p className="text-gray-400">
          {intl.formatMessage(messages.searchplaceholder)}
        </p>
      )}
    </>
  );
};

export default DiscoverReadingMedia;
