import { fileURLToPath } from 'node:url';

import basicSsl from '@vitejs/plugin-basic-ssl';
// vitest/config re-exports Vite's defineConfig with the `test` field typed.
import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * Asset URLs are emitted **relative**, not rooted at a fixed prefix, because
 * this site is served from two different depths:
 *
 *   live     https://kruddage.github.io/carve/
 *   preview  https://kruddage.github.io/carve/pr-preview/pr-<N>/
 *
 * The deploy and preview jobs in .github/workflows/pages.yml share a single
 * build artifact, so the build cannot know which depth it will be served from.
 * A hardcoded '/carve/' would be right for the first and wrong for the second
 * — and wrong in the worst way, because a preview would silently load the
 * *live* bundle: the page renders, looks about right, and is running different
 * code than the branch under review.
 *
 * './' resolves correctly at any depth with no per-job rebuild. The rule that
 * follows: runtime code must build URLs with `import.meta.env.BASE_URL` or
 * `new URL('./thing', import.meta.url)`, never a hand-written leading slash.
 * See docs/deploy.md.
 */
const BASE = './';

/**
 * Directory (relative to the repo root) whose contents are copied into the
 * build verbatim — no bundling, no hashing, no transform — and served at the
 * base URL in dev. `public/` is Vite's built-in mechanism for exactly this.
 *
 * `public/probe/` is the dependency-free capability probe from issue #2: plain
 * HTML plus one JS file, deliberately outside the app bundle so it keeps
 * working even when the app does not. Living here means it is served at
 * `/probe/` in dev and copied to `dist/probe/` at build, so the path is the
 * same in both — which matters, because that URL is a bookmark people re-open
 * after every Quest Browser update.
 */
const PUBLIC_DIR = 'public';

export default defineConfig(({ mode }) => ({
  root: projectRoot,
  base: BASE,
  // Explicit rather than defaulted: this is the contract that static assets are
  // copied byte-for-byte into the build. Do not point this at a directory that
  // also contains sources — everything under it ships as-is.
  publicDir: PUBLIC_DIR,
  plugins: [
    // HTTPS on the LAN for `npm run dev:https`, which is the fallback path when
    // `adb reverse` is not available. See docs/dev-setup.md — the default dev
    // loop is plain HTTP over `adb reverse`, which needs no certificate at all.
    ...(mode === 'https' ? [basicSsl()] : []),
  ],
  server: {
    host: true,
    port: 5173,
    // `adb reverse tcp:5173 tcp:5173` forwards a fixed port. Silently moving to
    // 5174 would make the headset load nothing with no visible error.
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
}));
