/**
 * The fuzz test from issue #5's done-when: undo/redo survives a few thousand
 * random command sequences.
 *
 * Hand-written undo tests check the cases someone thought of. The bugs that
 * actually reach users are the interleavings nobody thought of — delete a node
 * that a still-open gesture touched, move a subtree over the boundary its own
 * insert created, undo past a coalesced drag into a structural edit. So the
 * generator below builds sequences out of every command kind including
 * gestures, and after each sequence it walks the entire history backwards and
 * then forwards, comparing the document against a snapshot taken at that depth.
 *
 * What is being asserted, precisely:
 *
 *   - undoing back to depth *d* reproduces the document as it was at depth *d*,
 *     byte for byte in canonical JSON, for every *d*
 *   - redoing forward reproduces it again
 *
 * Snapshots are keyed on history *depth* rather than on step count because one
 * step is not one entry: a drag coalesces into one, a cancelled gesture into
 * none, and a composite boolean into one.
 *
 * The seeds are fixed, so a failure is replayable: the reported seed plus the
 * step index is the whole repro.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  DocumentError,
  booleanNode,
  groupNode,
  insertBundle,
  makeBooleanCommand,
  makeTrs,
  moveNode,
  quat,
  removeNode,
  renameNode,
  setBooleanOp,
  setParameters,
  setTransform,
  vec3,
  type BooleanOp,
  type NodeId,
  type PrimitiveKind,
} from '../src/core/index.js';

import { idFactory, placed, seededRandom, snapshot } from './support/document-fixture.js';

const SEEDS = [1, 7, 42, 1337, 90210, 271828, 314159, 8675309, 20260802, 65537, 999983, 123456];
const STEPS_PER_SEED = 80;

const PRIMITIVES: readonly PrimitiveKind[] = [
  'box',
  'cylinder',
  'sphere',
  'cone',
  'torus',
  'wedge',
];
const OPS: readonly BooleanOp[] = ['union', 'subtract', 'intersect'];

interface Step {
  readonly depth: number;
  readonly state: string;
  readonly description: string;
}

/**
 * What the generator actually produced, accumulated across seeds.
 *
 * Asserted at the end of the file. A fuzz test that silently stopped producing
 * cancelled gestures — one refactor of the generator away — would keep passing
 * while testing half of what it claims to, and nothing else in the suite would
 * notice.
 */
const performed: string[] = [];
let commandsDispatched = 0;

describe('undo/redo fuzz', () => {
  for (const seed of SEEDS) {
    it(`survives ${STEPS_PER_SEED} random steps with seed ${seed}`, () => {
      const random = seededRandom(seed);
      const nextId = idFactory(`s${seed}-`);
      const document = CarveDocument.create({
        root: groupNode({ id: 'root', name: 'Document' }),
        historyLimit: 10_000,
      });

      const pick = <T>(values: readonly T[]): T | undefined =>
        values.length === 0 ? undefined : values[Math.floor(random() * values.length)];

      const nodesOfKind = (kind: string): NodeId[] =>
        [...document.order()].filter((id) => document.expect(id).kind === kind);
      const removable = (): NodeId[] =>
        [...document.order()].filter((id) => id !== document.rootId);
      const containers = (): NodeId[] =>
        [...document.order()].filter((id) => document.expect(id).kind !== 'primitive');

      /** One random step. Returns a description for the failure message. */
      const step = (): string => {
        switch (Math.floor(random() * 9)) {
          case 0: {
            // Spawn a placed primitive somewhere.
            const parent = pick(containers()) ?? document.rootId;
            const bundle = placed(
              nextId,
              pick(PRIMITIVES) ?? 'box',
              { width: round(random()), height: round(random()) },
              makeTrs({ translation: vec3(round(random()), round(random()), round(random())) }),
            );
            document.dispatch(insertBundle(bundle, parent, Math.floor(random() * 4)));
            return `insert ${bundle.rootId} under ${parent}`;
          }
          case 1: {
            const target = pick(removable());
            if (!target) return 'skip: nothing to delete';
            document.dispatch(removeNode(target));
            return `remove ${target}`;
          }
          case 2: {
            // Moves are the step most likely to be illegal — into your own
            // subtree, or onto a primitive — and an illegal command must leave
            // the document untouched rather than half-moved.
            const target = pick(removable());
            const parent = pick(containers());
            if (!target || !parent) return 'skip: nothing to move';
            const before = snapshot(document);
            try {
              document.dispatch(moveNode(target, parent, Math.floor(random() * 4)));
              return `move ${target} under ${parent}`;
            } catch (error) {
              expect(error).toBeInstanceOf(DocumentError);
              expect(snapshot(document)).toBe(before);
              return `rejected move ${target} under ${parent}`;
            }
          }
          case 3: {
            const target = pick(nodesOfKind('transform'));
            if (!target) return 'skip: no transform nodes';
            document.dispatch(
              setTransform(
                target,
                makeTrs({
                  translation: vec3(round(random()), round(random()), round(random())),
                  rotation: quat(0, round(random()), 0, round(random())),
                  scale: vec3(round(random()) + 0.1, round(random()) + 0.1, round(random()) + 0.1),
                }),
              ),
            );
            return `transform ${target}`;
          }
          case 4: {
            const target = pick(nodesOfKind('primitive'));
            if (!target) return 'skip: no primitives';
            const key = pick(['width', 'height', 'depth', 'radius']) ?? 'width';
            document.dispatch(setParameters(target, { [key]: round(random()) }));
            return `set ${key} on ${target}`;
          }
          case 5: {
            const target = pick(nodesOfKind('boolean'));
            if (!target) return 'skip: no booleans';
            document.dispatch(setBooleanOp(target, pick(OPS) ?? 'union'));
            return `set op on ${target}`;
          }
          case 6: {
            const target = pick(removable()) ?? document.rootId;
            document.dispatch(renameNode(target, `name-${Math.floor(random() * 1000)}`));
            return `rename ${target}`;
          }
          case 7: {
            // A drag: many updates, one entry — or none at all if it is
            // cancelled, which is the hand-tracking-drops-the-hand case.
            const target = pick(nodesOfKind('transform'));
            if (!target) return 'skip: no transform to drag';
            const cancelled = random() < 0.35;
            const frames = 5 + Math.floor(random() * 70);
            const drag = document.beginGesture('fuzz-grab');
            for (let frame = 0; frame < frames; frame += 1) {
              drag.dispatch(
                setTransform(target, makeTrs({ translation: vec3(frame * 0.01, 0, 0) })),
              );
            }
            if (cancelled) drag.cancel();
            else drag.commit();
            return `${cancelled ? 'cancelled' : 'committed'} ${frames}-frame drag of ${target}`;
          }
          default: {
            // Wrap two siblings in a boolean: a composite, which must undo as
            // one entry and must roll back cleanly if the second move fails.
            const parent = pick(containers()) ?? document.rootId;
            const children = document.childrenOf(parent);
            const [first, second] = children;
            if (first === undefined || second === undefined) return 'skip: not enough operands';
            const node = booleanNode({ id: nextId(), op: pick(OPS) ?? 'subtract' });
            const before = snapshot(document);
            try {
              document.dispatch(makeBooleanCommand(document, node, [first, second]));
              return `boolean ${node.id} over ${first}, ${second}`;
            } catch (error) {
              expect(error).toBeInstanceOf(DocumentError);
              expect(snapshot(document)).toBe(before);
              return `rejected boolean over ${first}, ${second}`;
            }
          }
        }
      };

      document.subscribe((change) => {
        if (change.source === 'command') commandsDispatched += 1;
      });

      const steps: Step[] = [
        { depth: document.undoDepth, state: snapshot(document), description: 'initial' },
      ];
      for (let i = 0; i < STEPS_PER_SEED; i += 1) {
        const description = step();
        performed.push(description);
        steps.push({
          depth: document.undoDepth,
          state: snapshot(document),
          description: `${i}: ${description}`,
        });
      }

      // Walk all the way back, checking the document at every depth we passed
      // through on the way out.
      for (let i = steps.length - 1; i > 0; i -= 1) {
        const target = steps[i - 1];
        if (!target) throw new Error('unreachable');
        while (document.undoDepth > target.depth) {
          expect(document.undo(), `undo ran dry before ${steps[i]?.description}`).not.toBeNull();
        }
        expect(snapshot(document), `after undoing ${steps[i]?.description}`).toBe(target.state);
      }
      expect(document.undoDepth).toBe(steps[0]?.depth);

      // …and all the way forward again.
      for (let i = 1; i < steps.length; i += 1) {
        const target = steps[i];
        if (!target) throw new Error('unreachable');
        while (document.undoDepth < target.depth) {
          expect(document.redo(), `redo ran dry before ${target.description}`).not.toBeNull();
        }
        expect(snapshot(document), `after redoing ${target.description}`).toBe(target.state);
      }
    });
  }
});

describe('what the fuzz actually covered', () => {
  const matching = (pattern: RegExp): number =>
    performed.filter((description) => pattern.test(description)).length;

  it('dispatched a few thousand commands', () => {
    // Issue #5's done-when. A drag is dozens of commands and one entry, which
    // is why the count is of commands and not of steps.
    expect(commandsDispatched).toBeGreaterThan(2000);
  });

  it('exercised every step kind, including the awkward ones', () => {
    expect(matching(/^insert /)).toBeGreaterThan(0);
    expect(matching(/^remove /)).toBeGreaterThan(0);
    expect(matching(/^move /)).toBeGreaterThan(0);
    expect(matching(/^transform /)).toBeGreaterThan(0);
    expect(matching(/^set \w+ on /)).toBeGreaterThan(0);
    expect(matching(/^set op on /)).toBeGreaterThan(0);
    expect(matching(/^rename /)).toBeGreaterThan(0);
    expect(matching(/^committed \d+-frame drag/)).toBeGreaterThan(0);
    expect(matching(/^cancelled \d+-frame drag/)).toBeGreaterThan(0);
    expect(matching(/^boolean /)).toBeGreaterThan(0);
    // Illegal edits are part of the coverage: the assertion inside the
    // generator is that they change nothing.
    expect(matching(/^rejected /)).toBeGreaterThan(0);
  });
});

/** Keep generated numbers short so a failing snapshot diff is readable. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
