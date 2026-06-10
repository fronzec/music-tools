# Tasks: Dual Fretboard Comparison

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420–450 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 (feature-branch-chain) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DualFretboard component + tests | PR 1 | Base: `feature/dual-fretboard` tracker. Self-contained: component renders two FullFretboards with independent root/toggle controls. Tests verify rendering, aria-labels, toggle independence. |
| 2 | CagedTool dual-mode integration + tests | PR 2 | Base: PR 1 branch. Adds `secondRoot`, `secondVisibleShapes`, `'dual'` viewMode, conditional rendering. Tests verify state transitions, defaults, quality sync. |

## Phase 1: DualFretboard Component

- [x] 1.1 Create `src/lib/components/DualFretboard.svelte` — `$props` interface (`root1`, `root2`, `quality`, `labelMode`, `visibleShapes1`, `visibleShapes2`, `onRoot1Change`, `onRoot2Change`, `width?`), `$derived` shapes from `getShapes()`, two `#each CHROMATIC` root selector rows labeled "From" / "To", two CAGED pill toggle bars (mutate `visibleShapes1`/`visibleShapes2` via SvelteSet), two `<FullFretboard>` instances stacked with `gap-3`, `overflow-auto` wrapper, distinct `aria-label` per fretboard.
- [x] 1.2 Create `tests/components/DualFretboard.test.ts` — render with C/G roots, assert 2 SVGs with distinct aria-labels; toggle C shape on top only, assert top aria-label excludes C while bottom includes C; click "From: D", assert top shows D shapes and bottom unchanged; toggle all shapes off bottom, assert "No shapes selected" in bottom SVG only; verify same-root-on-both allowed.

## Phase 2: CagedTool Dual-Mode Integration

- [ ] 2.1 Add state to `CagedTool.svelte`: `viewMode` extends to `'full' | 'grid' | 'dual'`; `secondRoot` `$state<NoteName>('G')`; `secondVisibleShapes` `SvelteSet<CagedShape>(CAGED_ORDER)`; `secondShapes = $derived(getShapes(secondRoot, selectedQuality))`.
- [ ] 2.2 Add `$effect` in CagedTool — when `viewMode === 'dual'`, reset `secondVisibleShapes` to all 5 CAGED shapes.
- [ ] 2.3 Add "Dual Compare" button to view-mode `radiogroup` (third segment, same styling as Full Neck / Shape Grid).
- [ ] 2.4 Add `{#if viewMode === 'dual'}` block rendering `<DualFretboard>` with props mapping: `root1={selectedRoot}`, `root2={secondRoot}`, `quality={selectedQuality}`, `labelMode={labelMode}`, `visibleShapes1={visibleShapes}`, `visibleShapes2={secondVisibleShapes}`, callbacks for root changes.
- [ ] 2.5 Import `DualFretboard` component in CagedTool script.

## Phase 3: CagedTool Dual-Mode Tests

- [ ] 3.1 Add dual-mode render tests — click "Dual Compare", assert 2 SVGs rendered, shape toggle bar hidden, "From"/"To" labels present.
- [ ] 3.2 Add state reset test — enter dual mode, assert `secondVisibleShapes` has all 5 shapes via aria-pressed on bottom toggle bar.
- [ ] 3.3 Add view transition tests — dual→grid: assert 5 mini-fretboards, shape toggles hidden; grid→dual: assert DualFretboard re-renders, second state preserved.
- [ ] 3.4 Add shared quality test — in dual mode, click Minor, assert both fretboard aria-labels reflect minor quality.
- [ ] 3.5 Add independence test — in dual mode, change top root to D, assert bottom root remains G.
