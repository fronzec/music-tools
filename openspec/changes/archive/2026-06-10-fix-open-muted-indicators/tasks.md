# Tasks: Fix Open/Muted String Indicators

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80-100 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: FullFretboard deduplication

- [x] 1.1 Add `INDICATOR_SP: 14`, `INDICATOR_FS: 9` to `FL` in `src/lib/theory/layout.ts`
- [x] 1.2 Add `$derived.by` for `stringIndicators` pre-computing per-string O/× arrays
- [x] 1.3 Remove O/× rendering from inside `CAGED_ORDER` shape loop
- [x] 1.4 Add new indicator rendering section AFTER shape loop, BEFORE note rendering

## Phase 2: Fretboard color consistency

- [x] 2.1 Import `SHAPE_COLORS` in `Fretboard.svelte`
- [x] 2.2 Change O fill from `#6B7280` to `SHAPE_COLORS[shape.shape]`
- [x] 2.3 Change × fill from `#9CA3AF` to `SHAPE_COLORS[shape.shape]` with `opacity="0.6"`

## Phase 3: Tests

- [x] 3.1 Add test: per-shape indicator colors in FullFretboard with multiple shapes
- [x] 3.2 Add test: indicator row layout — correct O/× count per string
- [x] 3.3 Verify all existing tests pass (`pnpm test`) — 314/314 ✓
- [x] 3.4 Verify build succeeds (`pnpm build`) — ✓
