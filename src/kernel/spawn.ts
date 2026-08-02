/**
 * The one file that knows what a `Worker` is.
 *
 * Kept apart from `client.ts` on purpose, and not re-exported from
 * `index.ts`. `?worker` is a Vite transform: importing this module at all pulls
 * in a bundler-specific import that has no meaning under Vitest in Node, so
 * anything that touched it transitively would stop being testable headlessly.
 * `client.ts` takes a `KernelPort` instead, which is why every scheduling rule
 * in the kernel is a Node test rather than a browser one.
 *
 * The app calls `spawnKernel()`. Tests never do.
 */

// `?worker` is resolved by Vite; `vite/client`'s ambient module declaration is
// what makes it type-check. Neither works under Node, hence this file's isolation.
import KernelWorker from './worker.js?worker';

import { KernelClient, type KernelPort } from './client.js';

/**
 * A kernel running in a real Web Worker.
 *
 * The worker is a module worker: `manifold-3d` ships as ESM and its WASM is
 * located relative to `import.meta.url`, neither of which survives a classic
 * worker. Vite emits it as a separate chunk, so the ~300kB of WASM glue is not
 * in the main bundle and the page is interactive before the kernel finishes
 * instantiating.
 *
 * Caller owns the result and must `terminate()` it. A worker outlives the
 * document that spawned it otherwise, and with it the whole subtree cache.
 */
export function spawnKernel(): KernelClient {
  return new KernelClient(new KernelWorker() as unknown as KernelPort);
}
