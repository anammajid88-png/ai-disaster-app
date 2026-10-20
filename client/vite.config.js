import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The client lives in ./client but reads safety JSON from ../shared/data,
// so both folders are allowed in the dev server's file system scope.
const projectRoot = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/lib', replacement: path.resolve(__dirname, 'src/features/intelligence') },
      { find: '@/data', replacement: path.resolve(__dirname, 'src/features/intelligence/data') },
      { find: '@shared', replacement: path.resolve(projectRoot, 'shared') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  server: {
    port: 5174,
    fs: { allow: [projectRoot] },
    // Integrated preview proxies to port 5001 to prevent conflicts with baseline on 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
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
