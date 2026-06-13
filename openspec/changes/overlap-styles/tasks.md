# Tasks: Overlap Visualization Styles

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full overlap styles feature | PR 1 | Single PR, ~150-180 lines — well under budget |

## Phase 1: Foundation

- [x] 1.1 Add `OverlapStyle` type (`'split' \| 'dots' \| 'gradient'`) to `src/lib/types/chord.ts`
- [x] 1.2 Add `DEFAULT_OVERLAP_STYLE`, `OVERLAP_DOT_OFFSET`, `OVERLAP_ROOT_DOT_OFFSET`, `OVERLAP_SPLIT_OPACITY`, `OVERLAP_DOTS_OPACITY`, `OVERLAP_GRADIENT_OPACITY` to `FL` in `src/lib/theory/layout.ts`

## Phase 2: FullFretboard Rendering

- [x] 2.1 Add optional `overlapStyle` prop (default `'split'`) to FullFretboard Props interface
- [x] 2.2 Add `$derived.by()` block computing `gradientDefs` array (posKey, color1, color2) when style is `'gradient'`
- [x] 2.3 Replace `overlapIndex >= 1` concentric-ring block (lines 466–521) with style branches: split (`<path>` semicircles), dots (offset `<circle>` chain), gradient (`fill="url(#grad-posKey)"`)
- [x] 2.4 Render `<defs>` block with `<linearGradient>` per entry in gradientDefs, ID scoped to posKey

## Phase 3: CagedTool Integration

- [x] 3.1 Add `overlapStyle` state with `localStorage('caged-overlap-style')` read/write + parse fallback to `'split'`
- [x] 3.2 Add Style toggle card (segmented Split/Dots/Gradient) in controls bar, visible only when `viewMode !== 'grid'`
- [x] 3.3 Pass `overlapStyle` prop to all three `<FullFretboard>` instances (full + dual top + dual bottom)
- [x] 3.4 Remove `OverlapDemo` import and `<OverlapDemo />` render from CagedTool

## Phase 4: Cleanup

- [x] 4.1 Delete `src/lib/components/OverlapDemo.svelte`

## Phase 5: Testing & Verification

- [x] 5.1 Add FullFretboard tests: each `overlapStyle` renders correct SVG structure (split→paths, dots→circles, gradient→url() fill), single shape unchanged, empty state unchanged
- [x] 5.2 Add CagedTool tests: Style card visible in full+dual, hidden in grid, toggle changes rendering, localStorage round-trip
- [x] 5.3 Run `pnpm build && pnpm vitest run` to verify zero regressions
