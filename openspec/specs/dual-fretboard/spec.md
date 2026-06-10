# Dual Fretboard Specification

## Purpose

Define the DualFretboard component: a layout wrapper that renders two FullFretboard instances stacked vertically for side-by-side CAGED chord comparison, with independent root selectors and per-fretboard shape visibility toggles.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **DualFretboard Component** | MUST accept two `ChordShape[]` arrays, two `Set<CagedShape>` visible sets, and shared `labelMode` and `quality` | Both fretboards render with correct shapes | Empty shapes array → empty fretboard with background only |
| **Vertical Stacking** | MUST render two `FullFretboard` instances stacked vertically with `~gap-3` (Tailwind `gap-3`, ~0.75rem/12px) | Top and bottom fretboards visible with gap | Container overflow handled by `overflow-auto` on wrapper |
| **Per-Fretboard Shape Toggles** | MUST render a colored pill toggle bar per fretboard (C/A/G/E/D order) | Clicking pill toggles shape for that fretboard only | All shapes off → empty fretboard with "No shapes selected" message |
| **Per-Fretboard Root Selectors** | MUST render a 12-note chromatic button row per fretboard with distinct labels (e.g. "From" / "To") | Selecting root updates only that fretboard | Same root on both is allowed (e.g. C vs C) |
| **Shared Quality Selector** | MUST render a single quality toggle (Major/Minor) synchronized to both fretboards | Changing quality updates both necks simultaneously | — |
| **Shared Label Mode Selector** | MUST render a single label mode toggle (Intervals/Notes/Both) synchronized to both fretboards | Changing label mode updates both necks simultaneously | — |
| **Accessibility** | MUST assign distinct `aria-label` to each `FullFretboard` instance | Top: "{root} {quality} — top fretboard"; Bottom: "{root} {quality} — bottom fretboard" | Empty state: "Empty fretboard — no shapes selected" per instance |
| **Empty State Handling** | MUST render empty state when `visibleShapes` is empty for either fretboard | Background (strings, frets, markers) still visible | Both empty → both show "No shapes selected" |
| **Grid/Dual Mutual Exclusion** | Dual mode MUST always render full neck view; grid layout is NOT available in dual mode | Dual mode shows two full necks | Switching to grid mode hides dual and shows 5 mini-fretboards |
| **Zero FullFretboard Changes** | DualFretboard MUST NOT modify `FullFretboard.svelte` props interface or internal behavior | FullFretboard remains unchanged | All existing FullFretboard specs continue to apply |

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

## Notes

- **Layout**: Vertical stack only; horizontal side-by-side is out of scope for mobile
- **Gap**: `gap-3` from Tailwind (0.75rem / 12px) between the two fretboards
- **Overflow**: Wrapper should use `overflow-auto` to handle viewport height constraints
- **Shared controls**: Quality and label mode selectors appear once, above both fretboards or between the two root selector rows
- **Z-order**: Per-FullFretboard spec (C → A → G → E → D), last shape on top
- **No changes to FullFretboard**: The wrapper passes all props; FullFretboard remains unchanged per proposal
