import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts' } },
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: ['@dloizides/design-tokens', '@resvg/resvg-js'],
});
