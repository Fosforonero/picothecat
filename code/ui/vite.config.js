import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = 'http://192.168.2.136:8787'

const healthProxy = {
  '/health': {
    target: backendTarget,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: healthProxy,
  },
  preview: {
    proxy: healthProxy,
  },
})
