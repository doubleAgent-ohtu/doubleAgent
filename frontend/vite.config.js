import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // our backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // strips /api
      },
    },
  },
  
  // TESTS
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.jsx',
  },
});
