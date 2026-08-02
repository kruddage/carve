/**
 * The primitive registry: schemas, defaults, normalization, units.
 *
 * Two things are being defended here beyond "the functions work".
 *
 * The first is **determinism**. Issue #6's subtree cache is keyed on parameters,
 * so `normalizeParameters` has to be a real canonical form: idempotent, total,
 * and order-independent. If two parameter maps that describe the same solid can
 * produce two different keys, the cache misses forever and every leaf edit
 * re-solves the whole tree. If two maps that describe *different* solids can
 * produce the same key, the viewport shows the wrong mesh.
 *
 * The second is **no hardcoded primitive lists**, which is issue #7's actual
 * done-when. That one cannot be tested by calling a function, so it is tested by
 * reading the source: `sourceHasNoHardcodedPrimitiveList` walks every file in
 * src/ and fails if any of them enumerates the primitive names inline. It is a
 * blunt check and it is the only kind that catches the failure mode, which is a
 * palette that quietly lists five of six shapes.
 */

import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TESSELLATION_QUALITY,
  PARAMETER_UNITS,
  PRIMITIVE_KINDS,
  PRIMITIVE_REGISTRY,
  TESSELLATION_QUALITIES,
  applyTessellationQuality,
  defaultParameters,
  formatParameter,
  fromDisplayValue,
  getParameterSchema,
  getPrimitive,
  listPrimitives,
  normalizeParameters,
  parametersKey,
  spawnPrimitive,
  toDisplayValue,
  validateParameters,
  type PrimitiveKind,
} from '../src/core/index.js';
import {
  CarveDocument,
  IDENTITY_TRS,
  deserializeJson,
  insertBundle,
  placedPrimitive,
  serialize,
  setParameters,
} from '../src/core/index.js';

const ALL: readonly PrimitiveKind[] = PRIMITIVE_KINDS;

describe('the registry covers the primitive set exactly', () => {
  it('has one definition per kind in nodes.ts, and no extras', () => {
    expect(
      listPrimitives()
        .map((definition) => definition.kind)
        .sort(),
    ).toEqual([...ALL].sort());
    expect(Object.keys(PRIMITIVE_REGISTRY).sort()).toEqual([...ALL].sort());
  });

  it('gives every primitive a label, a description, an icon and at least one parameter', () => {
    for (const definition of listPrimitives()) {
      expect(definition.label, definition.kind).not.toHaveLength(0);
      expect(definition.description, definition.kind).not.toHaveLength(0);
      expect(definition.icon.paths.length, definition.kind).toBeGreaterThan(0);
      expect(definition.parameters.length, definition.kind).toBeGreaterThan(0);
    }
  });

  it('gives every parameter a unique key and a default inside its own range', () => {
    for (const definition of listPrimitives()) {
      const keys = definition.parameters.map((parameter) => parameter.key);
      expect(new Set(keys).size, definition.kind).toBe(keys.length);

      for (const parameter of definition.parameters) {
        const where = `${definition.kind}.${parameter.key}`;
        expect(parameter.min, where).toBeLessThan(parameter.max);
        expect(parameter.default, where).toBeGreaterThanOrEqual(parameter.min);
        expect(parameter.default, where).toBeLessThanOrEqual(parameter.max);
        expect(parameter.step, where).toBeGreaterThan(0);
        if (parameter.unit === 'count')
          expect(Number.isInteger(parameter.default), where).toBe(true);
        if (parameter.tessellation) expect(parameter.unit, where).toBe('count');
      }
    }
  });

  it('ships defaults that fit in a headset working volume', () => {
    // The "1000mm box at arm's length" failure from issue #7. Every length
    // default has to be something you can hold and look around.
    for (const definition of listPrimitives()) {
      for (const parameter of definition.parameters) {
        if (parameter.unit !== 'length') continue;
        expect(parameter.default, `${definition.kind}.${parameter.key}`).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it('defaults are already valid — nothing has to be repaired on spawn', () => {
    for (const kind of ALL) {
      expect(validateParameters(kind, defaultParameters(kind)), kind).toEqual([]);
    }
  });

  it('resolves a parameter schema by key, and reports an unknown key as undefined', () => {
    expect(getParameterSchema('box', 'width')?.unit).toBe('length');
    expect(getParameterSchema('box', 'radius')).toBeUndefined();
  });
});

describe('validateParameters reports without changing anything', () => {
  it('accepts a legal map', () => {
    expect(validateParameters('box', { width: 0.1, height: 0.02, depth: 0.05 })).toEqual([]);
  });

  it('flags missing, out-of-range, non-finite, fractional-count and unknown keys', () => {
    const issues = validateParameters('cylinder', {
      radius: -1,
      height: Number.NaN,
      radialSegments: 12.5,
      colour: 3,
    });
    const keys = issues.map((issue) => issue.key).sort();
    expect(keys).toEqual(['colour', 'height', 'radialSegments', 'radius']);
  });

  it('flags a torus whose tube is fatter than its ring', () => {
    const issues = validateParameters('torus', {
      ...defaultParameters('torus'),
      majorRadius: 0.02,
      minorRadius: 0.03,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/smaller than ring radius/);
  });

  it('does not pile a relation complaint on top of a range complaint', () => {
    // majorRadius is already reported as out of range; repeating the failure as
    // a relation violation would put two red fields on one mistake.
    const issues = validateParameters('torus', { ...defaultParameters('torus'), majorRadius: -5 });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.key).toBe('majorRadius');
  });

  it('flags a cone with no radius at either end', () => {
    const issues = validateParameters('cone', {
      ...defaultParameters('cone'),
      baseRadius: 0,
      topRadius: 0,
    });
    // baseRadius: 0 is below the shared length minimum, so it is caught by the
    // range rule; the point of the assertion is that it is caught at all.
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('normalizeParameters is a canonical form', () => {
  it('fills in every missing parameter from defaults', () => {
    expect(normalizeParameters('box', {})).toEqual(defaultParameters('box'));
    expect(normalizeParameters('box')).toEqual(defaultParameters('box'));
  });

  it('drops keys the primitive does not have', () => {
    const normalized = normalizeParameters('sphere', {
      radius: 0.01,
      width: 5,
      thickness: 2,
    });
    expect(Object.keys(normalized).sort()).toEqual(['radius', 'segments']);
  });

  it('clamps to range and rounds counts to integers', () => {
    const definition = getPrimitive('cylinder');
    const maxRadius = definition.parameters.find((p) => p.key === 'radius')?.max ?? 0;
    const normalized = normalizeParameters('cylinder', {
      radius: 1e6,
      height: -1,
      radialSegments: 31.6,
    });
    expect(normalized.radius).toBe(maxRadius);
    expect(normalized.height).toBeGreaterThan(0);
    expect(normalized.radialSegments).toBe(32);
  });

  it('never rounds a count back out of its own range', () => {
    // 255.6 rounds to 256, which is the max — but 256.4 must not round to 257.
    const normalized = normalizeParameters('cylinder', { radialSegments: 1e9 });
    expect(normalized.radialSegments).toBe(256);
    expect(validateParameters('cylinder', normalized)).toEqual([]);
  });

  it('replaces NaN and Infinity with the default rather than propagating them', () => {
    const normalized = normalizeParameters('box', {
      width: Number.NaN,
      height: Number.POSITIVE_INFINITY,
      depth: 0.02,
    });
    expect(normalized.width).toBe(defaultParameters('box').width);
    expect(Number.isFinite(normalized.height)).toBe(true);
    expect(normalized.depth).toBe(0.02);
  });

  it('repairs a self-intersecting torus into a solid that validates', () => {
    const normalized = normalizeParameters('torus', { majorRadius: 0.02, minorRadius: 0.09 });
    expect(normalized.minorRadius).toBeLessThan(normalized.majorRadius ?? 0);
    expect(validateParameters('torus', normalized)).toEqual([]);
  });

  it('produces something valid for every kind from arbitrary junk', () => {
    const junk = { width: Number.NaN, radius: -1e9, segments: 0.2, nonsense: 7 };
    for (const kind of ALL) {
      expect(validateParameters(kind, normalizeParameters(kind, junk)), kind).toEqual([]);
    }
  });

  it('is idempotent — the cache key in #6 depends on it', () => {
    const junk = { majorRadius: 0.02, minorRadius: 0.09, majorSegments: 999, stray: 1 };
    for (const kind of ALL) {
      const once = normalizeParameters(kind, junk);
      expect(normalizeParameters(kind, once), kind).toEqual(once);
    }
  });

  it('collapses -0 so it cannot produce a second cache key for one value', () => {
    const normalized = normalizeParameters('cone', { ...defaultParameters('cone'), topRadius: -0 });
    expect(Object.is(normalized.topRadius, -0)).toBe(false);
  });
});

describe('parametersKey identifies a shape', () => {
  it('does not depend on key insertion order', () => {
    const a = parametersKey('box', { width: 0.06, height: 0.02, depth: 0.04 });
    const b = parametersKey('box', { depth: 0.04, width: 0.06, height: 0.02 });
    expect(a).toBe(b);
  });

  it('changes when any parameter changes', () => {
    const base = normalizeParameters('cylinder', {});
    expect(parametersKey('cylinder', { ...base, radius: 0.031 })).not.toBe(
      parametersKey('cylinder', base),
    );
    expect(parametersKey('cylinder', { ...base, radialSegments: 16 })).not.toBe(
      parametersKey('cylinder', base),
    );
  });

  it('distinguishes two kinds with identical parameter values', () => {
    expect(parametersKey('box', { width: 1 })).not.toBe(parametersKey('wedge', { width: 1 }));
  });
});

describe('tessellation quality', () => {
  it('leaves standard quality exactly as authored', () => {
    for (const kind of ALL) {
      const defaults = defaultParameters(kind);
      expect(applyTessellationQuality(kind, defaults, 'standard'), kind).toEqual(defaults);
    }
  });

  it('moves triangle count without moving the shape', () => {
    const defaults = defaultParameters('cylinder');
    const draft = applyTessellationQuality('cylinder', defaults, 'draft');
    const fine = applyTessellationQuality('cylinder', defaults, 'fine');

    expect(draft.radialSegments).toBeLessThan(defaults.radialSegments ?? 0);
    expect(fine.radialSegments).toBeGreaterThan(defaults.radialSegments ?? 0);
    // The solid being described is untouched — only how finely it is diced.
    expect(draft.radius).toBe(defaults.radius);
    expect(fine.height).toBe(defaults.height);
  });

  it('cannot drive a radial sweep below the minimum that still bounds a solid', () => {
    const floored = applyTessellationQuality('cylinder', { radialSegments: 3 }, 'draft');
    expect(floored.radialSegments).toBe(3);
    expect(validateParameters('cylinder', floored)).toEqual([]);
  });

  it('produces a valid map for every kind at every tier', () => {
    for (const kind of ALL) {
      for (const quality of TESSELLATION_QUALITIES) {
        const params = applyTessellationQuality(kind, defaultParameters(kind), quality);
        expect(validateParameters(kind, params), `${kind}/${quality}`).toEqual([]);
      }
    }
  });
});

describe('units are declared once, in metres, displayed in millimetres', () => {
  it('shows a 60mm default as 60mm', () => {
    const width = getParameterSchema('box', 'width');
    expect(width).toBeDefined();
    if (!width) return;
    expect(toDisplayValue(width, 0.06)).toBeCloseTo(60);
    expect(formatParameter(width, 0.06)).toBe('60.0mm');
  });

  it('round-trips through the display unit', () => {
    for (const definition of listPrimitives()) {
      for (const parameter of definition.parameters) {
        const shown = toDisplayValue(parameter, parameter.default);
        expect(
          fromDisplayValue(parameter, shown),
          `${definition.kind}.${parameter.key}`,
        ).toBeCloseTo(parameter.default, 12);
      }
    }
  });

  it('shows counts bare and lengths suffixed', () => {
    const segments = getParameterSchema('cylinder', 'radialSegments');
    expect(segments).toBeDefined();
    if (!segments) return;
    expect(formatParameter(segments, 32)).toBe('32');
    expect(PARAMETER_UNITS.length.suffix).toBe('mm');
    expect(PARAMETER_UNITS.count.perCanonical).toBe(1);
  });
});

describe('spawnPrimitive', () => {
  it('produces a node whose parameters are already canonical', () => {
    for (const kind of ALL) {
      const node = spawnPrimitive(kind);
      expect(node.primitive, kind).toBe(kind);
      expect(node.name, kind).toBe(getPrimitive(kind).label);
      expect(validateParameters(kind, node.params), kind).toEqual([]);
    }
  });

  it('normalizes overrides rather than trusting them', () => {
    const node = spawnPrimitive('torus', { params: { majorRadius: 0.02, minorRadius: 0.5 } });
    expect(validateParameters('torus', node.params)).toEqual([]);
    expect(node.params.minorRadius).toBeLessThan(node.params.majorRadius ?? 0);
  });

  it('bakes the requested quality into the stored parameters', () => {
    const draft = spawnPrimitive('sphere', { quality: 'draft' });
    const standard = spawnPrimitive('sphere');
    expect(draft.params.segments).toBeLessThan(standard.params.segments ?? 0);
    expect(DEFAULT_TESSELLATION_QUALITY).toBe('standard');
  });

  it('accepts a custom name', () => {
    expect(spawnPrimitive('box', { name: 'Base plate' }).name).toBe('Base plate');
  });
});

describe('parameter edits round-trip through serialization', () => {
  it('survives save and reload for every primitive, including after an edit', () => {
    const doc = CarveDocument.create();

    for (const kind of ALL) {
      const primitive = spawnPrimitive(kind);
      doc.dispatch(insertBundle(placedPrimitive(primitive, IDENTITY_TRS), doc.rootId));

      // Edit one parameter the way an inspector field would: patch the map,
      // normalize it, dispatch the result.
      const first = getPrimitive(kind).parameters[0];
      expect(first, kind).toBeDefined();
      if (!first) continue;
      const edited = normalizeParameters(kind, {
        ...primitive.params,
        [first.key]: first.unit === 'count' ? first.default + 2 : first.default * 1.5,
      });
      doc.dispatch(setParameters(primitive.id, edited));
      expect(edited[first.key], `${kind}.${first.key}`).not.toBe(first.default);
    }

    const reloaded = deserializeJson(JSON.stringify(serialize(doc)));

    let checked = 0;
    for (const id of doc.order()) {
      const before = doc.expect(id);
      if (before.kind !== 'primitive') continue;
      const after = reloaded.expect(id);
      expect(after.kind).toBe('primitive');
      if (after.kind !== 'primitive') continue;

      expect(after.params, before.primitive).toEqual(before.params);
      expect(validateParameters(before.primitive, after.params)).toEqual([]);
      expect(parametersKey(before.primitive, after.params)).toBe(
        parametersKey(before.primitive, before.params),
      );
      checked += 1;
    }
    expect(checked).toBe(ALL.length);
  });
});

describe('no hardcoded primitive lists anywhere in src/', () => {
  it('only nodes.ts names the primitive set', async () => {
    const offenders = await sourceHasNoHardcodedPrimitiveList();
    expect(offenders).toEqual([]);
  });
});

/**
 * Every src/ file that spells out two or more primitive names as string
 * literals in one place — the shape a drifting hardcoded list takes.
 *
 * `nodes.ts` is exempt because it declares `PRIMITIVE_KINDS`, which is the list
 * everything else derives from, and `primitives.ts` is exempt because the
 * registry has to name each kind once to define it.
 */
async function sourceHasNoHardcodedPrimitiveList(): Promise<string[]> {
  const srcRoot = fileURLToPath(new URL('../src', import.meta.url));
  const exempt = new Set(['nodes.ts', 'primitives.ts']);
  const names = ALL.map((kind) => `'${kind}'`);
  const offenders: string[] = [];

  for (const file of await walk(srcRoot)) {
    if (extname(file) !== '.ts' || exempt.has(file.split('/').pop() ?? '')) continue;
    const source = await readFile(file, 'utf8');
    // Two or more of the names on one line is the tell. A single mention is
    // ordinary — `if (node.primitive === 'box')` is fine and unavoidable.
    for (const [index, line] of source.split('\n').entries()) {
      if (line.trimStart().startsWith('*')) continue; // prose in a doc comment
      const hits = names.filter((name) => line.includes(name));
      if (hits.length >= 2) offenders.push(`${file}:${index + 1} — ${hits.join(', ')}`);
    }
  }

  return offenders;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}
