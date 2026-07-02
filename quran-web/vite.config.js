import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Al-Quran Web',
        short_name: 'Quran',
        description: 'Baca Al-Quran digital offline',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        icons: [
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}']
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:9969'
    }
  }
})
