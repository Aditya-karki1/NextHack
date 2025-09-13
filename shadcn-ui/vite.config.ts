import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite resolves '/src' from project root, so using '/src' avoids Node-specific APIs
    alias: {
      '@': '/src',
    },
  },
})
