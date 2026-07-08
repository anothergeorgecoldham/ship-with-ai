import { defineConfig } from 'astro/config';

// GitHub Pages project-page deploy: `base` must match the repo name so
// links and assets resolve under /ship-with-ai. See RUNSHEET.md / README.md.
export default defineConfig({
  site: 'https://anothergeorgecoldham.github.io',
  base: '/ship-with-ai',
});
