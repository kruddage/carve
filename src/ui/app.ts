/**
 * The desktop app: one document, one kernel, one viewport, four panels.
 *
 * This is the composition root and deliberately the only file in `src/ui/` that
 * knows all of them exist. Everything else here takes what it needs as options
 * — which is why the outliner can be tested against a document with no
 * renderer, and the gizmo against a ray with no canvas.
 *
 * ## What "one command path" means in practice
 *
 * Every structural edit is an `action` intent through one `IntentRouter`: the
 * toolbar's buttons, the keyboard shortcuts, and later #12's wrist menu. Not
 * because indirection is virtuous, but because the router is where a boolean's
 * operand order, a delete's ancestor filtering and a spawn's select-after are
 * decided, and a second path would decide them again and differently.
 *
 * The exceptions are edits with no headset equivalent — a rename, an outliner
 * reparent, an inspector parameter — which go through `dispatch` as plain
 * commands. They are still commands, so undo covers them; they are just not
 * intents, because no gesture produces them and adding union members no adapter
 * emits would weaken the vocabulary rather than strengthen it.
 *
 * ## One document, for the app's lifetime
 *
 * Opening a file loads *into* the existing document rather than replacing the
 * object — see `load.ts`. Everything downstream therefore subscribes once and
 * never has to be re-wired, which removes the entire class of bug where one
 * panel is still watching the document from two files ago.
 *
 * ## The evaluation loop
 *
 * A document change submits `visibleBundle(doc.bundle(), hidden)` to the kernel
 * and returns. The result arrives whenever it arrives and the renderer uploads
 * it then. Nothing awaits it, nothing blocks on it, and during a drag most
 * requests are superseded before they run — which is the design, not a
 * shortcoming. See `src/kernel/index.ts`.
 */

import {
  CarveDocument,
  makeTrs,
  vec3,
  type BooleanOp,
  type Command,
  type Gesture,
  type NodeId,
  type PrimitiveKind,
} from '../core/index.js';
import {
  Autosave,
  CARVE_ACCEPT,
  DEFAULT_DOCUMENT_NAME,
  attachDocumentDropTarget,
  downloadFile,
  encodeDocument,
  exportMesh,
  flushOnHide,
  openDocumentFile,
  openDocumentStore,
  recoverLatest,
  type ExportFormat,
} from '../io/index.js';
import { IntentRouter, action, snapToGrid, type Aabb } from '../input/index.js';
import type { KernelClient, MeshPayload } from '../kernel/index.js';
import type { Bounds } from '../render/index.js';

import { el } from './dom.js';
import { createHelpOverlay } from './help-overlay.js';
import { createInspector } from './inspector.js';
import { loadInto } from './load.js';
import { createOutliner } from './outliner.js';
import { topLevelIds } from './outliner-model.js';
import {
  PrimitiveBoundsCache,
  buildPickTargets,
  buildSnapField,
  documentBounds,
  localBounds,
  worldBounds,
} from './scene-bounds.js';
import { visibleBundle } from './scene-bundle.js';
import { resolveShortcut, type ShortcutId } from './shortcuts.js';
import { createStatusBar } from './status-bar.js';
import { createToolbar } from './toolbar.js';
import { ViewState } from './view-state.js';
import { createViewport } from './viewport.js';

/** The channel a drag ghost is evaluated on. Never the viewport's. */
const GHOST_CHANNEL = 'ghost';

/** Grid step a spawn position is quantized to, metres. Matches `DEFAULT_SNAP_SETTINGS`. */
const SPAWN_GRID = 0.001;

/**
 * The working volume the camera is framed on when there is nothing to frame.
 *
 * 300mm across, centred on the world origin. Two decisions in one constant:
 *
 * `CameraRig`'s own default is a 5m radius, which is the right neutral answer
 * for a renderer that does not know what it will be asked to draw and the wrong
 * one here — the registry spawns 60mm parts, so an empty document opened at 5m
 * puts the first box six pixels across in a screen full of ground grid. The
 * renderer should not know that primitives are 60mm; this layer does, so the
 * number goes here.
 *
 * And it is centred on the origin rather than sitting above the floor because
 * `spawn` places new parts at the camera's orbit target. Every solid is centred
 * on its own origin (see the note in `src/core/primitives.ts`), so a first part
 * spawned at the origin straddles the grid — which reads as "that plane is the
 * floor" — while an off-floor target would leave it hanging at an arbitrary
 * height nobody chose.
 */
const DEFAULT_VIEW: Bounds = { min: [-0.15, -0.15, -0.15], max: [0.15, 0.15, 0.15] };

export interface AppOptions {
  /** Where the app mounts. Emptied first. */
  readonly host: HTMLElement;
  /**
   * The kernel. Injected rather than spawned here so this module has no
   * Vite-specific `?worker` import — the same reason `src/kernel/spawn.ts` is
   * not re-exported from its own layer's barrel. `main.ts` does the spawning.
   */
  readonly kernel: KernelClient;
  /** Skip autosave and crash recovery. For a preview build, and for a smoke test. */
  readonly persistence?: boolean;
}

export interface CarveApp {
  readonly document: CarveDocument;
  dispose(): void;
}

export function mountApp(options: AppOptions): CarveApp {
  const { host, kernel } = options;
  host.replaceChildren();

  const doc = CarveDocument.create();
  const view = new ViewState();
  const router = new IntentRouter({ document: doc });
  const bounds = new PrimitiveBoundsCache((spec, requestOptions) =>
    kernel.requestPreview(spec, requestOptions),
  );

  let autosave: Autosave | null = null;
  /** Outstanding viewport evaluations, for the stats overlay's queue depth. */
  let inFlight = 0;
  /** Set by the first spawn into an empty document; consumed by `bounds.onChange`. */
  let frameOnNextBounds = false;

  // --- Layout ---------------------------------------------------------------
  //
  // Order matters once: the viewport is built before the status bar, because
  // the bar reads `RendererStats` off it. Everything else is wired through
  // closures and is order-independent.

  const viewportHost = el('div', { class: 'carve-viewport' });
  const help = createHelpOverlay(() => view.setShowHelp(false));

  const outliner = createOutliner({
    document: doc,
    view,
    onSelect: (nodeId, additive) => select(nodeId, additive),
    onCommand: (command) => dispatch(command),
  });

  const inspector = createInspector({
    document: doc,
    onCommand: (command) => dispatch(command),
    beginGesture: (name) => beginGesture(name),
  });

  const toolbar = createToolbar({
    document: doc,
    view,
    actions: {
      spawn: (kind) => spawn(kind),
      applyBoolean: (op) => applyBoolean(op),
      undo: () => run('undo'),
      redo: () => run('redo'),
      deleteSelection: () => run('delete'),
      setView: (standard) => viewport.setView(standard),
      frameSelection: () => frameSelection(),
      newDocument: () => newDocument(),
      open: () => void openFile(),
      save: () => save(),
      exportAs: (format) => void exportAs(format),
      toggleHelp: () => view.setShowHelp(!view.showHelp),
    },
  });

  host.append(
    toolbar.element,
    el('div', { class: 'carve-body' }, [outliner.element, viewportHost, inspector.element]),
  );

  const viewport = createViewport(viewportHost, {
    document: doc,
    router,
    view,
    boundsOf: (nodeId) => localBounds(doc, nodeId, bounds.lookup),
    targets: () => buildPickTargets(doc, bounds.lookup, { hidden: view.hidden }),
    requestGhost: (nodeId) => requestGhost(nodeId),
  });

  const statusBar = createStatusBar({
    document: doc,
    view,
    stats: () => viewport.renderer.stats,
  });

  host.append(statusBar.element, help.element);

  // --- Subscriptions --------------------------------------------------------

  const unsubscribeDocument = doc.subscribe((change) => {
    view.prune((id) => doc.has(id));
    refreshSnapField();
    void evaluate();
    renderPanels();
    // A drag emits one of these per frame; announcing each would make the
    // status line a strobe. The commit that follows says it once.
    if (change.gesturePhase !== 'update') {
      statusBar.setMessage(labelFor(change.source, change.label));
    }
  });

  const unsubscribeSelection = doc.subscribeSelection(() => renderPanels());

  const unsubscribeBounds = bounds.onChange(() => {
    refreshSnapField();
    viewport.refresh();
    if (!frameOnNextBounds) return;
    frameOnNextBounds = false;
    frameSelection();
  });

  const unsubscribeView = view.subscribe(() => {
    // Hiding a node changes the bundle that gets evaluated, so this is not
    // only a repaint — see `scene-bundle.ts`.
    void evaluate();
    renderPanels();
  });

  const unsubscribeMeshes = kernel.subscribe((evaluated) => {
    viewport.renderer.upload(evaluated.mesh);
    statusBar.setWarnings(evaluated.warnings);
  });

  function renderPanels(): void {
    outliner.render();
    inspector.render();
    toolbar.render();
    statusBar.render();
    viewport.refresh();
    help.setVisible(view.showHelp);
  }

  function refreshSnapField(): void {
    router.setSnapField(buildSnapField(doc, bounds.lookup, { hidden: view.hidden }));
  }

  // --- Kernel ---------------------------------------------------------------

  async function evaluate(): Promise<void> {
    inFlight += 1;
    viewport.renderer.setEvaluationQueueDepth(inFlight);
    try {
      await kernel.request(visibleBundle(doc.bundle(), view.hidden));
    } catch (error) {
      statusBar.setMessage(`The kernel failed: ${messageOf(error)}`, 'warn');
    } finally {
      inFlight -= 1;
      viewport.renderer.setEvaluationQueueDepth(inFlight);
    }
  }

  async function requestGhost(nodeId: NodeId): Promise<MeshPayload | null> {
    try {
      const evaluated = await kernel.request(doc.bundle(nodeId), { channel: GHOST_CHANNEL });
      return evaluated?.mesh ?? null;
    } catch {
      // No ghost is a degraded drag, not a failed one: the solid still catches
      // up from the main channel.
      return null;
    }
  }

  // --- Editing --------------------------------------------------------------

  function select(nodeId: NodeId | null, additive: boolean): void {
    if (nodeId === null) {
      doc.clearSelection();
      return;
    }
    if (!additive) {
      doc.setSelection([nodeId]);
      return;
    }
    doc.setSelection(
      doc.isSelected(nodeId)
        ? doc.selection.filter((id) => id !== nodeId)
        : [...doc.selection, nodeId],
    );
  }

  function dispatch(command: Command): void {
    try {
      doc.dispatch(command);
    } catch (error) {
      statusBar.setMessage(messageOf(error), 'warn');
    }
  }

  function beginGesture(name: string): Gesture | null {
    try {
      return doc.beginGesture(name);
    } catch {
      // Something else is mid-drag. Refusing is right: the document forbids
      // overlapping gestures, and the caller falls back to doing nothing.
      return null;
    }
  }

  /** Route an action intent and turn any refusal into a sentence. */
  function run(name: 'undo' | 'redo' | 'delete'): void {
    const outcome = router.handle(action({ name }));
    if (outcome.status === 'rejected') statusBar.setMessage(rejectionText(outcome.reason), 'warn');
  }

  /**
   * Spawn at the camera's orbit target, snapped to the grid.
   *
   * Not at the world origin: after the first solid, every subsequent spawn
   * would land inside the last one and have to be dragged out before it could
   * be seen. The orbit target is where the user is looking, which is where they
   * expect a new part to appear.
   */
  function spawn(kind: PrimitiveKind): void {
    const wasEmpty = topLevelIds(doc).length === 0;
    const target = viewport.renderer.camera.target;
    const at = snapToGrid(vec3(target[0], target[1], target[2]), SPAWN_GRID);
    const outcome = router.handle(
      action({ name: 'spawn-primitive', primitive: kind, transform: makeTrs({ translation: at }) }),
    );
    if (outcome.status === 'rejected') {
      statusBar.setMessage(rejectionText(outcome.reason), 'warn');
      return;
    }
    // The first solid in an empty document gets framed. Deferred to a
    // microtask because the bounds it needs come from the kernel, and the
    // cache's own change notification is what actually has them — framing
    // synchronously here would frame nothing and leave the camera where it was.
    if (wasEmpty) frameOnNextBounds = true;
  }

  function applyBoolean(op: BooleanOp): void {
    const outcome = router.handle(action({ name: 'apply-boolean', op }));
    if (outcome.status === 'rejected') statusBar.setMessage(rejectionText(outcome.reason), 'warn');
  }

  /**
   * Frame the selection, or the whole document, or the default working volume.
   *
   * Falling back to `DEFAULT_VIEW` rather than to `null` matters more than it
   * looks: `frame(null)` resets to the rig's 5m default, so framing an empty
   * document — or one whose bounds have not come back from the kernel yet —
   * would zoom *out* to a view with nothing usable in it.
   */
  function frameSelection(): void {
    const ids = doc.selection.length > 0 ? doc.selection : topLevelIds(doc);
    const box = worldBounds(doc, ids, bounds.lookup) ?? documentBounds(doc, bounds.lookup);
    viewport.frame(toRenderBounds(box) ?? DEFAULT_VIEW);
  }

  // --- Files ----------------------------------------------------------------

  function documentName(): string {
    return doc.get(doc.rootId)?.name ?? DEFAULT_DOCUMENT_NAME;
  }

  function newDocument(): void {
    loadInto(doc, CarveDocument.create());
    viewport.frame(DEFAULT_VIEW);
    renderPanels();
    statusBar.setMessage('New document.');
  }

  function save(): void {
    downloadFile(encodeDocument(doc, documentName()));
    statusBar.setMessage('Saved.');
  }

  function adopt(source: CarveDocument, what: string): void {
    loadInto(doc, source);
    renderPanels();
    frameSelection();
    statusBar.setMessage(`Opened ${what}.`);
  }

  /**
   * The file picker.
   *
   * A hidden `<input type="file">` rather than the File System Access API,
   * which Firefox and Safari do not implement — and #9's last done-when names
   * all three browsers.
   */
  async function openFile(): Promise<void> {
    const input = el('input', { attrs: { type: 'file', accept: CARVE_ACCEPT, hidden: 'hidden' } });
    host.appendChild(input);
    const picked = await new Promise<File | null>((resolve) => {
      input.addEventListener('change', () => resolve(input.files?.item(0) ?? null));
      // A cancelled picker fires no event anywhere; the window regaining focus
      // is the only signal, and it is good enough for a promise nothing blocks
      // on. The delay lets a real `change` win the race.
      window.addEventListener('focus', () => setTimeout(() => resolve(null), 400), { once: true });
      input.click();
    });
    input.remove();
    if (!picked) return;

    try {
      adopt(await openDocumentFile(picked), picked.name);
    } catch (error) {
      statusBar.setMessage(`Could not open that file: ${messageOf(error)}`, 'warn');
    }
  }

  async function exportAs(format: ExportFormat): Promise<void> {
    statusBar.setMessage(`Exporting ${format.toUpperCase()}…`);
    try {
      // `roots: selection` means "selected only", and an empty selection means
      // the whole document — `exportMesh` documents that, so nothing here has
      // to branch on it.
      const file = await exportMesh(kernel, doc, {
        format,
        roots: doc.selection,
        name: documentName(),
      });
      downloadFile(file);
      statusBar.setMessage(
        file.warnings.length > 0
          ? `Exported ${file.fileName} with ${file.warnings.length} warning(s).`
          : `Exported ${file.fileName} — ${file.triangles.toLocaleString()} triangles.`,
        file.warnings.length > 0 ? 'warn' : 'info',
      );
    } catch (error) {
      statusBar.setMessage(`Export failed: ${messageOf(error)}`, 'warn');
    }
  }

  const detachDropTarget = attachDocumentDropTarget(host, {
    onDocument: (opened, file) => adopt(opened, file.name),
    onError: (error) =>
      statusBar.setMessage(`Could not open that file: ${messageOf(error)}`, 'warn'),
    onDragStateChange: (dragging) => host.classList.toggle('is-drop-target', dragging),
  });

  // --- Keyboard -------------------------------------------------------------

  function onKeyDown(event: KeyboardEvent): void {
    const shortcut = resolveShortcut({
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      target: event.target,
    });
    if (shortcut === null) return;
    event.preventDefault();
    perform(shortcut);
  }

  /** Exhaustive by design: a new `ShortcutId` fails the typecheck here. */
  function perform(shortcut: ShortcutId): void {
    switch (shortcut) {
      case 'undo':
      case 'redo':
      case 'delete':
        run(shortcut);
        return;
      case 'select-all':
        doc.setSelection(topLevelIds(doc));
        return;
      case 'deselect':
        doc.clearSelection();
        return;
      case 'mode-translate':
        view.setGizmoMode('translate');
        return;
      case 'mode-rotate':
        view.setGizmoMode('rotate');
        return;
      case 'mode-scale':
        view.setGizmoMode('scale');
        return;
      case 'toggle-space':
        view.toggleSpace();
        return;
      case 'toggle-snapping':
        view.setSnapping(!view.snapping);
        return;
      case 'toggle-grid':
        view.setShowGrid(!view.showGrid);
        return;
      case 'toggle-stats':
        view.setShowStats(!view.showStats);
        return;
      case 'toggle-help':
        view.setShowHelp(!view.showHelp);
        return;
      case 'view-front':
        viewport.setView('front');
        return;
      case 'view-top':
        viewport.setView('top');
        return;
      case 'view-right':
        viewport.setView('right');
        return;
      case 'view-home':
        viewport.setView('home');
        return;
      case 'frame-selection':
        frameSelection();
        return;
      case 'frame-all':
        viewport.frame(toRenderBounds(documentBounds(doc, bounds.lookup)) ?? DEFAULT_VIEW);
        return;
      case 'boolean-union':
        applyBoolean('union');
        return;
      case 'boolean-subtract':
        applyBoolean('subtract');
        return;
      case 'boolean-intersect':
        applyBoolean('intersect');
        return;
      case 'hide-selection':
        for (const nodeId of doc.selection) view.setHidden(nodeId, true);
        return;
      case 'show-all':
        for (const nodeId of [...view.hidden]) view.setHidden(nodeId, false);
        return;
      case 'save':
        save();
        return;
      case 'open':
        void openFile();
        return;
      case 'cancel':
        if (view.showHelp) view.setShowHelp(false);
        else viewport.cancelDrag();
        return;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // --- Startup --------------------------------------------------------------

  refreshSnapField();
  renderPanels();
  viewport.frame(DEFAULT_VIEW);
  void evaluate();

  let detachFlush: (() => void) | null = null;

  if (options.persistence !== false) {
    void openDocumentStore().then(async (opened) => {
      if (!opened.persistent && opened.reason) statusBar.setMessage(opened.reason, 'warn');

      const recovered = await recoverLatest(opened.store);
      // Only offer recovery into an untouched document. Replacing work already
      // in progress with a session from yesterday is a data-loss bug wearing a
      // friendly label.
      if (recovered && doc.size <= 1 && doc.undoDepth === 0) {
        adopt(recovered.document, `"${recovered.record.name}" from autosave`);
      }

      autosave = Autosave.attach(doc, opened.store, {
        onError: (error) => statusBar.setMessage(`Autosave failed: ${messageOf(error)}`, 'warn'),
      });
      detachFlush = flushOnHide(() => void autosave?.flush());
    });
  }

  return {
    document: doc,
    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      detachDropTarget();
      detachFlush?.();
      unsubscribeDocument();
      unsubscribeSelection();
      unsubscribeBounds();
      unsubscribeView();
      unsubscribeMeshes();
      autosave?.stop();
      statusBar.dispose();
      viewport.dispose();
      host.replaceChildren();
    },
  };
}

/** `Aabb` (input) → `Bounds` (render). Identical shapes, different layers. */
function toRenderBounds(box: Aabb | null): Bounds | null {
  return box === null ? null : { min: box.min, max: box.max };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** What the status line says after a change, so undo and redo are visible. */
function labelFor(source: string, label: string): string {
  if (source === 'undo') return `Undid ${label.toLowerCase()}.`;
  if (source === 'redo') return `Redid ${label.toLowerCase()}.`;
  return `${label}.`;
}

/**
 * A router rejection as a sentence.
 *
 * The reasons in `REJECTION_REASONS` are identifiers meant for code; showing
 * `needs-two-operands` in a status bar is showing someone an enum.
 */
function rejectionText(reason: string | undefined): string {
  switch (reason) {
    case 'needs-two-operands':
      return 'Select at least two solids to boolean them.';
    case 'nothing-selected':
      return 'Nothing is selected.';
    case 'nothing-to-undo':
      return 'Nothing to undo.';
    case 'nothing-to-redo':
      return 'Nothing to redo.';
    case 'cannot-delete-root':
      return 'The document root cannot be deleted.';
    case 'gesture-open':
      return 'Finish the drag first.';
    case 'no-transform-target':
      return 'That node has no transform to move. Move its parent instead.';
    case 'already-transforming':
      return 'Something is already being dragged.';
    case 'degenerate-transform':
      return 'That node has a zero scale somewhere above it and cannot be moved.';
    case 'unknown-node':
      return 'That node is gone.';
    default:
      return `That did not work (${reason ?? 'unknown'}).`;
  }
}
