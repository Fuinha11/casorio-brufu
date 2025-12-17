import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages configuration
  site: 'https://fuinha11.github.io',
  base: '/casorio-brufu',

  // Output configuration for static site
  output: 'static',

  // Build options
  build: {
    assets: 'assets'
  },

  // View Transitions for smooth page animations
  // Enabled by default in Astro 4+
});
