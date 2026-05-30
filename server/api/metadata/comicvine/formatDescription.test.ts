import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatComicVineDescription } from './formatDescription';

describe('formatComicVineDescription', () => {
  it('returns plain text unchanged', () => {
    assert.equal(formatComicVineDescription('Simple deck text.'), 'Simple deck text.');
  });

  it('strips tags and preserves link labels with URLs', () => {
    const html =
      '<p>See also <a href="https://comicvine.gamespot.com/volume/4050-123/">Deadpool (2012)</a>.</p>';

    assert.equal(
      formatComicVineDescription(html),
      'See also Deadpool (2012) (https://comicvine.gamespot.com/volume/4050-123/).'
    );
  });

  it('removes embedded figures and images', () => {
    const html =
      '<p>Intro</p><figure><img src="https://example.com/x.jpg"></figure><p>Outro</p>';

    assert.equal(formatComicVineDescription(html), 'Intro\nOutro');
  });
});
