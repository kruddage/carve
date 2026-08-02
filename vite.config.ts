import { cpSync, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import basicSsl from '@vitejs/plugin-basic-ssl';
import type { Plugin, ResolvedConfig } from 'vite';
// vitest/config re-exports Vite's defineConfig with the `test` field typed.
import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * GitHub *project* Pages serve this repo at https://kruddage.github.io/carve/,
 * not at the domain root. Every emitted asset URL therefore has to be prefixed
 * with `/carve/`. Getting this wrong produces a white page with 404s for the
 * JS bundle — which is miserable to diagnose from inside a headset, so it is
 * pinned here rather than left to the deploy workflow (see issue #16).
 *
 * It is applied in dev as well as in build on purpose: the dev server then
 * serves the app at http://<host>:5173/carve/ exactly like production, so a
 * base-path bug cannot hide until deploy time. Vite redirects `/` to the base.
 */
const BASE = '/carve/';

/**
 * Directory (relative to the repo root) whose contents are copied into the
 * build verbatim — no bundling, no hashing, no transform. `public/` is Vite's
 * built-in mechanism for this and is configured below via `publicDir`.
 */
const PUBLIC_DIR = 'public';

/**
 * Additional root-level directories that must pass through the build untouched
 * and stay reachable at their own path.
 *
 * `probe/` is the dependency-free capability probe from issue #2: plain HTML
 * plus one JS file, no build step, deliberately not part of the app bundle so
 * it keeps working even when the app does not. It has to stay live at
 * `/carve/probe/` because that URL is a bookmark people re-open after every
 * Quest Browser update.
 *
 * Anything listed here is optional — if the directory does not exist the
 * plugin is a no-op, so this file does not depend on the probe having landed.
 */
const ROOT_PASSTHROUGH_DIRS = ['probe'] as const;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain',
};

/**
 * Serves and copies root-level static directories that live outside
 * `publicDir`. In dev it answers requests under `<base><dir>/`; at build time
 * it copies the directory into `outDir` after the bundle is written.
 */
function rootPassthrough(dirs: readonly string[]): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'carve:root-passthrough',
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? '/';
        // Depending on where this middleware lands relative to Vite's own base
        // middleware, the base may or may not already be stripped. Handle both.
        const withoutBase = rawUrl.startsWith(config.base)
          ? rawUrl.slice(config.base.length)
          : rawUrl.replace(/^\//, '');
        const pathname = decodeURIComponent(withoutBase.split(/[?#]/, 1)[0] ?? '');
        const dir = dirs.find((d) => pathname === d || pathname.startsWith(`${d}/`));
        if (dir === undefined) {
          next();
          return;
        }

        const dirRoot = resolve(config.root, dir);
        const requested = normalize(resolve(config.root, pathname));
        // Refuse anything that escaped the directory via `..`.
        if (requested !== dirRoot && !requested.startsWith(dirRoot + sep)) {
          next();
          return;
        }

        const file =
          existsSync(requested) && statSync(requested).isDirectory()
            ? join(requested, 'index.html')
            : requested;
        if (!existsSync(file)) {
          next();
          return;
        }

        res.setHeader(
          'Content-Type',
          MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
        );
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      for (const dir of dirs) {
        const from = resolve(config.root, dir);
        if (!existsSync(from)) continue;
        cpSync(from, resolve(config.root, config.build.outDir, dir), {
          recursive: true,
        });
        config.logger.info(`  carve: copied ${dir}/ into ${config.build.outDir}/ untouched`);
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: projectRoot,
  base: BASE,
  // Explicit rather than defaulted: this is the contract that static assets are
  // copied byte-for-byte into the build. Do not point this at a directory that
  // also contains sources — everything under it ships as-is.
  publicDir: PUBLIC_DIR,
  plugins: [
    rootPassthrough(ROOT_PASSTHROUGH_DIRS),
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
