import axios from 'axios';

export const isBinderyMetadataSearchUnavailable = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 502 || status === 403) {
      return true;
    }

    const body = error.response?.data;

    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error.includes('metadata provider unavailable')
    ) {
      return true;
    }
  }

  if (error instanceof Error) {
    return (
      error.message.includes('metadata provider unavailable') ||
      error.message.includes('HTTP 403')
    );
  }

  return false;
};
