/**
 * src/input — input adapters.
 *
 * Pointer/keyboard on desktop, pinch and grab in the headset. Both are
 * adapters: they translate device events into the same commands against the
 * document. Nothing downstream should be able to tell which one produced a
 * transform.
 *
 * Belongs here:
 *   - raw device event handling (pointer, keyboard, XR input sources, hands)
 *   - hit testing and picking against the rendered scene
 *   - gesture recognition and drag state machines
 *   - emitting core commands — this layer's output is commands, not mutations
 *
 * Must NOT appear here:
 *   - direct document mutation. Build a command and dispatch it, so undo/redo
 *     stays whole.
 *   - UI widget markup. A wrist menu's geometry is src/xr/; a DOM inspector
 *     panel is src/ui/. What lives here is the part that turns "the user did
 *     a thing" into "the document should change".
 *
 * Implemented by issue #8. Placeholder until then.
 */

export const INPUT_LAYER = 'input';
