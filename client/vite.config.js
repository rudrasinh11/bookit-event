import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // Suppresses non-breaking compiler configuration warnings
  logLevel: 'info',
  clearScreen: false
});