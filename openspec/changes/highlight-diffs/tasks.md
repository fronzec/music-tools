# Tasks: Highlight Diffs in Dual Compare

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~324 (60 new + ~264 mod) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR; optional 2-PR split: (1) extract utility + refactor, (2) highlight rings + dual diff |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No (resolved — stacked-to-main, PR 2 of 2)
Chained PRs recommended: Yes (done)
Chain strategy: stacked-to-main
400-line budget risk: Medium (distributed across 2 PRs)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Extract `fretboard.ts` + refactor `FullFretboard` | PR 1 (if split) | Pure relocation; zero visual change; existing tests verify |
| 2 | Highlight rings + dual diff + tests | PR 2 (if split) | New feature; depends on unit 1 |

## Phase 1: Shared Utility Extraction

- [x] 1.1 Create `src/lib/theory/fretboard.ts` — export `NoteEntry`, `DiffEntry` interfaces and `buildPositionMap()` function (extracted verbatim from `FullFretboard.svelte` lines 86–131)
- [x] 1.2 Refactor `FullFretboard.svelte` — import `buildPositionMap` from `$lib/theory/fretboard`, replace inline `$derived.by` positionMap block with `$derived(buildPositionMap(shapes, visibleShapes))`, remove duplicate `NoteEntry` type

## Phase 2: Highlight Rendering (FullFretboard)

- [x] 2.1 Add optional `highlightPositions?: Map<string, DiffEntry>` to `FullFretboard` Props interface
- [x] 2.2 Insert ring rendering in note loop (after shape, before label): green solid polygon/circle (`#22C55E`, opacity 0.5) for `type: 'same'`, amber dashed (`#F59E0B`, `stroke-dasharray="3 2"`, opacity 0.6) for `type: 'different'`, ring radius = shape radius + 4
- [x] 2.3 Verify backward compatibility — no visual change when `highlightPositions` absent; existing tests pass

## Phase 3: Diff Computation (DualFretboard)

- [x] 3.1 Import `buildPositionMap`, `DiffEntry` into `DualFretboard.svelte`
- [x] 3.2 Add `diffPositions` `$derived.by()` — call `buildPositionMap` for both fretboards, intersect keys, skip `null` intervals, classify shared as `'same'` (equal interval strings) or `'different'`
- [x] 3.3 Pass `highlightPositions={diffPositions}` to both `<FullFretboard>` instances

## Phase 4: Testing

- [x] 4.1 Test `buildPositionMap()` — empty shapes, single shape, multi-shape overlap, barre `absFret` computation, CAGED_ORDER sort
- [x] 4.2 Test diff classification — same interval → `'same'`, different → `'different'`, null intervals excluded, unique positions absent from map
- [x] 4.3 Test `FullFretboard` rings — green ring for `'same'` entry, amber dashed for `'different'`, no rings when prop absent, ring matches note shape (polygon for root, circle for tone)
- [x] 4.4 Test `DualFretboard` integration — identical shapes yield all-green, different roots yield mix, no overlap yields zero highlights, empty one side yields no highlights

## Dependencies

- Phase 2 depends on Phase 1 (import path exists)
- Phase 3 depends on Phase 1 (shared utility) and Phase 2 (prop exists)
- Phase 4 depends on Phase 2 and Phase 3 (features must exist to test)
