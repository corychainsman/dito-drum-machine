import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  server: {
    host: true,
    https: {
      cert: './department-of-mysteries.taile1b538.ts.net.crt',
      key: './department-of-mysteries.taile1b538.ts.net.key'
    }
  },
  // GitHub Pages: use relative paths so it works at any subpath
  // e.g. https://username.github.io/orbit/
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      },
      manifest: false // we provide our own in public/
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined // single chunk for simplicity
      }
    }
  }
});
