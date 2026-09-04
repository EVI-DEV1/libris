import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy em dev: o front fala /api e o Vite entrega na API, sem CORS no meio.
    proxy: {
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
});
