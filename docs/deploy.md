# Deploy

The site is published by [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) on every
push to `main`, and lives at:

**https://kruddage.github.io/carve/**

HTTPS is the point. WebXR only starts an immersive session from a secure context, so this URL is
the only way to try a change on a Quest without standing up a tunnel and a trusted certificate.

## One-time repo setting — do this or nothing publishes

**Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

Until that is flipped, `pages.yml` runs, goes green, uploads its artifact, and publishes nothing:
the repo is still serving whatever the legacy branch-based source points at. This is the single
most confusing failure mode in the whole setup, because there is no red X anywhere to notice. If
the workflow is green and the site is stale, check this setting first.

After flipping it, run the workflow once from the Actions tab (it has `workflow_dispatch`) rather
than waiting for the next push.

## What gets published

Today: the static repo root, which is just the coming-soon `index.html`. There is no build step.

The workflow copies the site into a `_site/` directory and uploads that, excluding `.git`,
`.github`, `docs/`, `LICENSE`, `CHANGELOG.md`, and the release-please config — the artifact should
be the site and nothing else. That copy is one clearly-marked step in `pages.yml`; when the Vite
scaffold lands (#3) it is replaced with `npm ci && npm run build` and the upload path changes from
`_site` to `dist`. The rest of the workflow is unaffected.

## The base-path gotcha

This is a *project* Pages site, not a user site, so everything is served under the `/carve/`
subdirectory rather than at the domain root. Any absolute path the app emits — `/assets/app.js`,
`/probe/`, a `fetch('/models/foo.glb')`, a service-worker scope — resolves to
`kruddage.github.io/assets/...`, which is not this repo, and 404s. Vite defaults `base` to `/`, so
a build that works perfectly on `localhost:5173` will come up blank on Pages with nothing but
console 404s to go on. The fix is `base: '/carve/'` in `vite.config.ts` (and using
`import.meta.env.BASE_URL` rather than hand-written leading slashes anywhere runtime code builds a
URL). Worth getting right before the first on-device test, because debugging a blank page from
inside a headset — where there is no devtools panel — costs far more than it does on a laptop.

The same trap applies to the capability probe from #2: link it as a relative path so it works at
`/carve/probe/` without special-casing.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs typecheck / lint / test / build on
push and PR. There is no `package.json` yet, so every npm step is guarded and the workflow is
currently a green no-op. It starts doing real work automatically once #3 lands the scaffold; no
edit to the workflow is needed.
