import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development the browser talks to Vite (port 5173) and Vite forwards /api to the Fastify server (port 3001).
const api = { '/api': { target: 'http://localhost:3001', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { proxy: api },
  preview: { proxy: api },
});
