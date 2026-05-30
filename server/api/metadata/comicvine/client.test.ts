import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import ComicVineClient from '@server/api/metadata/comicvine/client';
import axios from 'axios';

describe('ComicVineClient.listVolumes', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('requests volumes with sort, pagination, and field_list', async () => {
    let capturedUrl: string | undefined;
    let capturedParams: Record<string, unknown> | undefined;

    mock.method(axios, 'get', async (url: string, config?: { params?: Record<string, unknown> }) => {
      capturedUrl = url;
      capturedParams = config?.params;

      return {
        data: {
          error: 'OK',
          limit: 20,
          offset: 40,
          number_of_page_results: 1,
          number_of_total_results: 100,
          status_code: 1,
          results: [
            {
              id: 12345,
              name: 'The Amazing Spider-Man',
              deck: 'Web-slinging adventures.',
              start_year: '1963',
              publisher: { id: 31, name: 'Marvel' },
              image: { medium_url: 'https://example.com/cover.jpg' },
            },
          ],
        },
      };
    });

    const client = new ComicVineClient('test-api-key');
    const result = await client.listVolumes({
      sort: 'date_added:desc',
      limit: 20,
      offset: 40,
    });

    assert.equal(result.totalResults, 100);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.id, '12345');
    assert.equal(result.results[0]?.title, 'The Amazing Spider-Man');
    assert.equal(result.results[0]?.subtitle, 'Marvel');
    assert.equal(
      capturedUrl,
      'https://comicvine.gamespot.com/api/volumes/'
    );
    assert.deepEqual(capturedParams, {
      api_key: 'test-api-key',
      format: 'json',
      field_list: 'id,name,deck,start_year,publisher,image',
      sort: 'date_added:desc',
      limit: 20,
      offset: 40,
    });
  });

  it('throws when Comic Vine returns a non-success status_code', async () => {
    mock.method(axios, 'get', async () => ({
      data: {
        error: 'Invalid API Key',
        status_code: 100,
        results: [],
      },
    }));

    const client = new ComicVineClient('bad-key');

    await assert.rejects(
      () =>
        client.listVolumes({
          sort: 'date_added:desc',
          limit: 20,
          offset: 0,
        }),
      /Invalid API Key/
    );
  });
});

describe('ComicVineClient.listPublisherVolumes', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('loads volumes from the publisher resource and sorts by name', async () => {
    let capturedUrl: string | undefined;

    mock.method(axios, 'get', async (url: string) => {
      capturedUrl = url;

      return {
        data: {
          error: 'OK',
          status_code: 1,
          results: {
            id: 31,
            name: 'Marvel',
            volumes: [
              { id: 200, name: 'X-Men' },
              { id: 100, name: 'The Amazing Spider-Man' },
            ],
          },
        },
      };
    });

    const client = new ComicVineClient('test-api-key');
    const result = await client.listPublisherVolumes(31);

    assert.equal(
      capturedUrl,
      'https://comicvine.gamespot.com/api/publisher/4010-31/'
    );
    assert.equal(result.totalResults, 2);
    assert.deepEqual(
      result.results.map((volume) => volume.title),
      ['The Amazing Spider-Man', 'X-Men']
    );
    assert.equal(result.results[0]?.subtitle, 'Marvel');
    assert.equal(result.results[0]?.foreignAuthorId, '31');
  });
});
