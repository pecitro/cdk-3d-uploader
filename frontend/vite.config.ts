import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://d3s8tcjy4g9ua1.cloudfront.net',
        changeOrigin: true
      },
      '/pointclouds': {
        target: 'https://d3s8tcjy4g9ua1.cloudfront.net',
        changeOrigin: true
      }
    }
  }
});
