# Dual Fretboard — Delta Specification

## MODIFIED Requirements

### Requirement: DualFretboard Component

The `DualFretboard` component MUST accept two `ChordShape[]` arrays, two `Set<CagedShape>` visible sets, and shared `labelMode` and `quality`.
(Previously: no diff highlighting; now computes and passes `highlightPositions` to both `FullFretboard` instances.)

- GIVEN `root1` is C, `root2` is G, `quality` is major
- WHEN `viewMode` is `'dual'`
- THEN `DualFretboard` computes `diffPositions` via `$derived.by()`
- AND passes `highlightPositions={diffPositions}` to BOTH `FullFretboard` instances
- AND both fretboards render with diff rings on shared positions

### Requirement: Diff Computation

The system MUST compute `diffPositions` by intersecting position maps from both fretboards using `buildPositionMap()` from `src/lib/theory/fretboard.ts`.

- GIVEN `shapes1` (C major) and `shapes2` (G major)
- WHEN `diffPositions` is derived
- THEN `buildPositionMap(shapes1)` and `buildPositionMap(shapes2)` are called
- AND shared keys are classified as `'same'` (matching intervals) or `'different'` (mismatching intervals)
- AND the resulting `Map<string, { type: 'same' | 'different' }>` is passed to each `FullFretboard`

- GIVEN shared position at (5,2) with interval R in both chords
- WHEN diff computation runs
- THEN `"5,2"` has `type: 'same'`
- AND both fretboards render a green ring at that position

- GIVEN shared position at (3,4) with interval R in top and 3 in bottom
- WHEN diff computation runs
- THEN `"3,4"` has `type: 'different'`
- AND both fretboards render a dashed amber ring at that position

### Requirement: Zero FullFretboard Changes → Updated

The `DualFretboard` wrapper MUST pass all required props to `FullFretboard`.
(Previously: stated "DualFretboard MUST NOT modify FullFretboard props interface"; now `DualFretboard` passes optional `highlightPositions` without changing `FullFretboard`'s required interface.)

- GIVEN `DualFretboard` renders
- WHEN passing props to `FullFretboard`
- THEN `highlightPositions` is passed as an optional prop
- AND `FullFretboard` remains fully backward compatible when `highlightPositions` is absent

## ADDED Requirements

### Requirement: Per-Fretboard Diff Highlights

Each `FullFretboard` instance in `DualFretboard` MUST receive the same `highlightPositions` map.

- GIVEN a shared position classified as `'same'`
- WHEN both fretboards render
- THEN BOTH show a green ring at that position
- AND the classification is based on interval comparison, not note name

- GIVEN a shared position classified as `'different'`
- WHEN both fretboards render
- THEN BOTH show a dashed amber ring at that position
- AND each fretboard still renders its own note label and color

## REMOVED Requirements

None.

## RENAMED Requirements

None.

## Scenarios

### Scenario: Dual C major vs G major with diff highlights

- GIVEN `selectedRoot` is C, `secondRoot` is G, `selectedQuality` is major
- WHEN `viewMode` is `'dual'`
- THEN shared positions with matching intervals display green rings on both fretboards
- AND shared positions with mismatching intervals display dashed amber rings on both fretboards
- AND unique positions render normally without any ring

### Scenario: Independent shape toggles with diff update

- GIVEN `viewMode` is `'dual'` with all shapes visible on both fretboards
- WHEN user toggles off C shape on the top fretboard only
- THEN top fretboard hides C shape notes
- AND `diffPositions` recalculates to reflect new overlap
- AND bottom fretboard diff highlights update accordingly

### Scenario: Same root on both sides with identical shapes

- GIVEN `viewMode` is `'dual'` with both roots set to C
- WHEN both fretboards show identical C major shapes
- THEN `diffPositions` contains only `type: 'same'` entries
- AND all shared positions render green rings
- AND no amber rings appear

### Scenario: Empty state on one fretboard

- GIVEN `viewMode` is `'dual'`
- WHEN user toggles off all shapes on the bottom fretboard
- THEN `diffPositions` becomes empty (no shared positions)
- AND bottom fretboard shows "No shapes selected" with no highlights
- AND top fretboard continues to show its shapes but without any highlight rings

## Notes

- **Shared utility**: `src/lib/theory/fretboard.ts` exports `buildPositionMap()` and `NoteEntry` type; imported by both `FullFretboard` and `DualFretboard`
- **Reactivity**: `diffPositions` uses `$derived.by()` so it recalculates when either `shapes1`, `shapes2`, `visibleShapes1`, or `visibleShapes2` changes
- **Grid/Dual Mutual Exclusion**: Dual mode still always renders full neck view; grid layout remains unavailable in dual mode
