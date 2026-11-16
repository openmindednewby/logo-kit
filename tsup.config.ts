import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts', runtime: 'src/runtime/index.ts' },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts', runtime: 'src/runtime/index.ts' } },
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: ['@dloizides/design-tokens', '@resvg/resvg-js'],
});
