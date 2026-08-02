/**
 * The DOM edge, driven through its injected seams.
 *
 * `src/io/browser.ts` is small and every line of it is a place a save button
 * silently stops working: an anchor that is never attached, an object URL that
 * is never revoked (a multi-megabyte leak per export), a `dragover` that is not
 * cancelled — which navigates the page away from the app and takes the user's
 * unsaved work with it.
 *
 * None of that needs a browser to check. The seams are the two or three DOM
 * objects each function actually touches, so the fakes below are a few dozen
 * lines and assert the sequence rather than simulating a renderer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CARVE_ACCEPT,
  attachDocumentDropTarget,
  downloadFile,
  encodeDocumentFile,
  flushOnHide,
  openDocumentFile,
  type BrowserEnv,
  type ExportedFile,
} from '../src/io/index.js';

import { bracketDocument } from './support/document-fixture.js';

interface FakeAnchor {
  href: string;
  download: string;
  clicked: number;
  attached: boolean;
  removed: boolean;
}

function fakeEnv(): { env: BrowserEnv; anchor: FakeAnchor; revoked: string[]; blobs: Blob[] } {
  const anchor: FakeAnchor = {
    href: '',
    download: '',
    clicked: 0,
    attached: false,
    removed: false,
  };
  const revoked: string[] = [];
  const blobs: Blob[] = [];

  const element = {
    ...anchor,
    click(): void {
      // The order matters: a detached anchor's click is ignored by Firefox.
      expect(element.attached).toBe(true);
      element.clicked += 1;
      anchor.clicked += 1;
    },
    remove(): void {
      element.removed = true;
      anchor.removed = true;
    },
  };
  // Kept in sync so assertions can read the plain record.
  const proxy = new Proxy(element, {
    set(target, key, value: unknown) {
      Reflect.set(target, key, value);
      Reflect.set(anchor, key, value);
      return true;
    },
  });

  const env: BrowserEnv = {
    document: {
      createElement: (() => proxy) as unknown as Document['createElement'],
      body: {
        appendChild: ((node: unknown) => {
          expect(node).toBe(proxy);
          element.attached = true;
          anchor.attached = true;
          return node;
        }) as unknown as HTMLElement['appendChild'],
      } as unknown as HTMLElement,
    },
    url: {
      createObjectURL: (blob: Blob) => {
        blobs.push(blob);
        return `blob:carve/${blobs.length}`;
      },
      revokeObjectURL: (url: string) => {
        revoked.push(url);
      },
    },
    blob: Blob,
  };

  return { env, anchor, revoked, blobs };
}

function file(bytes = new Uint8Array([1, 2, 3]).buffer): ExportedFile {
  return {
    fileName: 'bracket.stl',
    mimeType: 'model/stl',
    bytes,
    warnings: [],
    triangles: 1,
  };
}

describe('downloading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks an attached anchor carrying the filename', () => {
    const { env, anchor } = fakeEnv();

    downloadFile(file(), env);

    expect(anchor.download).toBe('bracket.stl');
    expect(anchor.href).toMatch(/^blob:/);
    expect(anchor.clicked).toBe(1);
    expect(anchor.removed).toBe(true);
  });

  it('wraps the bytes in a blob of the declared media type', () => {
    const { env, blobs } = fakeEnv();

    downloadFile(file(), env);

    expect(blobs).toHaveLength(1);
    expect(blobs[0]?.type).toBe('model/stl');
    expect(blobs[0]?.size).toBe(3);
  });

  it('revokes the object URL a task later, not synchronously', () => {
    const { env, revoked, anchor } = fakeEnv();

    downloadFile(file(), env);

    // Revoking before the browser has read the URL fails the download
    // intermittently in Safari — see the note in src/io/browser.ts.
    expect(revoked).toEqual([]);
    vi.runAllTimers();
    expect(revoked).toEqual([anchor.href]);
  });
});

describe('opening', () => {
  it('reads a dropped or picked file as a document', async () => {
    const { document } = bracketDocument();
    const blob = new Blob([encodeDocumentFile(document)], { type: 'application/vnd.carve+json' });

    const opened = await openDocumentFile(blob);

    expect(opened.size).toBe(document.size);
  });

  it('rejects a file that is not a document', async () => {
    await expect(openDocumentFile(new Blob(['nope']))).rejects.toThrow(/Not valid JSON/);
  });

  it('offers an accept list a file input can use', () => {
    expect(CARVE_ACCEPT).toContain('.carve');
  });
});

// --- Drag and drop ----------------------------------------------------------

type Listener = (event: unknown) => void;

/** An element that records its listeners, so a test can fire one by name. */
function fakeElement(): {
  element: HTMLElement;
  fire: (type: string, event: Record<string, unknown>) => void;
  listenerCount: () => number;
} {
  const listeners = new Map<string, Set<Listener>>();
  const element = {
    addEventListener(type: string, listener: Listener): void {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: Listener): void {
      listeners.get(type)?.delete(listener);
    },
  } as unknown as HTMLElement;

  return {
    element,
    fire(type, event) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

function dragEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { preventDefault: vi.fn(), dataTransfer: { dropEffect: 'none' }, ...overrides };
}

describe('the drop target', () => {
  it('cancels dragover, which is what stops the browser navigating to the file', () => {
    const { element, fire } = fakeElement();
    attachDocumentDropTarget(element, { onDocument: () => {} });

    const event = dragEvent();
    fire('dragover', event);

    expect(event['preventDefault']).toHaveBeenCalled();
    expect((event['dataTransfer'] as { dropEffect: string }).dropEffect).toBe('copy');
  });

  it('counts enter and leave, so a child element does not flicker the highlight', () => {
    const { element, fire } = fakeElement();
    const states: boolean[] = [];
    attachDocumentDropTarget(element, {
      onDocument: () => {},
      onDragStateChange: (dragging) => states.push(dragging),
    });

    fire('dragenter', dragEvent()); // onto the zone
    fire('dragenter', dragEvent()); // onto a button inside it
    fire('dragleave', dragEvent()); // off the button, still inside the zone
    expect(states).toEqual([true]);

    fire('dragleave', dragEvent()); // and out
    expect(states).toEqual([true, false]);
  });

  it('opens the dropped document', async () => {
    const { document } = bracketDocument();
    const { element, fire } = fakeElement();
    const opened: number[] = [];
    attachDocumentDropTarget(element, { onDocument: (doc) => opened.push(doc.size) });

    const blob = new Blob([encodeDocumentFile(document)]);
    fire('drop', dragEvent({ dataTransfer: { files: { item: () => blob }, dropEffect: 'copy' } }));
    await vi.waitFor(() => expect(opened).toHaveLength(1));

    expect(opened[0]).toBe(document.size);
  });

  it('reports a drop that is not a document, without throwing', async () => {
    const { element, fire } = fakeElement();
    const errors: unknown[] = [];
    attachDocumentDropTarget(element, {
      onDocument: () => expect.unreachable('should not have opened'),
      onError: (error) => errors.push(error),
    });

    fire(
      'drop',
      dragEvent({ dataTransfer: { files: { item: () => new Blob(['nope']) }, dropEffect: '' } }),
    );
    await vi.waitFor(() => expect(errors).toHaveLength(1));

    expect(String(errors[0])).toMatch(/Not valid JSON/);
  });

  it('reports an empty drop', () => {
    const { element, fire } = fakeElement();
    const errors: unknown[] = [];
    attachDocumentDropTarget(element, { onDocument: () => {}, onError: (e) => errors.push(e) });

    fire('drop', dragEvent({ dataTransfer: { files: { item: () => null }, dropEffect: '' } }));

    expect(String(errors[0])).toMatch(/no file/);
  });

  it('detaches every listener it added', () => {
    const { element, listenerCount } = fakeElement();

    const detach = attachDocumentDropTarget(element, { onDocument: () => {} });
    expect(listenerCount()).toBe(4);
    detach();

    expect(listenerCount()).toBe(0);
  });
});

describe('flushing when the page goes away', () => {
  it('flushes on pagehide, which fires when a tab is frozen rather than unloaded', () => {
    const { element, fire } = fakeElement();
    let flushes = 0;

    flushOnHide(() => (flushes += 1), element);
    fire('pagehide', {});

    expect(flushes).toBe(1);
  });

  it('flushes when becoming hidden, and not when becoming visible', () => {
    const listeners = new Map<string, () => void>();
    const target = {
      visibilityState: 'visible',
      addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
    };
    let flushes = 0;

    const detach = flushOnHide(() => (flushes += 1), target);
    listeners.get('visibilitychange')?.();
    expect(flushes).toBe(0);

    target.visibilityState = 'hidden';
    listeners.get('visibilitychange')?.();
    expect(flushes).toBe(1);

    detach();
    expect(listeners.size).toBe(0);
  });
});
