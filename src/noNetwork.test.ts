import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fromRoot, readRoot } from './testing/paths';

const SOURCE = /\.ts$/;
const BANNED = [/\bfetch\s*\(/, /from ['"](node:)?(http|https|net|dns|tls|dgram)['"]/, /XMLHttpRequest|WebSocket/, /anthropic|openai|@google\/generative|ollama/i, /https?:\/\/(?!www\.w3\.org\/2000\/svg)/];

const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : SOURCE.test(e.name) && !e.name.endsWith('.test.ts') ? [path.join(dir, e.name)] : []));

describe('logo-kit sources', () => {
  it('with every non-test source file, make no network or LLM call', () => {
    const sources = files(fromRoot('src'));

    const hits = sources.flatMap((f) => BANNED.filter((re) => re.test(fs.readFileSync(f, 'utf8'))).map((re) => `${path.basename(f)} ${String(re)}`));

    expect(hits).toEqual([]);
  });

  it('with the package manifest, depends only on design-tokens and resvg', () => {
    const pkg = JSON.parse(readRoot('package.json')) as { dependencies: Record<string, string> };

    const deps = Object.keys(pkg.dependencies).sort((a, b) => a.localeCompare(b));

    expect(deps).toEqual(['@dloizides/design-tokens', '@resvg/resvg-js']);
  });
});
