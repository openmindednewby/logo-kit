import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { pixelDiff, renderSvg } from '../core/raster';
import { exportBrand } from '../export/exportBrand';
import { readPng } from '../testing/png';
import { fromRoot, MOONCUBE, readRoot, tmpDir } from '../testing/paths';

const MAX_DIFF = 0.02;
const out = tmpDir('export-parity');
exportBrand(loadBrand(MOONCUBE), out);

describe('Moon Cube export parity', () => {
  it.each(['icon-192.png', 'apple-touch-icon.png'])('with %s, is within 2% of today\'s export over the mark box', (file) => {
    const today = readPng(fromRoot('fixtures', 'mooncube', file));

    const share = pixelDiff(readPng(path.join(out, file)), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with favicon.svg at 32 px, is within 2% of today\'s favicon.svg', () => {
    const today = renderSvg(readRoot('fixtures', 'mooncube', 'favicon.svg'), 32);

    const share = pixelDiff(renderSvg(readRoot(path.relative(fromRoot(), path.join(out, 'favicon.svg'))), 32), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });
});
