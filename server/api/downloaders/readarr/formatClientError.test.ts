import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatReadarrClientError,
  isBookshelfDuplicateEditionError,
} from '@server/api/downloaders/readarr/formatClientError';
import axios from 'axios';

describe('formatClientError', () => {
  it('detects duplicate edition conflicts from formatted Bookshelf errors', () => {
    const error = new Error(
      'Bookshelf returned HTTP 409: {"message":"constraint failed\\nUNIQUE constraint failed: Editions.ForeignEditionId"}'
    );

    assert.equal(isBookshelfDuplicateEditionError(error), true);
  });

  it('does not treat other Bookshelf errors as duplicate edition conflicts', () => {
    assert.equal(
      isBookshelfDuplicateEditionError(
        new Error('Bookshelf returned HTTP 500: internal error')
      ),
      false
    );
    assert.equal(
      isBookshelfDuplicateEditionError(
        new Error('Bookshelf returned HTTP 409: other conflict')
      ),
      false
    );
  });

  it('formats axios errors with HTTP status', () => {
    const axiosError = new axios.AxiosError('Conflict');
    axiosError.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as never,
      data: { message: 'duplicate' },
    };

    const formatted = formatReadarrClientError(axiosError);
    assert.match(formatted.message, /HTTP 409/);
  });
});
