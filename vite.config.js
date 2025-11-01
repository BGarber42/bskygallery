import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'atproto': ['@atproto/api', '@atproto/xrpc']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})

