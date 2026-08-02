/**
 * src/ui — the desktop DOM interface.
 *
 * The CSG tree outliner, parameter inspector, toolbar and dialogs — everything
 * that is HTML around the canvas. This is the desktop half of the two
 * frontends; the in-headset half is src/xr/.
 *
 * Belongs here:
 *   - DOM construction, CSS, and DOM event wiring
 *   - views that subscribe to document changes and re-render
 *   - dispatching core commands in response to clicks
 *
 * Must NOT appear here:
 *   - anything the headset also needs. If both frontends need it, it belongs
 *     in src/core/ or src/render/, not duplicated here and in src/xr/.
 *   - business logic: validation of a parameter value is the document model's
 *     job, so it is enforced identically for a wrist menu and a text field.
 *   - direct document mutation — dispatch commands.
 *
 * Implemented by issue #9, which is also when `/` stops being the coming-soon
 * page. Placeholder until then.
 */

export const UI_LAYER = 'ui';
