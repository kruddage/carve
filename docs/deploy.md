# Deploy

The site is published by [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) on every
push to `main`, and lives at:

**https://kruddage.github.io/carve/**

HTTPS is the point. WebXR only starts an immersive session from a secure context, so this URL is
the only way to try a change on a Quest without standing up a tunnel and a trusted certificate.

## Repo setting

**Settings → Pages → Build and deployment → Source: `Deploy from a branch`, branch `gh-pages`,
folder `/ (root)`.**

The branch does not exist until the first push to `main` runs the workflow, so set this after the
first successful deploy — the branch will not be offered in the dropdown before then.

This mirrors `kruddage/engine`. The alternative — Source: `GitHub Actions` — was rejected for one
concrete reason: it publishes exactly **one** artifact per repository, so per-PR previews are
impossible under it. The branch model lets every PR own a subdirectory of the same branch, which
is what makes the previews below work.

## What gets published

One `build` job produces the site and uploads it as an artifact; `deploy` and `preview` both
consume that artifact, so what lands on a preview URL is byte-for-byte what would land on the live
site.

The build is `npm ci && npm run build`, and the resulting `dist/` is what gets uploaded. Two things
end up in it:

- **The app**, from the root `index.html` entry. As of #9 that is the modeler itself; `index.html`
  is now a shell around an empty `#app` host that `src/ui/` fills, plus a boot message that stays on
  screen if the bundle never arrives. See `docs/dev-setup.md` and `docs/desktop-ui.md`.
- **Everything under `public/`**, copied verbatim with no bundling, hashing, or transform. That is
  how the dependency-free capability probe from #2 reaches `/probe/`: it lives at `public/probe/`,
  so it is served there in dev and copied to `dist/probe/` at build.

`deploy` runs only on push to `main` and pushes the artifact to the root of `gh-pages` with
`keep_files: true`, which is what stops a main deploy from wiping every open PR's preview.

## PR previews

Every pull request from a branch in this repo gets its own deploy at:

```
https://kruddage.github.io/carve/pr-preview/pr-<N>/
```

The workflow comments the URL on the PR and deletes the directory when the PR merges or closes.
This is the point of the whole branch-based setup: a headset can open a branch directly, with no
local dev server, no `adb reverse`, and no certificate — which matters a lot when the device is
the thing you are actually building for.

Two limits worth knowing:

- **Fork PRs get no preview.** The `pull_request` token is read-only for forks, so a fork cannot
  push to `gh-pages`. Supporting them safely needs a separate `pull_request_target` /
  `workflow_run` job that deploys outside the untrusted build context.
- **The preview job is `continue-on-error`.** It is a convenience, not a correctness gate — CI
  covers that — so a gh-pages push race can never block a merge.

## The base-path gotcha

This is a _project_ Pages site, not a user site, so everything is served under the `/carve/`
subdirectory rather than at the domain root. Any absolute path the app emits — `/assets/app.js`,
`/probe/`, a `fetch('/models/foo.glb')`, a service-worker scope — resolves to
`kruddage.github.io/assets/...`, which is not this repo, and 404s. Vite defaults `base` to `/`, so
a build that works perfectly on `localhost:5173` comes up blank on Pages with nothing but console
404s to go on.

Previews make this sharper, because the site is now served from **two different depths**:

|         | Path                        |
| ------- | --------------------------- |
| Live    | `/carve/`                   |
| Preview | `/carve/pr-preview/pr-<N>/` |

A hardcoded `base: '/carve/'` is correct for the first and wrong for the second — every preview
would silently load the _live_ site's bundle, which is the worst possible failure because the page
renders and looks approximately right while testing the wrong code. Since `deploy` and `preview`
share one artifact, the build cannot know its own depth.

So the base is **relative** (`base: './'` in `vite.config.ts`), which resolves correctly at any
depth and needs no per-job rebuild. The rule that follows: anywhere runtime code constructs a URL,
use `import.meta.env.BASE_URL` or `new URL('./thing', import.meta.url)` — never a hand-written
leading slash. Worth getting right before the first on-device test, because debugging a blank page
from inside a headset, where there is no devtools panel, costs far more than it does on a laptop.

The same trap applies to the capability probe from #2: link it as a relative path so it works at
`/carve/probe/` without special-casing.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs typecheck / lint / test / build on
push and PR. Its npm steps are guarded on `package.json` existing — that guard is now satisfied by
the scaffold, so the workflow runs for real, and the guard stays only because it costs nothing and
keeps the file honest if the scaffold ever moves.

Note that `pages.yml` builds independently rather than depending on the CI job. That is deliberate:
a preview should be publishable to look at even while a lint rule is failing, since seeing the
thing on the headset is often how you work out what to fix.
