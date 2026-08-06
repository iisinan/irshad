import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          vendor: ['axios', '@tanstack/react-query', 'lucide-react']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://irshad.test',
        changeOrigin: true,
      },
    },
  },
})
