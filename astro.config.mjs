import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import ogImage from './src/integrations/og-image';

export default defineConfig({
  site: 'https://madebyksk.com',
  output: 'static',
  integrations: [sitemap(), ogImage()],
  vite: {
    plugins: [tailwindcss()],
  },
});
