# Capability matrix

What the target devices **actually** support, measured by the probe at
[`/probe/`](https://kruddage.github.io/carve/probe/) ([source](../probe/)).

> **Nothing here has been run on hardware yet.** Every measured cell below is a placeholder.
> Do not cite this file until the placeholders are gone.

## What this file is for now

It used to exist to settle one question — can WebGPU drive the stereo swapchain of a live immersive
session on Quest 3 — because the renderer's whole shape depended on the answer.

**That question is closed by decision rather than by measurement.** v1 renders with WebGL2 through
three.js `WebGLRenderer`, on the flat page and in the headset alike. `XRGPUBinding` is not
implemented on Quest, WebGL2 was always the expected shipping path, and carrying a second backend
for a hypothetical cost more than it bought. See [#4](https://github.com/kruddage/carve/issues/4)
and [`docs/roadmap.md`](roadmap.md).

So this file's job changed. It is no longer a decision record; it is the numbers
[#10](https://github.com/kruddage/carve/issues/10),
[#11](https://github.com/kruddage/carve/issues/11) and
[#15](https://github.com/kruddage/carve/issues/15) need in order to not guess:

- **Native framebuffer scale factor** — the starting point for #15's resolution budget
- **`session.supportedFrameRates`** — 72 / 90 / 120, which sets the frame budget
- **`XRHand` joint count** on `inputSource.hand` — #11's whole input model
- **Which reference spaces exist** — `local-floor` vs `bounded-floor` changes #10's setup
- **Which browsers can open the app at all** — the desktop matrix below

The probe still runs its WebGPU checks and they are still recorded. Not because anything depends on
them, but because re-running the probe after a Quest Browser update is the only way we would learn
that `XRGPUBinding` had landed — and that would be worth knowing, as a v2 question with evidence
behind it rather than a v1 risk.

## How to run it, and re-run it

1. Open **https://kruddage.github.io/carve/probe/** — in desktop Chrome, and in Quest Browser on
   the headset. No install, no dev server, no build step; it is a static page and it works even
   when the main app is broken.
2. Read the 2D-page rows, then press **Enter VR & run in-session checks**. It runs for about
   twelve seconds — hold your hands up in view so hand tracking is detected — then exits by itself
   and fills in the rest of the table.
3. Press **Copy as markdown** (or **Show markdown** and select it by hand — the Quest browser
   often blocks clipboard writes) and paste the result into the raw-output section for that device
   below, then transcribe the short values into the comparison table.
4. Read Horizon OS version off the headset: **Settings › System › Software Update**. It is not
   exposed to web content, so the probe cannot capture it.

**Re-run after every Quest Browser update.** It costs ten minutes, and it is what will tell us if
the WebGPU picture ever changes.

## Desktop browser support

"Runs in a browser tab" means more browsers than the one you develop in. WebGL2 is universal in
current browsers, so this table is about the surrounding APIs rather than the renderer.

|                                          | Chrome | Safari | Firefox |
| ---------------------------------------- | ------ | ------ | ------- |
| WebGL2                                   | _tbd_  | _tbd_  | _tbd_   |
| WASM (for `manifold-3d`)                 | _tbd_  | _tbd_  | _tbd_   |
| Web Workers + transferable `ArrayBuffer` | _tbd_  | _tbd_  | _tbd_   |
| IndexedDB (autosave, `14a`)              | _tbd_  | _tbd_  | _tbd_   |
| File download / file picker (`14a`)      | _tbd_  | _tbd_  | _tbd_   |
| Drag-and-drop a `.carve` file (`14a`)    | _tbd_  | _tbd_  | _tbd_   |
| `SharedArrayBuffer`                      | _tbd_  | _tbd_  | _tbd_   |

The three `14a` rows are the ones with code behind them now: save, autosave, export and
drag-and-drop have landed (see [`docs/persistence.md`](persistence.md)) and are asserted in CI at
the byte level, but "the download works in Safari" is not a thing CI can answer. Checking them is
ten minutes per browser once M2 has a page to open:

1. Open the app, edit something, and confirm a `.carve` file downloads and reopens by picker and by
   drop.
2. Kill the tab mid-edit, reload, and confirm the autosave is offered back — that is the IndexedDB
   row, and it is also the row a private-mode window is expected to _fail_: the app must still open,
   with autosave reporting itself unavailable rather than throwing.
3. Export an STL, open it in a slicer, and confirm the part measures what the inspector said in
   millimetres. Export a GLB and open it in any glTF viewer.

**`SharedArrayBuffer` will be absent in production regardless of the browser.** It requires
cross-origin isolation via COOP/COEP response headers, and GitHub Pages cannot set response headers.
[#6](https://github.com/kruddage/carve/issues/6) must therefore use a single-threaded `manifold-3d`
build, or Pages needs a service-worker shim to synthesize the headers. Decide before the kernel work
starts, not after.

## Runs

|                    | Desktop Chrome              | Quest 3                                    |
| ------------------ | --------------------------- | ------------------------------------------ |
| Date run           | _YYYY-MM-DD_                | _YYYY-MM-DD_                               |
| Browser version    | _e.g. Chrome 1xx.x.xxxx.xx_ | _e.g. OculusBrowser 1xx.x (Chromium 1xx)_  |
| Horizon OS version | n/a                         | _from Settings › System › Software Update_ |
| OS / platform      | _e.g. macOS 15.x_           | _Horizon OS (Android base per UA)_         |
| Run by             | _who_                       | _who_                                      |

## Results

Row labels match the probe's rows one-for-one, in the same order, so transcription is mechanical.
Statuses: `PASS` / `FAIL` / `ABSENT` (feature not present — not a bug) / `THREW` (check raised;
the message is the result) / `INFO` / `SKIPPED`.

### Environment

| Check                 | Desktop Chrome | Quest 3        |
| --------------------- | -------------- | -------------- |
| User agent            | _tbd_          | _tbd_          |
| Browser version       | _tbd_          | _tbd_          |
| Platform / OS version | _tbd_          | _tbd_          |
| Horizon OS version    | n/a            | _tbd (manual)_ |
| Secure context        | _tbd_          | _tbd_          |
| Logical cores         | _tbd_          | _tbd_          |
| Device pixel ratio    | _tbd_          | _tbd_          |

### The rows that feed a decision

These are the ones #10, #11 and #15 read. Everything else on this page is context.

| Check                                          | Desktop Chrome | Quest 3 | Consumed by           |
| ---------------------------------------------- | -------------- | ------- | --------------------- |
| Native framebuffer scale factor                | _tbd_          | _tbd_   | #15 resolution budget |
| `XRWebGLLayer` framebuffer size @ native scale | _tbd_          | _tbd_   | #15                   |
| `session.supportedFrameRates`                  | _tbd_          | _tbd_   | #15 frame budget      |
| Current `session.frameRate`                    | _tbd_          | _tbd_   | #15                   |
| `XRHand` on `inputSource.hand` / joint count   | _tbd_          | _tbd_   | #11                   |
| Reference space: `local-floor`                 | _tbd_          | _tbd_   | #10                   |
| Reference space: `bounded-floor`               | _tbd_          | _tbd_   | #10                   |
| `bounded-floor` boundsGeometry                 | _tbd_          | _tbd_   | #10                   |
| Views per frame / viewport size                | _tbd_          | _tbd_   | #10, #15              |

### WebXR — outside XR (2D page)

| Check                                | Desktop Chrome | Quest 3 |
| ------------------------------------ | -------------- | ------- |
| `navigator.xr` present               | _tbd_          | _tbd_   |
| `isSessionSupported('immersive-vr')` | _tbd_          | _tbd_   |
| `isSessionSupported('immersive-ar')` | _tbd_          | _tbd_   |
| `isSessionSupported('inline')`       | _tbd_          | _tbd_   |
| `window.XRWebGLBinding` defined      | _tbd_          | _tbd_   |
| `window.XRHand` defined              | _tbd_          | _tbd_   |

### Inside an immersive-vr session

| Check                                       | Desktop Chrome | Quest 3 |
| ------------------------------------------- | -------------- | ------- |
| `immersive-vr` session granted              | _tbd_          | _tbd_   |
| Enabled features                            | _tbd_          | _tbd_   |
| WebGL2 context, `xrCompatible`              | _tbd_          | _tbd_   |
| `XRWebGLLayer` created                      | _tbd_          | _tbd_   |
| `XRWebGLLayer` framebuffer size @ scale 1.0 | _tbd_          | _tbd_   |
| `XRWebGLLayer` survives one frame           | _tbd_          | _tbd_   |
| Reference space: `viewer`                   | _tbd_          | _tbd_   |
| Reference space: `local`                    | _tbd_          | _tbd_   |
| Reference space: `unbounded`                | _tbd_          | _tbd_   |
| Input sources seen                          | _tbd_          | _tbd_   |

### WebGPU — recorded, not depended on

Kept so a future re-run tells us whether the v2 question has changed. Nothing in v1 reads these
rows.

| Check                                         | Desktop Chrome | Quest 3 |
| --------------------------------------------- | -------------- | ------- |
| `navigator.gpu` present                       | _tbd_          | _tbd_   |
| `requestAdapter()` succeeds                   | _tbd_          | _tbd_   |
| Adapter info (vendor / architecture / device) | _tbd_          | _tbd_   |
| `window.XRGPUBinding` defined                 | _tbd_          | _tbd_   |
| `XRGPUBinding` defined inside session         | _tbd_          | _tbd_   |
| `new XRGPUBinding(session, device)`           | _tbd_          | _tbd_   |
| WebGPU projection layer created               | _tbd_          | _tbd_   |
| WebGPU layer survives one frame               | _tbd_          | _tbd_   |

`requestAdapter({ xrCompatible: true })` passing does **not** on its own prove anything: WebIDL
drops unknown dictionary members, so on a browser without the binding module the flag is silently
ignored and the call succeeds anyway. Only the projection-layer and one-frame rows are evidence.

If that last row ever comes back `PASS` on Quest 3, open a v2 issue with the measurement attached.
It is not on its own a reason to reopen the v1 renderer decision.

## Raw probe output

Paste the probe's **Copy as markdown** output verbatim, one block per run. Keep old runs — the
diff between two browser versions is the point.

### Desktop Chrome — _date_

```
(not yet run — paste the probe's markdown export here)
```

### Quest 3 — _date_

```
(not yet run — paste the probe's markdown export here)
```

## Follow-ups once the first Quest run lands

- [ ] Note the native framebuffer scale factor in [#15](https://github.com/kruddage/carve/issues/15)
      — it is the starting point for the resolution budget.
- [ ] Carry `supportedFrameRates` into [#15](https://github.com/kruddage/carve/issues/15)'s frame
      budget, and the hand joint count into [#11](https://github.com/kruddage/carve/issues/11).
- [ ] Confirm which reference spaces [#10](https://github.com/kruddage/carve/issues/10) can rely on.
- [ ] Fill the desktop browser table from Safari and Firefox, not just Chrome.
