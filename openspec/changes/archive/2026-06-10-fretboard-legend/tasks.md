# Tasks: Fretboard Legend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: LegendPanel Component

- [x] 1.1 Create `src/lib/components/LegendPanel.svelte` with shape colors, symbols, open/muted, diff sections
- [x] 1.2 Create `tests/components/LegendPanel.test.ts` with 8 tests

## Phase 2: CagedTool Integration

- [x] 2.1 Add `legendOpen` state and Legend toggle button to CagedTool.svelte
- [x] 2.2 Import and render LegendPanel between controls and content
- [x] 2.3 Add 5 legend integration tests to CagedTool.test.ts
- [x] 2.4 Run `pnpm test` — all tests pass
