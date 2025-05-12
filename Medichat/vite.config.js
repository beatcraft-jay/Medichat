import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // For local dev
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist', // Vite’s default output directory
  },
})
