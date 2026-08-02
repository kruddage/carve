/**
 * Thumbnail geometry: one primitive, meshed and framed to a fixed size.
 *
 * The `7a` registry gives every primitive a flat SVG glyph, which is what the
 * desktop palette draws. The wrist menu (#12) wants the other thing — a small
 * solid that turns, so that a wedge reads as a wedge from any angle a hand
 * happens to be at, and so that changing a parameter changes the picture. This
 * file is where that mesh comes from.
 *
 * ## Why this is not an evaluation
 *
 * A preview could be expressed as a one-node `NodeBundle` handed to
 * `evaluate.ts`, and it deliberately is not. Three reasons, in order of how
 * much they would cost:
 *
 *   - **Framing.** A menu cell is a fixed size. A 60mm box next to a torus of
 *     120mm outer diameter would render at half the apparent size for no reason
 *     a user could act on, and the scale that fixes it can only be known after
 *     the solid exists — it is `fit / longest bounding-box edge`. The evaluator
 *     has no business knowing about menu cells.
 *   - **The cache.** Every subtree the evaluator builds is retained under its
 *     hash. Six thumbnails, re-requested each time a parameter moves, would
 *     evict live document subtrees to hold geometry nobody is modelling with.
 *   - **Identity.** A palette entry is a shape nobody has spawned yet, so
 *     minting a node id for it — and then having to keep that id stable, or not
 *     — is a question with no good answer and no need to ask.
 *
 * What it *does* share is everything that has to agree: `buildSolid` for the
 * geometry, `normalizeParameters` and `applyTessellationQuality` for the
 * parameters, and `meshFromSolid` for the crease pass. A preview is the same
 * shape the document would get, at a smaller triangle count and a different
 * size, and never a second opinion about what a torus is.
 *
 * ## Draft density by default
 *
 * A thumbnail is a hundred pixels across, and in the headset there are six of
 * them on a wrist that is itself moving. `draft` halves every segment count,
 * which is invisible at that size and is most of the triangles. The tier is a
 * registry concept applied through `applyTessellationQuality`, not a second
 * density knob — same rule as everywhere else in the kernel, for the same
 * reason: a mesh is a pure function of `(kind, params)`.
 *
 * ## Nothing is cached here
 *
 * Preview meshes are built on demand and handed straight out. They are cheap —
 * a draft primitive is a fraction of a millisecond, with no boolean anywhere —
 * and caching them on this side of the worker boundary would be actively wrong:
 * the buffers are *transferred* to the main thread, so the worker's copy is
 * detached the moment it is posted, and the second caller to be handed a cached
 * payload would receive an empty one. A caller that wants to keep a thumbnail
 * around keeps it where the buffer lives, which is the main thread.
 */

import type { Box, ManifoldToplevel } from 'manifold-3d';

import { applyTessellationQuality, type TessellationQuality } from '../core/index.js';

import { meshFromSolid } from './mesh.js';
import {
  DEFAULT_CREASE_ANGLE,
  type PreviewBounds,
  type PreviewSpec,
  type PrimitivePreview,
} from './protocol.js';
import { buildSolid } from './solids.js';

/**
 * The tessellation tier a preview is built at unless the caller says otherwise.
 *
 * `draft` rather than `standard`: see the density note above. A caller showing
 * a large preview — a desktop inspector, say — passes `standard` and gets the
 * same mesh the viewport would.
 */
export const PREVIEW_QUALITY: TessellationQuality = 'draft';

/**
 * The size a preview is framed to: a one-metre box.
 *
 * Metres because everything geometric in this project is metres, and one
 * because it makes the result a unit shape — a caller scales by its cell size
 * and is done, with no division by a number it has to look up first.
 */
export const PREVIEW_FIT_SIZE = 1;

/**
 * Build the preview mesh for one primitive.
 *
 * Synchronous, like the rest of the kernel: this runs on the worker thread,
 * where blocking is the point. The returned buffers are freshly allocated and
 * owned by the caller; no WASM memory survives this call.
 */
export function buildPreview(api: ManifoldToplevel, spec: PreviewSpec): PrimitivePreview {
  const params = applyTessellationQuality(
    spec.kind,
    spec.params ?? {},
    spec.quality ?? PREVIEW_QUALITY,
  );

  const solid = buildSolid(api, spec.kind, params);
  try {
    const bounds = boundsOf(solid.boundingBox());
    const scale = framingScale(bounds, spec.fit ?? PREVIEW_FIT_SIZE);
    // `scale === 1` covers both "framing is off" and "it already fits", and
    // skipping the transform in that case is not just an optimization: it keeps
    // a true-scale preview bit-identical to the mesh the viewport would draw.
    const framed = scale === 1 ? solid : solid.scale(scale);
    try {
      return {
        kind: spec.kind,
        params,
        mesh: meshFromSolid(framed, spec.creaseAngle ?? DEFAULT_CREASE_ANGLE),
        bounds,
        scale,
      };
    } finally {
      if (framed !== solid) framed.delete();
    }
  } finally {
    solid.delete();
  }
}

/**
 * The uniform factor that fits `bounds` inside a box of edge `fit`.
 *
 * Uniform, and taken from the longest edge, because the alternative — one
 * factor per axis — would fill the cell exactly and make a wedge look like a
 * different wedge. Proportion is the thing a preview is *for*: it is how you
 * tell a cylinder from a disc before you have spawned either.
 *
 * Note what is *not* here: any re-centring. `primitives.ts` states that every
 * solid is centred on its own origin, `kernel-solids.test.ts` asserts it for
 * all six, and scaling about the origin preserves it. Translating to the
 * bounding-box centre here would work too, and would quietly paper over a
 * primitive that had stopped honouring the convention — which is a bug worth
 * seeing in a thumbnail rather than hiding in one.
 */
function framingScale(bounds: PreviewBounds, fit: number): number {
  if (fit <= 0) return 1;
  const longest = Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  );
  // A primitive with no extent cannot happen — `normalizeParameters` clamps
  // every dimension above zero — but dividing by it would produce `Infinity`
  // and a mesh of `NaN`s, which is a far worse way to find out.
  return longest > 0 ? fit / longest : 1;
}

/**
 * `manifold-3d`'s box as the readonly tuples the wire carries.
 *
 * Copied rather than passed through: the returned arrays are mutable and are
 * about to cross a `postMessage`, and a readonly tuple is what every consumer
 * of a `PrimitivePreview` should be handed.
 */
function boundsOf(box: Box): PreviewBounds {
  return {
    min: [box.min[0], box.min[1], box.min[2]],
    max: [box.max[0], box.max[1], box.max[2]],
  };
}
