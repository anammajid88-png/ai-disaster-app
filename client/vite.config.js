import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The client lives in ./client but reads safety JSON from ../shared/data,
// so both folders are allowed in the dev server's file system scope.
const projectRoot = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(projectRoot, 'shared'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [projectRoot] },
    // The browser never calls Model Studio directly - only our Express API.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Keep the router/vendor chunk separate so page code can be split further.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
