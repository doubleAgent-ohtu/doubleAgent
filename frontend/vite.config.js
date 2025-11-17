import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '' instead of process.cwd().
  // loadEnv will default to the current directory.
  const env = loadEnv(mode, '', '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''), // strips /api
        },
      },
    },
    
    //TESTS
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.jsx',
    },
  };
});
