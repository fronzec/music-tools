# Tasks: Fix O/× Indicator Positioning

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~26 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Core Fix

- [ ] 1.1 Replace two-branch `indicatorX()` in `src/lib/theory/layout.ts` (line 100-103) with unified formula `return fretLineX(baseFret + 1 - minFret) - 12;` — removes branch-dependent positioning bug

## Phase 2: Test Updates

- [ ] 2.1 Update `tests/unit/theory/layout.test.ts` (lines 108-122) — change 3 expected values from old branch expressions to `fretLineX(baseFret + 1 - minFret) - 12`
- [ ] 2.2 Update `tests/components/Fretboard.test.ts` (line 496) — fix barre indicator X assertion from nut-based formula to `fretLineX(1) - 12 - 8`
- [ ] 2.3 Update `tests/components/FullFretboard.test.ts` (lines 608-614) — assert translateX matches new `indicatorX(3, minFret)` value, not just "≠ old nut"

## Phase 3: Spec Updates

- [ ] 3.1 Update `openspec/specs/fretboard/spec.md` (lines 123, 148, 170) — change "left of barre line" / "nut position" to "right edge of fret space"
- [ ] 3.2 Update `openspec/specs/full-fretboard/spec.md` (lines 17, 149, 154-155, 164, 174, 192) — change "left of barre line" / "near nut area" to "right edge of fret space"

## Verification

- [ ] `pnpm build` — zero errors
- [ ] `pnpm vitest run` — all tests pass
- [ ] Manual: O/× at right edge of fret space in Shape Grid (open + barre)
- [ ] Manual: O/× at right edge of fret space in Full Neck (open position)
