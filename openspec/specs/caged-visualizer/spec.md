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

The system MUST render a row of 12 buttons for chromatic note selection (C, C#, D, D#, E, F, F#, G, G#, A, A#, B).

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

### Requirement: Simultaneous 5-Shape Display

The system MUST display all 5 CAGED shapes simultaneously as labeled mini-fretboards.

#### Scenario: All 5 shapes visible

- GIVEN a root note and quality are selected
- WHEN the CAGED tool renders
- THEN exactly 5 mini-fretboards are visible
- AND each is labeled with its shape name (C, A, G, E, D)

#### Scenario: Shape labels are correct

- GIVEN the tool shows C major
- WHEN the user inspects the mini-fretboards
- THEN the labels read "C shape", "A shape", "G shape", "E shape", "D shape"

### Requirement: Default State

The system MUST load with C Major selected by default.

#### Scenario: Initial load

- GIVEN the user navigates to the CAGED tool
- WHEN the page loads
- THEN the selected root is C
- AND the selected quality is Major
- AND 5 C major shapes are displayed

### Requirement: State Management

The system MUST use Svelte 5 runes for reactive state management.

#### Scenario: State changes re-render

- GIVEN the user changes the selected root
- WHEN the state updates via `$state`
- THEN the dependent derived values (`$derived`) recalculate
- AND the UI updates without manual DOM manipulation

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
