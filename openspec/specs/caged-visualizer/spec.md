# CAGED Visualizer Tool Specification

## Purpose

Define the CAGED chord visualizer tool, including chord selection, quality toggle, and simultaneous 5-shape display.

## Requirements

### Requirement: Tool Route or State

The system MUST provide a navigable entry point to the CAGED Visualizer tool.

#### Scenario: Navigation from home page

- GIVEN the user is on the home page
- WHEN the user clicks the CAGED Visualizer card
- THEN the CAGED tool is displayed

### Requirement: Chromatic Note Selector

The system MUST render chromatic note selectors. In Dual mode, the selector MUST render as paired "From → To" rows with independent root-per-fretboard control.
(Previously: Single row of 12 chromatic buttons for one root selection)

#### Scenario: Note selection

- GIVEN the CAGED tool is loaded
- WHEN the user clicks the "G#" button
- THEN "G#" becomes the selected root
- AND the fretboards update to show G# shapes

#### Scenario: Only one note selected at a time

- GIVEN a note is already selected
- WHEN the user clicks a different note
- THEN the previously selected note is deselected
- AND the new note is selected

#### Scenario: Dual root selection — top

- GIVEN `viewMode` is `'dual'`
- WHEN the user clicks a "From" note
- THEN `selectedRoot` updates
- AND the top fretboard updates independently

#### Scenario: Dual root selection — bottom

- GIVEN `viewMode` is `'dual'`
- WHEN the user clicks a "To" note
- THEN `secondRoot` updates
- AND the bottom fretboard updates independently

#### Scenario: Dual root independence

- GIVEN `viewMode` is `'dual'` with `selectedRoot` is C, `secondRoot` is G
- WHEN the user clicks top D
- THEN the bottom does not change
- AND the bottom remains G

### Requirement: Major/Minor Quality Toggle

The system MUST provide a segmented toggle to switch between Major and Minor chord qualities.

#### Scenario: Toggle to minor

- GIVEN the current quality is Major
- WHEN the user selects Minor
- THEN the quality changes to Minor
- AND the fretboards update to show minor shapes

#### Scenario: Default quality

- GIVEN the CAGED tool is loaded for the first time
- WHEN the initial state is rendered
- THEN the default quality is Major

### Requirement: Default State

The system MUST load with C Major selected by default, and in Dual mode the second root MUST default to G.
(Previously: Only C Major selected by default; no dual mode existed)

#### Scenario: Initial load

- GIVEN the user navigates to the CAGED tool
- WHEN the page loads
- THEN the selected root is C
- AND the selected quality is Major
- AND 5 C major shapes are displayed

#### Scenario: Dual default

- GIVEN the user selects Dual Compare view
- WHEN dual mode renders
- THEN `secondRoot` is G
- AND `secondVisibleShapes` contains all 5 shapes

#### Scenario: Full Neck default

- GIVEN the user navigates to the CAGED tool
- WHEN the page loads
- THEN `viewMode` is `'full'`
- AND `visibleShapes` contains all 5 shapes

### Requirement: Dual Compare Root Default

The system MUST default `secondRoot` to 'G' when the user first enters Dual mode.

#### Scenario: Default second root

- GIVEN `selectedRoot` is C
- WHEN the user enters Dual mode
- THEN `secondRoot` initializes to G
- AND the bottom fretboard shows G shapes

#### Scenario: Second root persists

- GIVEN the user has been in dual mode
- WHEN `secondRoot` was changed to D
- AND the user leaves and re-enters dual
- THEN `secondRoot` remains D (does not reset)

### Requirement: View Mode

The system MUST provide a segmented toggle with three options: Full Neck, Shape Grid, and Dual Compare. The controls bar MUST include the Legend toggle button adjacent to the View Mode radiogroup.
(Previously: View mode radiogroup only; no legend toggle)

#### Scenario: Full Neck selected

- GIVEN the CAGED tool is loaded
- WHEN the user clicks Full Neck
- THEN `viewMode` becomes `'full'`
- AND FullFretboard renders with a single neck

#### Scenario: Shape Grid selected

- GIVEN the CAGED tool is loaded
- WHEN the user clicks Shape Grid
- THEN `viewMode` becomes `'grid'`
- AND 5 mini-fretboards render in grid

#### Scenario: Dual Compare selected

- GIVEN the CAGED tool is loaded
- WHEN the user clicks Dual Compare
- THEN `viewMode` becomes `'dual'`
- AND DualFretboard renders with two stacked necks

#### Scenario: Dual-to-Grid transition

- GIVEN `viewMode` is `'dual'`
- WHEN the user clicks Shape Grid
- THEN `viewMode` becomes `'grid'`
- AND second root and second visible shapes are retained but not used until next dual view

#### Scenario: Dual-to-Full transition

- GIVEN `viewMode` is `'dual'`
- WHEN the user clicks Full Neck
- THEN `viewMode` becomes `'full'`
- AND second root and second visible shapes are retained but not used

### Requirement: View Mode State Reset

When the view mode changes to or from Dual, the system SHOULD reset the appropriate `visibleShapes` state to ensure consistent UX.

#### Scenario: Entering dual mode

- GIVEN `viewMode` is `'full'`
- WHEN the user selects Dual Compare
- THEN `secondVisibleShapes` resets to all 5
- AND `secondRoot` remains or defaults to G

#### Scenario: Leaving dual mode

- GIVEN `viewMode` is `'dual'`
- WHEN the user selects Full Neck
- THEN `visibleShapes` remains as-is
- AND `secondVisibleShapes` remains but is dormant

#### Scenario: Root/quality change in dual

- GIVEN `viewMode` is `'dual'`
- WHEN the user changes `selectedRoot` or `selectedQuality`
- THEN `secondShapes` recalculates
- AND `secondVisibleShapes` remains unchanged (does not auto-reset)

### Requirement: Simultaneous 5-Shape Display

The system MUST display all 5 CAGED shapes simultaneously. In Dual mode, the system MUST render two full-neck fretboards stacked vertically via the DualFretboard component.
(Previously: Displayed as 5 mini-fretboards in grid mode or single full neck in full mode)

#### Scenario: All 5 shapes visible (Grid)

- GIVEN a root note and quality are selected
- WHEN the CAGED tool renders in grid mode
- THEN exactly 5 mini-fretboards are visible
- AND each is labeled with its shape name (C, A, G, E, D)

#### Scenario: Dual stacked full necks

- GIVEN a root note and quality are selected
- WHEN `viewMode` is `'dual'`
- THEN two FullFretboard instances render
- AND each shows overlaid shapes for its root

#### Scenario: Shape labels correct

- GIVEN the tool shows C major
- WHEN the user inspects the labels
- THEN grid reads "C shape", "A shape", etc.
- AND dual labels use FullFretboard aria-labels

#### Scenario: Grid and dual mutual exclusion

- GIVEN `viewMode` is `'dual'`
- WHEN the user attempts grid layout
- THEN grid mode does not render
- AND dual always uses full neck only

### Requirement: Shape Toggle Bar in Dual Mode

The system MUST render a per-fretboard shape toggle bar in Dual mode. Each toggle bar MUST control only its corresponding fretboard's `visibleShapes`.

#### Scenario: Top toggle bar

- GIVEN `viewMode` is `'dual'`
- WHEN the user toggles C shape on top
- THEN `visibleShapes` changes
- AND the top fretboard updates; bottom unchanged

#### Scenario: Bottom toggle bar

- GIVEN `viewMode` is `'dual'`
- WHEN the user toggles A shape on bottom
- THEN `secondVisibleShapes` changes
- AND the bottom fretboard updates; top unchanged

#### Scenario: Toggle bar visibility (Full/Grid)

- GIVEN `viewMode` is `'full'`
- WHEN the user views full neck
- THEN a single shape toggle bar renders
- AND it controls `visibleShapes` for the single neck

#### Scenario: Toggle bar hidden in grid

- GIVEN `viewMode` is `'grid'`
- WHEN the user views grid
- THEN no shape toggle bar renders
- AND all 5 shapes are always visible in grid

### Requirement: State Management

The system MUST use Svelte 5 runes for reactive state management. The system MUST track `secondRoot` (NoteName) and `secondVisibleShapes` (SvelteSet<CagedShape>) as additional reactive state.
(Previously: Only `selectedRoot`, `selectedQuality`, `labelMode`, `viewMode`, `visibleShapes` tracked)

#### Scenario: State changes re-render

- GIVEN the user changes the selected root
- WHEN the state updates via `$state`
- THEN the dependent derived values (`$derived`) recalculate
- AND the UI updates without manual DOM manipulation

#### Scenario: Dual state re-render

- GIVEN the user changes `secondRoot`
- WHEN the `$state` updates
- THEN `$derived` recalculates second shapes
- AND the bottom fretboard updates reactively

#### Scenario: Dual shape toggle

- GIVEN the user toggles a shape in dual mode
- WHEN `secondVisibleShapes` mutates
- THEN the bottom fretboard updates
- AND the top fretboard remains unchanged

### Requirement: Label Toggle

The system MUST allow the user to toggle between interval labels (R, 3, 5) and note name labels.

#### Scenario: Toggle to note names

- GIVEN the current label mode is intervals
- WHEN the user toggles to note names
- THEN all mini-fretboards show note names instead of intervals

#### Scenario: Toggle to intervals

- GIVEN the current label mode is note names
- WHEN the user toggles to intervals
- THEN all mini-fretboards show interval labels

### Requirement: Responsive Layout

The system MUST adapt the layout for mobile and desktop viewports.

#### Scenario: Desktop layout

- GIVEN the viewport is ≥ 768px wide
- WHEN the tool renders
- THEN the 5 mini-fretboards are arranged in a grid

#### Scenario: Mobile layout

- GIVEN the viewport is < 768px wide
- WHEN the tool renders
- THEN the mini-fretboards stack vertically
- OR a horizontal scroll container is provided

### Requirement: Legend Toggle Button

The system MUST provide a toggle button labeled "Legend" in the controls bar, following the existing radiogroup toggle pattern for visual and behavioral consistency.

#### Scenario: Legend toggle opens

- GIVEN the CAGED tool is loaded
- WHEN the user clicks the "Legend" toggle
- THEN `legendOpen` becomes `true`
- AND the legend panel renders below the controls

#### Scenario: Legend toggle closes

- GIVEN `legendOpen` is `true`
- WHEN the user clicks the "Legend" toggle again
- THEN `legendOpen` becomes `false`
- AND the legend panel is hidden

#### Scenario: Default state

- GIVEN the CAGED tool is loaded for the first time
- WHEN the initial state is rendered
- THEN `legendOpen` is `false`
- AND the legend panel is not visible

### Requirement: Legend Panel Placement

The system MUST render `<LegendPanel>` between the controls bar and the fretboard content area.

#### Scenario: Full Neck with legend

- GIVEN `viewMode` is `'full'` and `legendOpen` is `true`
- WHEN the tool renders
- THEN the legend panel appears below controls and above the full neck fretboard

#### Scenario: Grid with legend

- GIVEN `viewMode` is `'grid'` and `legendOpen` is `true`
- WHEN the tool renders
- THEN the legend panel appears below controls and above the shape grid

#### Scenario: Dual with legend

- GIVEN `viewMode` is `'dual'` and `legendOpen` is `true`
- WHEN the tool renders
- THEN the legend panel appears below controls and above the dual fretboards
