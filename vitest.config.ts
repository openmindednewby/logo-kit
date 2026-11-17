import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { 'react-native': 'react-native-web' } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['src/react/**', 'jsdom']],
    testTimeout: 60000,
  },
});
