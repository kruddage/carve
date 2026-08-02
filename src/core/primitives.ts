/**
 * The parametric primitive set: what each shape's parameters *are*, what values
 * are legal, and one registry that everything else enumerates instead of
 * hardcoding a list of six strings.
 *
 * This is the `7a` half of issue #7 — schemas, units, defaults, validation and
 * the registry. Mesh construction, tessellation into triangles and 3D preview
 * thumbnails are `7b`, and they land after the kernel in #6, because a mesh
 * builder without a boolean to feed cannot be shown to be correct.
 *
 * `nodes.ts` deliberately does not know what a torus is: a `PrimitiveNode`
 * carries `primitive` plus an untyped bag of numbers, and the document model's
 * job is to keep that bag editable and undoable. This file is the other half of
 * that arrangement — the only place that knows a torus has a major and a minor
 * radius, and the only place that knows a minor radius larger than the major
 * one is a self-intersecting solid the kernel cannot make manifold.
 *
 * ## Units: stored in metres, shown in millimetres
 *
 * Issue #7 asks for millimetres and `math.ts` already says metres. Both are
 * right about different things, so the split is explicit:
 *
 *   - **Canonical storage is metres and radians.** `Trs.translation` is metres
 *     because WebXR poses are metres, and a primitive whose parameters were
 *     millimetres would mean a unit conversion at exactly the boundary where a
 *     factor-of-1000 bug is hardest to see — a box would be right until you
 *     grabbed it. Serialization, the kernel, and every transform stay in one
 *     unit.
 *   - **The authoring unit is millimetres**, declared once here in
 *     `PARAMETER_UNITS` and read by the inspector (#9) and the wrist menu
 *     (#12). Both call `formatParameter` / `toDisplayValue` /
 *     `fromDisplayValue` rather than each writing their own `* 1000`.
 *
 * "Pick a unit now and never revisit it" holds for both halves. What must never
 * happen is a *third* convention appearing in a UI file.
 *
 * ## Defaults are sized for a headset, not for a CAD viewport
 *
 * A default 1000mm box spawned at arm's length fills the room and cannot be
 * inspected. Defaults here are 60mm — a part you can hold, boolean against, and
 * see all of without walking backwards. Desktop users can scale up; a headset
 * user handed a wall cannot.
 *
 * ## Determinism
 *
 * The subtree cache in #6 is keyed on parameters, so identical parameters must
 * always yield an identical mesh. Two rules keep that true:
 *
 *   1. `normalizeParameters` is the single funnel. It fills in defaults, drops
 *      unknown keys, clamps to range, rounds counts to integers and repairs
 *      cross-parameter violations — so a node's parameter map has exactly one
 *      canonical form and `parametersKey` over it is a usable cache key.
 *   2. Tessellation quality is *baked into parameters* at edit time by
 *      `applyTessellationQuality`, never read as ambient state at evaluation
 *      time. A mesh is a pure function of `(kind, params)` alone; if quality
 *      were a hidden argument, the same cache key would name two meshes and
 *      switching to XR would serve a desktop-density mesh from cache.
 */

import { primitiveNode, type PrimitiveKind, type PrimitiveNode } from './nodes.js';

/**
 * What a number *means*, which is what decides how it is shown and how it is
 * scaled. Not a full unit system — three kinds is all the v1 primitive set
 * needs, and an unused abstraction is a liability in a file this central.
 */
export type ParameterUnit = 'length' | 'angle' | 'count';

export interface UnitDisplay {
  /** Multiply a canonical value by this to get the number shown to a user. */
  readonly perCanonical: number;
  readonly suffix: string;
  readonly decimals: number;
}

/** The authoring units. The one place `* 1000` is allowed to be written. */
export const PARAMETER_UNITS: Readonly<Record<ParameterUnit, UnitDisplay>> = Object.freeze({
  length: Object.freeze({ perCanonical: 1000, suffix: 'mm', decimals: 1 }),
  angle: Object.freeze({ perCanonical: 180 / Math.PI, suffix: '°', decimals: 1 }),
  count: Object.freeze({ perCanonical: 1, suffix: '', decimals: 0 }),
});

export interface ParameterSchema {
  /** Key in `PrimitiveNode.params`. Stable — it is in saved files. */
  readonly key: string;
  /** Inspector label. Free to change; not an identifier. */
  readonly label: string;
  readonly unit: ParameterUnit;
  /** All three in canonical units: metres, radians, or a bare count. */
  readonly default: number;
  readonly min: number;
  readonly max: number;
  /** Drag/slider increment, canonical units. Not a quantization grid. */
  readonly step: number;
  /**
   * True for a tessellation knob — a value that changes triangle count without
   * changing the shape being described. Scaled by `applyTessellationQuality`,
   * grouped separately in the inspector, and always an integer.
   */
  readonly tessellation?: boolean;
  readonly description: string;
}

/**
 * A rule spanning more than one parameter.
 *
 * Ranges alone cannot express "the minor radius must be smaller than the major
 * one" — both can be individually legal and jointly describe a solid that
 * self-intersects, which `manifold-3d` will either reject or silently turn into
 * a mesh nobody asked for. `holds` reports; `repair` fixes, and the pair must
 * agree: after `repair`, `holds` is true.
 */
interface ParameterRelation {
  /** Parameters involved, for attributing the issue in the inspector. */
  readonly keys: readonly [string, ...string[]];
  readonly message: string;
  readonly holds: (params: Readonly<Record<string, number>>) => boolean;
  /** Mutates a draft in place. Only ever called on a private working copy. */
  readonly repair: (draft: Record<string, number>) => void;
}

/**
 * A primitive's icon, as data rather than as markup.
 *
 * `src/core/` is headless and must not touch the DOM, so this is a viewBox and
 * a list of path `d` strings — enough for the desktop palette to build an
 * `<svg>` and for the wrist menu to extrude the same outline, without either
 * inventing its own glyph. The 3D preview mesh is `7b`; this is the flat mark
 * that has to exist before there is anything to render.
 */
export interface PrimitiveIcon {
  readonly viewBox: string;
  readonly paths: readonly string[];
}

export interface PrimitiveDefinition {
  readonly kind: PrimitiveKind;
  readonly label: string;
  readonly description: string;
  readonly parameters: readonly ParameterSchema[];
  readonly relations: readonly ParameterRelation[];
  readonly icon: PrimitiveIcon;
}

/** Quality tiers. A headset at 72fps cannot afford desktop sphere density. */
export const TESSELLATION_QUALITIES = ['draft', 'standard', 'fine'] as const;
export type TessellationQuality = (typeof TESSELLATION_QUALITIES)[number];

/**
 * Multipliers applied to every `tessellation: true` parameter.
 *
 * `standard` is 1 by definition: the defaults below *are* the standard tier, so
 * a spawned primitive needs no scaling pass and a document saved on desktop
 * does not silently change density when reopened. Clamping to each parameter's
 * own min/max still applies, which is why `draft` cannot drive a cylinder below
 * three sides.
 */
export const TESSELLATION_SCALE: Readonly<Record<TessellationQuality, number>> = Object.freeze({
  draft: 0.5,
  standard: 1,
  fine: 2,
});

export const DEFAULT_TESSELLATION_QUALITY: TessellationQuality = 'standard';

/** Default extent of a spawned primitive, in metres. See the header note. */
const NOMINAL_SIZE = 0.06;
/** Smallest meaningful dimension: 0.1mm, below print and machining tolerance. */
const MIN_SIZE = 0.0001;
/** Largest single primitive: 2m, past which you are modelling the room. */
const MAX_SIZE = 2;
/** 1mm drag increment — one detent is a number a machinist would type. */
const SIZE_STEP = 0.001;

/** A length parameter with the shared range, since five of six primitives want it. */
function lengthParameter(
  key: string,
  label: string,
  defaultValue: number,
  description: string,
): ParameterSchema {
  return {
    key,
    label,
    unit: 'length',
    default: defaultValue,
    min: MIN_SIZE,
    max: MAX_SIZE,
    step: SIZE_STEP,
    description,
  };
}

/**
 * A tessellation count.
 *
 * `min` is the lowest count that still bounds a solid — three sides for a
 * radial sweep, four for a sphere's rings. `max` is 256, which is far past
 * useful and exists only to stop a fat-fingered inspector entry from handing
 * the worker a million-triangle sphere.
 */
function segmentParameter(
  key: string,
  label: string,
  defaultValue: number,
  minimum: number,
  description: string,
): ParameterSchema {
  return {
    key,
    label,
    unit: 'count',
    default: defaultValue,
    min: minimum,
    max: 256,
    step: 1,
    tessellation: true,
    description,
  };
}

/**
 * The six shapes, in palette order.
 *
 * Order is the order they appear in the desktop palette (#9) and around the
 * wrist menu (#12): the three you reach for constantly first, then the three
 * you reach for occasionally. Both UIs enumerate this array, so reordering here
 * reorders both and neither can drift.
 *
 * Every solid is centred on its own origin with +Y up, so a `transform` node's
 * translation places the *centre* of the shape. The alternative — sitting on
 * the XZ plane — reads well on a desktop grid and badly in a headset, where
 * there is no ground plane to sit on and a grabbed object should rotate about
 * the thing in your hand.
 */
const DEFINITIONS: readonly PrimitiveDefinition[] = [
  {
    kind: 'box',
    label: 'Box',
    description: 'Rectangular block. The base of most hard-surface parts.',
    parameters: [
      lengthParameter('width', 'Width', NOMINAL_SIZE, 'Extent along X.'),
      lengthParameter('height', 'Height', NOMINAL_SIZE, 'Extent along Y.'),
      lengthParameter('depth', 'Depth', NOMINAL_SIZE, 'Extent along Z.'),
    ],
    relations: [],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v8'],
    },
  },
  {
    kind: 'cylinder',
    label: 'Cylinder',
    description: 'Round bar or, subtracted, a through-hole.',
    parameters: [
      lengthParameter('radius', 'Radius', NOMINAL_SIZE / 2, 'Radius in the XZ plane.'),
      lengthParameter('height', 'Height', NOMINAL_SIZE, 'Extent along Y.'),
      segmentParameter('radialSegments', 'Sides', 32, 3, 'Sides around the axis.'),
    ],
    relations: [],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M6 7a6 3 0 1 0 12 0a6 3 0 1 0 -12 0', 'M6 7v10', 'M18 7v10', 'M6 17a6 3 0 0 0 12 0'],
    },
  },
  {
    kind: 'sphere',
    label: 'Sphere',
    description: 'Ball. Subtracted, a spherical pocket or a rounded end.',
    parameters: [
      lengthParameter('radius', 'Radius', NOMINAL_SIZE / 2, 'Radius in every direction.'),
      segmentParameter('segments', 'Segments', 32, 4, 'Divisions around and over the pole.'),
    ],
    relations: [],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0 -16', 'M12 4a5 8 0 1 0 0 16a5 8 0 1 0 0 -16'],
    },
  },
  {
    kind: 'cone',
    label: 'Cone',
    description: 'Truncated cone. A top radius of zero gives a true point.',
    parameters: [
      lengthParameter('baseRadius', 'Base radius', NOMINAL_SIZE / 2, 'Radius at −Y.'),
      {
        key: 'topRadius',
        label: 'Top radius',
        unit: 'length',
        // Zero is the useful default and the one value the shared length range
        // must not forbid: a cone with a flat top is a frustum, not a cone.
        default: 0,
        min: 0,
        max: MAX_SIZE,
        step: SIZE_STEP,
        description: 'Radius at +Y. Zero for a point.',
      },
      lengthParameter('height', 'Height', NOMINAL_SIZE, 'Extent along Y.'),
      segmentParameter('radialSegments', 'Sides', 32, 3, 'Sides around the axis.'),
    ],
    relations: [
      {
        keys: ['baseRadius', 'topRadius'],
        message: 'A cone needs a non-zero radius at one end.',
        holds: (params) => (params.baseRadius ?? 0) > 0 || (params.topRadius ?? 0) > 0,
        repair: (draft) => {
          draft.baseRadius = NOMINAL_SIZE / 2;
        },
      },
    ],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M12 4l6 13', 'M12 4l-6 13', 'M6 17a6 3 0 0 0 12 0a6 3 0 0 0 -12 0'],
    },
  },
  {
    kind: 'torus',
    label: 'Torus',
    description: 'Ring. Subtracted, an O-ring groove or a relief channel.',
    parameters: [
      lengthParameter('majorRadius', 'Ring radius', NOMINAL_SIZE * 0.7, 'Centre to tube centre.'),
      lengthParameter('minorRadius', 'Tube radius', NOMINAL_SIZE * 0.2, 'Radius of the tube.'),
      segmentParameter('majorSegments', 'Ring segments', 48, 3, 'Divisions around the ring.'),
      segmentParameter('minorSegments', 'Tube segments', 16, 3, 'Divisions around the tube.'),
    ],
    relations: [
      {
        keys: ['minorRadius', 'majorRadius'],
        message: 'Tube radius must be smaller than ring radius, or the tube passes through itself.',
        // Strictly less: equal radii close the hole to a single degenerate
        // point at the centre, which is not a manifold solid either.
        holds: (params) => (params.minorRadius ?? 0) < (params.majorRadius ?? 0),
        repair: (draft) => {
          // 0.45 rather than 0.5 so the repaired ring keeps a visible hole
          // instead of landing on the degenerate case it was rescued from.
          draft.minorRadius = (draft.majorRadius ?? NOMINAL_SIZE * 0.7) * 0.45;
        },
      },
    ],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M12 6a9 6 0 1 0 0 12a9 6 0 1 0 0 -12', 'M12 10a4 2 0 1 0 0 4a4 2 0 1 0 0 -4'],
    },
  },
  {
    kind: 'wedge',
    label: 'Wedge',
    description: 'Right triangular prism. Chamfers and gussets before #13 has fillets.',
    parameters: [
      lengthParameter('width', 'Width', NOMINAL_SIZE, 'Extent along X.'),
      lengthParameter('height', 'Height', NOMINAL_SIZE, 'Extent along Y, tapering to zero at +X.'),
      lengthParameter('depth', 'Depth', NOMINAL_SIZE, 'Extent along Z.'),
    ],
    relations: [],
    icon: {
      viewBox: '0 0 24 24',
      paths: ['M4 18h12l4-4V6l-4 4H4z', 'M4 18l4-4h12', 'M8 14V6l8 4'],
    },
  },
];

/** The registry. Lookup by kind; `listPrimitives()` for palette order. */
export const PRIMITIVE_REGISTRY: Readonly<Record<PrimitiveKind, PrimitiveDefinition>> =
  Object.freeze(
    Object.fromEntries(DEFINITIONS.map((definition) => [definition.kind, definition])) as Record<
      PrimitiveKind,
      PrimitiveDefinition
    >,
  );

/**
 * Every primitive, in palette order.
 *
 * This is the enumeration UIs must use. A hardcoded `['box', 'cylinder', ...]`
 * anywhere else is the drift issue #7 is about: it compiles, it looks right,
 * and it silently omits the seventh primitive from one of the two frontends.
 */
export function listPrimitives(): readonly PrimitiveDefinition[] {
  return DEFINITIONS;
}

export function getPrimitive(kind: PrimitiveKind): PrimitiveDefinition {
  return PRIMITIVE_REGISTRY[kind];
}

export function getParameterSchema(kind: PrimitiveKind, key: string): ParameterSchema | undefined {
  return getPrimitive(kind).parameters.find((parameter) => parameter.key === key);
}

/** A fresh, canonical parameter map. Always valid by construction. */
export function defaultParameters(kind: PrimitiveKind): Readonly<Record<string, number>> {
  const params: Record<string, number> = {};
  for (const parameter of getPrimitive(kind).parameters) params[parameter.key] = parameter.default;
  return Object.freeze(params);
}

/** A single thing wrong with a parameter map, addressed to one key. */
export interface ParameterIssue {
  readonly key: string;
  readonly message: string;
}

/**
 * Everything wrong with `params`, without changing it.
 *
 * Reports rather than throws, because the caller is usually an inspector field
 * mid-edit and the right response is a red outline, not an exception. The
 * kernel's degenerate-input handling in #6 has the same shape for the same
 * reason: surface a warning on the node, do not throw.
 */
export function validateParameters(
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
): readonly ParameterIssue[] {
  const definition = getPrimitive(kind);
  const issues: ParameterIssue[] = [];
  const known = new Set<string>();

  for (const parameter of definition.parameters) {
    known.add(parameter.key);
    const value = params[parameter.key];
    if (value === undefined) {
      issues.push({ key: parameter.key, message: `Missing ${parameter.label.toLowerCase()}.` });
      continue;
    }
    if (!Number.isFinite(value)) {
      issues.push({ key: parameter.key, message: `${parameter.label} must be a finite number.` });
      continue;
    }
    if (value < parameter.min || value > parameter.max) {
      issues.push({
        key: parameter.key,
        message: `${parameter.label} must be between ${formatValue(parameter, parameter.min)} and ${formatValue(parameter, parameter.max)}.`,
      });
      continue;
    }
    if (parameter.unit === 'count' && !Number.isInteger(value)) {
      issues.push({ key: parameter.key, message: `${parameter.label} must be a whole number.` });
    }
  }

  for (const key of Object.keys(params)) {
    if (!known.has(key)) {
      issues.push({ key, message: `${definition.label} has no parameter "${key}".` });
    }
  }

  // Relations are checked last and only against values that already passed the
  // per-parameter pass — comparing a NaN major radius to a minor one produces a
  // second, less useful complaint about a problem already reported.
  const perKeyProblem = new Set(issues.map((issue) => issue.key));
  for (const relation of definition.relations) {
    if (relation.keys.some((key) => perKeyProblem.has(key))) continue;
    if (!relation.holds(params)) {
      issues.push({ key: relation.keys[0], message: relation.message });
    }
  }

  return issues;
}

/**
 * The canonical form of `params`: complete, in range, integral where required,
 * relation-satisfying, and free of keys this primitive does not have.
 *
 * Total by design — there is no input this rejects. Anything unusable is
 * replaced with the default rather than thrown over, so a document that was
 * hand-edited, produced by an older build, or migrated from a version where a
 * parameter had a different range still opens. `validateParameters` is what
 * tells a user something was wrong; this is what makes the tree evaluable.
 *
 * Idempotent: `normalize(normalize(p))` deep-equals `normalize(p)`. #6's cache
 * key depends on that, and the test suite asserts it.
 */
export function normalizeParameters(
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>> = {},
): Readonly<Record<string, number>> {
  const definition = getPrimitive(kind);
  const draft: Record<string, number> = {};

  for (const parameter of definition.parameters) {
    draft[parameter.key] = coerce(parameter, params[parameter.key]);
  }

  for (const relation of definition.relations) {
    if (relation.holds(draft)) continue;
    relation.repair(draft);
    // A repair writes a raw value; run it back through the per-parameter rules
    // so it cannot land outside the range it was repaired into.
    for (const key of relation.keys) {
      const parameter = definition.parameters.find((candidate) => candidate.key === key);
      if (parameter) draft[key] = coerce(parameter, draft[key]);
    }
  }

  return Object.freeze(draft);
}

/** One parameter's worth of clamping. Undefined and NaN both fall back to the default. */
function coerce(parameter: ParameterSchema, value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return parameter.default;
  const clamped = Math.min(parameter.max, Math.max(parameter.min, value));
  // Round before the final clamp so rounding cannot push a value back out of
  // range — `Math.round` on a max of 255.6 would otherwise give 256.
  return parameter.unit === 'count'
    ? Math.min(parameter.max, Math.max(parameter.min, Math.round(clamped)))
    : normalizeZero(clamped);
}

/** `-0` and `0` are the same length but different strings, and `parametersKey` uses strings. */
function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Bake a quality tier into a parameter map.
 *
 * Only `tessellation` parameters move; a draft-quality box is the same box.
 * Called when spawning into an XR session or when the user changes quality —
 * never during evaluation. See the determinism note in the file header for why
 * that separation is load-bearing rather than stylistic.
 */
export function applyTessellationQuality(
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
  quality: TessellationQuality,
): Readonly<Record<string, number>> {
  const scale = TESSELLATION_SCALE[quality];
  const normalized = normalizeParameters(kind, params);
  const draft: Record<string, number> = { ...normalized };
  for (const parameter of getPrimitive(kind).parameters) {
    if (!parameter.tessellation) continue;
    draft[parameter.key] = Math.round((normalized[parameter.key] ?? parameter.default) * scale);
  }
  return normalizeParameters(kind, draft);
}

/**
 * A stable string identifying `(kind, params)`, for #6's subtree cache.
 *
 * Sorted keys so map insertion order cannot produce two keys for one shape, and
 * exact values rather than rounded ones: quantizing here would let two visibly
 * different radii share a cached mesh, which is a wrong picture rather than a
 * slow one. Callers must pass a normalized map — `normalizeParameters` is what
 * guarantees that equivalent inputs reduce to one key.
 */
export function parametersKey(
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
): string {
  const entries = Object.keys(params)
    .sort()
    .map((key) => `${key}=${normalizeZero(params[key] ?? Number.NaN)}`);
  return `${kind}(${entries.join(',')})`;
}

/** Canonical value → the number a user sees. Metres to millimetres, radians to degrees. */
export function toDisplayValue(parameter: ParameterSchema, value: number): number {
  return value * PARAMETER_UNITS[parameter.unit].perCanonical;
}

/** The inverse. What an inspector field hands back after the user types in it. */
export function fromDisplayValue(parameter: ParameterSchema, display: number): number {
  return display / PARAMETER_UNITS[parameter.unit].perCanonical;
}

/**
 * A value with its unit, e.g. `60.0mm`, `32`.
 *
 * Lives here rather than in the UI so the desktop inspector and the wrist menu
 * cannot disagree about precision — the same edit read off a monitor and read
 * off a wrist must be the same number.
 */
export function formatParameter(parameter: ParameterSchema, value: number): string {
  return formatValue(parameter, value);
}

function formatValue(parameter: ParameterSchema, value: number): string {
  const unit = PARAMETER_UNITS[parameter.unit];
  return `${toDisplayValue(parameter, value).toFixed(unit.decimals)}${unit.suffix}`;
}

export interface SpawnPrimitiveOptions {
  /** Partial overrides; anything omitted comes from the registry defaults. */
  readonly params?: Readonly<Record<string, number>>;
  readonly name?: string;
  /** Defaults to `standard`. Pass `draft` when spawning into an XR session. */
  readonly quality?: TessellationQuality;
}

/**
 * A `PrimitiveNode` with registry-correct parameters.
 *
 * The registry-aware counterpart to `primitiveNode` in `nodes.ts`: that one
 * takes whatever bag of numbers it is given, because the document model is not
 * allowed to know what a torus is. This one is what UI code and the wrist menu
 * should call, so that nothing spawned by a user is ever un-normalized.
 */
export function spawnPrimitive(
  kind: PrimitiveKind,
  options: SpawnPrimitiveOptions = {},
): PrimitiveNode {
  const quality = options.quality ?? DEFAULT_TESSELLATION_QUALITY;
  const params = applyTessellationQuality(kind, options.params ?? {}, quality);
  return primitiveNode({
    primitive: kind,
    name: options.name ?? getPrimitive(kind).label,
    params,
  });
}
