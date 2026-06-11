# Tasks: Progression Builder

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 490–540 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, ViewName, route, HomePage card + test | PR 1 | Foundation; standalone; base=main |
| 2 | ProgressionBar + ProgressionTimeline components + tests | PR 2 | Depends on PR 1 types |
| 3 | ProgressionBuilder orchestrator + test, build verification | PR 3 | Depends on PR 2 child components |

## Phase 1: Foundation

- [x] 1.1 Create `src/lib/types/progression.ts` — `ProgressionChord`, `PlaybackSpeed`, `PLAYBACK_MS`, `MAX_CHORDS`
- [x] 1.2 Extend `ViewName` in `src/lib/types/chord.ts` to `'home' | 'caged' | 'progression'`
- [x] 1.3 Add `ProgressionBuilder` import and `{:else if currentView === 'progression'}` route in `src/App.svelte`
- [x] 1.4 Add Progression Builder nav card (🧩, "Progression Builder", "Build chord progressions and practice transitions step by step") in `src/lib/components/HomePage.svelte` after CAGED card
- [x] 1.5 Update `tests/components/HomePage.test.ts` — assert new card renders, active styling (button), `navigate('progression')` on click

## Phase 2: Core Components

- [ ] 2.1 Create `src/lib/components/ProgressionBar.svelte` — horizontal scrollable chord pills, add/remove controls, active highlighting, chord picker popover (CHROMATIC grid), MAX_CHORDS guard
- [ ] 2.2 Create `src/lib/components/ProgressionTimeline.svelte` — step dots (one per chord), prev/next buttons, play/pause toggle, speed selector (slow/medium/fast), clickable dots for direct navigation

## Phase 3: Orchestrator

- [ ] 3.1 Create `src/lib/components/ProgressionBuilder.svelte` — owner view with progression state, shared quality toggle (major/minor), default C–F–G–C progression, `$effect` playback with `setInterval` + cleanup on unmount, chord add/remove handlers with `activeIndex` adjustment, FullFretboard wiring via `getShapes()`, empty-state message, back button

## Phase 4: Testing

- [ ] 4.1 Create `tests/components/ProgressionBar.test.ts` — pills render roots, active pill highlighted, add dropdown opens, remove triggers callback, MAX_CHORDS disables add
- [ ] 4.2 Create `tests/components/ProgressionTimeline.test.ts` — correct dot count, active dot highlighted, prev at start disabled, next at end disabled, play/pause toggles, speed change triggers callback
- [ ] 4.3 Create `tests/components/ProgressionBuilder.test.ts` — default C–F–G–C renders, add chord appends with quality inheritance, remove chord adjusts `activeIndex`, quality toggle updates all chords, playback auto-advances and stops at end, empty progression shows message, back button navigates home

## Phase 5: Integration & Verification

- [ ] 5.1 Run `pnpm tsc --noEmit` — confirm zero type errors with new `ViewName`
- [ ] 5.2 Run `pnpm vitest run` — all tests pass (7 total: 4 modified/new + 3 new)
- [ ] 5.3 Run `pnpm build` — production build succeeds
