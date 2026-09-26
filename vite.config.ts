import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The app is served at www.todd.sh/timesTableDiary/App through a rewrite that keeps the path as
// is, so every URL it builds carries this prefix, and the build lands at the same path in dist/.
const BASE = '/timesTableDiary/App/'

// todd.sh drops trailing slashes, so the page itself is /timesTableDiary/App. The service worker's
// scope leaves off the slash to cover it, which vercel.json allows with Service-Worker-Allowed.
const SCOPE = BASE.slice(0, -1)

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  build: { outDir: `dist${SCOPE}` },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: SCOPE,
      // Icons are already precached by globPatterns below.
      includeManifestIcons: false,
      manifest: {
        id: SCOPE,
        start_url: SCOPE,
        name: 'Times Table Diary',
        short_name: 'Times Diary',
        description: 'Times tables practice, one diary entry a day.',
        theme_color: '#ff4fa3',
        background_color: '#fffdf7',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // The diary API always goes to the network; never answer it with the app shell.
        navigateFallbackDenylist: [new RegExp(`^${BASE}api/`)],
      },
    }),
  ],
})
