import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@protocol': path.resolve(__dirname, '../../codex-rs/app-server-protocol/schema/typescript')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  clearScreen: false
});
