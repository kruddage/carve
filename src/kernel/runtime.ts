/**
 * Loading `manifold-3d`, once per thread.
 *
 * The WASM module is a few hundred kilobytes and its instantiation is
 * asynchronous, so it is loaded lazily and shared: the first `loadManifold()`
 * starts the work and every caller after that awaits the same promise. A second
 * instance would mean a second WASM heap, and since a `Manifold` cannot cross
 * between instances it would also mean cache entries built by one instance
 * being unusable by the other, silently, at runtime.
 *
 * ## Single-threaded, deliberately
 *
 * This is the plain build, not the threaded one. Issue #6 sets out the full
 * reasoning; the short version is that the threaded build needs
 * `SharedArrayBuffer`, which needs cross-origin isolation, which GitHub Pages
 * cannot provide without a service worker synthesizing COOP/COEP headers — for
 * a speedup that does not appear at the mesh sizes this project targets and
 * that is arguably negative on a thermally constrained headset. If measurement
 * ever says otherwise, the escalation order is `draft` tessellation, then a
 * depth cap, then threading, and threading most likely arrives as a change of
 * host rather than as a shim.
 *
 * Nothing else in the kernel knows which build this is. That is the point of
 * putting the decision in one file.
 *
 * ## `setup()`
 *
 * `manifold-3d` requires `setup()` before any constructor is called; it wires
 * up the class prototypes on the WASM exports. Calling it twice is harmless,
 * calling it never is a crash inside the WASM boundary with no useful stack —
 * so it happens here, in the same promise that resolves the module, and there
 * is no path to a toolkit that has not had it called.
 */

import Module, { type ManifoldToplevel } from 'manifold-3d';

let pending: Promise<ManifoldToplevel> | null = null;

/**
 * The `manifold-3d` toolkit, ready to use.
 *
 * Idempotent and concurrency-safe: N simultaneous callers share one
 * instantiation. On failure the memoized promise is cleared so a later call can
 * retry — a WASM fetch that failed because the network blinked should not
 * poison the kernel for the lifetime of the worker.
 */
export function loadManifold(): Promise<ManifoldToplevel> {
  pending ??= Module()
    .then((api) => {
      api.setup();
      return api;
    })
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });
  return pending;
}

/**
 * Forget the memoized module. Tests only.
 *
 * Does not tear down the WASM instance — there is no supported way to do that,
 * and any `Manifold` still held by a cache would be left pointing at a freed
 * heap. This only affects what the *next* `loadManifold()` returns.
 */
export function resetManifoldForTesting(): void {
  pending = null;
}
