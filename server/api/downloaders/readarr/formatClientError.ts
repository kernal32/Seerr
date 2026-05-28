import axios from 'axios';

export const formatReadarrClientError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    let detail = error.message;

    if (typeof data === 'string' && data.trim()) {
      detail = data.trim();
    } else if (data && typeof data === 'object') {
      detail = JSON.stringify(data);
    }

    if (detail.length > 500) {
      detail = `${detail.slice(0, 500)}…`;
    }

    return new Error(
      status
        ? `Bookshelf returned HTTP ${status}: ${detail}`
        : `Bookshelf request failed: ${detail}`
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};
