import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = { '/api': { target: 'http://localhost:3001', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: { proxy: api },
  preview: { proxy: api },
});
