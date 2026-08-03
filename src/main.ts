/**
 * Application entry point, loaded by the root index.html.
 *
 * As of issue #9 this starts the modeler. What it still does first is set
 * `document.documentElement.dataset.carveBoot`, and that marker has not stopped
 * earning its keep: the most likely way this project breaks on a Quest is a
 * wrong `base` in vite.config.ts, where the page renders (it is static HTML),
 * the bundle 404s, and from inside a headset that looks identical to everything
 * working. The marker is present only if this module actually loaded and
 * executed, so `chrome://inspect` or the probe page can tell those two states
 * apart — and because it is set *before* the app mounts, it also distinguishes
 * "the bundle never loaded" from "the bundle loaded and the app threw".
 *
 * The kernel is spawned here rather than inside `mountApp`. `spawn.ts` imports
 * a Vite-specific `?worker` module that has no meaning in Node, so anything
 * touching it transitively would stop being importable from a test — see the
 * note at the top of `src/kernel/spawn.ts`. Keeping it in the one file that
 * only ever runs in a browser is what lets all of `src/ui/` stay testable.
 */

import { CORE_LAYER } from './core/index.js';
import { INPUT_LAYER } from './input/index.js';
import { IO_LAYER } from './io/index.js';
import { KERNEL_LAYER } from './kernel/index.js';
import { spawnKernel } from './kernel/spawn.js';
import { RENDER_LAYER } from './render/index.js';
import { UI_LAYER, mountApp } from './ui/index.js';
import './ui/styles.css';
import { XR_LAYER } from './xr/index.js';

/** Every architectural layer, in dependency order: inner layers first. */
export const LAYERS = [
  CORE_LAYER,
  KERNEL_LAYER,
  IO_LAYER,
  RENDER_LAYER,
  INPUT_LAYER,
  UI_LAYER,
  XR_LAYER,
] as const;

document.documentElement.dataset['carveBoot'] = LAYERS.join(',');

const host = document.querySelector<HTMLElement>('#app');
if (!host) throw new Error('index.html is missing its #app host element');

mountApp({ host, kernel: spawnKernel() });

/**
 * Set only after the app mounted without throwing.
 *
 * A smoke test asserting that "the page loads" is worth very little if it
 * passes on a blank canvas. This is the flag worth asserting on: it means the
 * toolbar, the panels, the canvas and the kernel worker are all up. #16b's
 * Playwright check is its intended consumer.
 */
document.documentElement.dataset['carveReady'] = 'true';
