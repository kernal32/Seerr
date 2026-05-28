import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import HardcoverClient from '@server/api/metadata/hardcover/client';
import { MediaType } from '@server/constants/media';

const settingsPath = path.join(process.cwd(), 'config', 'settings.json');
const settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as {
  bookDownloaders: { mediaSubtype?: string; hardcoverApiToken?: string }[];
};
const token =
  settings.bookDownloaders.find((d) => d.mediaSubtype === 'book')
    ?.hardcoverApiToken ??
  settings.bookDownloaders.find((d) => d.hardcoverApiToken)?.hardcoverApiToken;

describe('audiobook related media', { skip: !token }, () => {
  it('similar does not throw for yesteryear', async () => {
    const client = new HardcoverClient(token!);
    const results = await client.getSimilarBooks(
      'hc:yesteryear-2026',
      'audiobook',
      MediaType.AUDIOBOOK,
      20
    );

    assert.ok(Array.isArray(results));
  });

  it('author books does not throw for Caro Claire Burke', async () => {
    const client = new HardcoverClient(token!);
    const results = await client.getBooksByAuthor(
      'Caro Claire Burke',
      'hc:yesteryear-2026',
      'audiobook',
      MediaType.AUDIOBOOK,
      20
    );

    assert.ok(Array.isArray(results));
  });
});
