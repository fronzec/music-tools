# Delta for caged-visualizer

## ADDED Requirements

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

## MODIFIED Requirements

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

## RENAMED Requirements

None.

## REMOVED Requirements

None.
