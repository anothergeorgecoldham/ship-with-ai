import { defineConfig } from 'astro/config';

const [owner, repository] =
  process.env.GITHUB_REPOSITORY?.split('/') ?? ['anothergeorgecoldham', 'ship-with-ai'];

// Derive the project-page URL in Actions so repositories created from the
// template work without source edits. Local development uses the canonical URL.
export default defineConfig({
  site: `https://${owner}.github.io`,
  base: `/${repository}`,
});
