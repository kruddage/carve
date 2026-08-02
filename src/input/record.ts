/**
 * Recording and replaying intent streams.
 *
 * This is the file that makes #8's third done-when real: *intent streams are
 * replayable in tests, so hand gestures can be unit tested without a headset*.
 * A session in a Quest writes a stream to a file; the test suite reads it back
 * and drives a `CarveDocument` with it in Node, with no renderer, no WebXR and
 * no hardware. When a two-hand transform does something wrong in a headset,
 * the bug becomes a fixture, and the fixture becomes a regression test — which
 * is the only way a headset-only bug ever gets a test at all.
 *
 * It works because of a property `intents.ts` maintains deliberately: intents
 * are plain JSON with cumulative deltas. There is no clock to reproduce, no
 * device state to restore, and no ordering subtlety beyond "in order" — replay
 * is a `for` loop.
 *
 * ## The format
 *
 * ```json
 * {
 *   "version": 1,
 *   "label": "pinch-drag a box 20cm right",
 *   "intents": [
 *     { "at": 0,  "source": "xr-hand", "intent": { "kind": "select", ... } },
 *     { "at": 16, "source": "xr-hand", "intent": { "kind": "transform-begin", ... } }
 *   ]
 * }
 * ```
 *
 * `at` is milliseconds from the first recorded intent and is **metadata**: it
 * is written so a recording can be inspected ("the drag took 1.2s and produced
 * 84 updates"), and it is not consulted by replay. Making replay honour
 * timestamps would make every test that uses one slow and flaky in exchange for
 * verifying nothing — the document has no time-dependent behaviour, by design.
 *
 * Node ids inside a fixture refer to the document the fixture was recorded
 * against. `remapNodeIds` exists for the case where the test builds an
 * equivalent document with fresh ids, which is the usual one, since ids are
 * UUIDs generated at spawn.
 */

import type { NodeId } from '../core/index.js';

import { isIntent, type Intent, type IntentSink, type InputSourceKind } from './intents.js';
import type { IntentRouter, RouterOutcome } from './router.js';

export const RECORDING_FORMAT_VERSION = 1;

export interface RecordedIntent {
  /** Milliseconds since the first intent in the recording. Metadata; see the header. */
  readonly at: number;
  readonly source: InputSourceKind;
  readonly intent: Intent;
}

export interface IntentRecording {
  readonly version: number;
  /** What was being done, in words. A fixture with no label is a fixture nobody can fix. */
  readonly label?: string;
  readonly intents: readonly RecordedIntent[];
}

/** Thrown by `parseRecording`, naming what was wrong. Mirrors core's `DocumentFormatError`. */
export class IntentFormatError extends Error {
  override readonly name = 'IntentFormatError';
}

export interface RecorderOptions {
  readonly label?: string;
  /** Milliseconds, monotonic. Defaults to `performance.now()` where it exists. */
  readonly clock?: () => number;
}

/**
 * Wraps a sink and keeps a copy of everything that went through it.
 *
 * Wrapping rather than subscribing to the router, because what should be
 * replayable is what the *adapter* produced. Router outcomes are a function of
 * the intents plus the document, so recording them too would store a derived
 * value that can go stale against the code that derived it — and a fixture that
 * disagrees with the router is a test that fails for the wrong reason.
 */
export class IntentRecorder {
  readonly #recorded: RecordedIntent[] = [];
  readonly #clock: () => number;
  readonly #label: string | undefined;
  #startedAt: number | null = null;

  constructor(options: RecorderOptions = {}) {
    this.#clock = options.clock ?? defaultClock;
    this.#label = options.label;
  }

  get intents(): readonly RecordedIntent[] {
    return this.#recorded;
  }

  get length(): number {
    return this.#recorded.length;
  }

  /**
   * A sink that records, then forwards to `downstream`.
   *
   * Pass this as an adapter's `emit` and the adapter is unchanged and unaware —
   * which is the point: an adapter that behaved differently while being
   * recorded would produce fixtures that do not describe the real thing.
   */
  sink(source: InputSourceKind, downstream?: IntentSink): IntentSink {
    return (intent: Intent) => {
      this.record(source, intent);
      downstream?.(intent);
    };
  }

  record(source: InputSourceKind, intent: Intent): void {
    const now = this.#clock();
    this.#startedAt ??= now;
    this.#recorded.push({ at: Math.round(now - this.#startedAt), source, intent });
  }

  clear(): void {
    this.#recorded.length = 0;
    this.#startedAt = null;
  }

  toRecording(): IntentRecording {
    return this.#label === undefined
      ? { version: RECORDING_FORMAT_VERSION, intents: [...this.#recorded] }
      : { version: RECORDING_FORMAT_VERSION, label: this.#label, intents: [...this.#recorded] };
  }
}

function defaultClock(): number {
  const timing = globalThis.performance as { now?: () => number } | undefined;
  return typeof timing?.now === 'function' ? timing.now() : Date.now();
}

/** Pretty-printed, because these are committed files that get read in diffs. */
export function serializeRecording(recording: IntentRecording): string {
  return `${JSON.stringify(recording, null, 2)}\n`;
}

/**
 * Parse and validate. A file is hostile input, on the same principle core's
 * `deserialize` applies: a half-understood intent replayed against a document
 * is worse than a rejected one, because it fails somewhere else later.
 */
export function parseRecording(source: unknown): IntentRecording {
  let value: unknown = source;
  if (typeof source === 'string') {
    try {
      value = JSON.parse(source);
    } catch (error) {
      throw new IntentFormatError(`Not JSON: ${(error as Error).message}`);
    }
  }

  if (typeof value !== 'object' || value === null) {
    throw new IntentFormatError('Recording must be an object');
  }
  const candidate = value as Partial<IntentRecording>;
  if (candidate.version !== RECORDING_FORMAT_VERSION) {
    throw new IntentFormatError(
      `Unsupported recording version ${String(candidate.version)}; expected ${RECORDING_FORMAT_VERSION}`,
    );
  }
  if (!Array.isArray(candidate.intents)) {
    throw new IntentFormatError('Recording is missing its `intents` array');
  }

  const intents = candidate.intents.map((entry, index): RecordedIntent => {
    if (typeof entry !== 'object' || entry === null) {
      throw new IntentFormatError(`intents[${index}] is not an object`);
    }
    const recorded = entry as Partial<RecordedIntent>;
    if (!isIntent(recorded.intent)) {
      throw new IntentFormatError(`intents[${index}] does not hold a valid intent`);
    }
    if (typeof recorded.at !== 'number' || !Number.isFinite(recorded.at)) {
      throw new IntentFormatError(`intents[${index}].at is not a finite number`);
    }
    if (typeof recorded.source !== 'string') {
      throw new IntentFormatError(`intents[${index}].source is missing`);
    }
    return { at: recorded.at, source: recorded.source, intent: recorded.intent };
  });

  return candidate.label === undefined
    ? { version: candidate.version, intents }
    : { version: candidate.version, label: candidate.label, intents };
}

/**
 * Rewrite the node ids in a recording.
 *
 * Ids are UUIDs minted at spawn, so a fixture recorded against one document
 * names nodes that do not exist in the document a test builds. Mapping them is
 * the alternative to seeding the id generator, which would mean core carrying a
 * test hook for the benefit of this file.
 *
 * Ids with no entry in `mapping` are left alone: a fixture that deliberately
 * references a stale node — testing that a grab on a deleted node is rejected —
 * must keep referencing it.
 */
export function remapNodeIds(
  recording: IntentRecording,
  mapping: ReadonlyMap<NodeId, NodeId>,
): IntentRecording {
  const map = (id: NodeId): NodeId => mapping.get(id) ?? id;
  const intents = recording.intents.map((recorded): RecordedIntent => {
    const intent = recorded.intent;
    switch (intent.kind) {
      case 'hover':
      case 'select':
        return intent.nodeId === null
          ? recorded
          : { ...recorded, intent: { ...intent, nodeId: map(intent.nodeId) } };
      case 'transform-begin':
        return { ...recorded, intent: { ...intent, nodeId: map(intent.nodeId) } };
      case 'action': {
        const request = intent.action;
        if (request.name !== 'apply-boolean' && request.name !== 'delete') return recorded;
        if (!request.targets) return recorded;
        return {
          ...recorded,
          intent: { ...intent, action: { ...request, targets: request.targets.map(map) } },
        };
      }
      default:
        return recorded;
    }
  });

  return { ...recording, intents };
}

/** Drive a router with a recording, in order. Returns one outcome per intent. */
export function replay(recording: IntentRecording, router: IntentRouter): readonly RouterOutcome[] {
  return router.handleAll(recording.intents.map((recorded) => recorded.intent));
}
