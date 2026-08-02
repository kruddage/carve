/**
 * Proves the architecture boundary in eslint.config.js actually fires.
 *
 * A restricted-import rule whose globs match nothing is worse than no rule: it
 * reports a clean lint forever and everyone believes the boundary is held. So
 * this test writes a real violating module into src/core/ and src/kernel/,
 * runs ESLint over it with the project's own config, asserts the error is
 * reported — and then asserts the negatives too, because a rule that errors on
 * everything is equally useless.
 *
 * The files are written to disk rather than linted as strings because the
 * type-checked ESLint rules need the file to exist inside the TS project. They
 * are removed in a `finally`.
 */

import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const BOUNDARY_RULE = '@typescript-eslint/no-restricted-imports';
const TIMEOUT = 120_000;

const eslint = new ESLint({ cwd: repoRoot });

/** Lint a throwaway module at `relPath`, returning only boundary-rule errors. */
async function boundaryErrors(relPath: string, source: string): Promise<string[]> {
  const absPath = join(repoRoot, relPath);
  await writeFile(absPath, source, 'utf8');
  try {
    const results = await eslint.lintFiles([absPath]);
    return (results[0]?.messages ?? [])
      .filter((message) => message.ruleId === BOUNDARY_RULE)
      .map((message) => message.message);
  } finally {
    await rm(absPath, { force: true });
  }
}

/** A module that imports one symbol from another layer and re-exports it. */
function importsFrom(layer: string, symbol: string): string {
  return `import { ${symbol} } from '../${layer}/index.js';\nexport const probe = ${symbol};\n`;
}

const OUTER_LAYERS = [
  ['io', 'IO_LAYER'],
  ['render', 'RENDER_LAYER'],
  ['input', 'INPUT_LAYER'],
  ['ui', 'UI_LAYER'],
  ['xr', 'XR_LAYER'],
] as const;

/** The layers `src/io/` may not import. Itself and the inner two are fine. */
const ABOVE_IO = OUTER_LAYERS.filter(([layer]) => layer !== 'io');

describe('src/core and src/kernel may not import outer layers', () => {
  for (const headless of ['core', 'kernel'] as const) {
    for (const [layer, symbol] of OUTER_LAYERS) {
      it(
        `flags src/${headless}/ importing src/${layer}/`,
        async () => {
          const errors = await boundaryErrors(
            `src/${headless}/__boundary_probe__.ts`,
            importsFrom(layer, symbol),
          );
          expect(errors).toHaveLength(1);
          expect(errors[0]).toMatch(/Import boundary/);
        },
        TIMEOUT,
      );
    }
  }
});

/**
 * `src/io/` has a boundary of its own — see the note beside `FORBIDDEN_FOR_IO`
 * in eslint.config.js. It is the reason an export is testable in Node: the
 * exporters see a `MeshPayload` and never a renderer object.
 */
describe('src/io may not import the layers above it', () => {
  for (const [layer, symbol] of ABOVE_IO) {
    it(
      `flags src/io/ importing src/${layer}/`,
      async () => {
        const errors = await boundaryErrors(
          'src/io/__boundary_probe__.ts',
          importsFrom(layer, symbol),
        );
        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/Import boundary/);
      },
      TIMEOUT,
    );
  }

  for (const [layer, symbol] of [
    ['core', 'CORE_LAYER'],
    ['kernel', 'KERNEL_LAYER'],
  ] as const) {
    it(
      `allows src/io/ to import src/${layer}/`,
      async () => {
        const errors = await boundaryErrors(
          'src/io/__boundary_probe__.ts',
          importsFrom(layer, symbol),
        );
        expect(errors).toEqual([]);
      },
      TIMEOUT,
    );
  }
});

describe('the boundary rule is scoped, not blanket', () => {
  it(
    'allows src/core/ to import from src/core/',
    async () => {
      const errors = await boundaryErrors(
        'src/core/__boundary_probe__.ts',
        `import { CORE_LAYER } from './index.js';\nexport const probe = CORE_LAYER;\n`,
      );
      expect(errors).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'allows src/core/ to import from src/kernel/',
    async () => {
      const errors = await boundaryErrors(
        'src/core/__boundary_probe__.ts',
        importsFrom('kernel', 'KERNEL_LAYER'),
      );
      expect(errors).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'allows outer layers to import inward — src/render/ importing src/core/',
    async () => {
      const errors = await boundaryErrors(
        'src/render/__boundary_probe__.ts',
        importsFrom('core', 'CORE_LAYER'),
      );
      expect(errors).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'does not police outer layer to outer layer — src/ui/ importing src/render/',
    async () => {
      const errors = await boundaryErrors(
        'src/ui/__boundary_probe__.ts',
        importsFrom('render', 'RENDER_LAYER'),
      );
      expect(errors).toEqual([]);
    },
    TIMEOUT,
  );
});
