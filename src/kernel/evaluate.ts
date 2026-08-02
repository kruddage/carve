/**
 * The tree walk: a `NodeBundle` in, one evaluated mesh out, with a subtree
 * cache in the middle.
 *
 * This is the part of #6 that decides whether editing feels immediate. A CSG
 * tree of twenty primitives and ten booleans takes tens of milliseconds to
 * evaluate from scratch, and dragging a slider asks for a new one sixty times a
 * second. Neither faster booleans nor more threads close that gap. Not
 * re-doing the work does.
 *
 * ## The cache, and why there is no invalidation
 *
 * Every node's result is stored under its subtree hash (`hash.ts`), which is a
 * structural fingerprint: identical geometry, identical key. Editing a leaf
 * changes that leaf's hash, and therefore every ancestor's hash, and therefore
 * misses the cache along exactly the path from the leaf to the root. Every
 * sibling subtree still hashes the same and hits.
 *
 * So there is no dirty flag, no invalidation pass, and no way for the cache to
 * be wrong about what changed — the only thing that can name an entry is a tree
 * that would rebuild it identically. Undo gets this for free too: stepping back
 * to a previous parameter restores a previous hash, which is very often still
 * resident, so undo during a drag is instant rather than a rebuild.
 *
 * A hit does not just skip the boolean, it skips the *walk*: a cached subtree's
 * children are never visited. That is what makes `stats.evaluated` a meaningful
 * number for the test that asserts it, and what makes a deep untouched branch
 * cost one map lookup regardless of its size.
 *
 * ## Eager, not lazy
 *
 * `manifold-3d` booleans are deferred: `a.subtract(b)` builds a node in a CSG
 * graph and does no work until something asks for the result. Left alone, a
 * whole evaluation would collapse into one batched solve at `getMesh()`, which
 * is faster *for a single evaluation from cold* — and useless here, because
 * nothing would be memoized in the cached subtrees and every edit would pay for
 * the entire tree again.
 *
 * So each subtree is forced as it is built (`numTri()`), and what lands in the
 * cache is an evaluated solid rather than a promise of one. Two consequences,
 * both wanted:
 *
 *   - the cache actually caches work, which is the entire premise above
 *   - emptiness and error status are known per node at no extra cost, so a
 *     subtraction that removed everything is attributable to the node that did
 *     it instead of being noticed at the root with nothing to point at
 *
 * ## Ownership
 *
 * A `Solid` is WASM memory and is not garbage-collected, so every one built
 * here has exactly one owner. The rule is carried in a `fresh` flag rather than
 * inferred: `fresh` means "nobody owns this yet, the caller must cache it or
 * delete it", and its opposite means "the cache owns this, do not free it".
 *
 * Three shapes come out of the walk, and mixing them up is a double free or a
 * leak rather than a wrong picture, so they are enumerated:
 *
 *   - a **cache hit** — not fresh
 *   - a **pass-through**, where a group, transform-free boolean or single-child
 *     container yields its one child's solid unchanged — not fresh, and
 *     deliberately *not* cached under the parent's hash, since caching the same
 *     solid under two keys would have eviction free it twice
 *   - anything **newly built** — fresh, and cached by `#evaluateNode`
 *
 * Fold intermediates (the `a ∪ b` inside `a ∪ b ∪ c`) are the one thing that is
 * fresh and never cached; they are deleted the moment the next operand consumes
 * them. Eviction is otherwise the only place a solid is destroyed, it runs after
 * a walk completes, and it skips every entry that walk touched.
 */

import type { ManifoldToplevel } from 'manifold-3d';

import {
  isContainer,
  trsToMatrix,
  type CarveNode,
  type NodeBundle,
  type NodeId,
} from '../core/index.js';

import { nodeLookup, subtreeHash, type NodeLookup } from './hash.js';
import {
  DEFAULT_CREASE_ANGLE,
  NORMAL_OFFSET,
  POSITION_OFFSET,
  VERTEX_STRIDE,
  emptyMesh,
  type EvaluationStats,
  type KernelWarning,
  type MeshPayload,
} from './protocol.js';
import { buildSolid, toManifoldMatrix, type Solid } from './solids.js';

/**
 * Cache capacity, in subtrees.
 *
 * Sized for the working set of an edit session rather than for a document:
 * dragging one parameter through a hundred values leaves a hundred entries
 * behind, and holding them is what makes dragging *back* free. 512 covers that
 * plus a large tree's untouched branches, at a few tens of megabytes of WASM
 * heap for meshes of the size this project targets — comfortable on desktop and
 * on a Quest 3.
 *
 * This is the knob to turn if the worker's memory grows in a long session. It
 * is not the knob to turn for speed; that one is tessellation quality.
 */
const DEFAULT_MAX_CACHE_ENTRIES = 512;

export interface EvaluatorOptions {
  readonly maxCacheEntries?: number;
  /** Degrees. Applied to the root result only — see `#toMesh`. */
  readonly creaseAngle?: number;
}

export interface EvaluationOutcome {
  readonly mesh: MeshPayload;
  readonly warnings: readonly KernelWarning[];
  readonly stats: EvaluationStats;
}

/**
 * A solid plus who owns it. See the ownership note in the file header.
 *
 * `fresh: false` means the cache owns it and it must not be freed by whoever is
 * holding this; `fresh: true` means it is unowned and the holder is responsible
 * for either caching it or deleting it.
 */
interface Built {
  readonly solid: Solid;
  readonly fresh: boolean;
}

/** Per-walk bookkeeping, so `evaluate` stays re-entrant-safe by construction. */
interface Walk {
  readonly lookup: NodeLookup;
  readonly hashes: Map<NodeId, string>;
  readonly warnings: KernelWarning[];
  /** Hashes touched by this walk. Protected from eviction at the end of it. */
  readonly touched: Set<string>;
  evaluated: number;
  cached: number;
}

export class Evaluator {
  readonly #api: ManifoldToplevel;
  readonly #maxEntries: number;
  readonly #creaseAngle: number;

  /**
   * Insertion-ordered, which is what makes eviction LRU without a second
   * structure: a `Map` preserves insertion order, and a cache hit re-inserts to
   * move the entry to the end.
   */
  readonly #cache = new Map<string, Solid>();

  constructor(api: ManifoldToplevel, options: EvaluatorOptions = {}) {
    this.#api = api;
    this.#maxEntries = options.maxCacheEntries ?? DEFAULT_MAX_CACHE_ENTRIES;
    this.#creaseAngle = options.creaseAngle ?? DEFAULT_CREASE_ANGLE;
  }

  get cacheSize(): number {
    return this.#cache.size;
  }

  /**
   * Evaluate `bundle` and return a mesh.
   *
   * Synchronous, and expected to be: this runs on the worker thread, where
   * blocking is the whole point. Nothing above this ever calls it directly —
   * `driver.ts` decides *which* evaluation to run, and this decides what the
   * answer is.
   */
  evaluate(bundle: NodeBundle, creaseAngle = this.#creaseAngle): EvaluationOutcome {
    const startedAt = now();
    const walk: Walk = {
      lookup: nodeLookup(bundle.nodes),
      hashes: new Map(),
      warnings: [],
      touched: new Set(),
      evaluated: 0,
      cached: 0,
    };

    const root = this.#evaluateNode(walk, bundle.rootId);
    const mesh = root ? this.#toMesh(root.solid, creaseAngle) : emptyMesh();

    if (mesh.indices.length === 0) {
      walk.warnings.push({
        code: 'empty-result',
        nodeId: bundle.rootId,
        message: 'This evaluated to nothing. Check for a subtraction that removes its own base.',
      });
    }

    this.#evict(walk.touched);

    return {
      mesh,
      warnings: walk.warnings,
      stats: {
        evaluated: walk.evaluated,
        cached: walk.cached,
        cacheSize: this.#cache.size,
        triangles: mesh.indices.length / 3,
        vertices: mesh.vertices.length / VERTEX_STRIDE,
        durationMs: now() - startedAt,
      },
    };
  }

  /** Drop every cached solid and free its WASM memory. */
  reset(): void {
    for (const solid of this.#cache.values()) solid.delete();
    this.#cache.clear();
  }

  /**
   * The solid for one subtree, or `null` for one that evaluates to nothing.
   *
   * `null` rather than an empty `Manifold` so callers can tell "no geometry"
   * from "geometry that happens to be empty" without an eager emptiness check,
   * and so an absent operand can be skipped in a union rather than unioned with
   * a thing that does not exist.
   */
  #evaluateNode(walk: Walk, id: NodeId): Built | null {
    const node = walk.lookup(id);
    if (!node) return null;

    const hash = subtreeHash(walk.lookup, id, walk.hashes);
    walk.touched.add(hash);

    const hit = this.#cache.get(hash);
    if (hit) {
      walk.cached += 1;
      // Re-insert to move this entry to the end of the eviction order.
      this.#cache.delete(hash);
      this.#cache.set(hash, hit);
      return { solid: hit, fresh: false };
    }

    const built = this.#build(walk, node);
    if (!built) return null;

    // A pass-through is already owned by the cache under its own hash. Storing
    // it a second time under this node's hash would give eviction two chances
    // to free one allocation.
    if (!built.fresh) return built;

    walk.evaluated += 1;
    this.#cache.set(hash, built.solid);
    return { solid: built.solid, fresh: false };
  }

  /** Construct the solid for `node`, recursing into children as needed. */
  #build(walk: Walk, node: CarveNode): Built | null {
    if (node.kind === 'primitive') {
      try {
        return this.#force(walk, node, buildSolid(this.#api, node.primitive, node.params));
      } catch (error) {
        walk.warnings.push({
          code: 'build-failed',
          nodeId: node.id,
          message: `Could not build this ${node.primitive}: ${messageOf(error)}`,
        });
        return null;
      }
    }

    const operands = this.#operands(walk, node);

    switch (node.kind) {
      // A group has no geometric meaning of its own; `nodes.ts` defines it as a
      // union for evaluation purposes, and `hash.ts` gives it a union's hash so
      // the two share cache entries.
      case 'group':
        return this.#combine(walk, node, 'union', operands);

      case 'transform': {
        const united = this.#combine(walk, node, 'union', operands);
        if (!united) return null;
        try {
          return this.#force(
            walk,
            node,
            united.solid.transform(toManifoldMatrix(trsToMatrix(node.transform))),
          );
        } catch (error) {
          walk.warnings.push({
            code: 'build-failed',
            nodeId: node.id,
            message: `Could not apply this transform: ${messageOf(error)}`,
          });
          return null;
        } finally {
          // The pre-transform union of two or more children is a fold
          // intermediate with no node of its own and therefore no cache entry.
          // A single child's solid is the cache's and is left alone.
          if (united.fresh) united.solid.delete();
        }
      }

      case 'boolean': {
        // A `subtract` or `intersect` with one operand is legal and evaluates to
        // that operand — but it is almost always a half-finished edit, and
        // silently drawing the base unchanged looks exactly like a boolean that
        // did nothing. Flagged, not corrected.
        if (operands.length === 1 && node.op !== 'union') {
          walk.warnings.push({
            code: 'unary-boolean',
            nodeId: node.id,
            message: `This ${node.op} has only one operand, so it has nothing to ${
              node.op === 'subtract' ? 'cut with' : 'intersect against'
            }.`,
          });
        }
        return this.#combine(walk, node, node.op, operands);
      }
    }
  }

  /**
   * Every child's solid, in order, with the absent ones reported and dropped.
   *
   * A missing child is a malformed bundle rather than a user error — the store
   * cannot produce one — so it is a warning that names the parent, and
   * evaluation carries on with what is there. Refusing to draw the rest of the
   * document because one id did not resolve is the wrong failure mode for a
   * modeller you might be wearing.
   *
   * Everything returned here is cache-owned: `#evaluateNode` has already stored
   * whatever it built. Operands are never deleted by their consumer.
   */
  #operands(walk: Walk, node: CarveNode): Solid[] {
    const solids: Solid[] = [];
    for (const childId of isContainer(node) ? node.children : []) {
      if (!walk.lookup(childId)) {
        walk.warnings.push({
          code: 'missing-child',
          nodeId: node.id,
          message: `Child ${childId} is not in this document.`,
        });
        continue;
      }
      const child = this.#evaluateNode(walk, childId);
      if (child) solids.push(child.solid);
    }
    return solids;
  }

  /**
   * Apply a boolean across ordered operands.
   *
   * Folded left rather than handed to `Manifold.difference(list)` so that the
   * result is forced and status-checked once at the end, and so `subtract`'s
   * "first child is the base, the rest are cut out of it" ordering is the
   * literal shape of the loop rather than a property of a batch call.
   *
   * Each intermediate is deleted as soon as the next operand has consumed it.
   * `manifold-3d` operations hold their operands by shared reference, so the
   * result of `a.add(b)` stays valid after `a` is freed — which is what makes a
   * left fold over N operands cost one live temporary rather than N.
   */
  #combine(
    walk: Walk,
    node: CarveNode,
    op: 'union' | 'subtract' | 'intersect',
    operands: readonly Solid[],
  ): Built | null {
    const [first, ...rest] = operands;
    if (!first) return null;
    // One operand is the operand: no boolean to apply, and nothing new to own.
    if (rest.length === 0) return { solid: first, fresh: false };

    let accumulated = first;
    let accumulatedIsTemporary = false;
    try {
      for (const operand of rest) {
        const next =
          op === 'union'
            ? accumulated.add(operand)
            : op === 'subtract'
              ? accumulated.subtract(operand)
              : accumulated.intersect(operand);
        if (accumulatedIsTemporary) accumulated.delete();
        accumulated = next;
        accumulatedIsTemporary = true;
      }
    } catch (error) {
      if (accumulatedIsTemporary) accumulated.delete();
      walk.warnings.push({
        code: 'build-failed',
        nodeId: node.id,
        message: `Could not evaluate this ${op}: ${messageOf(error)}`,
      });
      return null;
    }

    return this.#force(walk, node, accumulated);
  }

  /**
   * Force a deferred solid and check what came out.
   *
   * `numTri()` is what collapses `manifold-3d`'s deferred CSG node into an
   * evaluated mesh, so calling it is both the "make the cache hold real work"
   * step from the header note and the cheapest way to ask whether the result
   * has any geometry at all.
   *
   * Note the asymmetry in what is returned: a non-`NoError` status is a
   * *failure* and yields `null`, because the solid is not usable and feeding it
   * to a parent boolean produces a second, more confusing error one level up.
   * An empty result is *not* a failure — it is the correct answer to "subtract
   * this plate from itself" — so it yields `null` with a warning and lets the
   * rest of the tree carry on. Both are reported against the node that produced
   * them, which is only possible because evaluation is eager.
   */
  #force(walk: Walk, node: CarveNode, solid: Solid): Built | null {
    const triangles = solid.numTri();
    const status = solid.status();

    if (status !== 'NoError') {
      walk.warnings.push({
        code: 'degenerate-input',
        nodeId: node.id,
        message: `manifold-3d could not make this manifold (${status}).`,
      });
      solid.delete();
      return null;
    }

    if (triangles === 0) {
      // Only worth saying for something the user built out of other things. An
      // empty primitive cannot happen — `normalizeParameters` clamps every
      // dimension above zero — so a bare `empty-result` on a leaf would be a
      // kernel bug reported as a modelling note.
      if (node.kind !== 'primitive') {
        walk.warnings.push({
          code: 'empty-result',
          nodeId: node.id,
          message: 'This evaluated to nothing — the operands may not overlap.',
        });
      }
      solid.delete();
      return null;
    }

    return { solid, fresh: true };
  }

  /**
   * Root solid → interleaved buffers, with sharp-edge normals.
   *
   * Normals are computed here and not per subtree because they are a property
   * of the visible surface: a face that an ancestor boolean is about to cut
   * away does not need one, and an intermediate's normals would be thrown away
   * by the next operation anyway.
   *
   * `calculateNormals(0, creaseAngle)` is `manifold-3d`'s own crease-threshold
   * pass, which splits a vertex into one per adjacent face wherever the dihedral
   * angle exceeds the threshold and shares it everywhere else. That is exactly
   * the hard-surface requirement — machined edges stay crisp, tessellated
   * cylinders stay round — and doing it inside WASM over the whole mesh is an
   * order of magnitude quicker than the equivalent walk in JS, on the thread
   * where the time is cheapest to spend.
   *
   * The derived solid is deleted immediately: it is keyed by crease angle as
   * well as by geometry, so caching it would double the cache's memory for a
   * pass that costs a fraction of a boolean.
   */
  #toMesh(solid: Solid, creaseAngle: number): MeshPayload {
    const withNormals = solid.calculateNormals(0, creaseAngle);
    try {
      const mesh = withNormals.getMesh();
      if (mesh.numProp !== VERTEX_STRIDE) {
        // Unreachable unless `calculateNormals` changes what it writes, which
        // would silently mis-key every attribute offset downstream.
        throw new Error(`Expected ${VERTEX_STRIDE} properties per vertex, got ${mesh.numProp}`);
      }
      return {
        vertices: mesh.vertProperties,
        indices: mesh.triVerts,
        stride: VERTEX_STRIDE,
        positionOffset: POSITION_OFFSET,
        normalOffset: NORMAL_OFFSET,
      };
    } finally {
      withNormals.delete();
    }
  }

  /**
   * Evict down to capacity, oldest first, skipping anything the walk just used.
   *
   * The skip is not an optimization — it is what makes the ownership rule in
   * the header note hold. The mesh has already been extracted by the time this
   * runs, but a solid the walk touched is still referenced by cache entries
   * above it, and freeing it would leave those pointing into a released WASM
   * allocation. Evicting only untouched entries means the live tree is never a
   * candidate.
   *
   * If the live tree alone exceeds capacity, the cache is allowed to overflow
   * rather than break. That is a document big enough to be a #15 conversation,
   * and a memory ceiling is not worth a use-after-free.
   */
  #evict(touched: ReadonlySet<string>): void {
    if (this.#cache.size <= this.#maxEntries) return;
    for (const [hash, solid] of this.#cache) {
      if (this.#cache.size <= this.#maxEntries) break;
      if (touched.has(hash)) continue;
      solid.delete();
      this.#cache.delete(hash);
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A monotonic clock that works everywhere the kernel runs.
 *
 * `performance` exists in browsers, in Workers and in modern Node, but the
 * kernel is also expected to run under Vitest in Node, where a stubbed global
 * environment is common enough that a hard reference is a needless way to fail.
 */
function now(): number {
  return typeof performance === 'object' ? performance.now() : Date.now();
}
