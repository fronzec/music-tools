/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve('./src/lib'),
    },
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.ts'],
    globals: true,
    // Bound runaway tests so a hang fails fast instead of pinning a worker.
    // Note: these catch async hangs; a synchronous infinite loop blocks the
    // event loop and can only be stopped by killing the process — so the real
    // guard is correct code (no unbounded loops) plus an external run timeout.
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
