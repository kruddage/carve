/**
 * src/xr — WebXR session lifecycle and in-headset interface.
 *
 * Session request and teardown, reference spaces, the immersive frame loop,
 * passthrough AR, and the spatial UI that has no DOM equivalent — the wrist
 * menu above all.
 *
 * Belongs here:
 *   - `navigator.xr` feature detection, session request, and the Enter XR flow
 *   - reference spaces, `XRFrame` pose reading, the immersive render loop
 *   - spatial widgets (wrist menu, in-world labels) built from render-layer
 *     primitives
 *
 * Must NOT appear here:
 *   - anything desktop also needs. Shared behaviour goes to core/kernel/render;
 *     this layer is only the parts that exist because there is a headset.
 *   - direct document mutation — hands are an input adapter, and adapters emit
 *     commands (src/input/).
 *   - renderer internals. The session renders through src/render/ like every
 *     other surface does; this layer supplies poses and input, not draw calls.
 *
 * Implemented by issues #10–#12. Placeholder until then.
 */

export const XR_LAYER = 'xr';
