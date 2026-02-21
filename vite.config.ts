// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173,
  },
  build: {
    rollupOptions: {
      // The Even Realities SDK is injected at runtime by the G2 glasses' WebView
      // host environment and is not available as an npm package.
      external: ['@evenrealities/even_hub_sdk'],
    },
  },
})