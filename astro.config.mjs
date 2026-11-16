import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';

let base = '/';

export default defineConfig({
  site: 'https://familia-online.site',
  output: 'static',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  vite: {
    build: {
      // Standalone Astro scripts also need to run when the review opens via file://.
      assetsInlineLimit: path => path.endsWith('.js') ? true : undefined,
    },
  },
  integrations: [{
    name: 'legacy-routes',
    hooks: {
      async 'astro:config:done'({ config }) {
        base = config.base;
      },
      async 'astro:build:done'({ dir }) {
        if (base.replace(/\/$/, '') !== '') return;

        // Preserve the assets and the working paths of the historical test.
        const legacy = new URL('Test/', dir);
        await mkdir(legacy, { recursive: true });
        await Promise.all([
          copyFile(new URL('./Test/index.html', import.meta.url), new URL('index.html', legacy)),
          copyFile(new URL('./KiselevIvanAkulovich.jpg', import.meta.url), new URL('KiselevIvanAkulovich.jpg', dir)),
        ]);
        // The old capitalized URL served a single newline. On Windows it resolves to index.html.
        await writeFile(new URL('Index.html', legacy), '\n', { flag: 'wx' }).catch(error => {
          if (error.code !== 'EEXIST') throw error;
        });
      },
    },
  }],
});
