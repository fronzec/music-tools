# Tasks: CAGED Full Fretboard Overlay

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (FullFretboard) → PR 2 (CagedTool integration) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | FullFretboard component + layout constants + tests | PR 1 | Base: main. ~370 lines. SVGs, range calc, diamonds, labels. |
| 2 | CagedTool integration (view toggle, shape bar + tests) | PR 2 | Base: main (stacked) or PR#1 branch (feature-chain). ~180 lines. |

## Phase 1: Foundation — Layout Constants

- [x] 1.1 Add `FL` object and `SHAPE_COLORS` map to `src/lib/theory/layout.ts`
- [x] 1.2 Test: add FL/SHAPE_COLORS assertions to `tests/unit/theory/layout.test.ts`

## Phase 2: FullFretboard Component

- [x] 2.1 Create `src/lib/components/FullFretboard.svelte` — prop interface + $derived fret range (minFret, maxFret, displaySpan)
- [x] 2.2 Render shared background: string lines, fret lines, nut, fret markers at 3/5/7/9/12/15
- [x] 2.3 Iterate visible shapes in CAGED order: barre rects, note circles, root diamonds via `diamondPoints()`
- [x] 2.4 Render labels (intervals/notes/both) + fret numbers (gray-500, below string 5) + O/× indicators
- [x] 2.5 Test: create `tests/components/FullFretboard.test.ts` — render w/ shapes, verify SVG structure, diamonds, labels, empty set, dynamic range

## Phase 3: CagedTool Integration

- [x] 3.1 Add `viewMode` (`'full' | 'grid'`) and `visibleShapes` (`Set<CagedShape>`, default all 5) state to `src/lib/components/CagedTool.svelte`
- [x] 3.2 Add "Full Neck" / "Shape Grid" view mode toggle UI above controls bar
- [x] 3.3 Add 5 shape-toggle pill buttons (C/A/G/E/D) colored by SHAPE_COLORS, visible only in Full Neck mode
- [x] 3.4 Conditional rendering: FullFretboard (full mode) vs ShapeCard grid (grid mode); reset visibleShapes on chord change
- [x] 3.5 Update `tests/components/CagedTool.test.ts` — view toggle switches mode, shape bar renders/hides, initial state is full

## Phase 4: Verification

- [x] 4.1 `pnpm test` — all unit + integration tests pass
- [x] 4.2 `pnpm build` — no TypeScript or Svelte errors
- [x] 4.3 Manual visual: toggle between modes, toggle shapes on/off, verify colors/diamonds/labels
