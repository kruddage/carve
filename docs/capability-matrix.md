# Capability matrix

What the target devices **actually** support, measured by the probe at
[`/probe/`](https://kruddage.github.io/carve/probe/) ([source](../probe/)). This file exists so
that [#1](https://github.com/kruddage/carve/issues/1)'s WebGPU table can be replaced with a
measurement instead of a reading of release notes, and so the renderer default in
[#4](https://github.com/kruddage/carve/issues/4) and
[#10](https://github.com/kruddage/carve/issues/10) is chosen from evidence.

> **Nothing here has been run on hardware yet.** Every measured cell below is a placeholder.
> Do not cite this file until the placeholders are gone.

## The one question

Not "does this device have WebGPU" — it is *"can WebGPU drive the stereo swapchain of a live
immersive session"*. Those are different features:

| | What it tells you |
|---|---|
| `navigator.gpu` | WebGPU works on the flat 2D browser page. Quest Browser 146.0 shipped this as experimental. |
| `XRGPUBinding` | WebGPU can replace `XRWebGLLayer` as the source of frames for an immersive session. This is the one that decides our renderer. |

A device can have the first and not the second. Expect exactly that on Quest 3.

**Verdict (fill in after the first Quest run):** _not yet measured_

**Immersive-session backend default:** _not yet decided — the probe prints a recommendation line,
paste it here_

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

**Re-run after every Quest Browser update.** It costs ten minutes and it is the only thing that
will tell us when `XRGPUBinding` lands. When it does: update this file, update the WebGPU table in
[#1](https://github.com/kruddage/carve/issues/1), and revisit the renderer default.

## Runs

| | Desktop Chrome | Quest 3 |
|---|---|---|
| Date run | _YYYY-MM-DD_ | _YYYY-MM-DD_ |
| Browser version | _e.g. Chrome 1xx.x.xxxx.xx_ | _e.g. OculusBrowser 1xx.x (Chromium 1xx)_ |
| Horizon OS version | n/a | _from Settings › System › Software Update_ |
| OS / platform | _e.g. macOS 15.x_ | _Horizon OS (Android base per UA)_ |
| Run by | _who_ | _who_ |

## Results

Row labels match the probe's rows one-for-one, in the same order, so transcription is mechanical.
Statuses: `PASS` / `FAIL` / `ABSENT` (feature not present — not a bug) / `THREW` (check raised;
the message is the result) / `INFO` / `SKIPPED`.

### Environment

| Check | Desktop Chrome | Quest 3 |
|---|---|---|
| User agent | _tbd_ | _tbd_ |
| Browser version | _tbd_ | _tbd_ |
| Platform / OS version | _tbd_ | _tbd_ |
| Horizon OS version | n/a | _tbd (manual)_ |
| Secure context | _tbd_ | _tbd_ |
| Logical cores | _tbd_ | _tbd_ |
| Device pixel ratio | _tbd_ | _tbd_ |

### WebGPU — outside XR (2D page)

| Check | Desktop Chrome | Quest 3 |
|---|---|---|
| `navigator.gpu` present | _tbd_ | _tbd_ |
| Preferred canvas format | _tbd_ | _tbd_ |
| `requestAdapter()` succeeds | _tbd_ | _tbd_ |
| Adapter info (vendor / architecture / device) | _tbd_ | _tbd_ |
| Adapter description | _tbd_ | _tbd_ |
| Adapter features (count) | _tbd_ | _tbd_ |
| Adapter limits (count + notable) | _tbd_ | _tbd_ |
| `requestDevice()` succeeds | _tbd_ | _tbd_ |
| WebGPU render pass on a 2D canvas | _tbd_ | _tbd_ |

Full feature and limit dumps go in the raw output below, not here.

### WebXR — outside XR (2D page)

| Check | Desktop Chrome | Quest 3 |
|---|---|---|
| `navigator.xr` present | _tbd_ | _tbd_ |
| `isSessionSupported('immersive-vr')` | _tbd_ | _tbd_ |
| `isSessionSupported('immersive-ar')` | _tbd_ | _tbd_ |
| `isSessionSupported('inline')` | _tbd_ | _tbd_ |
| `window.XRGPUBinding` defined | _tbd_ | _tbd_ |
| `window.XRWebGLBinding` defined | _tbd_ | _tbd_ |
| `window.XRHand` defined | _tbd_ | _tbd_ |

### Inside an immersive-vr session — the part that matters

| Check | Desktop Chrome | Quest 3 |
|---|---|---|
| `immersive-vr` session granted | _tbd_ | _tbd_ |
| Enabled features | _tbd_ | _tbd_ |
| `XRGPUBinding` defined inside session | _tbd_ | _tbd_ |
| `requestAdapter({ xrCompatible: true })` | _tbd_ | _tbd_ |
| `requestDevice()` for XR use | _tbd_ | _tbd_ |
| `new XRGPUBinding(session, device)` | _tbd_ | _tbd_ |
| WebGPU projection layer created | _tbd_ | _tbd_ |
| **WebGPU layer survives one frame** | _tbd_ | _tbd_ |
| WebGL2 context, `xrCompatible` | _tbd_ | _tbd_ |
| `XRWebGLLayer` created (fallback path) | _tbd_ | _tbd_ |
| Native framebuffer scale factor | _tbd_ | _tbd_ |
| `XRWebGLLayer` framebuffer size @ scale 1.0 | _tbd_ | _tbd_ |
| `XRWebGLLayer` framebuffer size @ native scale | _tbd_ | _tbd_ |
| `XRWebGLLayer` survives one frame | _tbd_ | _tbd_ |
| Views per frame / viewport size | _tbd_ | _tbd_ |

The bolded row is the decision. If it is not `PASS` on Quest 3, the immersive backend is WebGL2
and the WebGL2 path is a shipping path, not scaffolding.

`requestAdapter({ xrCompatible: true })` passing does **not** on its own prove anything: WebIDL
drops unknown dictionary members, so on a browser without the binding module the flag is silently
ignored and the call succeeds anyway. Only the projection-layer and one-frame rows are evidence.

### Session capabilities

Needed later by [#10](https://github.com/kruddage/carve/issues/10),
[#11](https://github.com/kruddage/carve/issues/11) and
[#15](https://github.com/kruddage/carve/issues/15); captured now because the headset is already on.

| Check | Desktop Chrome | Quest 3 |
|---|---|---|
| Reference space: `viewer` | _tbd_ | _tbd_ |
| Reference space: `local` | _tbd_ | _tbd_ |
| Reference space: `local-floor` | _tbd_ | _tbd_ |
| Reference space: `bounded-floor` | _tbd_ | _tbd_ |
| Reference space: `unbounded` | _tbd_ | _tbd_ |
| `bounded-floor` boundsGeometry | _tbd_ | _tbd_ |
| `session.supportedFrameRates` | _tbd_ | _tbd_ |
| Current `session.frameRate` | _tbd_ | _tbd_ |
| `XRHand` on `inputSource.hand` / joint count | _tbd_ | _tbd_ |
| Input sources seen | _tbd_ | _tbd_ |

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

- [ ] Replace the "Can we actually use WebGPU on Quest 3?" table in
      [#1](https://github.com/kruddage/carve/issues/1) with the measured result.
- [ ] Record the one-line backend recommendation in [#2](https://github.com/kruddage/carve/issues/2)
      and close it.
- [ ] Carry the decision into [#4](https://github.com/kruddage/carve/issues/4)'s renderer
      abstraction as the immersive default.
- [ ] Note the native framebuffer scale factor in [#15](https://github.com/kruddage/carve/issues/15)
      — it is the starting point for the resolution budget.
