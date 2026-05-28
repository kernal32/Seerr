import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import type { BookDownloaderSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import Select from 'react-select';
import * as Yup from 'yup';

type OptionType = { value: number; label: string };

export type BookDownloaderTestResponse = {
  profiles: { id: number; name: string }[];
  metadataProfiles?: { id: number; name: string }[];
  rootFolders: { id: number; path: string }[];
  urlBase?: string;
};

const messages = defineMessages('components.Settings.BookDownloaderModal', {
  createServer: 'Add Book Downloader',
  editServer: 'Edit Book Downloader',
  validationNameRequired: 'You must provide a server name',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  validationApiKeyRequired: 'You must provide an API key',
  validationRootFolderRequired: 'You must select a root folder',
  validationProfileRequired: 'You must select a quality profile',
  validationMetadataProfileRequired: 'You must select a metadata profile',
  provider: 'Downloader Type',
  providerReadarr: 'Bookshelf / Readarr',
  providerBindery: 'Bindery',
  metadataprofile: 'Metadata Profile',
  selectMetadataProfile: 'Select metadata profile',
  testFirstMetadataProfiles: 'Test connection to load metadata profiles',
  portBookshelfHint: 'Bookshelf default port is 8787',
  hardcoverApiToken:
    'Optional Hardcover API token for discover/search in Bookarr (not sent to Bookshelf).',
  hardcoverApiTokenHelp:
    'Paste the Hardcover API token only (no "Bearer " prefix). Use the same token as Bookshelf METADATA_AUTH when running the :hardcover image.',
  toastTestSuccess: 'Book downloader connection established successfully!',
  toastTestFailure: 'Failed to connect to book downloader.',
  toastSaveFailure: 'Failed to save book downloader.',
  add: 'Add Server',
  defaultserver: 'Default Server',
  servername: 'Server Name',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  ssl: 'Use SSL',
  apiKey: 'API Key',
  baseUrl: 'URL Base',
  externalUrl: 'External URL',
  qualityprofile: 'Quality Profile',
  rootfolder: 'Root Folder',
  mediasubtype: 'Media Type',
  subtypeBook: 'Books (ebook)',
  subtypeAudiobook: 'Audiobooks',
  selectQualityProfile: 'Select quality profile',
  selectRootFolder: 'Select root folder',
  loadingprofiles: 'Loading quality profiles…',
  testFirstQualityProfiles: 'Test connection to load quality profiles',
  loadingrootfolders: 'Loading root folders…',
  testFirstRootFolders: 'Test connection to load root folders',
  enableSearch: 'Enable Automatic Search',
  hardcoverApiTokenConfigured:
    'A Hardcover token is already saved. Leave blank to keep it, or enter a new token to replace it.',
});

interface BookDownloaderModalProps {
  downloader: BookDownloaderSettings | null;
  onClose: () => void;
  onSave: () => void;
}

const BookDownloaderModal = ({
  onClose,
  downloader,
  onSave,
}: BookDownloaderModalProps) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(!!downloader);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<BookDownloaderTestResponse>({
    profiles: [],
    metadataProfiles: [],
    rootFolders: [],
  });

  const schema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage(messages.validationNameRequired)
    ),
    hostname: Yup.string().required(
      intl.formatMessage(messages.validationHostnameRequired)
    ),
    port: Yup.number()
      .nullable()
      .required(intl.formatMessage(messages.validationPortRequired)),
    apiKey: Yup.string().required(
      intl.formatMessage(messages.validationApiKeyRequired)
    ),
    activeDirectory: Yup.string().required(
      intl.formatMessage(messages.validationRootFolderRequired)
    ),
    activeProfileId: Yup.number()
      .min(1, intl.formatMessage(messages.validationProfileRequired))
      .required(intl.formatMessage(messages.validationProfileRequired)),
    activeMetadataProfileId: Yup.number().when('provider', {
      is: 'readarr',
      then: (schemaField) =>
        schemaField
          .min(
            1,
            intl.formatMessage(messages.validationMetadataProfileRequired)
          )
          .required(
            intl.formatMessage(messages.validationMetadataProfileRequired)
          ),
      otherwise: (schemaField) => schemaField.optional(),
    }),
  });

  const testConnection = useCallback(
    async ({
      hostname,
      port,
      apiKey,
      baseUrl,
      useSsl = false,
      provider = 'readarr',
    }: {
      hostname: string;
      port: number | string;
      apiKey: string;
      baseUrl?: string;
      useSsl?: boolean;
      provider?: BookDownloaderSettings['provider'];
    }) => {
      setIsTesting(true);
      try {
        const response = await axios.post<BookDownloaderTestResponse>(
          '/api/v1/settings/bookDownloader/test',
          {
            hostname,
            apiKey,
            port: Number(port),
            baseUrl,
            useSsl,
            provider,
          }
        );
        setTestResponse(response.data);
        setIsValidated(true);
        addToast(intl.formatMessage(messages.toastTestSuccess), {
          appearance: 'success',
          autoDismiss: true,
        });
      } catch {
        addToast(intl.formatMessage(messages.toastTestFailure), {
          appearance: 'error',
          autoDismiss: true,
        });
        setIsValidated(false);
      } finally {
        setIsTesting(false);
      }
    },
    [addToast, intl]
  );

  useEffect(() => {
    if (downloader && !initialLoad.current) {
      initialLoad.current = true;
      testConnection({
        hostname: downloader.hostname,
        port: downloader.port,
        apiKey: downloader.apiKey,
        baseUrl: downloader.baseUrl,
        useSsl: downloader.useSsl,
        provider: downloader.provider ?? 'readarr',
      });
    }
  }, [downloader, testConnection]);

  const initialValues: BookDownloaderSettings = downloader ?? {
    id: 0,
    name: '',
    hostname: '',
    port: 8787,
    apiKey: '',
    useSsl: false,
    baseUrl: '',
    activeProfileId: 0,
    activeProfileName: '',
    activeDirectory: '',
    tags: [],
    is4k: false,
    isDefault: true,
    externalUrl: '',
    syncEnabled: false,
    preventSearch: false,
    tagRequests: false,
    overrideRule: [],
    provider: 'readarr',
    mediaSubtype: 'book',
    hardcoverApiToken: '',
    activeMetadataProfileId: 0,
    activeMetadataProfileName: '',
  };

  return (
    <Transition
      as="div"
      appear
      show
      enter="transition-opacity ease-in-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in-out duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Modal
        title={intl.formatMessage(
          downloader ? messages.editServer : messages.createServer
        )}
        onCancel={onClose}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={async (values) => {
            const submission = {
              name: values.name,
              hostname: values.hostname,
              port: Number(values.port),
              apiKey: values.apiKey,
              useSsl: values.useSsl,
              baseUrl: values.baseUrl,
              activeProfileId: Number(values.activeProfileId),
              activeProfileName: values.activeProfileName,
              activeDirectory: values.activeDirectory,
              tags: values.tags ?? [],
              is4k: false,
              isDefault: values.isDefault,
              externalUrl: values.externalUrl,
              syncEnabled: values.syncEnabled,
              preventSearch: values.preventSearch,
              tagRequests: values.tagRequests,
              overrideRule: values.overrideRule ?? [],
              provider: values.provider,
              mediaSubtype: values.mediaSubtype,
              activeMetadataProfileId:
                values.provider === 'readarr'
                  ? Number(values.activeMetadataProfileId)
                  : undefined,
              activeMetadataProfileName:
                values.provider === 'readarr'
                  ? values.activeMetadataProfileName
                  : undefined,
              hardcoverApiToken:
                values.hardcoverApiToken?.trim() ||
                downloader?.hardcoverApiToken ||
                undefined,
            };

            try {
              if (downloader) {
                await axios.put(
                  `/api/v1/settings/bookDownloader/${downloader.id}`,
                  submission
                );
              } else {
                await axios.post('/api/v1/settings/bookDownloader', submission);
              }

              onSave();
            } catch {
              addToast(intl.formatMessage(messages.toastSaveFailure), {
                appearance: 'error',
                autoDismiss: true,
              });
            }
          }}
        >
          {({
            values,
            errors,
            touched,
            handleSubmit,
            setFieldValue,
            isSubmitting,
            isValid,
          }) => {
            const profileOptions: OptionType[] = testResponse.profiles.map(
              (profile) => ({ value: profile.id, label: profile.name })
            );
            const metadataProfileOptions: OptionType[] = (
              testResponse.metadataProfiles ?? []
            ).map((profile) => ({ value: profile.id, label: profile.name }));
            const folderOptions = testResponse.rootFolders.map((folder) => ({
              value: folder.path,
              label: folder.path,
            }));

            return (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label htmlFor="name" className="text-label">
                    {intl.formatMessage(messages.servername)}
                  </label>
                  <div className="form-input-area">
                    <Field id="name" name="name" type="text" />
                    {errors.name && touched.name && (
                      <div className="error">{errors.name}</div>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="hostname" className="text-label">
                    {intl.formatMessage(messages.hostname)}
                  </label>
                  <div className="form-input-area">
                    <Field id="hostname" name="hostname" type="text" />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="port" className="text-label">
                    {intl.formatMessage(messages.port)}
                  </label>
                  <div className="form-input-area">
                    <Field id="port" name="port" type="text" />
                    <span className="help-text">
                      {intl.formatMessage(messages.portBookshelfHint)}
                    </span>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="provider" className="text-label">
                    {intl.formatMessage(messages.provider)}
                  </label>
                  <div className="form-input-area">
                    <Field
                      as="select"
                      id="provider"
                      name="provider"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setIsValidated(false);
                        setFieldValue('provider', e.target.value);
                      }}
                    >
                      <option value="readarr">
                        {intl.formatMessage(messages.providerReadarr)}
                      </option>
                      <option value="bindery">
                        {intl.formatMessage(messages.providerBindery)}
                      </option>
                    </Field>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="apiKey" className="text-label">
                    {intl.formatMessage(messages.apiKey)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <SensitiveInput
                        as="field"
                        id="apiKey"
                        name="apiKey"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setIsValidated(false);
                          setFieldValue('apiKey', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="hardcoverApiToken" className="text-label">
                    {intl.formatMessage(messages.hardcoverApiToken)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <SensitiveInput
                        as="field"
                        id="hardcoverApiToken"
                        name="hardcoverApiToken"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue('hardcoverApiToken', e.target.value);
                        }}
                      />
                    </div>
                    <span className="help-text">
                      {intl.formatMessage(messages.hardcoverApiTokenHelp)}
                    </span>
                    {downloader?.hardcoverApiToken &&
                      !values.hardcoverApiToken && (
                        <span className="help-text">
                          {intl.formatMessage(
                            messages.hardcoverApiTokenConfigured
                          )}
                        </span>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="baseUrl" className="text-label">
                    {intl.formatMessage(messages.baseUrl)}
                  </label>
                  <div className="form-input-area">
                    <Field id="baseUrl" name="baseUrl" type="text" />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="mediaSubtype" className="text-label">
                    {intl.formatMessage(messages.mediasubtype)}
                  </label>
                  <div className="form-input-area">
                    <Field as="select" id="mediaSubtype" name="mediaSubtype">
                      <option value="book">
                        {intl.formatMessage(messages.subtypeBook)}
                      </option>
                      <option value="audiobook">
                        {intl.formatMessage(messages.subtypeAudiobook)}
                      </option>
                    </Field>
                  </div>
                </div>
                <div className="actions">
                  <button
                    type="button"
                    onClick={() =>
                      testConnection({
                        hostname: values.hostname,
                        port: values.port,
                        apiKey: values.apiKey,
                        baseUrl: values.baseUrl,
                        useSsl: values.useSsl,
                        provider: values.provider,
                      })
                    }
                    disabled={isTesting}
                    className="button-md button-secondary"
                  >
                    {intl.formatMessage(globalMessages.test)}
                  </button>
                </div>
                {isValidated && (
                  <>
                    {values.provider === 'readarr' && (
                      <div className="form-row">
                        <label className="text-label">
                          {intl.formatMessage(messages.metadataprofile)}
                        </label>
                        <div className="form-input-area">
                          <Select
                            options={metadataProfileOptions}
                            placeholder={
                              metadataProfileOptions.length
                                ? intl.formatMessage(
                                    messages.selectMetadataProfile
                                  )
                                : intl.formatMessage(
                                    messages.testFirstMetadataProfiles
                                  )
                            }
                            value={metadataProfileOptions.find(
                              (option) =>
                                option.value === values.activeMetadataProfileId
                            )}
                            onChange={(option) => {
                              setFieldValue(
                                'activeMetadataProfileId',
                                option?.value ?? 0
                              );
                              setFieldValue(
                                'activeMetadataProfileName',
                                option?.label ?? ''
                              );
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="form-row">
                      <label className="text-label">
                        {intl.formatMessage(messages.qualityprofile)}
                      </label>
                      <div className="form-input-area">
                        <Select
                          options={profileOptions}
                          placeholder={
                            profileOptions.length
                              ? intl.formatMessage(
                                  messages.selectQualityProfile
                                )
                              : intl.formatMessage(
                                  messages.testFirstQualityProfiles
                                )
                          }
                          value={profileOptions.find(
                            (option) => option.value === values.activeProfileId
                          )}
                          onChange={(option) => {
                            setFieldValue(
                              'activeProfileId',
                              option?.value ?? 0
                            );
                            setFieldValue(
                              'activeProfileName',
                              option?.label ?? ''
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <label className="text-label">
                        {intl.formatMessage(messages.rootfolder)}
                      </label>
                      <div className="form-input-area">
                        <Select
                          options={folderOptions}
                          placeholder={
                            folderOptions.length
                              ? intl.formatMessage(messages.selectRootFolder)
                              : intl.formatMessage(
                                  messages.testFirstRootFolders
                                )
                          }
                          value={folderOptions.find(
                            (option) => option.value === values.activeDirectory
                          )}
                          onChange={(option) => {
                            setFieldValue(
                              'activeDirectory',
                              option?.value ?? ''
                            );
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="form-row">
                  <label className="checkbox-label">
                    <Field type="checkbox" name="isDefault" />
                    {intl.formatMessage(messages.defaultserver)}
                  </label>
                </div>
                <div className="form-row">
                  <label className="checkbox-label">
                    <Field type="checkbox" name="preventSearch" />
                    {intl.formatMessage(messages.enableSearch)}
                  </label>
                </div>
                <div className="actions">
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting || !isValidated}
                    className="button-md button-primary"
                  >
                    {downloader
                      ? intl.formatMessage(globalMessages.save)
                      : intl.formatMessage(messages.add)}
                  </button>
                </div>
              </form>
            );
          }}
        </Formik>
      </Modal>
    </Transition>
  );
};

export default BookDownloaderModal;
