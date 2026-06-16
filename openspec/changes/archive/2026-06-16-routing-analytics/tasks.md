# Tasks: Routing & Usage Analytics

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~245 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | n/a (single PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature: routing module + App wiring + analytics gate + vercel config | PR 1 | ~245 lines, well under 400-line budget |

---

## Phase 1: Pure Routing Module (TDD — test first)

Spec: `client-routing` capability / Path-to-View Mapping, View-to-Path Mapping, Round-Trip Correctness

- [x] 1.1 Write **failing** `tests/unit/routing.test.ts`
  - `viewToPath`: `'home' → '/'`; each of the 8 non-home `ViewName` values → `'/<view>'`
  - `pathToView`: `'/' → 'home'`; `'/caged' → 'caged'`; every other known view segment; trailing slash `'/caged/' → 'caged'`; double-leading-slash `'//caged' → 'caged'`; unknown `'/not-a-tool' → 'home'`; empty `'' → 'home'`
  - Round-trip for ALL `ViewName` values: iterate `VIEW_NAMES`, assert `pathToView(viewToPath(v)) === v`
  - `VIEW_NAMES.length === 9` and matches expected set (drift alarm)
  - All tests must FAIL (red) before implementation

- [x] 1.2 Implement `src/lib/routing.ts`
  - Export `VIEW_NAMES as const` with all 9 `ViewName` literals
  - Add compile-time exhaustiveness guard:
    - `type _ArrayIsSubsetOfUnion = (typeof VIEW_NAMES)[number] extends ViewName ? true : never`
    - `type _UnionIsSubsetOfArray = Exclude<ViewName, (typeof VIEW_NAMES)[number]> extends never ? true : never`
    - `const _viewNamesExhaustive: [_ArrayIsSubsetOfUnion, _UnionIsSubsetOfArray] = [true, true]`
  - Export `HOME_PATH = '/'`
  - Export `viewToPath(view: ViewName): string` — `home → '/'`, all others → `'/' + view`
  - Implement `VIEW_NAME_SET` (`ReadonlySet<string>`) from `VIEW_NAMES`, `isViewName` type guard
  - Export `pathToView(pathname: string): ViewName` — strip `^\/+` and `\/+$`, empty → `'home'`, known → cast, unknown → `'home'`
  - All Phase 1 tests must pass (green); run `npm test` — full suite (802 + new) stays green

Commit: `feat(routing): add pure routing module with exhaustiveness guard`

---

## Phase 2: App.svelte Wiring (TDD — test first)

Spec: `app-shell` capability / navigate() Syncs URL, Initial View Derived From Pathname, Browser Back/Forward Navigation

- [x] 2.1 Write **failing** `tests/components/App.test.ts` (extend existing or create)
  - `beforeEach`: `history.replaceState({}, '', '/')` to reset URL; unmount after each test
  - Seed-from-pathname: set `history.pushState({}, '', '/caged')` before `render(App)`; assert CagedTool renders
  - Seed unknown path: set pathname to `/'/unknown-tool'` before render; assert Home renders
  - navigate() syncs URL: render App at `'/'`, trigger navigation to `'caged'` (click a tool or call navigate via exposed handle), assert `window.location.pathname === '/caged'` and CagedTool rendered
  - navigate() to home: navigate to `'home'`, assert `location.pathname === '/'`
  - Back/forward: navigate to `'caged'`, then dispatch `new PopStateEvent('popstate')` after setting URL back to `'/'` via `history.replaceState`; assert Home renders and `history.pushState` was NOT called (spy assertion)
  - No-loop guard: spy on `history.pushState`; dispatch `popstate`; assert pushState call count is 0
  - All tests must FAIL (red) before implementation

- [x] 2.2 Edit `src/App.svelte` — four surgical edits inside `<script>`:
  - Add import: `import { viewToPath, pathToView } from '$lib/routing'`
  - Change initial state: `let currentView: ViewName = $state(pathToView(location.pathname))`
  - Extend `navigate(view: ViewName)`: after `currentView = view`, add `const path = viewToPath(view); if (location.pathname !== path) { history.pushState({}, '', path); }`
  - Add `$effect` with `popstate` listener: `const onPopState = () => { currentView = pathToView(location.pathname); }; window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState);`
  - All Phase 2 tests must pass (green); run `npm test` — full suite stays green

Commit: `feat(app): seed view from URL, sync pushState on navigate, handle popstate`

---

## Phase 3: Analytics Bootstrap in main.ts

Spec: `usage-analytics` capability / Vercel Web Analytics — Production Only, Automatic Pageview Tracking

- [x] 3.1 Add `@vercel/analytics` to `package.json` dependencies
  - Run `npm install @vercel/analytics`
  - Confirm the package resolves and `npm run build` succeeds

- [x] 3.2 Edit `src/main.ts` — add analytics gate after `mount(App, { target })`:
  ```ts
  import { inject } from '@vercel/analytics';

  function shouldEnableAnalytics(): boolean {
    return import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production';
  }

  if (shouldEnableAnalytics()) {
    inject();
  }
  ```
  - Gate MUST use the exact expression `import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production'`
  - `inject()` is called ONLY inside the gate; no `track()` calls anywhere
  - `@vercel/analytics` MUST NOT be imported in `App.svelte` or any component

- [x] 3.3 Verify analytics isolation: run `npm test` — all tests pass; confirm no test imports `main.ts` or requires a `@vercel/analytics` mock

Commit: `feat(analytics): inject Vercel Web Analytics gated to production only`

---

## Phase 4: Vercel SPA Rewrite Config

Spec: `client-routing` capability / SPA Fallback Rewrite

- [x] 4.1 Create `vercel.json` at repo root:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
  - Must use `rewrites` (NOT `redirects`) so the browser URL stays at `/<view-name>` for analytics
  - No `build.env` block needed; VITE_VERCEL_ENV is set via Vercel project env (see Task 5.1)

Commit: `feat(infra): add vercel.json SPA rewrite for deep links`

---

## Phase 5: Manual / Owner Action

> **MANUAL — owner action, NOT a code task. Must be done before production deploy.**

- [ ] 5.1 **[MANUAL / owner, not code]** In the Vercel dashboard, add a project environment variable:
  - Name: `VITE_VERCEL_ENV`
  - Value: `production`
  - Scope: **Production** environment ONLY (do NOT add to Preview or Development)
  - Purpose: makes the analytics gate `import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production'` evaluate `true` exclusively in production Vercel builds
  - If this variable is absent or set on Preview, analytics stays OFF (fail-safe behavior)

---

## Phase 6: Full Verification

- [x] 6.1 Run `npm test` — full Vitest suite must pass. Baseline is 802 tests + new routing unit tests + new App component tests. Zero regressions.

- [x] 6.2 Run `npm run build` (which invokes `tsc --noEmit`) — must succeed. The `VIEW_NAMES` exhaustiveness guard is enforced by `tsc`, NOT the test suite; a missing `ViewName` member in `VIEW_NAMES` must produce a build error here.

- [x] 6.3 Confirm no new `svelte-check` errors: run `npx svelte-check --tsconfig ./tsconfig.json` (or project equivalent) and verify zero new errors.

- [ ] 6.4 Visual regression check: open the app locally (`npm run dev`), confirm the visual skin (studio dark theme) is completely untouched — no layout shifts, no color changes, no design token modifications.

---

## Implementation Order (Sequential — each depends on prior)

```
1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2 → 3.3 → 4.1 → [5.1 MANUAL] → 6.1 → 6.2 → 6.3 → 6.4
```

All tasks are sequential. The strict TDD order is:
1. Failing routing tests → routing implementation (Phase 1)
2. Failing App tests → App wiring (Phase 2)
3. Dependency install → main.ts analytics (Phase 3)
4. vercel.json (Phase 4)
5. Manual env var in Vercel dashboard (Phase 5, owner)
6. Full verification suite (Phase 6)

No tasks can be parallelized safely because each phase's implementation is gated on the prior test being red-then-green.

---

## Spec Requirements Coverage

| Requirement | Tasks |
|---|---|
| Path-to-View Mapping (all 9 views + fallbacks) | 1.1, 1.2 |
| View-to-Path Mapping | 1.1, 1.2 |
| Round-Trip Correctness | 1.1, 1.2 |
| Browser Back/Forward Navigation | 2.1, 2.2 |
| SPA Fallback Rewrite | 4.1 |
| Vercel Web Analytics — Production Only | 3.1, 3.2, 5.1 |
| Automatic Pageview Tracking | 3.2 |
| navigate() Syncs URL | 2.1, 2.2 |
| Initial View Derived From Pathname | 2.1, 2.2 |
| VIEW_NAMES exhaustiveness guard (tsc) | 1.2, 6.2 |
