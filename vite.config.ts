import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      devOptions: {
        enabled: false, // 开发模式禁用 PWA，避免加载问题
        type: 'module'
      },
      manifest: {
        name: 'NutriAI - AI 營養助手',
        short_name: 'NutriAI',
        description: '智能營養追蹤與飲食建議應用程式',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: []
      }
    })
  ],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 60000, // 60秒超时
        proxyTimeout: 60000,
      }
    }
  }
});