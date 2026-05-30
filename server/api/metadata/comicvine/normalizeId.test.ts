import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  comicVinePublisherApiId,
  comicVineVolumeApiId,
  normalizeComicVinePublisherId,
  normalizeComicVineVolumeId,
} from '@server/api/metadata/comicvine/normalizeId';

describe('normalizeComicVineVolumeId', () => {
  it('strips 4050- prefix', () => {
    assert.equal(normalizeComicVineVolumeId('4050-12345'), '12345');
    assert.equal(normalizeComicVineVolumeId('12345'), '12345');
  });

  it('builds api id', () => {
    assert.equal(comicVineVolumeApiId('12345'), '4050-12345');
    assert.equal(comicVineVolumeApiId('4050-12345'), '4050-12345');
  });

  it('normalizes publisher ids', () => {
    assert.equal(normalizeComicVinePublisherId('4010-31'), '31');
    assert.equal(normalizeComicVinePublisherId('31'), '31');
    assert.equal(comicVinePublisherApiId('31'), '4010-31');
  });
});
