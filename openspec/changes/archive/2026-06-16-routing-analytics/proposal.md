# Proposal: Routing & Usage Analytics

## Intent

This is a single-URL SPA: the address bar always shows `/`, no matter which of the 9 tools is open. The owner cannot tell **which tools people actually use** — automatic pageview analytics are blind because every visit looks like the same `/` view. This change makes the URL reflect the active tool via History API routing and adds cookieless Vercel Web Analytics, so per-tool pageviews are captured automatically. A real, intended side-benefit: deep links, refresh, and browser back/forward start working per tool.

## Business Problem

The owner wants to know **which tools get used** to prioritize future work. With a single URL there is no usage signal — analytics can only ever report traffic to `/`. The fix is structural: give each tool a distinct path, then let analytics track those paths.

## Scope

### In Scope
- Lightweight **client-side routing using the History API** (`pushState`/`popstate`).
- **1:1 path ↔ `ViewName` mapping** — the path segment IS the ViewName, no slug/alias layer:
  - `home` → `/`
  - every other view → `/<view-name>` (`/caged`, `/progression`, `/note-trainer`, `/tone-generator`, `/pentatonic`, `/signal-lab`, `/interval-trainer`, `/tab-player`).
- Sync in both directions through the **single existing chokepoint** `navigate(view)` in `src/App.svelte` (line 15) plus `popstate` for back/forward.
- Initial-load resolution: read `location.pathname`, render the matching view; **unknown/unmatched path → redirect to `home` (`/`)**.
- **`vercel.json` SPA fallback rewrite** (all paths → `/index.html`) so deep links and refresh resolve on the static host.
- **`@vercel/analytics`** wired for pageview tracking; **production only** (disabled in dev and preview deploys).
- Strict TDD: routing logic (path↔view resolution, unknown-path fallback) is unit-tested before implementation.

### Out of Scope
- **Custom analytics events** (`track()`) — verified to require Vercel's paid Pro plan. Pageviews are free; that is all v1 ships.
- Slug/alias mapping, pretty names, or any indirection between path and `ViewName`.
- Nested routes, query-param state, or per-tool deep state in the URL (only the tool identity is encoded).
- Cookie/consent banner — Vercel Web Analytics is **cookieless and collects no PII**, so none is required.
- Any change to the visual skin / design tokens — this change is structural only.
- A routing library (svelte-spa-router, etc.) — the History API is sufficient for a 1:1 flat map.

## Capabilities

### New Capabilities
- `client-routing`: History API routing with a 1:1 path↔`ViewName` map, initial-load resolution, back/forward support, and unknown-path fallback to home.
- `usage-analytics`: cookieless Vercel Web Analytics capturing per-tool pageviews automatically from `pushState` navigations, production-only.

### Modified Capabilities
- `app-shell`: `navigate()` in `App.svelte` becomes the single sync point between view state and the URL; initial view is derived from `location.pathname` instead of hardcoded `'home'`.

## Approach

1. Add a tiny routing helper (e.g. `src/lib/routing.ts`) with two pure, testable functions:
   - `viewToPath(view: ViewName): string` — `home → '/'`, else `'/' + view`.
   - `pathToView(pathname: string): ViewName` — strip leading `/`, match against the `ViewName` union, **fall back to `'home'`** on no match.
2. In `App.svelte`: seed `currentView` from `pathToView(location.pathname)` on load. Extend the existing `navigate(view)` chokepoint to also `history.pushState({}, '', viewToPath(view))`. Add a `popstate` listener that sets `currentView = pathToView(location.pathname)` for back/forward.
3. Add `vercel.json` with an SPA fallback rewrite mapping all routes to `/index.html` so deep links and refresh hit the app instead of a 404.
4. Add `@vercel/analytics`, mount it once in the app shell, **enabled in production only** (gate via Vercel's production-mode detection / `import.meta.env.PROD`) so dev and preview data stay clean. Vercel auto-tracks History API navigations, so per-tool pageviews come for free — no `track()` calls.
5. Strict TDD: unit-test `viewToPath`/`pathToView` (round-trip, every ViewName, unknown-path → home) before wiring `App.svelte`.

Keep it minimal and idiomatic: flat `$state` runes, presentational/stateful split preserved, routing logic isolated as pure functions so the component stays thin.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/routing.ts` | New | Pure `viewToPath` / `pathToView` helpers with unknown→home fallback |
| `src/App.svelte` | Modified | Seed view from pathname; `navigate()` calls `pushState`; add `popstate` listener; mount analytics (prod-only) |
| `vercel.json` | New | SPA fallback rewrite: all paths → `/index.html` |
| `package.json` | Modified | Add `@vercel/analytics` dependency |
| `tests/unit/` | New | Unit tests for `viewToPath`/`pathToView` (round-trip + fallback) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing SPA rewrite → deep link / refresh 404s on Vercel | Med | `vercel.json` rewrite is part of this change and verified before merge |
| Analytics leaks into dev/preview, polluting data | Med | Gate mount on production-only detection (`import.meta.env.PROD` / Vercel prod mode) |
| `popstate` and `pushState` cause double-render or feedback loop | Low | `navigate()` only pushes; `popstate` only reads pathname → state; no push inside the listener |
| Unknown/legacy path lands on a blank screen | Low | `pathToView` falls back to `'home'`; covered by unit test |
| Adding a new tool later forgets the route | Low | Map derives directly from `ViewName`; path segment IS the view, so new union members route automatically |
| Custom-event ambition creeps in (needs paid plan) | Low | Explicitly out of scope; pageviews only for v1 |

## Rollback Plan

Revert the commit: `navigate()` returns to a plain state assignment, the `popstate` listener and pathname seeding are removed, the analytics mount is dropped, and `vercel.json` + `routing.ts` are deleted. `package.json` drops `@vercel/analytics`. No shared modules are mutated destructively and the visual skin is untouched, so reverting restores the prior single-URL behavior exactly.

## Dependencies

- New runtime dependency: `@vercel/analytics`.
- Hosting: Vercel (already the deploy target) — relies on `vercel.json` rewrites and free cookieless Web Analytics (pageviews).
- No backend, no API, no consent/cookie infrastructure.

## Constraints

- **Strict TDD active** — routing helpers are unit-tested before implementation.
- **Rebrand-ready / token-based** project — this change is structural and MUST NOT touch the visual skin or design tokens.
- **Conventional commits**, no AI attribution.
- Existing suite is **802 tests green** and must stay green; **no new svelte-check errors**.
- Minimal and idiomatic to the codebase: flat `$state` runes, presentational/stateful split.

## Success Criteria

- [ ] Each tool has a distinct URL (`home → /`, others → `/<view-name>`); switching tools updates the address bar.
- [ ] Deep-linking to `/<view-name>` and refreshing keeps the correct tool open (SPA rewrite works on Vercel).
- [ ] Browser back/forward navigates between previously visited tools.
- [ ] Unknown paths redirect to `home` (`/`), verified by unit test.
- [ ] `viewToPath`/`pathToView` round-trip for every `ViewName`, unit-tested.
- [ ] Vercel Web Analytics records per-tool pageviews in production only (no dev/preview data, no cookies, no custom events).
- [ ] Suite stays at 802 tests green (plus new routing tests); no new svelte-check errors; visual skin unchanged.
