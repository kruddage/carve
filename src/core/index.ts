/**
 * src/core — the document model.
 *
 * The single source of truth for what the user has built: the CSG tree,
 * primitive parameters, transforms, selection, and the command/undo stack.
 * Desktop gizmos and XR hands are two input adapters emitting the same
 * commands against this; a scene built in one opens in the other because both
 * only ever talk to what is in here.
 *
 * Belongs here:
 *   - node/tree data structures and their invariants
 *   - commands, the undo/redo stack, and document mutation
 *   - serialization of the document (the on-disk shape lives with the model)
 *   - pure geometry math used to describe the document (units, transforms)
 *
 * Must NOT appear here:
 *   - imports from src/render/, src/input/, src/ui/ or src/xr/ — enforced by
 *     ESLint, see eslint.config.js and test/import-boundary.test.ts
 *   - three.js, WebGPU/WebGL types, or anything else renderer-shaped
 *   - DOM or WebXR APIs: `document`, `window`, `navigator.xr`, event listeners
 *
 * The test for whether something belongs here is "does it still make sense
 * with no screen attached?" This module must run unchanged under Vitest in
 * Node, in a Web Worker, and on a headset.
 *
 * Implemented by issue #5. Placeholder until then.
 */

export const CORE_LAYER = 'core';
