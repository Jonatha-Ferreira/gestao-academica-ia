import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O proxy encaminha /api para o back-end em desenvolvimento, evitando CORS
// e mantendo a URL da API configurável via VITE_API_URL quando necessário.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
