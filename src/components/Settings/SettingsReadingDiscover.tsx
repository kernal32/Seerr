import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { encodeNytListSlug } from '@app/utils/encodeNytListSlug';
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import type { ReadingDiscoverSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate as globalMutate } from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.Settings', {
  readingDiscoverSettings: 'Reading Discover',
  readingDiscoverDescription:
    'Configure NYT Best Sellers lists and optional Hardcover community sliders for Books and Audiobooks discover pages.',
  nytApiKey: 'NYT Books API Key',
  nytApiKeyHelp:
    'Free key from developer.nytimes.com. Used for Best Sellers lists only — Hardcover (on your book downloader) still powers search and requests.',
  nytEnabled: 'Enable NYT Best Sellers sliders',
  loadNytLists: 'Load current lists',
  loadNytListsHelp:
    'Fetches this week\'s lists from the NYT overview API. List names are no longer available as a separate endpoint (May 2025 API change).',
  listDisplayName: 'Slider title',
  listMediaType: 'Show on',
  listEnabled: 'Enabled',
  booksMediaType: 'Books',
  audiobooksMediaType: 'Audiobooks',
  hardcoverPopularEnabled: 'Show Hardcover "Popular" slider',
  hardcoverPopularHelp:
    'Community-ranked titles on Hardcover. Often overlaps with well-known backlist hits.',
  hardcoverTrendingEnabled: 'Show Hardcover "Trending" slider',
  hardcoverTrendingHelp: 'Recently popular titles on Hardcover.',
  nytConnectionOk: 'NYT Books API connection successful',
  nytConnectionFailed: 'NYT Books API connection failed',
  settingsSaved: 'Reading discover settings saved',
  settingsSaveFailed: 'Failed to save reading discover settings',
  saveApiKeyFirst: 'Save an API key before loading lists',
  listsLoaded: 'NYT lists loaded',
  listsLoadFailed: 'Failed to load NYT lists',
  noListsLoaded: 'Load lists to choose which Best Sellers rows appear on Discover.',
});

interface NytListOption {
  listName: string;
  displayName: string;
  mediaSubtype: 'book' | 'audiobook';
  bookCount: number;
}

interface FormValues {
  nytApiKey: string;
  nytEnabled: boolean;
  lists: ReadingDiscoverSettings['lists'];
  hardcoverPopularEnabled: boolean;
  hardcoverTrendingEnabled: boolean;
}

const SettingsReadingDiscover = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const { data, error, mutate } = useSWR<ReadingDiscoverSettings>(
    '/api/v1/settings/reading-discover'
  );

  const validationSchema = Yup.object().shape({
    nytApiKey: Yup.string(),
    nytEnabled: Yup.boolean(),
    lists: Yup.array(),
    hardcoverPopularEnabled: Yup.boolean(),
    hardcoverTrendingEnabled: Yup.boolean(),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const initialValues: FormValues = {
    nytApiKey: data?.nytApiKey ?? '',
    nytEnabled: data?.nytEnabled ?? false,
    lists: data?.lists ?? [],
    hardcoverPopularEnabled: data?.hardcoverPopularEnabled ?? false,
    hardcoverTrendingEnabled: data?.hardcoverTrendingEnabled ?? true,
  };

  const mergeLoadedLists = (
    currentLists: ReadingDiscoverSettings['lists'],
    loaded: NytListOption[]
  ): ReadingDiscoverSettings['lists'] => {
    const existingByName = new Map(
      currentLists.map((list) => [list.listName, list])
    );

    return loaded.map((list) => {
      const existing = existingByName.get(list.listName);

      return {
        listName: list.listName,
        displayName: existing?.displayName ?? list.displayName,
        mediaSubtype: existing?.mediaSubtype ?? list.mediaSubtype,
        enabled: existing?.enabled ?? false,
      };
    });
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.readingDiscoverSettings),
          intl.formatMessage(globalMessages.settings),
        ]}
      />

      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.readingDiscoverSettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.readingDiscoverDescription)}
        </p>
      </div>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await axios.put('/api/v1/settings/reading-discover', {
              ...values,
              lists: values.lists.map((list) => ({
                ...list,
                listName: encodeNytListSlug(list.listName),
              })),
            });
            await mutate();
            await globalMutate('/api/v1/settings/public');
            addToast(intl.formatMessage(messages.settingsSaved), {
              appearance: 'success',
              autoDismiss: true,
            });
          } catch {
            addToast(intl.formatMessage(messages.settingsSaveFailed), {
              appearance: 'error',
              autoDismiss: true,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="nytApiKey" className="text-label">
                {intl.formatMessage(messages.nytApiKey)}
              </label>
              <div className="form-input-area">
                <Field
                  id="nytApiKey"
                  name="nytApiKey"
                  type="password"
                  className="short"
                  autoComplete="off"
                />
                <div className="form-input-area">
                  <span className="label-required">
                    {intl.formatMessage(messages.nytApiKeyHelp)}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="nytEnabled" className="checkbox-label">
                <Field id="nytEnabled" name="nytEnabled" type="checkbox" />
                <span className="ml-2">
                  {intl.formatMessage(messages.nytEnabled)}
                </span>
              </label>
            </div>

            <div className="actions mb-6">
              <span className="inline-flex rounded-md shadow-sm">
                <Button
                  buttonType="warning"
                  type="button"
                  disabled={isTesting || isSubmitting || !values.nytApiKey.trim()}
                  onClick={async () => {
                    setIsTesting(true);
                    try {
                      await axios.post('/api/v1/settings/reading-discover/test', {
                        nytApiKey: values.nytApiKey,
                      });
                      addToast(intl.formatMessage(messages.nytConnectionOk), {
                        appearance: 'success',
                        autoDismiss: true,
                      });
                    } catch {
                      addToast(
                        intl.formatMessage(messages.nytConnectionFailed),
                        {
                          appearance: 'error',
                          autoDismiss: true,
                        }
                      );
                    } finally {
                      setIsTesting(false);
                    }
                  }}
                >
                  <BeakerIcon />
                  <span>
                    {isTesting
                      ? intl.formatMessage(globalMessages.testing)
                      : intl.formatMessage(globalMessages.test)}
                  </span>
                </Button>
              </span>

              <span className="ml-3 inline-flex rounded-md shadow-sm">
                <Button
                  buttonType="default"
                  type="button"
                  disabled={
                    isLoadingLists ||
                    isSubmitting ||
                    !values.nytApiKey.trim()
                  }
                  onClick={async () => {
                    if (!values.nytApiKey.trim()) {
                      addToast(intl.formatMessage(messages.saveApiKeyFirst), {
                        appearance: 'warning',
                        autoDismiss: true,
                      });
                      return;
                    }

                    setIsLoadingLists(true);
                    try {
                      await axios.put('/api/v1/settings/reading-discover', {
                        ...values,
                      });
                      const response = await axios.get<NytListOption[]>(
                        '/api/v1/settings/reading-discover/nyt-lists'
                      );
                      const merged = mergeLoadedLists(
                        values.lists,
                        response.data
                      );
                      setFieldValue('lists', merged);
                      addToast(intl.formatMessage(messages.listsLoaded), {
                        appearance: 'success',
                        autoDismiss: true,
                      });
                    } catch {
                      addToast(intl.formatMessage(messages.listsLoadFailed), {
                        appearance: 'error',
                        autoDismiss: true,
                      });
                    } finally {
                      setIsLoadingLists(false);
                    }
                  }}
                >
                  <ArrowPathIcon />
                  <span>
                    {isLoadingLists
                      ? intl.formatMessage(globalMessages.loading)
                      : intl.formatMessage(messages.loadNytLists)}
                  </span>
                </Button>
              </span>
            </div>

            <p className="description mb-4">
              {intl.formatMessage(messages.loadNytListsHelp)}
            </p>

            {values.lists.length === 0 ? (
              <p className="mb-6 text-gray-400">
                {intl.formatMessage(messages.noListsLoaded)}
              </p>
            ) : (
              <div className="mb-6 overflow-x-auto rounded-lg bg-gray-800">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-left text-gray-400">
                      <th className="w-16 p-3">
                        {intl.formatMessage(messages.listEnabled)}
                      </th>
                      <th className="p-3">
                        {intl.formatMessage(messages.listDisplayName)}
                      </th>
                      <th className="w-40 p-3">
                        {intl.formatMessage(messages.listMediaType)}
                      </th>
                      <th className="hidden p-3 md:table-cell">List ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.lists.map((list, index) => (
                      <tr
                        key={list.listName}
                        className="border-b border-gray-700 last:border-0"
                      >
                        <td className="p-3 align-top">
                          <input
                            checked={list.enabled}
                            type="checkbox"
                            onChange={(event) =>
                              setFieldValue(
                                `lists.${index}.enabled`,
                                event.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="p-3 align-top">
                          <input
                            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                            value={list.displayName}
                            onChange={(event) =>
                              setFieldValue(
                                `lists.${index}.displayName`,
                                event.target.value
                              )
                            }
                          />
                        </td>
                        <td className="p-3 align-top">
                          <select
                            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                            value={list.mediaSubtype}
                            onChange={(event) =>
                              setFieldValue(
                                `lists.${index}.mediaSubtype`,
                                event.target.value
                              )
                            }
                          >
                            <option value="book">
                              {intl.formatMessage(messages.booksMediaType)}
                            </option>
                            <option value="audiobook">
                              {intl.formatMessage(messages.audiobooksMediaType)}
                            </option>
                          </select>
                        </td>
                        <td className="hidden p-3 align-top text-gray-500 md:table-cell">
                          <Badge badgeType="dark">{list.listName}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="hardcoverPopularEnabled" className="checkbox-label">
                <Field
                  id="hardcoverPopularEnabled"
                  name="hardcoverPopularEnabled"
                  type="checkbox"
                />
                <span className="ml-2">
                  {intl.formatMessage(messages.hardcoverPopularEnabled)}
                </span>
              </label>
              <div className="form-input-area">
                <span className="label-required">
                  {intl.formatMessage(messages.hardcoverPopularHelp)}
                </span>
              </div>
            </div>

            <div className="form-row">
              <label
                htmlFor="hardcoverTrendingEnabled"
                className="checkbox-label"
              >
                <Field
                  id="hardcoverTrendingEnabled"
                  name="hardcoverTrendingEnabled"
                  type="checkbox"
                />
                <span className="ml-2">
                  {intl.formatMessage(messages.hardcoverTrendingEnabled)}
                </span>
              </label>
              <div className="form-input-area">
                <span className="label-required">
                  {intl.formatMessage(messages.hardcoverTrendingHelp)}
                </span>
              </div>
            </div>

            <div className="actions">
              <div className="flex justify-end">
                <span className="inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || isTesting || isLoadingLists}
                  >
                    <ArrowDownOnSquareIcon />
                    <span>
                      {isSubmitting
                        ? intl.formatMessage(globalMessages.saving)
                        : intl.formatMessage(globalMessages.save)}
                    </span>
                  </Button>
                </span>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default SettingsReadingDiscover;
