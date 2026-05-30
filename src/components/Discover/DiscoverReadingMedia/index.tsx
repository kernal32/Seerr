import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import PageTitle from '@app/components/Common/PageTitle';
import DiscoverReadingPlaceholder from '@app/components/Discover/DiscoverReadingPlaceholder';
import ReadingDiscoverSliders from '@app/components/Discover/ReadingDiscoverSliders';
import ErrorPage from '@app/pages/_error';
import globalMessages from '@app/i18n/globalMessages';
import type { ReadingMediaResult } from '@server/models/ReadingMedia';
import { MediaType } from '@server/constants/media';
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
  discoverListBasePath: string;
  mediaType: typeof MediaType.BOOK | typeof MediaType.AUDIOBOOK | typeof MediaType.COMIC;
  enabled: boolean;
  mediaTypeLabel: string;
  messages: {
    title: MessageDescriptor;
    searchplaceholder: MessageDescriptor;
    search: MessageDescriptor;
    noresults: MessageDescriptor;
    metadataUnavailable: MessageDescriptor;
    downloaderUnavailable: MessageDescriptor;
  };
}

const DiscoverReadingMedia = ({
  apiBasePath,
  detailPathPrefix,
  discoverPath,
  discoverListBasePath,
  mediaType,
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
          className="mt-4 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-stretch"
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
            className="min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white"
            defaultValue={query ?? ''}
            name="query"
            placeholder={intl.formatMessage(messages.searchplaceholder)}
            type="search"
          />
          <Button buttonType="primary" type="submit">
            {intl.formatMessage(messages.search)}
          </Button>
        </form>
      </div>
      {query && isLoading && (
        <p className="text-gray-400">
          {intl.formatMessage(globalMessages.loading)}
        </p>
      )}
      {query && !isLoading && results.length === 0 && (
        <p className="text-gray-400">
          {intl.formatMessage(messages.noresults)}
        </p>
      )}
      {query && results.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={{
                  pathname: `${detailPathPrefix}/${encodeURIComponent(item.id)}`,
                  query: item.foreignAuthorId
                    ? { authorId: item.foreignAuthorId }
                    : {},
                }}
                className="flex h-28 overflow-hidden rounded-lg bg-gray-800 p-3 transition hover:bg-gray-700"
              >
                {item.coverUrl ? (
                  <img
                    alt=""
                    className="h-full w-14 flex-shrink-0 rounded object-cover"
                    src={item.coverUrl}
                  />
                ) : (
                  <div className="flex h-full w-14 flex-shrink-0 items-center justify-center rounded bg-gray-700 text-xs text-gray-500">
                    —
                  </div>
                )}
                <div className="ml-3 flex min-w-0 flex-1 flex-col justify-center">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="truncate text-xs text-gray-400">
                      {item.subtitle}
                    </p>
                  )}
                  {item.year && (
                    <p className="mt-1 text-xs text-gray-500">{item.year}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!query && mediaType !== MediaType.COMIC && (
        <ReadingDiscoverSliders
          discoverListBasePath={discoverListBasePath}
          discoverPath={discoverPath}
          mediaSubtype={mediaType === MediaType.AUDIOBOOK ? 'audiobook' : 'book'}
          mediaType={mediaType}
        />
      )}
    </>
  );
};

export default DiscoverReadingMedia;
