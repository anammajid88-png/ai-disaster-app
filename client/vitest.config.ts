import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

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
  test: {
    globals: true,
    environment: 'node',
  },
});
