import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth', 'pako'],
  },
  build: {
    // Keep HTML readable in View Page Source (manager requirement)
    minify: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
