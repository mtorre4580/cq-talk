import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icons for the manifest, iOS and the browser tab, generated from public/logo.svg
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#05080D' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#05080D' } },
  },
  images: ['public/logo.svg'],
});
