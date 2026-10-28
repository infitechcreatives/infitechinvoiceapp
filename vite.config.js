import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // html2pdf.js is large but only loaded on demand when making a PDF.
  build: { chunkSizeWarningLimit: 1200 },
})
