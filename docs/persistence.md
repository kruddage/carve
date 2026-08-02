# Persistence and export

Implements `14a` of [#14](https://github.com/kruddage/carve/issues/14). Lives in
[`src/io/`](../src/io).

Keeping work, and getting it out to somewhere useful. Four things, in the order a user meets them:
a document that saves and reopens, an autosave that survives a crash, an STL a slicer can print,
and a GLB anything else can display.

```
  CarveDocument ──serialize──► SerializedDocument ──┬─► .carve text ──► download / drop
   (src/core)                                        └─► IndexedDB record ──► recovery

  CarveDocument ──bundle──► kernel (#6) ──► MeshPayload ──┬─► binary STL (mm)
                                                          └─► GLB (m)
```

Every arrow crosses a layer that already existed. `src/io/` invents no geometry, no document shape
and no second copy of the CSG tree — which is what keeps "the file matches what you were looking
at" true by construction rather than by care.

## The `.carve` file

The versioned JSON from [#5](https://github.com/kruddage/carve/issues/5), pretty-printed with a
trailing newline, served as `application/vnd.carve+json`. `src/core/serialize.ts` owns the shape and
its validation; [`carve-file.ts`](../src/io/carve-file.ts) owns only the extension, the media type
and the filename.

Files are indented rather than minified. It roughly doubles the size of a few tens of kilobytes and
buys a format that diffs in git, can be hand-repaired, and can be read by whoever writes the first
migration.

Filenames are sanitized, and not only cosmetically: a document name is user text, and one
containing `/` or a leading `.` would be a path or a hidden file by the time a browser wrote it.

### The migration story, honestly

The format is at **v1**, so there is no old version to migrate _from_ yet. What exists is:

- the migration table and its runner in `src/core/serialize.ts`, tested with injected fake
  migrations in [`test/serialize.test.ts`](../test/serialize.test.ts)
- a **real file, checked in** — [`test/fixtures/bracket.carve`](../test/fixtures/bracket.carve) —
  that [`test/io-carve-file.test.ts`](../test/io-carve-file.test.ts) opens on every CI run

The fixture is the part that will actually catch something. It is what a user's file looks like
today, and when the format reaches v2 it stops being a round-trip check and becomes the migration's
input, unchanged.

## Autosave

IndexedDB, not `localStorage`: structured clones (so a serialized document goes in without a
`JSON.stringify` round trip), asynchronous (so a save never blocks a frame), and a quota measured in
hundreds of megabytes rather than five.

The policy is in [`autosave.ts`](../src/io/autosave.ts) and is four rules:

| Rule                                | Because                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Nothing is written during a gesture | a hand-drag emits a change per pose; that is dozens of documents a second       |
| Trailing debounce, 2s               | edits arrive in bursts — nudge, nudge, nudge, think                             |
| Ceiling, 15s                        | a user who never pauses would otherwise never be saved                          |
| One write at a time                 | two overlapping `put`s of one key are not ordered, so the older could land last |

Failures are reported through `onError`, never thrown: this runs inside a document change listener,
and throwing there would take out the gizmo drag that triggered it to report that a background save
failed. The document stays dirty and the next tick retries.

**Storage is allowed to be unavailable.** Private-mode Safari, a browser with site data blocked and
a headset with storage permissions withheld all fail at `open()`. `openDocumentStore` falls back to
an in-memory store and reports `persistent: false` with a reason, so the app runs with autosave
degraded to "this session only" rather than failing to start. The UI can say so; it must not be
gated on it.

Recovery is `recoverLatest(store)`: the newest record, as a live document plus the metadata a
prompt needs ("restore _Bracket_, saved four minutes ago?"). A record that fails to deserialize is
skipped rather than thrown, so one corrupted autosave cannot make an older readable one
unreachable.

## Export

### Units, which is where an exporter goes wrong

[#25](https://github.com/kruddage/carve/issues/25) settled it: the document stores **metres**, and
millimetres are an authoring unit applied at the boundary. An exporter is a boundary.

|     | Unit in the file | Why                                                     |
| --- | ---------------- | ------------------------------------------------------- |
| STL | millimetres      | STL declares no unit and every slicer assumes mm        |
| GLB | metres           | glTF 2.0 fixes the unit of linear coordinates as metres |

Both scales live in [`units.ts`](../src/io/units.ts), and the millimetre one is **derived** from
`PARAMETER_UNITS.length` rather than written as `* 1000`. That is the difference between a project
that later authors in inches changing one constant, and one that changes it, watches the inspector
update, and ships exports still in millimetres with no test failing anywhere.
`test/io-stl.test.ts` asserts the derivation, not the number.

### STL

Binary, never ASCII — ~7× smaller, and every slicer reads it. Facet normals are **recomputed** from
each triangle's own winding rather than copied from a vertex normal: the mesh's normals are split at
[#6](https://github.com/kruddage/carve/issues/6)'s crease threshold, so on a curved wall the three
vertex normals of one triangle point three different ways and any of them would disagree with the
facet.

The header never begins with `solid`, which some parsers sniff to decide a binary file is ASCII.

### GLB

Written by hand — about a hundred lines of `DataView` — rather than through three.js
`GLTFExporter`. The exporter would take a `THREE.Mesh`, which would put a renderer object between
the kernel's buffers and the file: export would only work once the scene existed, could not be
tested in Node, and would write whatever the renderer had done to the geometry rather than what was
evaluated. The lint boundary in [`eslint.config.js`](../eslint.config.js) enforces the ban, and
[`test/import-boundary.test.ts`](../test/import-boundary.test.ts) proves the rule fires.

The interleaved `[px, py, pz, nx, ny, nz]` buffer the kernel already produces is written verbatim,
with POSITION and NORMAL as two accessors into one strided buffer view. No de-interleaving, no
copy.

glTF is right-handed, +Y up, CCW front faces and metres; the kernel already resolves Z-up→Y-up at
the primitive-construction seam and emits CCW. So this exporter transforms nothing — and
`test/io-gltf.test.ts` asserts a known solid comes out the right way up and the right size, so if
one of those conventions ever changes upstream a test fails here rather than a part arriving on its
side in someone else's viewer.

No material is written. A part's appearance is [#13](https://github.com/kruddage/carve/issues/13)'s
shading, not a property of the document, and a hand-written PBR material here would be a second
diverging description of how a Carve part looks.

### Exporting a selection

"Export selection only" is a different **bundle**, not a different exporter — `exportBundle` builds
it and the same encoders run. Two details make it correct rather than nearly correct:

- **World placement is preserved.** A subtree describes itself in its parent's space, so it is
  re-wrapped in copies of its ancestors' transform nodes. A hole 60mm along the plate exports as a
  cylinder 60mm from the origin.
- **Nested selections do not double.** Selecting a boolean _and_ one of its operands would union
  that operand with itself; descendants of another selected node are dropped.

Exports run on their own kernel channel (`EXPORT_CHANNEL`). The kernel supersedes within a channel,
so exporting on the viewport's would mean an export cancels the evaluation the viewport is waiting
for — and a mid-drag export gets superseded by the drag and silently resolves to nothing. On its own
channel they simply proceed.

## What is tested, and what needs a human

The end-to-end assertion is in [`test/io-export.test.ts`](../test/io-export.test.ts): the fixture
bracket is evaluated by the real `manifold-3d`, exported, and then **measured out of the exported
file** — extents of 200 × 10 × 100mm, the volume of a drilled plate rather than a solid one, and a
positive signed volume so it is not inside out. That is #14a's "correct dimensions" as far as a test
can take it.

What a test cannot settle is whether a given tool accepts the file, and that is deliberately not
faked:

| Claim                                      | Status                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| STL has the right size, units, winding     | asserted in CI, out of the file's own bytes                        |
| GLB is a valid, viewer-parseable container | asserted in CI by an independent parse of the chunks and accessors |
| STL slices correctly in a real slicer      | **needs a human with a slicer** — see `docs/capability-matrix.md`  |
| GLB opens in an external viewer            | **needs a human with a viewer**                                    |
| Download and file picker in Safari/Firefox | **unmeasured** — the rows are in `docs/capability-matrix.md`       |

The three unmeasured rows are why `14a` is tracked as complete in code and open in the matrix. They
are checks, not work: nothing else is waiting on them.

## Where the DOM starts

[`browser.ts`](../src/io/browser.ts), and nowhere else. Everything else in the layer is bytes in,
bytes out, which is what lets the export path be tested in Node with no browser.

Downloads use a `Blob` and an anchor with `download`, not `showSaveFilePicker` — the File System
Access API is Chrome-only and the Quest browser's support is one of the unmeasured rows above. The
object URL is revoked a task later rather than synchronously, because revoking immediately after
`click()` races Safari's own read of it and fails the download intermittently.

The flush on page-hide listens to `pagehide` and `visibilitychange`, **not** `beforeunload`: on
mobile and on the Quest a tab is frequently frozen rather than unloaded — the user takes the headset
off — and `beforeunload` never fires at all.

## What `14b` still needs

`14b` (in-headset file operations, blocked on [#12](https://github.com/kruddage/carve/issues/12)) is
a wrist-menu surface over exactly these functions: `store.list()` for recent documents,
`encodeDocument` + `Autosave` for save-over, and auto-naming instead of a virtual keyboard. There is
no second implementation to write, which was the point of splitting it.
