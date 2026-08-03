/**
 * The inspector's model.
 *
 * The claim under test is #9's: the inspector reads the registry and never
 * reinvents it. So the assertions are mostly about *not* doing things —
 * millimetres never computed by hand, normalize never run on a keystroke, no
 * form built per primitive — because each of those is a thing that works fine
 * until the registry changes underneath it.
 *
 * `every primitive gets a complete set of fields` is the one that generalizes:
 * it runs over `listPrimitives()`, so a seventh primitive is covered the day it
 * is added rather than the day someone remembers to extend this file.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  IDENTITY_TRS,
  PARAMETER_UNITS,
  getParameterSchema,
  getPrimitive,
  insertBundle,
  listPrimitives,
  makeTrs,
  placedPrimitive,
  quat,
  spawnPrimitive,
  vec3,
  type PrimitiveNode,
} from '../src/core/index.js';
import {
  commitValue,
  dragValue,
  eulerFromQuat,
  inspectPrimitive,
  inspectTransform,
  parseFieldInput,
  primitiveUnder,
  quatFromEuler,
} from '../src/ui/index.js';

describe('fields come from the schema', () => {
  it('gives every primitive a complete set of fields, dimensions and tessellation apart', () => {
    for (const definition of listPrimitives()) {
      const inspection = inspectPrimitive(spawnPrimitive(definition.kind));
      const shown = [...inspection.dimensions, ...inspection.tessellation];

      expect(shown.map((field) => field.schema.key).sort(), definition.kind).toEqual(
        definition.parameters.map((parameter) => parameter.key).sort(),
      );
      // Tessellation knobs change triangle count, not shape, and #9 asks for
      // them grouped apart. The flag on the schema is the only thing deciding.
      expect(
        inspection.dimensions.every((field) => field.schema.tessellation !== true),
        definition.kind,
      ).toBe(true);
      expect(
        inspection.tessellation.every((field) => field.schema.tessellation === true),
        definition.kind,
      ).toBe(true);
      expect(inspection.primitiveLabel).toBe(definition.label);
    }
  });

  it('shows lengths in millimetres and counts as bare numbers', () => {
    const box = spawnPrimitive('box');
    const width = inspectPrimitive(box).dimensions.find((field) => field.schema.key === 'width');
    expect(width).toBeDefined();
    if (!width) return;

    // 60mm is the registry's nominal size; the field must not have invented it.
    expect(width.display).toBeCloseTo(width.value * PARAMETER_UNITS.length.perCanonical, 9);
    expect(width.suffix).toBe('mm');
    expect(width.formatted).toBe('60.0mm');

    const sides = inspectPrimitive(spawnPrimitive('cylinder')).tessellation[0];
    expect(sides?.suffix).toBe('');
    expect(sides?.decimals).toBe(0);
  });

  it('reports an out-of-range value as an issue on that field, without changing it', () => {
    const box = spawnPrimitive('box');
    const broken: PrimitiveNode = { ...box, params: { ...box.params, width: -1 } };
    const inspection = inspectPrimitive(broken);

    const width = inspection.dimensions.find((field) => field.schema.key === 'width');
    expect(width?.issue).toBeTruthy();
    expect(width?.value).toBe(-1);
    // Every other field is fine — the issue is attributed, not global.
    expect(inspection.dimensions.filter((field) => field.issue !== null)).toHaveLength(1);
  });

  it('surfaces a relation violation against one of the keys it names', () => {
    const torus = spawnPrimitive('torus');
    const broken: PrimitiveNode = {
      ...torus,
      params: { ...torus.params, minorRadius: (torus.params.majorRadius ?? 0) * 2 },
    };
    const issues = inspectPrimitive(broken).dimensions.filter((field) => field.issue !== null);
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('reading a field back', () => {
  const width = getParameterSchema('box', 'width');

  it('converts display units to canonical ones', () => {
    expect(width).toBeDefined();
    if (!width) return;
    expect(parseFieldInput(width, '42')).toEqual({ ok: true, value: 0.042 });
  });

  it('tolerates a typed unit suffix, because the field shows one', () => {
    if (!width) return;
    expect(parseFieldInput(width, ' 42mm ')).toEqual({ ok: true, value: 0.042 });
  });

  it('rejects text that is not a number at all', () => {
    if (!width) return;
    expect(parseFieldInput(width, 'wide').ok).toBe(false);
    expect(parseFieldInput(width, '').ok).toBe(false);
  });

  it('accepts an out-of-range number rather than fighting the keystroke', () => {
    // 9000mm is past the 2m maximum. Refusing it here would leave the field
    // holding text the user cannot fix without deleting it; the red outline
    // comes from `validateParameters` once the value is on the node.
    if (!width) return;
    expect(parseFieldInput(width, '9000')).toEqual({ ok: true, value: 9 });
  });
});

describe('validate on keystroke, normalize on commit', () => {
  function boxDocument(): { document: CarveDocument; box: PrimitiveNode } {
    const document = CarveDocument.create();
    const box = spawnPrimitive('box');
    document.dispatch(insertBundle(placedPrimitive(box, IDENTITY_TRS), document.rootId));
    return { document, box };
  }

  it('clamps a drag to the schema range but leaves relations alone', () => {
    const torus = spawnPrimitive('torus');
    const minor = getParameterSchema('torus', 'minorRadius');
    expect(minor).toBeDefined();
    if (!minor) return;

    const document = CarveDocument.create();
    document.dispatch(insertBundle(placedPrimitive(torus, IDENTITY_TRS), document.rootId));

    // Mid-drag past the ring radius: clamped to the range, and deliberately not
    // repaired, or the other field would jump around under the cursor.
    document.dispatch(dragValue(torus, minor, 5));
    const dragged = document.expect(torus.id);
    expect(dragged.kind === 'primitive' && dragged.params.minorRadius).toBe(minor.max);
  });

  it('normalizes the whole map on commit, so a relation repair is visible', () => {
    const torus = spawnPrimitive('torus');
    const document = CarveDocument.create();
    document.dispatch(insertBundle(placedPrimitive(torus, IDENTITY_TRS), document.rootId));

    document.dispatch(commitValue(torus, 'minorRadius', 5));
    const after = document.expect(torus.id);
    if (after.kind !== 'primitive') return;
    // Repaired to something smaller than the ring radius, which is the whole
    // point of normalizing over the map rather than the one key.
    expect(after.params.minorRadius).toBeLessThan(after.params.majorRadius ?? 0);
    expect(inspectPrimitive(after).dimensions.every((field) => field.issue === null)).toBe(true);
  });

  it('makes a parameter edit one undo entry', () => {
    const { document, box } = boxDocument();
    const depth = document.undoDepth;
    document.dispatch(commitValue(box, 'width', 0.1));
    expect(document.undoDepth).toBe(depth + 1);

    document.undo();
    const restored = document.expect(box.id);
    expect(restored.kind === 'primitive' && restored.params.width).toBe(box.params.width);
  });

  it('coalesces a whole field drag into one entry', () => {
    const { document, box } = boxDocument();
    const width = getParameterSchema('box', 'width');
    if (!width) return;
    const depth = document.undoDepth;

    const drag = document.beginGesture('Width');
    for (let step = 1; step <= 20; step += 1) {
      drag.dispatch(dragValue(box, width, 0.06 + step * width.step));
    }
    drag.commit();

    expect(document.undoDepth).toBe(depth + 1);
    document.undo();
    const restored = document.expect(box.id);
    expect(restored.kind === 'primitive' && restored.params.width).toBeCloseTo(0.06, 9);
  });
});

describe('the transform block', () => {
  it('shows translation in millimetres and scale as a bare ratio', () => {
    const inspection = inspectTransform(
      'node',
      makeTrs({ translation: vec3(0.025, 0, -0.1), scale: vec3(2, 1, 1) }),
    );
    expect(inspection.translation[0]?.display).toBeCloseTo(25, 9);
    expect(inspection.translation[2]?.display).toBeCloseTo(-100, 9);
    expect(inspection.translation[0]?.suffix).toBe('mm');
    expect(inspection.scale[0]?.display).toBe(2);
  });

  it('round-trips a rotation through Euler degrees', () => {
    const original = quatFromEuler({ x: 0.3, y: -0.8, z: 1.1 });
    const back = quatFromEuler(eulerFromQuat(original));
    // Quaternions are double covers, so `q` and `-q` are the same rotation.
    const same =
      Math.abs(back.x - original.x) < 1e-9 &&
      Math.abs(back.y - original.y) < 1e-9 &&
      Math.abs(back.z - original.z) < 1e-9 &&
      Math.abs(back.w - original.w) < 1e-9;
    const negated =
      Math.abs(back.x + original.x) < 1e-9 &&
      Math.abs(back.y + original.y) < 1e-9 &&
      Math.abs(back.z + original.z) < 1e-9 &&
      Math.abs(back.w + original.w) < 1e-9;
    expect(same || negated).toBe(true);
  });

  it('does not produce NaN at gimbal lock', () => {
    // A 90° pitch is where `asin` reaches its limit and roll and yaw stop
    // being separable. The displayed triple has to stay finite and stable.
    const straightUp = quatFromEuler({ x: 0, y: Math.PI / 2, z: 0 });
    const euler = eulerFromQuat(straightUp);
    expect(Number.isFinite(euler.x)).toBe(true);
    expect(Number.isFinite(euler.y)).toBe(true);
    expect(Number.isFinite(euler.z)).toBe(true);
    expect(euler.y).toBeCloseTo(Math.PI / 2, 6);
  });

  it('reports degrees, converted through the registry’s unit', () => {
    const quarterTurn = quat(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4));
    const inspection = inspectTransform('node', makeTrs({ rotation: quarterTurn }));
    expect(inspection.rotationDegrees[1]?.display).toBeCloseTo(90, 6);
    expect(inspection.rotationDegrees[1]?.suffix).toBe(PARAMETER_UNITS.angle.suffix);
  });
});

describe('which node the inspector shows', () => {
  it('follows a transform down to the single primitive it wraps', () => {
    const document = CarveDocument.create();
    const box = spawnPrimitive('box');
    const bundle = placedPrimitive(box, IDENTITY_TRS);
    document.dispatch(insertBundle(bundle, document.rootId));

    expect(primitiveUnder(document, bundle.rootId)?.id).toBe(box.id);
    expect(primitiveUnder(document, box.id)?.id).toBe(box.id);
  });

  it('shows nothing for a node with no single primitive under it', () => {
    const document = CarveDocument.create();
    expect(primitiveUnder(document, document.rootId)).toBeNull();
    expect(primitiveUnder(document, 'missing')).toBeNull();
  });

  it('labels the primitive from the registry', () => {
    for (const definition of listPrimitives()) {
      expect(inspectPrimitive(spawnPrimitive(definition.kind)).primitiveLabel).toBe(
        getPrimitive(definition.kind).label,
      );
    }
  });
});
