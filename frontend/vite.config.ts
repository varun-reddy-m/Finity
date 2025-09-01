import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000', // Replace with your backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1'),
      },
    },
  },
});
