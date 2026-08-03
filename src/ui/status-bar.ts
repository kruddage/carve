/**
 * The line along the bottom: what is selected, what the last edit was, what the
 * kernel said about it, and — when the overlay is on — how fast any of it is
 * running.
 *
 * ## Why the performance readout is here and not in #15
 *
 * #15 owns the *budget*: the numbers to hold, the benchmark scene, the headless
 * assertion in CI. It does not own the display, and #10 explicitly moves the
 * instrumentation overlay earlier because "#11's 'frame rate holds while
 * dragging' and #13's 'measured in stereo' are unevaluable without it". The
 * desktop half of that same overlay is unevaluable without a desktop viewport,
 * which is this issue. So the readout lands here, reading `RendererStats`,
 * which #4 already exposes for exactly this; the budget it should be compared
 * against is still #15's to set.
 *
 * ## Kernel warnings are status, not errors
 *
 * `src/kernel/protocol.ts` is emphatic that a degenerate boolean is something a
 * user does on the way to something valid: an intersection of two solids that
 * do not touch is empty, and throwing or opening a dialog would interrupt an
 * edit in progress. So warnings surface here, attributed to the node, and
 * nowhere louder.
 */

import type { CarveDocument } from '../core/index.js';
import type { KernelWarning } from '../kernel/index.js';
import type { RendererStats } from '../render/index.js';

import { clear, el } from './dom.js';
import type { ViewState } from './view-state.js';

export interface StatusBarOptions {
  readonly document: CarveDocument;
  readonly view: ViewState;
  readonly stats: () => RendererStats;
}

export interface StatusBar {
  readonly element: HTMLElement;
  /** Left-hand text: what just happened. Cleared by the next document change. */
  setMessage(message: string, tone?: 'info' | 'warn'): void;
  setWarnings(warnings: readonly KernelWarning[]): void;
  render(): void;
  dispose(): void;
}

/** How often the performance readout updates. Per frame would be unreadable. */
const STATS_INTERVAL_MS = 250;

export function createStatusBar(options: StatusBarOptions): StatusBar {
  const { document: doc, view } = options;

  const message = el('span', { class: 'carve-status-message' });
  const warningsNode = el('span', { class: 'carve-status-warnings' });
  const selectionNode = el('span', { class: 'carve-status-selection' });
  const statsNode = el('span', { class: 'carve-status-stats' });

  const element = el('footer', { class: 'carve-status', attrs: { role: 'status' } }, [
    message,
    warningsNode,
    el('span', { class: 'carve-status-spacer' }),
    selectionNode,
    statsNode,
  ]);

  let warnings: readonly KernelWarning[] = [];
  let lastStats = 0;
  /** Rolling mean, because a single frame's time on a laptop is mostly noise. */
  let smoothedFrameMs = 0;

  function setMessage(text: string, tone: 'info' | 'warn' = 'info'): void {
    message.textContent = text;
    message.classList.toggle('is-warn', tone === 'warn');
  }

  function setWarnings(next: readonly KernelWarning[]): void {
    warnings = next;
    renderWarnings();
  }

  function renderWarnings(): void {
    clear(warningsNode);
    if (warnings.length === 0) return;
    const first = warnings[0];
    if (!first) return;
    const name = doc.get(first.nodeId)?.name ?? 'a node';
    warningsNode.appendChild(
      el('span', {
        class: 'carve-warning',
        text:
          warnings.length === 1
            ? `${name}: ${first.message}`
            : `${name}: ${first.message} (+${warnings.length - 1} more)`,
        title: warnings.map((warning) => `${warning.code}: ${warning.message}`).join('\n'),
      }),
    );
  }

  function render(): void {
    const selection = doc.selection;
    selectionNode.textContent =
      selection.length === 0
        ? `${doc.size - 1} nodes`
        : selection.length === 1
          ? (doc.get(selection[0] ?? '')?.name ?? '')
          : `${selection.length} selected`;
    renderWarnings();
    renderStats(true);
  }

  function renderStats(force = false): void {
    if (!view.showStats) {
      statsNode.textContent = '';
      return;
    }
    const now = performance.now();
    if (!force && now - lastStats < STATS_INTERVAL_MS) return;
    lastStats = now;

    const stats = options.stats();
    // Exponential mean with a short memory: responsive enough to show a stall,
    // steady enough that the number is readable.
    smoothedFrameMs =
      smoothedFrameMs === 0 ? stats.frameTimeMs : smoothedFrameMs * 0.8 + stats.frameTimeMs * 0.2;
    const fps = smoothedFrameMs > 0 ? Math.round(1000 / smoothedFrameMs) : 0;
    statsNode.textContent = `${fps} fps · ${smoothedFrameMs.toFixed(1)} ms · ${stats.triangleCount.toLocaleString()} tris · queue ${stats.evaluationQueueDepth}`;
  }

  // Driven by its own timer rather than by the frame loop: the readout updates
  // four times a second, and hanging it off `requestAnimationFrame` would put a
  // DOM write on the frame path to change a number nobody can read that fast.
  const timer = setInterval(() => renderStats(), STATS_INTERVAL_MS);

  render();
  return {
    element,
    setMessage,
    setWarnings,
    render,
    dispose: () => clearInterval(timer),
  };
}
