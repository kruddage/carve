# The primitive registry

`src/core/primitives.ts`. What each parametric solid's parameters are, what values are legal, and
one list that the desktop palette ([#9](https://github.com/kruddage/carve/issues/9)) and the wrist
menu ([#12](https://github.com/kruddage/carve/issues/12)) both enumerate.

This is the `7a` half of [#7](https://github.com/kruddage/carve/issues/7) — schemas, units,
defaults, validation, registry. Mesh construction, tessellation into triangles and 3D preview
thumbnails are `7b`, and they landed after the kernel in
[#6](https://github.com/kruddage/carve/issues/6), because a mesh builder with no boolean to feed
cannot be shown to be correct. They live in `src/kernel/`: `solids.ts` for the construction and
`preview.ts` for the thumbnails.

## Why it is not in `nodes.ts`

The document model does not know what a torus is. A `PrimitiveNode` carries a shape name plus an
untyped bag of numbers, and [#5](https://github.com/kruddage/carve/issues/5)'s job is to keep that
bag editable, undoable and serializable. This file is the other half of that arrangement: the only
place that knows a torus has a major and a minor radius, and the only place that knows a minor
radius larger than the major one describes a solid that passes through itself.

Keeping them apart is what lets the undo stack, the store and the on-disk format stay indifferent to
the primitive set growing.

## Units: stored in metres, shown in millimetres

[#7](https://github.com/kruddage/carve/issues/7) asks for millimetres. `src/core/math.ts` already
says metres. Both are right about different things, so the split is explicit and lives in one place.

|                       |                                                                         |
| --------------------- | ----------------------------------------------------------------------- |
| **Canonical storage** | metres and radians — everything in `params`, on disk, and in the kernel |
| **Authoring unit**    | millimetres and degrees — everything a user reads or types              |

Storage is metres because `Trs.translation` is metres, because WebXR poses are metres. A primitive
whose parameters were millimetres would put a factor-of-1000 conversion at exactly the boundary
where that bug is hardest to see: the box would be the right size until you grabbed it.

The display unit is declared once, in `PARAMETER_UNITS`, and reached through `formatParameter`,
`toDisplayValue` and `fromDisplayValue`. "Pick a unit now and never revisit it" holds for both
halves; what must never happen is a third convention appearing in a UI file.

## The six

Palette order, which is the order both frontends show them in. Every solid is centred on its own
origin with +Y up, so a transform node's translation places the shape's _centre_ — the alternative,
sitting on the XZ plane, reads well on a desktop grid and badly in a headset, where there is no
ground plane and a grabbed object should rotate about the thing in your hand.

| Primitive | Parameters                                                                                   |
| --------- | -------------------------------------------------------------------------------------------- |
| Box       | `width`, `height`, `depth`                                                                   |
| Cylinder  | `radius`, `height`, `radialSegments`                                                         |
| Sphere    | `radius`, `segments`                                                                         |
| Cone      | `baseRadius`, `topRadius`, `height`, `radialSegments` — a top radius of 0 gives a true point |
| Torus     | `majorRadius`, `minorRadius`, `majorSegments`, `minorSegments`                               |
| Wedge     | `width`, `height`, `depth`                                                                   |

Defaults are 60mm. A default 1000mm box spawned at arm's length fills the room and cannot be
inspected; desktop users can scale up, and a headset user handed a wall cannot.

## Validating versus normalizing

Two functions, deliberately not one, because the callers want opposite things.

`validateParameters` **reports and changes nothing.** Its caller is usually an inspector field
mid-edit, where the right response is a red outline naming the problem, not an exception and not a
silently corrected value. It returns one issue per problem, attributed to a key. It is also careful
not to pile a cross-parameter complaint on top of a range complaint about the same field — one
mistake, one red outline.

`normalizeParameters` **is total and returns something evaluable.** Missing keys get defaults,
unknown keys are dropped, values are clamped, counts are rounded, and cross-parameter violations are
repaired. There is no input it rejects, so a document that was hand-edited, produced by an older
build, or migrated from a version where a range was different still opens.

`spawnPrimitive` is the registry-aware counterpart to `nodes.ts`'s `primitiveNode`. UI code that
places a shape for a user should call it, so nothing un-normalized ever reaches the store.

## Determinism, and why #6 depends on it

The subtree cache in [#6](https://github.com/kruddage/carve/issues/6) is keyed on parameters:
editing one leaf must re-evaluate only the path from that leaf to the root. That only works if
identical parameters always produce an identical mesh. Two rules keep it true.

**`normalizeParameters` is the single funnel, and it is idempotent.** A parameter map has exactly
one canonical form, so `parametersKey` over it is a usable cache key. Key order does not affect it
and `-0` is collapsed, because both would otherwise mint a second key for one shape — a cache that
misses forever is indistinguishable from no cache at all.

**Tessellation quality is baked into parameters, not read at evaluation time.**
`applyTessellationQuality` scales the `tessellation` parameters (segment counts, never dimensions)
and writes the result into the node. A mesh is a pure function of `(kind, params)` alone. Were
quality a hidden argument, one cache key would name two meshes, and entering XR would serve the
desktop-density mesh back out of cache.

Tiers are `draft` (×0.5), `standard` (×1) and `fine` (×2). `standard` is 1 by definition — the
defaults _are_ the standard tier, so a spawn needs no scaling pass and a document saved on desktop
does not change density when reopened. Each parameter's own minimum still applies, which is why
`draft` cannot drive a cylinder below three sides.

## Icons

`PrimitiveIcon` is a viewBox plus a list of SVG path `d` strings — data, not markup, because
`src/core/` is headless and may not touch the DOM. Enough for the desktop palette to build an
`<svg>` and for the wrist menu to work from the same outline, without either inventing its own
glyph.

The 3D version is `buildPreview` in `src/kernel/preview.ts`: the same solid the document would get,
at `draft` density and framed to a unit box, for a menu that wants a shape that turns rather than a
flat mark. It lives in the kernel because it is mesh work — see
[`docs/kernel.md`](./kernel.md#previews-the-other-kind-of-work). Nothing here has to know about it;
a preview is requested by `kind`, and every default it applies comes back out of this registry.

## What the tests hold down

`test/primitives.test.ts`. Beyond the obvious per-function coverage, two things:

- **Determinism.** `normalizeParameters` is asserted idempotent and total for every kind against
  deliberate junk, and `parametersKey` is asserted independent of key order and sensitive to every
  parameter. Parameter edits are round-tripped through `serialize`/`deserialize` for all six.
- **No hardcoded primitive lists**, which is [#7](https://github.com/kruddage/carve/issues/7)'s
  actual done-when and cannot be tested by calling a function. So it is tested by reading the
  source: every `.ts` file under `src/` is scanned, and naming two or more primitives as string
  literals on one line fails the test. `nodes.ts` is exempt because it declares `PRIMITIVE_KINDS`,
  and `primitives.ts` because the registry must name each kind once to define it.

The list check is blunt, and it is the only kind that catches the failure mode it is aimed at: a
palette that quietly enumerates five of six shapes and looks completely fine.
