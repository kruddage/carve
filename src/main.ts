/**
 * Application entry point, loaded by the root index.html.
 *
 * There is no application yet — issue #9 is what replaces the coming-soon
 * landing page with the modeler. Until then this module deliberately renders
 * nothing and only records that it ran.
 *
 * That marker is not decoration. The most likely way this project breaks on a
 * Quest is a wrong `base` in vite.config.ts: the page renders (it is static
 * HTML), the bundle 404s, and from inside a headset that looks identical to
 * everything working. `document.documentElement.dataset.carveBoot` is present
 * only if this module actually loaded and executed — so `chrome://inspect` or
 * the probe page can tell those two states apart.
 */

import { CORE_LAYER } from './core/index.js';
import { INPUT_LAYER } from './input/index.js';
import { IO_LAYER } from './io/index.js';
import { KERNEL_LAYER } from './kernel/index.js';
import { RENDER_LAYER } from './render/index.js';
import { UI_LAYER } from './ui/index.js';
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
