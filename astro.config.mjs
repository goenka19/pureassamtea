import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  integrations: [tailwind(), sitemap()],
  output: 'static',
  site: 'https://pureassamtea.com',
  adapter: cloudflare()
});