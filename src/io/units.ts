/**
 * The one conversion an exporter is allowed to perform, in one place.
 *
 * #25 settled the convention: the document stores metres, and millimetres are
 * an authoring unit applied at the boundary. An exporter is a boundary — a
 * slicer reading an STL will treat the numbers as millimetres — so the scale
 * has to happen somewhere, and #14 asks for it to happen "once, at the
 * boundary, using `PARAMETER_UNITS` rather than a hand-written `* 1000`".
 *
 * The value below is therefore *derived* from `PARAMETER_UNITS.length`, not
 * copied from it. Copying would be correct today and would be the kind of
 * duplication nobody finds: a project that later authored in inches would
 * change one constant, watch the inspector update, and ship exports that were
 * still in millimetres with no test failing anywhere.
 *
 * `test/io-stl.test.ts` asserts the derivation rather than the number, for the
 * same reason.
 */

import { PARAMETER_UNITS } from '../core/index.js';

/**
 * Multiply a canonical (metre) length by this to get millimetres.
 *
 * The unit STL is conventionally read in. STL itself declares no unit at all —
 * every slicer assumes millimetres — which is exactly why this cannot be left
 * implicit: a part exported in metres imports as a 0.2mm speck, and the failure
 * looks like a modelling mistake rather than a units one.
 */
export const METRES_TO_MILLIMETRES = PARAMETER_UNITS.length.perCanonical;

/**
 * glTF's unit, which is metres — so this is 1, and it is written down anyway.
 *
 * The glTF 2.0 specification fixes the unit of a scene's linear coordinates as
 * metres. The document already stores metres, so `encodeGlb` scales by nothing
 * and that is a decision rather than an omission. A named constant is what
 * stops someone from "fixing" the asymmetry with STL by scaling both.
 */
export const METRES_TO_GLTF = 1;
