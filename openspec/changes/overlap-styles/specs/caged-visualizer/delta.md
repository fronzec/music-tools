# Delta for caged-visualizer

## ADDED Requirements

### Requirement: Overlap Style Toggle

The system MUST provide a Style toggle card in the CAGED Visualizer controls bar. The card MUST contain a segmented control with three options: Split, Dots, and Gradient. The toggle MUST be visible only in Full Neck and Dual Compare view modes; it MUST be hidden in Shape Grid mode.

#### Scenario: Style toggle visible in Full Neck

- GIVEN `viewMode` is `'full'`
- WHEN the CAGED tool renders
- THEN the Style card is visible in the controls bar
- AND it contains a segmented toggle with Split, Dots, and Gradient options
- AND the currently selected style is highlighted

#### Scenario: Style toggle visible in Dual Compare

- GIVEN `viewMode` is `'dual'`
- WHEN the CAGED tool renders
- THEN the Style card is visible in the controls bar
- AND it controls the shared overlap style for both fretboards
- AND both `FullFretboard` instances receive the same `overlapStyle` value

#### Scenario: Style toggle hidden in Grid

- GIVEN `viewMode` is `'grid'`
- WHEN the CAGED tool renders
- THEN the Style card is NOT visible
- AND the controls bar remains unchanged otherwise

#### Scenario: Style selection changes rendering

- GIVEN `overlapStyle` is currently `'split'`
- WHEN the user clicks the Gradient option
- THEN `overlapStyle` updates to `'gradient'`
- AND the FullFretboard overlap rendering updates immediately without animation

#### Scenario: Default style is split

- GIVEN the CAGED tool is loaded for the first time with no stored preference
- WHEN the initial state renders
- THEN `overlapStyle` defaults to `'split'`
- AND the Style toggle shows Split selected

### Requirement: Overlap Style Persistence

The system MUST persist the selected `overlapStyle` to `localStorage` under the key `caged-overlap-style`. On initial load, the system MUST read the stored value and use it if valid. If the stored value is invalid, corrupted, or missing, the system MUST fall back to `'split'`.

#### Scenario: Persistence across reloads

- GIVEN the user selects Dots style
- WHEN the page reloads
- THEN the Style toggle shows Dots selected
- AND the fretboard renders overlaps in Dots style

#### Scenario: Invalid localStorage fallback

- GIVEN `localStorage` contains a corrupted or invalid value for `caged-overlap-style`
- WHEN the CAGED tool loads
- THEN `overlapStyle` falls back to `'split'`
- AND the Style toggle shows Split selected
- AND no console error is thrown (graceful fallback)

#### Scenario: No stored value

- GIVEN `localStorage` has no `caged-overlap-style` entry
- WHEN the CAGED tool loads
- THEN `overlapStyle` defaults to `'split'`
- AND the Style toggle shows Split selected

## REMOVED Requirements

### Requirement: OverlapDemo Component

(Reason: The standalone `OverlapDemo.svelte` component is removed in favor of the integrated Style toggle in the CAGED Visualizer controls.)
(Migration: Remove import of `OverlapDemo` from `CagedTool.svelte`; no other consumers exist.)
