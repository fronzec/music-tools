# Tasks: Fix O/× Indicator Positioning v2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~30 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full fix: constant + formula + components + tests | PR 1 | Single PR; all changes under ~30 lines |

## Phase 1: Foundation — Layout Constants & Formula

- [ ] 1.1 Add `INDICATOR_OPACITY: 0.6` to `FL` constants in `src/lib/theory/layout.ts`
- [ ] 1.2 Replace `indicatorX()` with three-branch formula (nut `baseFret===0 → fretLineX(0)+8`, barre `minFret===baseFret → fretLineX(1)-22`, absolute `→ fretLineX(baseFret)+20`) in `src/lib/theory/layout.ts`

## Phase 2: Component Updates

- [ ] 2.1 Update `src/lib/components/Fretboard.svelte`: remove `- 8` from `indicatorXPos` call; replace `opacity="0.85"` and `opacity="0.4"` with `opacity={FL.INDICATOR_OPACITY}`
- [ ] 2.2 Update `src/lib/components/FullFretboard.svelte`: remove `- 8` from `indicatorX` call; replace `indicator.type === 'muted' ? 0.4 : 0.85` with `FL.INDICATOR_OPACITY`

## Phase 3: Tests

- [ ] 3.1 Update `tests/unit/theory/layout.test.ts`: add nut branch test (`indicatorX(0,0) === fretLineX(0)+8`), barre branch test (`indicatorX(3,3) === fretLineX(1)-22`), absolute branch test (`indicatorX(3,0) === fretLineX(3)+20`); add `FL.INDICATOR_OPACITY === 0.6` assertion
- [ ] 3.2 Update `tests/components/Fretboard.test.ts` and `tests/components/FullFretboard.test.ts`: update barre indicator X assertions to match new formula values; add `opacity="0.6"` assertions
