# Design: Routing & Usage Analytics — v1

## Context

This is a non-SvelteKit Svelte 5 + Vite SPA mounted manually in `src/main.ts`
(`mount(App, { target })`). The app is a single chokepoint router: `App.svelte`
holds `let currentView: ViewName = $state('home')` and a `navigate(view)`
function (line 15) that every tool and the home grid call. The address bar
always reads `/`, so automatic pageview analytics cannot tell tools apart.

This change makes the URL the source of truth for tool identity via the History
API, with a **1:1 path ↔ `ViewName`** map (no slug layer, no routing library),
and wires cookieless Vercel Web Analytics so per-tool pageviews are captured
automatically from `pushState` navigations — **production only**.

The proposal already decided WHAT and WHETHER. This document designs HOW, against
the real code: `App.svelte` (the `navigate` chokepoint), `ViewName` in
`src/lib/types/chord.ts`, `main.ts` (manual `mount`), `index.html`, and the
Vitest/jsdom suite (`vite.config.ts` → `test.environment: 'jsdom'`,
`include: ['tests/**/*.{test,spec}.ts']`). No `vercel.json` exists yet.

Stack facts that constrain the design:
- Svelte 5 runes mode. `navigate` is plain function state mutation today.
- Vite, no SvelteKit → the SvelteKit `<Analytics />` component does NOT apply.
  The correct API is the framework-agnostic `inject()` from `@vercel/analytics`.
- Tests run in jsdom, which DOES provide `window.location` and
  `window.history` (`pushState`/`replaceState`/`popstate`) — confirmed by the
  existing component suite rendering with `@testing-library/svelte`.
- `$lib` alias → `src/lib`. Unit tests live under `tests/unit/`, component tests
  under `tests/components/`.

## Goals / Non-Goals

Goals (v1):
- Pure, unit-tested `src/lib/routing.ts` with `viewToPath` / `pathToView`,
  unknown-path → `home` fallback, root and trailing-slash handling.
- A canonical runtime list of `ViewName` values that is kept in sync with the
  union by a **compile-time exhaustiveness check** (a missing entry fails
  `tsc`).
- `App.svelte` seeds `currentView` from `location.pathname`, extends `navigate`
  to `pushState`, and adds a `popstate` listener with `$effect` cleanup, with NO
  feedback loop between push and pop.
- `@vercel/analytics` injected once, **production-on-Vercel only** (dev AND
  Vercel preview excluded), no `track()` calls.
- `vercel.json` SPA fallback rewrite so deep links / refresh resolve.

Non-Goals (locked, do NOT re-open):
- No `track()` / custom events (Pro-plan gated). Pageviews only.
- No slug/alias indirection, no query-param or nested route state.
- No cookie/consent banner (Vercel Web Analytics is cookieless, no PII).
- No routing library. No visual skin / design-token changes.

## Decisions

### ADR-1 — `src/lib/routing.ts`: pure functions + a single source-of-truth `ViewName[]` guarded by an exhaustiveness check

**Problem.** A TypeScript union (`ViewName`) has **no runtime form** — you cannot
iterate or `.includes()` over a type. `pathToView` must validate an arbitrary
pathname against the set of valid views at runtime, so it needs a runtime array.
The risk: that array silently drifts from the union when a tool is added later
(the proposal's "forgets the route" risk). The design REQUIRES that a missing
entry be a **compile error**, not a silent fallback-to-home bug.

**Decision.** Declare the canonical runtime array `as const`, then assert at the
type level that it covers every `ViewName` member. Place the array in
`routing.ts` (routing-owned), not in `chord.ts`, to keep the type module
declaration-only.

```ts
import type { ViewName } from '$lib/types/chord';

// Canonical runtime list of every ViewName. ORDER is irrelevant; COVERAGE is enforced below.
export const VIEW_NAMES = [
  'home',
  'caged',
  'progression',
  'note-trainer',
  'tone-generator',
  'pentatonic',
  'signal-lab',
  'interval-trainer',
  'tab-player',
] as const;

// --- Compile-time sync guard (no runtime cost) ---
// 1. The array must contain ONLY ViewName members (catches typos / stale entries).
type _ArrayIsSubsetOfUnion = (typeof VIEW_NAMES)[number] extends ViewName ? true : never;
// 2. The array must contain EVERY ViewName member (catches a forgotten new tool).
//    If a ViewName is missing from VIEW_NAMES, `Exclude<...>` is non-never and this errors.
type _UnionIsSubsetOfArray =
  Exclude<ViewName, (typeof VIEW_NAMES)[number]> extends never ? true : never;
// Force evaluation; either failing produces a `tsc` error at this line.
const _viewNamesExhaustive: [_ArrayIsSubsetOfUnion, _UnionIsSubsetOfArray] = [true, true];
void _viewNamesExhaustive;
```

`pathToView` then uses a `Set`-backed membership test derived from `VIEW_NAMES`
and a `ViewName` type guard.

**Signatures + impl sketch:**

```ts
export const HOME_PATH = '/';

/** home → '/', every other view → '/' + view. Total, never throws. */
export function viewToPath(view: ViewName): string {
  return view === 'home' ? HOME_PATH : `/${view}`;
}

const VIEW_NAME_SET: ReadonlySet<string> = new Set(VIEW_NAMES);

function isViewName(value: string): value is ViewName {
  return VIEW_NAME_SET.has(value);
}

/**
 * Resolve a pathname to a ViewName.
 * - '/'           → 'home'
 * - '/caged'      → 'caged'
 * - '/caged/'     → 'caged'   (trailing slash tolerated)
 * - '/unknown'    → 'home'    (unknown-path fallback)
 * - ''            → 'home'    (defensive)
 * Total, never throws.
 */
export function pathToView(pathname: string): ViewName {
  // Strip exactly one leading and one trailing slash, then normalize empties.
  const segment = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (segment === '') return 'home';
  return isViewName(segment) ? segment : 'home';
}
```

**Rationale.**
- `viewToPath`/`pathToView` are **total pure functions** (no `window`, no
  throws) → trivially unit-testable in jsdom or node, and SSR-safe by
  construction. Keeping them pure is the whole point of isolating routing here.
- The exhaustiveness guard turns the proposal's "new tool forgets the route"
  risk into a compile error: add `'metronome'` to `ViewName` without adding it to
  `VIEW_NAMES` and `Exclude<ViewName, ...>` becomes `'metronome'` (not `never`),
  so `_UnionIsSubsetOfArray` resolves to `never` and the `const` assignment fails
  `tsc`. This satisfies the "ideally so a missing entry is a compile error"
  requirement WITHOUT codegen or a build step.
- `home → '/'` is special-cased in BOTH directions, so the round-trip
  `pathToView(viewToPath('home')) === 'home'` holds.
- Trailing slash: Vercel's SPA rewrite can surface `/caged/`; the single
  trailing-slash strip normalizes it. Leading-slash strip uses `^\/+` to be
  defensive against `//caged`.

**Rejected.**
- *Deriving the array from the union at runtime* — impossible; unions don't exist
  at runtime. This is exactly why the explicit-array-plus-guard pattern is the
  canonical TS idiom.
- *Putting `VIEW_NAMES` in `chord.ts`* — would add runtime code to a
  types-only module and couple the type definition to routing concerns. Routing
  owns its runtime table.
- *A regex `Record<ViewName, string>` map* — heavier; `viewToPath` is a one-line
  conditional and `pathToView` only needs membership, not a reverse map.

### ADR-2 — `App.svelte` integration: seed from pathname, push on navigate, read on popstate, no feedback loop

**Decision.** Four surgical edits inside the existing `<script>`:

```ts
import { viewToPath, pathToView } from '$lib/routing';

// 1. Seed initial view from the URL instead of hardcoding 'home'.
let currentView: ViewName = $state(pathToView(location.pathname));

// 2. navigate() becomes the single sync point: set state AND push the URL.
function navigate(view: ViewName) {
  currentView = view;
  const path = viewToPath(view);
  if (location.pathname !== path) {
    history.pushState({}, '', path);
  }
}

// 3. Back/forward: read the URL → state. NEVER push here.
$effect(() => {
  const onPopState = () => {
    currentView = pathToView(location.pathname);
  };
  window.addEventListener('popstate', onPopState);
  // 4. Cleanup on teardown (App lives for the app's lifetime, but this is correct + test-friendly).
  return () => window.removeEventListener('popstate', onPopState);
});
```

**No-feedback-loop guarantee.** The two directions are strictly one-way each:
- `navigate()` writes state **and** pushes the URL. It does NOT listen to itself.
- the `popstate` handler **only reads** `location.pathname` and writes state. It
  NEVER calls `pushState`/`navigate`.

`pushState` does **not** emit a `popstate` event (only user back/forward, or
`history.back()/forward()/go()`, do). So a `navigate()` call cannot trigger the
listener, and the listener cannot trigger a push. There is no cycle. The
`if (location.pathname !== path)` guard in `navigate` is belt-and-suspenders: it
prevents a redundant history entry if `navigate` is ever called for the
already-current view (e.g. clicking the active tool), which also avoids polluting
back-stack with duplicate `/caged` entries.

**Svelte 5 idioms.**
- The listener lives in `$effect` (not `onMount`) per the project's Svelte 5
  convention; the returned function is the cleanup, mirroring how
  `ToneGenerator`/`IntervalTrainer` close their AudioContext in an effect
  teardown. This auto-removes the listener if `App` is ever unmounted (every
  component test mounts/unmounts `App`, so cleanup prevents listener leakage
  across tests).
- The effect body reads only `window`/`location` (untracked DOM globals), not
  reactive `$state`, so it runs **once** on mount and does not re-subscribe. No
  `untrack` is needed: `addEventListener`/`removeEventListener` and
  `location.pathname` are not Svelte reactive sources, so the effect has no
  reactive dependencies and will not re-run. (If a future edit reads
  `currentView` inside the effect, wrap that read in `untrack` to avoid
  re-registering the listener — called out so the gotcha is on record, but v1
  does not need it.)

**Initial-load seeding.** `pathToView(location.pathname)` resolves the deep link
on first render. Combined with the `vercel.json` rewrite (ADR-4), a refresh on
`/caged` serves `index.html`, the app boots, and `currentView` seeds to `'caged'`
— the deep-link + refresh success criteria. Unknown paths seed to `'home'`
(handled purely by `pathToView`), so a stale/legacy URL never blanks the screen.

**Optional polish (NOT required for v1):** on first load we could
`history.replaceState({}, '', viewToPath(currentView))` to canonicalize the URL
(e.g. rewrite `/caged/` → `/caged`, or `/unknown` → `/`). This is a one-liner in
the same `$effect` BEFORE adding the listener. Left out of the required scope to
keep the diff minimal; flagged so tasks can include it if desired.

**Rejected.**
- *`onMount` for the listener* — works, but `$effect` cleanup is the project's
  Svelte 5 idiom and gives symmetric add/remove in one place.
- *A `hashchange`/hash-router approach* — the proposal mandates the History API
  and clean `/caged` paths; hash routing would put `#/caged` in the URL and is
  explicitly out of scope.
- *A store/separate router module owning `currentView`* — overkill; the existing
  flat `$state` + single `navigate` chokepoint is exactly the seam routing needs.

### ADR-3 — Analytics mount: framework-agnostic `inject()` in `main.ts`, gated to Vercel production only

**Decision.** Use the **framework-agnostic** entry point from `@vercel/analytics`
— `inject()` — NOT the SvelteKit `<Analytics />` component (which requires
SvelteKit's app stores and does not exist for a plain Svelte/Vite app). Mount it
**once** in `src/main.ts`, gated so it runs only in Vercel **production**:

```ts
// src/main.ts (after the existing mount(App, { target }) succeeds)
import { inject } from '@vercel/analytics';

if (shouldEnableAnalytics()) {
  inject(); // auto-tracks History API pushState navigations → per-tool pageviews
}
```

`inject()` patches History so `pushState` navigations (our `navigate`) are
recorded as pageviews automatically — no `track()` and no per-view wiring needed.

**Where it lives: `main.ts`, not `App.svelte`.** Analytics is an
app-bootstrap/side-effect concern, exactly like the font imports and the global
mount already in `main.ts`. Keeping it there means:
- `App.svelte` stays a pure UI/router component with zero analytics import — so
  every component test that renders `App` or a tool never touches analytics, and
  no test-time guard or mock is needed in the component.
- It is mounted once for the app's lifetime (no effect re-run concerns).

**The gating gotcha — `import.meta.env.PROD` is NOT enough.** Vite sets
`import.meta.env.PROD === true` for ANY `vite build` (and `vite preview`),
including the build that produces **Vercel preview deployments**. So gating on
`PROD` alone would let **preview-deploy** analytics through, polluting the data —
exactly the risk the proposal calls out ("disabled in dev and preview deploys").

**Correct gate.** Vercel injects `VERCEL_ENV` (`'production' | 'preview' |
'development'`) at build time. We must check Vercel's environment, not just
Vite's mode. Because client code only sees env vars prefixed `VITE_`, expose it
in `vercel.json` build config OR read Vercel's auto-exposed system var. The
robust, Vite-idiomatic gate:

```ts
function shouldEnableAnalytics(): boolean {
  // Excludes: `vite dev` (PROD === false) AND Vercel preview/dev builds.
  // Includes ONLY a production build that is ALSO Vercel production.
  // VITE_VERCEL_ENV is mapped from Vercel's VERCEL_ENV (see vercel.json / project env).
  return import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production';
}
```

To make `VITE_VERCEL_ENV` available at build time on Vercel, add a project env
var (or `vercel.json` build env) mapping `VITE_VERCEL_ENV` ← `VERCEL_ENV`. With
that:
- **Local `vite dev`**: `PROD === false` → disabled.
- **Local `vite build`/`preview`**: `VITE_VERCEL_ENV` undefined → disabled.
- **Vercel preview deploy**: `PROD === true` but `VITE_VERCEL_ENV === 'preview'`
  → disabled.
- **Vercel production deploy**: `PROD === true` AND `VITE_VERCEL_ENV ===
  'production'` → **enabled**.

This is the recommended gate: dev AND Vercel preview are both excluded, only true
production is included. (If the team decides preview data is acceptable, they can
simplify to `import.meta.env.PROD`; documented here as a deliberate tradeoff, but
v1 ships the stricter `VERCEL_ENV` gate per the proposal.)

**Rationale.** `inject()` is the documented non-SvelteKit path; it is
side-effecting and idempotent, perfect for a single `main.ts` call. Gating in
`main.ts` keeps the bundle's analytics code dead-stripped in dev and absent from
the test path (tests import `App`/components, never run `main.ts`).

**Rejected.**
- *`<Analytics />` SvelteKit component* — wrong package surface for a plain Vite
  SPA; depends on `$app/*` which does not exist here. WOULD NOT BUILD.
- *Mount in `App.svelte` via `$effect`* — pulls an analytics import into the
  component tree and into component tests, forcing a stub; no benefit over
  `main.ts`.
- *Gate on `import.meta.env.PROD` alone* — leaks preview-deploy pageviews into
  production analytics. Rejected as the primary gate (kept only as the documented
  fallback if the team relaxes the requirement).

### ADR-4 — `vercel.json`: SPA fallback rewrite

**Decision.** Add `vercel.json` at the repo root with a catch-all rewrite so any
deep link / refresh serves the SPA shell, letting client routing resolve it:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Rationale.** Without this, a refresh on `/caged` asks Vercel's static host for a
`/caged` file, which does not exist → 404. The rewrite makes every path return
`index.html`; the app boots and `pathToView(location.pathname)` (ADR-2) opens the
right tool. `rewrites` (not `redirects`) is correct: the URL stays `/caged` in the
bar (so analytics still sees the per-tool path), only the served file changes.
Build env mapping for `VITE_VERCEL_ENV` (ADR-3) is configured via Vercel project
env vars; if preferred inline, a `build.env` block can be added here, but the
project-env approach keeps `vercel.json` to the rewrite alone.

**Rejected.** Per-route `routes` config or static `redirects` — `redirects`
changes the URL (breaks the path-based analytics signal); explicit per-route
entries don't scale and duplicate the routing map.

## Architecture / Data Flow

```
                         ┌─────────────── URL (address bar) ───────────────┐
                         │  /  /caged  /progression  ... /tab-player        │
                         └───────▲──────────────────────────────┬──────────┘
                                 │ pushState (navigate)          │ popstate (back/fwd)
                                 │                               ▼
  HomePage / tool ──navigate(v)──▶  App.svelte  ◀──── seed: pathToView(location.pathname)
                                    currentView $state              (initial load)
                                 ┌──────────────┴───────────────┐
                                 ▼                               ▼
                       viewToPath(view)                 pathToView(pathname)
                                 │   src/lib/routing.ts (PURE, total) │
                                 └─── VIEW_NAMES (canonical, tsc-exhaustive) ───┘

  src/main.ts (bootstrap):  mount(App) ──▶ if shouldEnableAnalytics() inject()
                                              (Vercel prod only; patches History → pageviews)

  Vercel static host:  /(.*) ──rewrite──▶ /index.html  (deep link / refresh resolve)
```

Data flow:
1. **Initial load.** Vercel serves `index.html` for any path (rewrite) →
   `main.ts` mounts `App` → `currentView = pathToView(location.pathname)` opens
   the right tool (or `home` on unknown).
2. **In-app navigation.** Any `navigate(view)` sets `currentView` and
   `pushState(viewToPath(view))` → address bar updates → `inject()`'s History
   patch records the pageview (prod only).
3. **Back/forward.** Browser emits `popstate` → listener sets
   `currentView = pathToView(location.pathname)` → view swaps; no push, no loop.

## Integration Points

- **Reuses:** `ViewName` (`src/lib/types/chord.ts`, unchanged), the existing
  `navigate` chokepoint and `currentView` `$state`, the `$effect`-cleanup idiom
  already used for AudioContext teardown, `$lib` alias.
- **New isolated module:** `src/lib/routing.ts` (pure; the only unit-tested
  surface).
- **New file:** `vercel.json` (host config; not imported by app code).
- **New dependency:** `@vercel/analytics` (runtime), imported ONLY in `main.ts`.
- **Build/host:** Vercel project env var `VITE_VERCEL_ENV` ← `VERCEL_ENV` for the
  analytics gate.
- **Untouched:** every tool component, the visual skin, design tokens, the error
  boundary, and the whole existing test suite's behavior.

## Testing Strategy (file placement)

**Unit (pure, the bulk of coverage) — `tests/unit/routing.test.ts`:**
- `viewToPath`: `home → '/'`; every other `ViewName → '/' + view`.
- `pathToView`: `'/' → 'home'`; each `'/<view>' → <view>`; trailing slash
  `'/caged/' → 'caged'`; unknown `'/nope' → 'home'`; empty `'' → 'home'`; double
  slash `'//caged' → 'caged'`.
- **Round-trip for EVERY `ViewName`:** iterate `VIEW_NAMES`, assert
  `pathToView(viewToPath(v)) === v`. This iteration is why `VIEW_NAMES` is the
  canonical list — the test loops the runtime array, and the ADR-1 guard ensures
  that array equals the union, so the round-trip test transitively covers every
  union member. A forgotten tool fails `tsc` (guard) before it can be missed by
  the test.
- `VIEW_NAMES` contains exactly 9 entries / matches expected set (cheap drift
  alarm in addition to the compile guard).

These run in jsdom but need no DOM — the functions are total and side-effect
free.

**Component integration — `tests/components/App.test.ts`** (jsdom history/popstate):
- jsdom provides `window.history` and `window.location`. Drive the URL with
  `window.history.pushState({}, '', '/caged')` then `render(App)` and assert the
  CagedTool is shown (seed-from-pathname). Use `history.replaceState` in
  `beforeEach` to reset to `/` so tests are isolated.
- Navigation: render `App`, click a tool (or call through HomePage), assert
  `window.location.pathname === '/caged'` and the tool rendered.
- Back/forward: after navigating, dispatch a `popstate`
  (`window.dispatchEvent(new PopStateEvent('popstate'))` after setting the URL
  via `history.back()`/manual `pushState`+`replaceState`), assert the view
  follows the pathname. jsdom does maintain a history stack for
  `back()/forward()`; if a specific jsdom version's `back()` is flaky, drive it
  deterministically by `replaceState` + manual `popstate` dispatch (the listener
  only reads `location.pathname`, so this is faithful).
- No-loop assertion: spy on `history.pushState`; dispatch `popstate` and assert
  `pushState` is NOT called by the handler.
- Reset `beforeEach`/`afterEach`: `history.replaceState({}, '', '/')` so the URL
  does not leak between tests, and unmount `App` so the `$effect` cleanup removes
  the `popstate` listener (preventing cross-test listener accumulation).

**Analytics kept out of tests.** Because `inject()` is called only in `main.ts`
(never imported by `App.svelte` or any component), and tests import components
directly via `@testing-library/svelte`, the analytics code path is never executed
in the suite. No mock, no stub, no `vi.mock('@vercel/analytics')` needed. If a
future test ever imports `main.ts`, it must `vi.mock('@vercel/analytics', () => ({
inject: vi.fn() }))` and assert the gate — documented here, not needed for v1.

## Test / SSR Safety

- **jsdom provides `window`, `location`, `history`.** Confirmed by the existing
  suite (`environment: 'jsdom'`, components render and read DOM). So
  `App.svelte`'s `location.pathname`, `history.pushState`, and
  `window.addEventListener('popstate', …)` all work under test without guards.
- **`routing.ts` touches no globals** — pure string functions. SSR/node-safe by
  construction; importing it never references `window`.
- **`App.svelte` global access** runs only in the browser/jsdom (the component is
  mounted, not SSR'd — `main.ts` uses client `mount`, there is no SSR pass), so
  no `typeof window !== 'undefined'` guard is required. Documented explicitly so
  a future SSR migration knows the seed line (`pathToView(location.pathname)`)
  and the `popstate` `$effect` are the two browser-only touchpoints to guard.
- **`main.ts` analytics** is double-guarded: it only runs at runtime in the
  browser bundle AND only when `shouldEnableAnalytics()` is true. Tests don't run
  `main.ts`, so no jsdom/analytics interaction occurs.

## Review Workload / 400-line Budget

Estimated CHANGED lines (new + modified, incl. tests):

| Artifact | Est. lines |
|---|---|
| `src/lib/routing.ts` (fns + VIEW_NAMES + tsc guard) | ~55 |
| `src/App.svelte` (seed + push + popstate effect) | ~14 |
| `src/main.ts` (inject + gate fn) | ~10 |
| `vercel.json` | ~5 |
| `package.json` (`@vercel/analytics` dep) | ~1 |
| `tests/unit/routing.test.ts` | ~70 |
| `tests/components/App.test.ts` | ~90 |
| **Total** | **~245** |

Well under the 400-line budget → **single PR, no `size:exception` needed, no
chained PRs required.** TDD order: write `routing.test.ts` and implement
`routing.ts` first (pure, fully covered), then the `App.svelte`/`main.ts` wiring
+ integration test, then `vercel.json`.

## Risks

- **`import.meta.env.PROD` over-includes preview deploys** — MITIGATED by the
  `VITE_VERCEL_ENV === 'production'` gate (ADR-3) plus the required Vercel env
  mapping. If the env var is not configured, analytics is simply OFF (fail-safe:
  excludes rather than over-reports).
- **`VIEW_NAMES` drift from `ViewName`** — MITIGATED by the compile-time
  exhaustiveness guard (ADR-1); a missing/extra entry fails `tsc` before tests.
- **`popstate`/`pushState` feedback loop** — STRUCTURALLY PREVENTED:
  `pushState` does not fire `popstate`; the handler only reads. Guarded by a
  spy-based no-push test.
- **jsdom `history.back()` flakiness** — MITIGATED by driving back/forward
  deterministically via `replaceState` + manual `popstate` dispatch in the test.
- **`@vercel/analytics` leaking into component tests** — STRUCTURALLY PREVENTED:
  the import lives only in `main.ts`, which tests never load.
- **Trailing-slash / double-slash paths from the host** — HANDLED in
  `pathToView` normalization and unit-tested.

## Rollback

Revert the single commit: `navigate()` returns to a plain `currentView = view`
assignment; the pathname seed reverts to `$state('home')`; the `popstate`
`$effect` is removed; the `inject()` call + gate are removed from `main.ts`;
delete `src/lib/routing.ts`, `vercel.json`, and `tests` added; drop
`@vercel/analytics` from `package.json` and the `VITE_VERCEL_ENV` Vercel env var.
No shared modules mutated destructively, `ViewName` and the visual skin untouched
— revert restores the exact prior single-URL behavior.
