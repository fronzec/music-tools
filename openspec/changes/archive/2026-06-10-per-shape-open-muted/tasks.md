# Tasks: Per-Shape Open/Muted Indicators

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Layout Helper

- [x] 1.1 Add `indicatorX(baseFret, minFret)` to `src/lib/theory/layout.ts`

## Phase 2: FullFretboard Refactor

- [x] 2.1 Replace `stringIndicators` derived with `positionIndicators` grouped by `(baseFret, stringIndex)`
- [x] 2.2 Exclude barre strings (`fret===0 && baseFret>0`) from O indicators
- [x] 2.3 Remove `isOpenPosition` guard from indicator rendering — all shapes show indicators
- [x] 2.4 Replace rendering block: each group in `<g>` with CSS `transform` transition
- [x] 2.5 Keep `isOpenPosition` derived for nut vs. barre-label rendering only

## Phase 3: Fretboard Adjustments

- [x] 3.1 Make indicator X position conditional: `LEFT_PAD+NUT_W/2` (open) vs `fretLineX(0)-FRET_SP/2-8` (barre)

## Phase 4: Tests

- [x] 4.1 Add `indicatorX` tests to `tests/unit/theory/layout.test.ts`
- [x] 4.2 Update FullFretboard "no indicators for barre" → new test: barre shapes DO show indicators
- [x] 4.3 Add FullFretboard test: × for muted strings in barre positions
- [x] 4.4 Add FullFretboard test: indicators grouped by (baseFret, stringIndex)
- [x] 4.5 Add FullFretboard test: barre-position indicator X uses `indicatorX`
- [x] 4.6 Update FullFretboard "CAGED order colors" test — E shape may have zero indicators
- [x] 4.7 Add Fretboard test: × for muted string in barre position
- [x] 4.8 Add Fretboard test: barre-position indicator X uses barre-area offset
