# Dev setup: clone to code running on a Quest 3

Everything you need to go from a fresh machine to your own build running in the headset, plus
the decisions baked into the scaffold that are easier to read here than to reverse-engineer from
config files.

The short version:

```bash
git clone https://github.com/kruddage/carve.git && cd carve
npm install
npm run dev            # http://localhost:5173/carve/
adb reverse tcp:5173 tcp:5173
# then open http://localhost:5173/carve/ in Quest Browser
```

If that worked, skip to [HMR across the link](#4-does-hmr-survive-the-link).

---

## 1. Prerequisites

|         |                                                                                     |
| ------- | ----------------------------------------------------------------------------------- |
| Node    | 20.19+ or 22.12+ (Vite 7 requires it). `node --version`.                            |
| npm     | 10+. The lockfile is committed — use `npm ci` in CI, `npm install` locally.         |
| Quest 3 | Developer mode enabled, USB-C cable.                                                |
| `adb`   | From Android platform-tools. `brew install --cask android-platform-tools` on macOS. |

Developer mode on the headset: Meta Horizon app on your phone → Devices → your headset →
Headset settings → Developer Mode → on. Then plug the headset into your computer and accept the
"Allow USB debugging" prompt **inside the headset** — it is a floating dialog you have to look at
and click, and it is easy to miss if the headset is on your desk. Confirm with:

```bash
adb devices
# List of devices attached
# 1WMHHXXXXXXXXX  device        <- "device", not "unauthorized" and not empty
```

## 2. The scripts

| Command             | What it does                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server on **http://localhost:5173/carve/**, listening on all interfaces (`--host`). |
| `npm run dev:https` | Same, over HTTPS with a self-signed cert from `@vitejs/plugin-basic-ssl`.                    |
| `npm run build`     | Production build into `dist/`.                                                               |
| `npm run preview`   | Serves the built `dist/` on port 4173 — use this to check a production build on-device.      |
| `npm test`          | Vitest, once. `npm run test:watch` to stay in it.                                            |
| `npm run typecheck` | `tsc --noEmit`. Vite does not typecheck during dev; this is the check that does.             |
| `npm run lint`      | ESLint (including the import boundary) plus a Prettier format check.                         |
| `npm run lint:fix`  | Fixes what is auto-fixable and reformats.                                                    |

**The dev URL has `/carve/` in it.** That is not a typo — see [§6](#6-the-base-path). `/` redirects
to it.

## 3. Getting it onto the headset

WebXR only runs in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).
`http://192.168.1.20:5173` is not one, so the obvious approach — start the dev server, type your
LAN IP into Quest Browser — cannot work. There are three ways around it, in the order you should
reach for them.

### Option A — `adb reverse` (recommended default)

```bash
npm run dev
adb reverse tcp:5173 tcp:5173
```

Then in Quest Browser open **`http://localhost:5173/carve/`**.

`adb reverse` makes port 5173 _on the headset_ forward to port 5173 on your machine. The headset
is genuinely talking to `localhost`, and `http://localhost` is a secure context by definition — so
WebXR, `navigator.xr`, device sensors and the rest all work with **no certificate anywhere in the
picture**. No self-signed warnings, no CA to install on a device with an awkward settings UI, no
re-issuing a cert when your laptop's DHCP lease changes, no firewall exceptions. That is why this
is the default and the LAN-HTTPS route is the fallback rather than the other way around.

Things to know:

- The forward is **not persistent**. Unplugging the cable, rebooting the headset, or restarting
  the adb server drops it. Re-run `adb reverse tcp:5173 tcp:5173`. Check with `adb reverse --list`.
- `npm run dev` pins the port (`strictPort: true`). If 5173 is busy Vite fails loudly instead of
  quietly moving to 5174 — which would leave the forward pointing at nothing and the headset
  showing a connection error that looks like an adb problem.
- **Wireless works too.** Once connected over USB: `adb tcpip 5555`, unplug, `adb connect <headset-ip>:5555`,
  then `adb reverse tcp:5173 tcp:5173` as usual. The headset's IP is in Settings → Wi-Fi → your
  network. This is worth doing — being tethered while wearing a headset is its own kind of misery.
- With multiple devices attached, target the headset explicitly: `adb -s <serial> reverse tcp:5173 tcp:5173`.

### Option B — HTTPS on the LAN

For when adb is unavailable — a headset you cannot put in developer mode, or someone else's
device on your network.

```bash
npm run dev:https
#   ➜  Network: https://192.168.1.20:5173/carve/
```

`--mode https` is what activates `@vitejs/plugin-basic-ssl` (see `vite.config.ts`); plain
`npm run dev` deliberately does not, so the common path never touches certificates. The plugin
mints a self-signed certificate and caches it under `node_modules/.vite/basic-ssl/`.

In Quest Browser, open the network URL. You will get the interstitial warning. **Certificate trust
steps, in the order they actually work:**

1. On the warning page, tap **Advanced** → **Proceed to 192.168.1.20 (unsafe)**. The exception is
   per-origin and lasts for the browser session; the IP is part of the origin, so a new DHCP lease
   means doing it again.
2. If WebXR still refuses to start after clicking through, the click-through exception was not
   enough — Chromium treats a page with a certificate error as a secure context for _loading_ but
   restricts some powerful features. In that case you need the certificate actually trusted:
   - `mkcert -install` on your dev machine, then `mkcert 192.168.1.20` for a cert naming your LAN
     IP, and point `server.https` in `vite.config.ts` at the generated `.pem` pair.
   - Get mkcert's root CA onto the headset: `adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/Download/`,
     then in the headset Settings → System → search for _certificate_ → install from storage. Horizon
     OS requires a device screen lock (PIN/pattern) before it will let you install a user CA, so set
     one first. This is the step everyone forgets, and it is the reason Option A exists.
3. Your desktop firewall must allow inbound 5173. On macOS the prompt appears the first time Node
   binds; if you dismissed it once, System Settings → Network → Firewall → Options.

### Option C — deploy and open the real URL

Merging to `main` publishes to <https://kruddage.github.io/carve/> over real HTTPS, with the
capability probe alongside at `/probe/`. Slowest loop by far, but it is the only one that exercises
the production build, the real base path, and Pages' own headers. Do it before you believe
something works. `npm run preview` after `npm run build` is the local approximation — combine it
with `adb reverse tcp:4173 tcp:4173`.

## 4. Does HMR survive the link?

**Over `adb reverse`: yes, with nothing to configure.** The HMR WebSocket connects back to the same
origin the page was loaded from (`localhost:5173`), which the forward already covers. Edit a file,
the headset picks it up.

**Over LAN HTTPS: yes, once the certificate is accepted.** The HMR socket upgrades to `wss://` on
the same host and port, so it inherits the exception you granted the page. If the page loads but
edits never arrive, open DevTools ([§5](#5-remote-debugging)) and look for a failed WebSocket — that
is the certificate, not Vite.

**Entering an immersive session is where it gets sharp**, and the distinction that matters is
_hot update_ versus _full reload_:

- A **full page reload** — which is what Vite falls back to whenever a module has no HMR handler,
  and unconditionally for `index.html` — **ends the `XRSession`**. The headset drops you back to the
  browser panel. Re-entering requires clicking Enter XR again, because `requestSession()` for an
  immersive mode requires user activation and a reload throws that away. There is no way around
  this; it is the WebXR security model, not a Vite limitation.
- A **hot update** can survive the session, but only for modules that do not own session state. Any
  module holding the `XRSession`, the renderer, or GPU resources has to hand them over explicitly
  via `import.meta.hot.dispose(...)` or it will leak the old session and the new module will render
  into a canvas nobody is presenting.

The practical consequence for the XR work: expect to re-enter immersive mode after most edits, and
keep the Enter XR path to one click from a cold load. Cheaper still, do as much iteration as
possible on the 2D page and only put the headset on to verify.

> Measured on-device behaviour goes here once issue #10 exists and there is a real session to break.
> Until then the above is derived from how Vite HMR and the WebXR user-activation requirement work,
> not from a recorded run — do not treat it as tested.

## 5. Remote debugging

You cannot read a console while wearing a headset. Use Chrome on the desktop.

1. Headset connected via adb (`adb devices` shows `device`).
2. Desktop Chrome → **`chrome://inspect/#devices`** → tick **Discover USB devices**.
3. The headset appears with its open Quest Browser tabs listed under it. Click **inspect** next to
   the Carve tab. You get full DevTools — console, network, sources, breakpoints — against the page
   running in the headset. Keep the headset on and read the desktop screen.

Notes worth having:

- Only one adb server can own the device. If `chrome://inspect` shows nothing while `adb devices`
  works, some other tool grabbed it — `adb kill-server && adb devices`, then reload the inspect page.
- The **Port forwarding** button on `chrome://inspect` does the same job as `adb reverse` through a
  GUI. Either is fine; `adb reverse` is scriptable, so it is what this doc uses.
- `adb logcat -s chromium` gives you console output as a plain stream, which is easier to grep and
  survives DevTools disconnecting when a session starts.
- To see what the wearer sees, cast the headset (Quest menu → Camera → Cast → Computer, then open
  <https://www.meta.com/experiences/cast/>). Debugging spatial UI without this is guesswork.
- `document.documentElement.dataset.carveBoot` is set by `src/main.ts` on load. If it is missing but
  the page rendered, the JS bundle 404'd — almost always a base-path problem ([§6](#6-the-base-path)).

## 6. The base path

The site is a GitHub **project** page: it lives at `https://kruddage.github.io/carve/`, not at a
domain root. `vite.config.ts` therefore sets `base: '/carve/'`, and asset URLs are emitted as
`/carve/assets/...`.

This is applied **in dev as well as in build**, on purpose. The dev server serves the app at
`http://localhost:5173/carve/` (and redirects `/` to it), so dev and production resolve URLs
identically. The alternative — base `/` in dev, `/carve/` in build — hides base-path bugs until
deploy, and the failure mode is a page that renders its static HTML with a 404'd bundle. Inside a
headset that is indistinguishable from everything working. It is worth the mildly ugly dev URL to
make that class of bug impossible.

## 7. Static passthrough: `publicDir` and `probe/`

Two ways to ship a file into the build byte-for-byte:

- **`public/`** — Vite's `publicDir`, set explicitly in `vite.config.ts`. Contents are copied to the
  root of `dist/` and served at `<base>` in dev. `public/foo/bar.txt` → `/carve/foo/bar.txt`.
- **`probe/`** at the repo root — handled by the small `carve:root-passthrough` plugin in
  `vite.config.ts`. The capability probe from issue #2 is deliberately outside the app: plain HTML
  and one JS file, no build step, no dependency on anything here. It stays reachable at
  `/carve/probe/` in dev and is copied into `dist/probe/` at build. The plugin is a no-op if the
  directory does not exist.

Neither path is bundled, transformed, hashed, or linted. Do not put sources in them.

## 8. Why `index.html` is still the coming-soon page

The repo root already had `index.html` — the coming-soon landing page — and Vite wants exactly that
path as its entry. The collision had to be resolved one way or the other. The options were:

1. **Move the landing page aside** (to `landing/index.html` or `public/`) and give the app a fresh
   shell at the root.
2. **Keep the landing page as the app's initial shell**, with the app's entry script added to it.

**We chose (2).** The app has no UI until issue #9 — the milestone where `/` stops being the
coming-soon page and becomes the modeler. Choosing (1) would have replaced a working landing page
with a blank one for the whole of M0 and M1, at the exact moment the project most wants a URL you
can send someone. So `index.html` keeps its markup verbatim and gains one line:

```html
<script type="module" src="/src/main.ts"></script>
```

`src/main.ts` renders nothing today. Issue #9 replaces the `<main>` content with the modeler; the
coming-soon markup is the thing being replaced, not something to delete now and reinstate later.

Two consequences to keep in mind:

- The landing page is now part of the build. It is `dist/index.html`, produced by Vite, not a static
  copy — so edits to it go through the build, and its inline `<style>` block is Vite's problem now.
- If a future issue wants the landing page preserved _alongside_ the app, the move is to copy it
  into `public/` at that point, not to reverse this decision.

## 9. The import boundary

`src/core/` (document model) and `src/kernel/` (CSG worker) are headless by contract. They must not
import from `src/render/`, `src/input/`, `src/ui/` or `src/xr/`. Dependencies point inward; outer
layers importing inner ones is fine and expected.

This is enforced by `@typescript-eslint/no-restricted-imports` in `eslint.config.js`, scoped to
those two directories, and `npm run lint` is what CI runs. It is not a convention in a README —
issue #3's phrasing is that "the abstraction is only real if it's enforced".

**Verify the rule actually fires** (a restricted-import glob that matches nothing lints clean
forever and everyone believes the boundary is held):

```bash
echo "export * from '../render/index.js';" > src/core/violation.ts
npx eslint src/core/violation.ts; rm src/core/violation.ts
```

Expected: exactly one error, rule `@typescript-eslint/no-restricted-imports`, exit code 1.

`test/import-boundary.test.ts` asserts this automatically — both directions, and both the positive
case (each forbidden import is flagged from both `core` and `kernel`) and the negatives (inward
imports and outer-to-outer imports are _not_ flagged, so the rule cannot be passing by being
over-broad). `test/headless.test.ts` backs it up from the other side by importing `core` and
`kernel` in a DOM-less Node environment.

## 10. Troubleshooting

| Symptom                                                     | Cause                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Headset shows "site can't be reached" at `localhost:5173`   | `adb reverse` not active (`adb reverse --list`), or the dev server is not running.                                 |
| Page renders but nothing works; `dataset.carveBoot` missing | Bundle 404'd. Base path — check the URL includes `/carve/`.                                                        |
| `Vite: Port 5173 is already in use` and it exits            | Intentional (`strictPort`). Kill the other server rather than letting the port drift out from under `adb reverse`. |
| `adb devices` shows `unauthorized`                          | The USB-debugging prompt inside the headset has not been accepted. Put it on.                                      |
| WebXR unavailable / `navigator.xr` undefined over LAN HTTPS | Certificate is not trusted enough. Use Option A, or install the CA properly per Option B step 2.                   |
| Edits do not hot-reload                                     | Over HTTPS: failed HMR WebSocket, look in DevTools. In an immersive session: expected, see §4.                     |
| `chrome://inspect` lists nothing                            | Another adb server owns the device: `adb kill-server && adb devices`.                                              |
| Lint fails on formatting only                               | `npm run lint:fix`.                                                                                                |
