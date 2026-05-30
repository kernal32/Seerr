import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import type { ComicDownloaderSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

export type ComicDownloaderTestResponse = {
  urlBase?: string;
  comicVineConfigured?: boolean;
};

const messages = defineMessages('components.Settings.ComicDownloaderModal', {
  createServer: 'Add Comic Downloader',
  editServer: 'Edit Comic Downloader',
  validationNameRequired: 'You must provide a server name',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  validationApiKeyRequired: 'You must provide an API key',
  validationComicVineKeyRequired: 'You must provide a Comic Vine API key',
  portMylarHint: 'Mylar3 default port is 8090',
  comicVineApiKey:
    'Comic Vine API key for discover/search in Bookarr (not sent to Mylar3).',
  comicVineApiKeyHelp:
    'Get a free key at comicvine.gamespot.com/api. Mylar3 needs its own Comic Vine key configured separately.',
  comicVineApiKeyConfigured:
    'A Comic Vine key is already saved. Leave blank to keep it, or enter a new key to replace it.',
  toastTestSuccess: 'Comic downloader connection established successfully!',
  toastTestFailure: 'Failed to connect to comic downloader.',
  toastSaveFailure: 'Failed to save comic downloader.',
  add: 'Add Server',
  defaultserver: 'Default Server',
  servername: 'Server Name',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  ssl: 'Use SSL',
  apiKey: 'Mylar3 API Key',
  baseUrl: 'URL Base',
  externalUrl: 'External URL',
  enableSearch: 'Enable Automatic Search',
  syncEnabled: 'Sync Enabled',
  syncEnabledHelp:
    'Poll Mylar3 for download completion and update request status.',
});

interface ComicDownloaderFormValues extends ComicDownloaderSettings {
  enableSearch: boolean;
}

interface ComicDownloaderModalProps {
  downloader: ComicDownloaderSettings | null;
  onClose: () => void;
  onSave: () => void;
}

const ComicDownloaderModal = ({
  onClose,
  downloader,
  onSave,
}: ComicDownloaderModalProps) => {
  const intl = useIntl();
  const initialLoad = useRef(false);
  const { addToast } = useToasts();
  const [isValidated, setIsValidated] = useState(!!downloader);
  const [isTesting, setIsTesting] = useState(false);

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
    comicVineApiKey: Yup.string().when('$isNew', {
      is: true,
      then: (field) =>
        field.required(
          intl.formatMessage(messages.validationComicVineKeyRequired)
        ),
      otherwise: (field) => field.optional(),
    }),
  });

  const testConnection = useCallback(
    async (values: {
      hostname: string;
      port: number | string;
      apiKey: string;
      baseUrl?: string;
      useSsl?: boolean;
      comicVineApiKey?: string;
    }) => {
      setIsTesting(true);
      try {
        await axios.post<ComicDownloaderTestResponse>(
          '/api/v1/settings/comicDownloader/test',
          {
            hostname: values.hostname,
            apiKey: values.apiKey,
            port: Number(values.port),
            baseUrl: values.baseUrl,
            useSsl: values.useSsl ?? false,
            provider: 'mylar3',
            comicVineApiKey: values.comicVineApiKey,
          }
        );
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
      });
    }
  }, [downloader, testConnection]);

  const initialValues: ComicDownloaderFormValues = {
    ...(downloader ?? {
      id: 0,
      name: '',
      hostname: '',
      port: 8090,
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
      syncEnabled: true,
      preventSearch: false,
      tagRequests: false,
      overrideRule: [],
      provider: 'mylar3' as const,
      comicVineApiKey: '',
    }),
    enableSearch: downloader ? !downloader.preventSearch : true,
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
        onCancel={onClose}
        title={
          downloader
            ? intl.formatMessage(messages.editServer)
            : intl.formatMessage(messages.createServer)
        }
      >
      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        validationContext={{ isNew: !downloader }}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            const submission: ComicDownloaderSettings = {
              ...values,
              provider: 'mylar3',
              preventSearch: !values.enableSearch,
            };

            if (downloader) {
              if (!submission.comicVineApiKey?.trim()) {
                submission.comicVineApiKey = downloader.comicVineApiKey;
              }
              await axios.put(
                `/api/v1/settings/comicDownloader/${downloader.id}`,
                submission
              );
            } else {
              await axios.post('/api/v1/settings/comicDownloader', submission);
            }

            onSave();
          } catch {
            setFieldError('name', intl.formatMessage(messages.toastSaveFailure));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          errors,
          handleSubmit,
          isSubmitting,
          setFieldValue,
          values,
        }) => (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name" className="text-label">
                {intl.formatMessage(messages.servername)}
              </label>
              <div className="form-input-area">
                <Field id="name" name="name" type="text" />
                {errors.name && (
                  <div className="error">{String(errors.name)}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="hostname" className="text-label">
                {intl.formatMessage(messages.hostname)}
              </label>
              <div className="form-input-area">
                <Field id="hostname" name="hostname" type="text" />
                {errors.hostname && (
                  <div className="error">{String(errors.hostname)}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="port" className="text-label">
                {intl.formatMessage(messages.port)}
              </label>
              <div className="form-input-area">
                <Field id="port" name="port" type="text" />
                <span className="label-small">
                  {intl.formatMessage(messages.portMylarHint)}
                </span>
                {errors.port && (
                  <div className="error">{String(errors.port)}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="apiKey" className="text-label">
                {intl.formatMessage(messages.apiKey)}
              </label>
              <div className="form-input-area">
                <SensitiveInput as="field" id="apiKey" name="apiKey" />
                {errors.apiKey && (
                  <div className="error">{String(errors.apiKey)}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="comicVineApiKey" className="text-label">
                {intl.formatMessage(messages.comicVineApiKey)}
              </label>
              <div className="form-input-area">
                <SensitiveInput
                  as="field"
                  id="comicVineApiKey"
                  name="comicVineApiKey"
                />
                <span className="label-small">
                  {downloader?.comicVineApiKey
                    ? intl.formatMessage(messages.comicVineApiKeyConfigured)
                    : intl.formatMessage(messages.comicVineApiKeyHelp)}
                </span>
                {errors.comicVineApiKey && (
                  <div className="error">{String(errors.comicVineApiKey)}</div>
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
              <label htmlFor="externalUrl" className="text-label">
                {intl.formatMessage(messages.externalUrl)}
              </label>
              <div className="form-input-area">
                <Field id="externalUrl" name="externalUrl" type="text" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="useSsl" className="checkbox-label">
                <Field id="useSsl" name="useSsl" type="checkbox" />
                {intl.formatMessage(messages.ssl)}
              </label>
            </div>
            <div className="form-row">
              <label htmlFor="isDefault" className="checkbox-label">
                <Field id="isDefault" name="isDefault" type="checkbox" />
                {intl.formatMessage(messages.defaultserver)}
              </label>
            </div>
            <div className="form-row">
              <label htmlFor="enableSearch" className="checkbox-label">
                <Field
                  id="enableSearch"
                  name="enableSearch"
                  type="checkbox"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setFieldValue('enableSearch', e.target.checked);
                    setFieldValue('preventSearch', !e.target.checked);
                  }}
                />
                {intl.formatMessage(messages.enableSearch)}
              </label>
            </div>
            <div className="form-row">
              <label htmlFor="syncEnabled" className="checkbox-label">
                <Field id="syncEnabled" name="syncEnabled" type="checkbox" />
                {intl.formatMessage(messages.syncEnabled)}
              </label>
              <span className="label-small">
                {intl.formatMessage(messages.syncEnabledHelp)}
              </span>
            </div>
            <div className="actions">
              <button
                type="button"
                className="server-form-submit-button"
                disabled={isTesting}
                onClick={() =>
                  testConnection({
                    hostname: values.hostname,
                    port: values.port,
                    apiKey: values.apiKey,
                    baseUrl: values.baseUrl,
                    useSsl: values.useSsl,
                    comicVineApiKey: values.comicVineApiKey,
                  })
                }
              >
                {intl.formatMessage(globalMessages.test)}
              </button>
              <button
                type="submit"
                className="server-form-submit-button"
                disabled={isSubmitting || !isValidated}
              >
                {downloader
                  ? intl.formatMessage(globalMessages.save)
                  : intl.formatMessage(messages.add)}
              </button>
            </div>
          </form>
        )}
      </Formik>
      </Modal>
    </Transition>
  );
};

export default ComicDownloaderModal;
