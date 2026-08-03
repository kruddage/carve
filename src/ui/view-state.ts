/**
 * Everything the desktop UI remembers that is *not* the document.
 *
 * Issue #9 asks for this explicitly — "do not let panel state leak into the
 * document model; view state and document state serialize separately" — and the
 * reason is sharper than tidiness. `CarveDocument` is the thing both frontends
 * share and the thing that goes in a `.carve` file. A collapsed outliner row or
 * a gizmo left in rotate mode has no meaning in a headset and no business in a
 * file, and the moment either one is stored on a node, opening a document on
 * the Quest starts restoring somebody's laptop panel layout.
 *
 * So this object holds it instead. It is observable the same way the document
 * is — subscribe, get told, re-render — because the outliner, the toolbar and
 * the viewport all read the same flags and must not disagree about them.
 *
 * ## Hidden nodes are view state that changes what is drawn
 *
 * That looks like a contradiction and is not. Hiding a node does not edit the
 * tree; it changes which subtree is submitted for evaluation, via
 * `visibleBundle` in `scene-bundle.ts`. Undo does not restore visibility,
 * saving does not record it, and a document opened in the headset shows
 * everything — all three of which are what you want, and none of which are true
 * if `visible` becomes a field on `CarveNode`.
 */

import type { NodeId } from '../core/index.js';
import type { TransformMode } from '../input/index.js';

/**
 * Which space a gizmo drag runs in.
 *
 * `world` moves along the world axes; `local` moves along the selected node's
 * own. Not a document property — the same node dragged from the headset has no
 * gizmo at all — and not a per-node one either: it is a modal preference, and
 * every CAD tool treats it that way.
 */
export const TRANSFORM_SPACES = ['world', 'local'] as const;
export type TransformSpace = (typeof TRANSFORM_SPACES)[number];

/** The gizmo modes a desktop drag can be in. Grab is XR-only; a mouse picks one axis set. */
export const GIZMO_MODES = ['translate', 'rotate', 'scale'] as const;
export type GizmoMode = (typeof GIZMO_MODES)[number];

/** `GizmoMode` widened to what the intent vocabulary calls it. Identical by construction. */
export function transformModeOf(mode: GizmoMode): TransformMode {
  return mode;
}

export type ViewStateListener = () => void;

export interface ViewStateSnapshot {
  readonly gizmoMode: GizmoMode;
  readonly space: TransformSpace;
  readonly snapping: boolean;
  readonly showGrid: boolean;
  readonly showStats: boolean;
  readonly showHelp: boolean;
  readonly hidden: ReadonlySet<NodeId>;
  readonly collapsed: ReadonlySet<NodeId>;
}

/**
 * Mutable view state with one change signal.
 *
 * One signal rather than one per field: every consumer of this object re-reads
 * all of it anyway (the toolbar draws six toggles, the outliner draws every
 * row), and granular events here would buy nothing but a way for two panels to
 * be out of step. The document's change events *are* granular, for the opposite
 * reason — see the note in `src/core/document.ts`.
 */
export class ViewState {
  #gizmoMode: GizmoMode = 'translate';
  #space: TransformSpace = 'world';
  #snapping = true;
  #showGrid = true;
  #showStats = false;
  #showHelp = false;
  readonly #hidden = new Set<NodeId>();
  /** Collapsed rather than expanded, so a freshly loaded tree is open by default. */
  readonly #collapsed = new Set<NodeId>();
  readonly #listeners = new Set<ViewStateListener>();

  subscribe(listener: ViewStateListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  snapshot(): ViewStateSnapshot {
    return {
      gizmoMode: this.#gizmoMode,
      space: this.#space,
      snapping: this.#snapping,
      showGrid: this.#showGrid,
      showStats: this.#showStats,
      showHelp: this.#showHelp,
      hidden: this.#hidden,
      collapsed: this.#collapsed,
    };
  }

  get gizmoMode(): GizmoMode {
    return this.#gizmoMode;
  }

  setGizmoMode(mode: GizmoMode): void {
    if (this.#gizmoMode === mode) return;
    this.#gizmoMode = mode;
    this.#emit();
  }

  get space(): TransformSpace {
    return this.#space;
  }

  setSpace(space: TransformSpace): void {
    if (this.#space === space) return;
    this.#space = space;
    this.#emit();
  }

  toggleSpace(): void {
    this.setSpace(this.#space === 'world' ? 'local' : 'world');
  }

  get snapping(): boolean {
    return this.#snapping;
  }

  setSnapping(on: boolean): void {
    if (this.#snapping === on) return;
    this.#snapping = on;
    this.#emit();
  }

  get showGrid(): boolean {
    return this.#showGrid;
  }

  setShowGrid(on: boolean): void {
    if (this.#showGrid === on) return;
    this.#showGrid = on;
    this.#emit();
  }

  get showStats(): boolean {
    return this.#showStats;
  }

  setShowStats(on: boolean): void {
    if (this.#showStats === on) return;
    this.#showStats = on;
    this.#emit();
  }

  get showHelp(): boolean {
    return this.#showHelp;
  }

  setShowHelp(on: boolean): void {
    if (this.#showHelp === on) return;
    this.#showHelp = on;
    this.#emit();
  }

  // --- Visibility -----------------------------------------------------------

  get hidden(): ReadonlySet<NodeId> {
    return this.#hidden;
  }

  isHidden(id: NodeId): boolean {
    return this.#hidden.has(id);
  }

  setHidden(id: NodeId, hidden: boolean): void {
    const changed = hidden ? !this.#hidden.has(id) : this.#hidden.delete(id);
    if (hidden) this.#hidden.add(id);
    if (changed) this.#emit();
  }

  toggleHidden(id: NodeId): void {
    this.setHidden(id, !this.#hidden.has(id));
  }

  // --- Expansion ------------------------------------------------------------

  isCollapsed(id: NodeId): boolean {
    return this.#collapsed.has(id);
  }

  setCollapsed(id: NodeId, collapsed: boolean): void {
    const changed = collapsed ? !this.#collapsed.has(id) : this.#collapsed.delete(id);
    if (collapsed) this.#collapsed.add(id);
    if (changed) this.#emit();
  }

  toggleCollapsed(id: NodeId): void {
    this.setCollapsed(id, !this.#collapsed.has(id));
  }

  /**
   * Drop state for nodes that no longer exist.
   *
   * Called after a document change. Without it, deleting a hidden node and
   * undoing the delete brings it back invisible — the id survived in this set
   * and nothing ever cleared it. Same shape as `CarveDocument`'s selection
   * pruning, and for the same reason.
   */
  prune(exists: (id: NodeId) => boolean): void {
    let changed = false;
    for (const set of [this.#hidden, this.#collapsed]) {
      for (const id of [...set]) {
        if (exists(id)) continue;
        set.delete(id);
        changed = true;
      }
    }
    if (changed) this.#emit();
  }

  #emit(): void {
    for (const listener of this.#listeners) listener();
  }
}
