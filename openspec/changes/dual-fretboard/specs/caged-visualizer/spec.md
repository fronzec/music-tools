# Delta for caged-visualizer

## MODIFIED Requirements

### Requirement: View Mode

The system MUST provide a segmented toggle with three options: Full Neck, Shape Grid, and Dual Compare.
(Previously: Two options: Full Neck and Shape Grid)

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Full Neck selected | CAGED tool loaded | user clicks Full Neck | `viewMode` becomes `'full'` | FullFretboard renders with single neck |
| Shape Grid selected | CAGED tool loaded | user clicks Shape Grid | `viewMode` becomes `'grid'` | 5 mini-fretboards render in grid |
| Dual Compare selected | CAGED tool loaded | user clicks Dual Compare | `viewMode` becomes `'dual'` | DualFretboard renders with two stacked necks |
| Dual-to-Grid transition | `viewMode` is `'dual'` | user clicks Shape Grid | `viewMode` becomes `'grid'` | second root and second visible shapes are retained but not used until next dual view |
| Dual-to-Full transition | `viewMode` is `'dual'` | user clicks Full Neck | `viewMode` becomes `'full'` | second root and second visible shapes are retained but not used |

### Requirement: Default State

The system MUST load with C Major selected by default, and in Dual mode the second root MUST default to G.
(Previously: Only C Major selected by default; no dual mode existed)

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Initial load | user navigates to CAGED tool | page loads | `selectedRoot` is C | `selectedQuality` is Major |
| Dual default | user selects Dual Compare view | dual mode renders | `secondRoot` is G | `secondVisibleShapes` contains all 5 shapes |
| Full Neck default | user navigates to CAGED tool | page loads | `viewMode` is `'full'` | `visibleShapes` contains all 5 shapes |

### Requirement: Chromatic Note Selector

The system MUST render chromatic note selectors. In Dual mode, the selector MUST render as paired "From → To" rows with independent root-per-fretboard control.
(Previously: Single row of 12 chromatic buttons for one root selection)

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Single root selection (Full/Grid) | viewMode is `'full'` or `'grid'` | user clicks "G#" | `selectedRoot` becomes G# | fretboard(s) update to G# shapes |
| Only one note selected | a note is already selected | user clicks different note | previously selected is deselected | new note is selected |
| Dual root selection — top | `viewMode` is `'dual'` | user clicks "From" note | `selectedRoot` updates | top fretboard updates independently |
| Dual root selection — bottom | `viewMode` is `'dual'` | user clicks "To" note | `secondRoot` updates | bottom fretboard updates independently |
| Dual root independence | `viewMode` is `'dual'` | `selectedRoot` is C, `secondRoot` is G | clicking top D does not change bottom | bottom remains G |

### Requirement: Simultaneous 5-Shape Display

The system MUST display all 5 CAGED shapes simultaneously. In Dual mode, the system MUST render two full-neck fretboards stacked vertically via the DualFretboard component.
(Previously: Displayed as 5 mini-fretboards in grid mode or single full neck in full mode)

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| All 5 shapes visible (Grid) | root and quality selected | CAGED renders in grid mode | exactly 5 mini-fretboards visible | each labeled with shape name |
| Dual stacked full necks | root and quality selected | `viewMode` is `'dual'` | two FullFretboard instances render | each shows overlaid shapes for its root |
| Shape labels correct | tool shows C major | user inspects labels | grid reads "C shape", "A shape", etc. | dual labels use FullFretboard aria-labels |
| Grid and dual mutual exclusion | `viewMode` is `'dual'` | user attempts grid layout | grid mode does not render | dual always uses full neck only |

### Requirement: State Management

The system MUST use Svelte 5 runes for reactive state management. The system MUST track `secondRoot` (NoteName) and `secondVisibleShapes` (SvelteSet<CagedShape>) as additional reactive state.
(Previously: Only `selectedRoot`, `selectedQuality`, `labelMode`, `viewMode`, `visibleShapes` tracked)

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| State changes re-render | user changes selected root | `$state` updates | `$derived` recalculates shapes | UI updates without manual DOM manipulation |
| Dual state re-render | user changes `secondRoot` | `$state` updates | `$derived` recalculates second shapes | bottom fretboard updates reactively |
| Dual shape toggle | user toggles shape in dual mode | `secondVisibleShapes` mutates | bottom fretboard updates | top fretboard remains unchanged |

## ADDED Requirements

### Requirement: View Mode State Reset

When the view mode changes to or from Dual, the system SHOULD reset the appropriate `visibleShapes` state to ensure consistent UX.

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Entering dual mode | `viewMode` is `'full'` | user selects Dual Compare | `secondVisibleShapes` resets to all 5 | `secondRoot` remains or defaults to G |
| Leaving dual mode | `viewMode` is `'dual'` | user selects Full Neck | `visibleShapes` remains as-is | `secondVisibleShapes` remains but is dormant |
| Root/quality change in dual | `viewMode` is `'dual'` | user changes `selectedRoot` or `selectedQuality` | `secondShapes` recalculates | `secondVisibleShapes` remains unchanged (does not auto-reset) |

### Requirement: Shape Toggle Bar in Dual Mode

The system MUST render a per-fretboard shape toggle bar in Dual mode. Each toggle bar MUST control only its corresponding fretboard's `visibleShapes`.

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Top toggle bar | `viewMode` is `'dual'` | user toggles C shape on top | `visibleShapes` changes | top fretboard updates; bottom unchanged |
| Bottom toggle bar | `viewMode` is `'dual'` | user toggles A shape on bottom | `secondVisibleShapes` changes | bottom fretboard updates; top unchanged |
| Toggle bar visibility | `viewMode` is `'full'` | user views full neck | single shape toggle bar renders | controls `visibleShapes` for single neck |
| Toggle bar hidden in grid | `viewMode` is `'grid'` | user views grid | no shape toggle bar renders | all 5 shapes always visible in grid |

### Requirement: Dual Compare Root Default

The system MUST default `secondRoot` to 'G' when the user first enters Dual mode.

| Scenario | Given | When | Then | And |
|---|---|---|---|---|
| Default second root | `selectedRoot` is C | user enters Dual mode | `secondRoot` initializes to G | bottom fretboard shows G shapes |
| Second root persists | user has been in dual mode | `secondRoot` was changed to D | user leaves and re-enters dual | `secondRoot` remains D (does not reset) |
