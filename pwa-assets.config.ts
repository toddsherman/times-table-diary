import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Generates the PNG app icons from public/icon.svg: npx pwa-assets-generator
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: { background: '#ff4fa3' } },
    apple: { ...preset.apple, resizeOptions: { background: '#ff4fa3' } },
  },
  images: ['public/icon.svg'],
})
