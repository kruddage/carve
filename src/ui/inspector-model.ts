/**
 * The parameter inspector, as data.
 *
 * Every field in the inspector is built from a `ParameterSchema` (#25) — label,
 * range, step, unit, description, and whether it is a tessellation knob. There
 * is no per-primitive form anywhere in this project, and #9 says so in as many
 * words: "build fields from `ParameterSchema`, not from a hand-written form per
 * primitive". A hand-written form is how the seventh primitive ships with no
 * inspector.
 *
 * ## Millimetres are a display concern and only that
 *
 * Values are metres in the document and millimetres on screen. #9 is explicit
 * that UI code must not write `* 1000`, and this is the file that would have
 * done it, so every conversion here goes through `toDisplayValue` /
 * `fromDisplayValue` / `formatParameter` from the registry. If the authoring
 * unit ever changes, nothing in `src/ui/` changes with it.
 *
 * ## Validate on every keystroke, normalize only on commit
 *
 * These are different operations and #9 asks for both, separately:
 *
 *   - `validateParameters` reports without mutating. That is the red-outline
 *     path: it runs on every keystroke and its output decorates fields.
 *   - `normalizeParameters` clamps, rounds and repairs. It runs when the edit
 *     is committed, and its output is what gets dispatched.
 *
 * Running normalize per keystroke is the failure this separation exists to
 * prevent: a user typing `0.5` types `0` first, the clamp rewrites it to the
 * minimum, and the field fights back on every character. Stated in #9; the
 * `parseFieldInput` → `commitValue` split is where it is enforced.
 */

import {
  formatParameter,
  fromDisplayValue,
  getPrimitive,
  normalizeParameters,
  setParameters,
  toDisplayValue,
  validateParameters,
  PARAMETER_UNITS,
  type CarveDocument,
  type Command,
  type NodeId,
  type ParameterSchema,
  type PrimitiveNode,
  type Trs,
} from '../core/index.js';

/** A single numeric row in the inspector, ready to render. */
export interface ParameterField {
  readonly schema: ParameterSchema;
  /** Canonical value, straight off the node. */
  readonly value: number;
  /** The same value in authoring units — what goes in the `<input>`. */
  readonly display: number;
  readonly displayMin: number;
  readonly displayMax: number;
  readonly displayStep: number;
  readonly decimals: number;
  readonly suffix: string;
  /** `formatParameter`'s output: the value with its unit, for a read-only label. */
  readonly formatted: string;
  /** From `validateParameters`, or `null` when this field is fine. */
  readonly issue: string | null;
}

/**
 * The inspector's whole view model for one node.
 *
 * Dimensions and tessellation are separate lists because they answer different
 * questions — one changes the shape, the other changes how many triangles
 * describe it — and #9 asks for them grouped apart. Mixing them puts "Sides:
 * 32" next to "Radius: 30mm" as though they were the same kind of decision.
 */
export interface PrimitiveInspection {
  readonly nodeId: NodeId;
  readonly primitiveLabel: string;
  readonly description: string;
  readonly dimensions: readonly ParameterField[];
  readonly tessellation: readonly ParameterField[];
  /** Issues that name a key with no field of its own — an unknown parameter on a migrated file. */
  readonly otherIssues: readonly string[];
}

export function inspectPrimitive(node: PrimitiveNode): PrimitiveInspection {
  const definition = getPrimitive(node.primitive);
  const issues = validateParameters(node.primitive, node.params);
  const issueFor = (key: string): string | null =>
    issues.find((issue) => issue.key === key)?.message ?? null;

  const fields = definition.parameters.map((schema) =>
    buildField(schema, node.params[schema.key] ?? schema.default, issueFor(schema.key)),
  );
  const known = new Set(definition.parameters.map((schema) => schema.key));

  return {
    nodeId: node.id,
    primitiveLabel: definition.label,
    description: definition.description,
    dimensions: fields.filter((field) => !field.schema.tessellation),
    tessellation: fields.filter((field) => field.schema.tessellation === true),
    otherIssues: issues.filter((issue) => !known.has(issue.key)).map((issue) => issue.message),
  };
}

function buildField(schema: ParameterSchema, value: number, issue: string | null): ParameterField {
  const unit = PARAMETER_UNITS[schema.unit];
  return {
    schema,
    value,
    display: toDisplayValue(schema, value),
    displayMin: toDisplayValue(schema, schema.min),
    displayMax: toDisplayValue(schema, schema.max),
    displayStep: toDisplayValue(schema, schema.step),
    decimals: unit.decimals,
    suffix: unit.suffix,
    formatted: formatParameter(schema, value),
    issue,
  };
}

/** What a field's text currently means. Neither branch touches the document. */
export type FieldInput =
  { readonly ok: true; readonly value: number } | { readonly ok: false; readonly message: string };

/**
 * Read a field's text as a canonical value.
 *
 * Deliberately permissive about range: `2000` in a millimetre field is out of
 * range for most parameters and is still a number the user is allowed to have
 * typed. Out-of-range is reported by `validateParameters` once the value is on
 * the node, as a red outline — not by refusing the keystroke, which leaves the
 * field showing something the user cannot correct without deleting it. Only
 * text that is not a number at all is rejected here.
 */
export function parseFieldInput(schema: ParameterSchema, text: string): FieldInput {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, message: 'Enter a number.' };
  // Tolerate a typed unit suffix: the field shows "60.0mm", and selecting all
  // and retyping "62mm" is a thing people do.
  const stripped = trimmed.replace(PARAMETER_UNITS[schema.unit].suffix, '').trim();
  const parsed = Number(stripped);
  if (!Number.isFinite(parsed)) return { ok: false, message: 'Not a number.' };
  return { ok: true, value: fromDisplayValue(schema, parsed) };
}

/**
 * The command that writes one parameter, normalized.
 *
 * Normalization happens over the *whole* map rather than the one key, because
 * the registry's relations span parameters: raising a torus's tube radius past
 * its ring radius is only repairable with both values in hand. `setParameters`
 * merges, so dispatching the full normalized map is also what makes the repair
 * visible in the other field instead of silently applying at evaluation time.
 */
export function commitValue(node: PrimitiveNode, key: string, value: number): Command {
  const merged = normalizeParameters(node.primitive, { ...node.params, [key]: value });
  return setParameters(node.id, merged);
}

/**
 * The command for a live drag on a numeric field.
 *
 * Clamped to the schema range but **not** normalized: a drag cannot produce a
 * value the range does not allow, so the clamp is enough, and running the
 * relation repairs mid-drag would yank the other field around under the
 * cursor. The gesture's commit dispatches `commitValue`, which does normalize.
 */
export function dragValue(node: PrimitiveNode, schema: ParameterSchema, value: number): Command {
  const clamped = Math.min(schema.max, Math.max(schema.min, value));
  return setParameters(node.id, { [schema.key]: clamped });
}

// --- Transform ---------------------------------------------------------------

/** One row of the transform block: a component of translation, rotation or scale. */
export interface TransformField {
  readonly axis: 'x' | 'y' | 'z';
  readonly display: number;
  readonly suffix: string;
  readonly decimals: number;
  readonly step: number;
}

export interface TransformInspection {
  readonly nodeId: NodeId;
  readonly translation: readonly TransformField[];
  readonly scale: readonly TransformField[];
  /** Rotation as degrees about each axis, derived for display only — see below. */
  readonly rotationDegrees: readonly TransformField[];
}

const AXES = ['x', 'y', 'z'] as const;

/**
 * A transform node's TRS, in authoring units.
 *
 * Rotation is shown as XYZ Euler degrees and **read back** the same way. That
 * is lossy in the usual manner — Euler angles are not unique and a quaternion
 * round-tripped through them can come back a different triple than it went in
 * — and it is still what the field has to be, because nobody types a
 * quaternion. The document keeps the quaternion; only this display derives from
 * it, and only when the user commits does a typed Euler triple replace it.
 */
export function inspectTransform(nodeId: NodeId, transform: Trs): TransformInspection {
  const length = PARAMETER_UNITS.length;
  const angle = PARAMETER_UNITS.angle;
  const euler = eulerFromQuat(transform.rotation);

  return {
    nodeId,
    translation: AXES.map((axis) => ({
      axis,
      display: transform.translation[axis] * length.perCanonical,
      suffix: length.suffix,
      decimals: length.decimals,
      step: 1,
    })),
    rotationDegrees: AXES.map((axis) => ({
      axis,
      display: euler[axis] * angle.perCanonical,
      suffix: angle.suffix,
      decimals: angle.decimals,
      step: 1,
    })),
    scale: AXES.map((axis) => ({
      axis,
      display: transform.scale[axis],
      suffix: '×',
      decimals: 3,
      step: 0.01,
    })),
  };
}

/**
 * Euler angles in radians, from a unit quaternion.
 *
 * The convention is **extrinsic XYZ**: the displayed angles are turns about the
 * fixed world X, then Y, then Z, which composes as `Rz · Ry · Rx`. Written down
 * because there are a dozen Euler conventions and picking one silently is how
 * a rotation typed into a field comes back as a different rotation. `quatFromEuler`
 * is its exact inverse and the round trip is asserted in
 * `test/ui-inspector.test.ts`.
 *
 * Written here rather than borrowed from three.js because `src/ui/` reads the
 * renderer's public surface and that surface has no `THREE.Euler` in it by
 * design (see `src/render/index.ts`). A dozen lines of trigonometry is a
 * smaller price than a three.js type in a panel.
 */
export function eulerFromQuat(rotation: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}): { readonly x: number; readonly y: number; readonly z: number } {
  const { x, y, z, w } = rotation;
  const sinPitch = 2 * (w * y - z * x);
  // Gimbal lock: |sin| reaches 1 and roll and yaw stop being separable. Pinning
  // roll to zero and putting the whole turn in yaw is the standard resolution
  // and keeps the displayed triple stable instead of flickering between two
  // equivalent answers a hundredth of a degree apart.
  if (Math.abs(sinPitch) >= 0.999999) {
    return {
      x: 0,
      y: (Math.sign(sinPitch) * Math.PI) / 2,
      z: 2 * Math.atan2(z, w) * Math.sign(sinPitch),
    };
  }
  return {
    x: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
    y: Math.asin(sinPitch),
    z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
  };
}

/** The inverse of `eulerFromQuat`, same extrinsic-XYZ convention. */
export function quatFromEuler(euler: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}): { readonly x: number; readonly y: number; readonly z: number; readonly w: number } {
  const [cx, sx] = [Math.cos(euler.x / 2), Math.sin(euler.x / 2)];
  const [cy, sy] = [Math.cos(euler.y / 2), Math.sin(euler.y / 2)];
  const [cz, sz] = [Math.cos(euler.z / 2), Math.sin(euler.z / 2)];
  return {
    x: sx * cy * cz - cx * sy * sz,
    y: cx * sy * cz + sx * cy * sz,
    z: cx * cy * sz - sx * sy * cz,
    w: cx * cy * cz + sx * sy * sz,
  };
}

/**
 * The node the inspector should show for a selection.
 *
 * A selection names the thing you clicked, which is usually a transform node
 * wrapping a primitive (`placedPrimitive` guarantees the pairing). Showing only
 * the transform would mean selecting a box and being offered no way to change
 * its width, so the inspector follows the single primitive child down. It stops
 * at the first branch: a transform over a boolean has no one primitive to show,
 * and guessing one is worse than showing none.
 */
export function primitiveUnder(document: CarveDocument, nodeId: NodeId): PrimitiveNode | null {
  const node = document.get(nodeId);
  if (!node) return null;
  if (node.kind === 'primitive') return node;
  if (node.kind !== 'transform') return null;
  const children = document.childrenOf(nodeId);
  if (children.length !== 1) return null;
  const child = children[0] === undefined ? undefined : document.get(children[0]);
  return child?.kind === 'primitive' ? child : null;
}
