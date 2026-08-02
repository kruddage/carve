/**
 * The headless contract, checked rather than asserted in a comment.
 *
 * Vitest runs in Node with no DOM. If src/core/ or src/kernel/ ever reaches for
 * `document`, `window` or a renderer at module scope, these imports throw and
 * this test fails — which is the point: the document model and the CSG kernel
 * are meant to stay testable without a screen, and that only holds if a test
 * notices when it stops being true.
 */

import { describe, expect, it } from 'vitest';

import { CORE_LAYER } from '../src/core/index.js';
import { KERNEL_LAYER } from '../src/kernel/index.js';

describe('headless layers', () => {
  it('imports src/core and src/kernel in a DOM-less environment', () => {
    expect(globalThis.document).toBeUndefined();
    expect([CORE_LAYER, KERNEL_LAYER]).toEqual(['core', 'kernel']);
  });
});
