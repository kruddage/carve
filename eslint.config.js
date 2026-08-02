import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The architecture boundary, as tooling rather than as etiquette.
 *
 * `src/core/` is the document model and `src/kernel/` is the CSG worker. Both
 * are headless by contract: they must run in Node under Vitest, in a Web
 * Worker, and on a headset, with no renderer, no DOM input adapter and no UI
 * attached. The moment `core` reaches for `render`, the "one document, two
 * frontends" claim in issue #1 stops being true, and it stops being true
 * quietly — nothing breaks until someone tries to test the model headlessly, or
 * to run it somewhere the renderer it accidentally depends on cannot go.
 *
 * So it is enforced here, and CI runs `npm run lint`. See issue #3: "the
 * abstraction is only real if it's enforced".
 *
 * Direction of the rule: outer layers may import inner ones. `render`, `input`,
 * `ui` and `xr` are all free to import `core` and `kernel`. Never the reverse.
 *
 * To watch it fire (this is also asserted by test/import-boundary.test.ts):
 *
 *   echo "export * from '../render/index.js';" > src/core/violation.ts
 *   npx eslint src/core/violation.ts; rm src/core/violation.ts
 *
 * expected: 1 error, @typescript-eslint/no-restricted-imports, exit code 1.
 */
/** Every layer that sits outside `src/core/` and `src/kernel/`, as import globs. */
const OUTER_LAYER_GLOBS = ['io', 'render', 'input', 'ui', 'xr'].flatMap((layer) => [
  `**/${layer}/**`,
  `**/${layer}`,
]);

const FORBIDDEN_FOR_HEADLESS_LAYERS = [
  {
    group: OUTER_LAYER_GLOBS,
    message:
      'Import boundary: src/core/ and src/kernel/ are headless and must not import from src/io/, src/render/, src/input/, src/ui/ or src/xr/. Dependencies point inward — move the shared type into core, or invert the call so the outer layer drives.',
  },
];

/**
 * `src/io/` is the export path, and it may see the document and the kernel's
 * buffers — nothing above them.
 *
 * The moment it can import the renderer, "the exported file is the mesh the
 * viewport drew" becomes a claim about two pipelines rather than one, and
 * three.js `GLTFExporter` becomes the obvious way to write a GLB — which is
 * exactly the decision `src/io/gltf.ts` exists to refuse, and which would make
 * every export test need a GPU. The DOM is not a layer and is not restricted;
 * see `src/io/browser.ts`.
 */
const FORBIDDEN_FOR_IO = [
  {
    group: OUTER_LAYER_GLOBS.filter((glob) => !glob.includes('/io')),
    message:
      'Import boundary: src/io/ writes files from the document and the kernel mesh, and must not import from src/render/, src/input/, src/ui/ or src/xr/. An exporter that needs a renderer object exports something other than what was evaluated.',
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      // Static passthrough, shipped byte-for-byte — including the #2 capability
      // probe at public/probe/, which is deliberately plain untyped JS.
      'public/**',
      // Claude Code agent worktrees. These are full checkouts of this repo
      // nested inside it, so without this the linter walks into each one and
      // reports parse errors for files that are not part of this project.
      '**/.claude/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Browser globals for everything that ships to a page.
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // Node globals for build tooling and tests.
  {
    files: ['vite.config.ts', 'eslint.config.js', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // --- The boundary ---------------------------------------------------------
  {
    files: ['src/core/**/*.ts', 'src/kernel/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: FORBIDDEN_FOR_HEADLESS_LAYERS },
      ],
    },
  },
  {
    files: ['src/io/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: FORBIDDEN_FOR_IO }],
    },
  },
  // The boundary test deliberately lints a violating snippet; it is not itself
  // subject to the rule (it never imports the modules, it lints strings).
  // -------------------------------------------------------------------------

  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  prettier,
);
