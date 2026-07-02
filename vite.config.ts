import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        if (log.code === 'INVALID_ANNOTATION') return;
        defaultHandler(level, log);
      },
    },
  },
})
