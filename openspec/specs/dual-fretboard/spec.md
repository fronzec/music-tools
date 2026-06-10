# Dual Fretboard Specification

## Purpose

Define the DualFretboard component: a layout wrapper that renders two FullFretboard instances stacked vertically for side-by-side CAGED chord comparison, with independent root selectors and per-fretboard shape visibility toggles.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **DualFretboard Component** | MUST accept two `ChordShape[]` arrays, two `Set<CagedShape>` visible sets, shared `labelMode` and `quality`; computes `diffPositions` via `$derived.by()` and passes `highlightPositions` to both `FullFretboard` instances | Both fretboards render with correct shapes and diff rings on shared positions | Empty shapes array → empty fretboard with background only; no highlights |
| **Diff Computation** | MUST compute `diffPositions` by intersecting position maps from both fretboards using `buildPositionMap()` from `src/lib/theory/fretboard.ts`; shared keys classified as `'same'` (matching intervals) or `'different'` (mismatching) | C major vs G major → shared (5,2) with same interval = `'same'`, shared (3,4) with different intervals = `'different'` | No overlap → empty `diffPositions` map |
| **Vertical Stacking** | MUST render two `FullFretboard` instances stacked vertically with `~gap-3` (Tailwind `gap-3`, ~0.75rem/12px) | Top and bottom fretboards visible with gap | Container overflow handled by `overflow-auto` on wrapper |
| **Per-Fretboard Shape Toggles** | MUST render a colored pill toggle bar per fretboard (C/A/G/E/D order) | Clicking pill toggles shape for that fretboard only | All shapes off → empty fretboard with "No shapes selected" message |
| **Per-Fretboard Root Selectors** | MUST render a 12-note chromatic button row per fretboard with distinct labels (e.g. "From" / "To") | Selecting root updates only that fretboard | Same root on both is allowed (e.g. C vs C) |
| **Shared Quality Selector** | MUST render a single quality toggle (Major/Minor) synchronized to both fretboards | Changing quality updates both necks simultaneously | — |
| **Shared Label Mode Selector** | MUST render a single label mode toggle (Intervals/Notes/Both) synchronized to both fretboards | Changing label mode updates both necks simultaneously | — |
| **Accessibility** | MUST assign distinct `aria-label` to each `FullFretboard` instance | Top: "{root} {quality} — top fretboard"; Bottom: "{root} {quality} — bottom fretboard" | Empty state: "Empty fretboard — no shapes selected" per instance |
| **Empty State Handling** | MUST render empty state when `visibleShapes` is empty for either fretboard | Background (strings, frets, markers) still visible | Both empty → both show "No shapes selected" |
| **Grid/Dual Mutual Exclusion** | Dual mode MUST always render full neck view; grid layout is NOT available in dual mode | Dual mode shows two full necks | Switching to grid mode hides dual and shows 5 mini-fretboards |
| **Zero FullFretboard Changes** | DualFretboard MUST pass all required props to `FullFretboard` and MAY pass optional `highlightPositions` without changing the required interface | FullFretboard remains backward compatible when `highlightPositions` is absent | All existing FullFretboard specs continue to apply |
| **Per-Fretboard Diff Highlights** | Each `FullFretboard` instance in `DualFretboard` MUST receive the same `highlightPositions` map; classification based on interval comparison, not note name | Same position classified `'same'` → both show green ring; classified `'different'` → both show dashed amber ring | Each fretboard still renders its own note label and color |

## Scenarios

### Scenario: Dual C major vs G major (happy path)

- GIVEN `selectedRoot` is C, `secondRoot` is G, `selectedQuality` is major
- WHEN `viewMode` is `'dual'`
- THEN DualFretboard renders with top fretboard showing C major shapes and bottom fretboard showing G major shapes
- AND each fretboard has its own CAGED pill toggle bar
- AND quality toggle shows "Major" and applies to both

### Scenario: Independent shape toggles

- GIVEN `viewMode` is `'dual'` and all shapes are visible on both fretboards
- WHEN user toggles off C shape on the top fretboard only
- THEN top fretboard hides C shape notes while bottom fretboard still shows C shape
- AND top toggle bar reflects C as inactive

### Scenario: Independent root changes

- GIVEN `viewMode` is `'dual'` with top C and bottom G
- WHEN user selects D as the top root
- THEN top fretboard updates to D major shapes
- AND bottom fretboard remains G major shapes

### Scenario: Shared quality change

- GIVEN `viewMode` is `'dual'` with both fretboards showing major shapes
- WHEN user selects Minor
- THEN both top and bottom fretboards recalculate to minor shapes for their respective roots
- AND both fretboards update reactively

### Scenario: Empty state on one fretboard

- GIVEN `viewMode` is `'dual'`
- WHEN user toggles off all shapes on the bottom fretboard
- THEN bottom fretboard shows "No shapes selected" with background strings/frets visible
- AND top fretboard continues to show its shapes normally

### Scenario: Empty state on both fretboards

- GIVEN `viewMode` is `'dual'`
- WHEN user toggles off all shapes on both fretboards
- THEN both fretboards show "No shapes selected" with background strings/frets visible
- AND both toggle bars show all pills as inactive

### Scenario: Accessibility labels

- GIVEN `viewMode` is `'dual'` with top C major (C,A,G visible) and bottom G major (E,D visible)
- WHEN screen reader focuses top fretboard
- THEN aria-label reads "C major — C, A, G shapes — top fretboard"
- AND bottom fretboard aria-label reads "G major — E, D shapes — bottom fretboard"

### Scenario: Dual to grid transition

- GIVEN `viewMode` is `'dual'`
- WHEN user selects Shape Grid
- THEN DualFretboard unmounts
- AND 5 mini-fretboards render in grid layout for `selectedRoot` only
- AND `secondRoot` and `secondVisibleShapes` state is retained but not used

### Scenario: Default dual entry

- GIVEN user has not previously entered dual mode
- WHEN user selects Dual Compare
- THEN `secondRoot` defaults to G
- AND `secondVisibleShapes` defaults to all 5 shapes
- AND top fretboard shows C major, bottom shows G major

### Scenario: Same root on both sides

- GIVEN `viewMode` is `'dual'`
- WHEN user sets both roots to C
- THEN both fretboards show C major shapes
- AND this is explicitly allowed (useful for comparing different shape subsets)

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

### Scenario: Empty state on one fretboard (with highlights)

- GIVEN `viewMode` is `'dual'`
- WHEN user toggles off all shapes on the bottom fretboard
- THEN `diffPositions` becomes empty (no shared positions)
- AND bottom fretboard shows "No shapes selected" with no highlights
- AND top fretboard continues to show its shapes but without any highlight rings

## Notes

- **Layout**: Vertical stack only; horizontal side-by-side is out of scope for mobile
- **Gap**: `gap-3` from Tailwind (0.75rem / 12px) between the two fretboards
- **Overflow**: Wrapper should use `overflow-auto` to handle viewport height constraints
- **Shared controls**: Quality and label mode selectors appear once, above both fretboards or between the two root selector rows
- **Z-order**: Per-FullFretboard spec (C → A → G → E → D), last shape on top
- **No changes to FullFretboard**: The wrapper passes all props; FullFretboard remains unchanged per proposal
- **Shared utility**: `src/lib/theory/fretboard.ts` exports `buildPositionMap()` and `NoteEntry` type; imported by both `FullFretboard` and `DualFretboard`
- **Reactivity**: `diffPositions` uses `$derived.by()` so it recalculates when either `shapes1`, `shapes2`, `visibleShapes1`, or `visibleShapes2` changes
- **Grid/Dual Mutual Exclusion**: Dual mode still always renders full neck view; grid layout remains unavailable in dual mode
