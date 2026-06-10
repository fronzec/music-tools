# Fretboard Component Specification

## Purpose

Define a reusable SVG fretboard component that renders guitar strings, frets, markers, and note positions with configurable visual properties.

## Requirements

### Requirement: SVG Fretboard Rendering

The system MUST render an SVG fretboard with configurable string count, fret count, and tuning.

#### Scenario: Default 6-string, 15-fret board

- GIVEN the default props are used
- WHEN the component renders
- THEN 6 horizontal string lines and 16 vertical fret lines (including nut) are visible

#### Scenario: Custom fret count

- GIVEN `frets` prop is set to 12
- WHEN the component renders
- THEN 13 vertical fret lines are visible

### Requirement: Fret Markers

The system MUST render fret markers at positions 3, 5, 7, 9, 12, and 15.

#### Scenario: Standard fret markers

- GIVEN the default 15-fret board
- WHEN the component renders
- THEN dots appear at frets 3, 5, 7, 9, and 15
- AND a double dot appears at fret 12

### Requirement: Note Position Rendering

The system MUST render note positions as circles on the fretboard, colored by chord function.

#### Scenario: Root note is large and blue

- GIVEN a note position with interval "R"
- WHEN the component renders
- THEN the note is rendered as a larger circle with a blue fill

#### Scenario: Chord tone is medium and green

- GIVEN a note position with interval "3" or "5"
- WHEN the component renders
- THEN the note is rendered as a medium circle with a green fill

#### Scenario: Non-chord tone is small and outlined

- GIVEN a note position with a non-chord interval
- WHEN the component renders
- THEN the note is rendered as a small circle with only an outline

### Requirement: Interval and Note Labels

The system MUST display labels on active note positions, controlled by a `labelType` prop.

#### Scenario: Interval labels

- GIVEN `labelType` is "intervals"
- WHEN the component renders
- THEN note labels show "R", "3", "5", "b3", etc.

#### Scenario: Note name labels

- GIVEN `labelType` is "notes"
- WHEN the component renders
- THEN note labels show "C", "E", "G", etc.

#### Scenario: Both labels

- GIVEN `labelType` is "both"
- WHEN the component renders
- THEN both note name and interval are displayed

### Requirement: Barre Indicator

The system MUST render a horizontal barre line when a shape has a barre fret.

#### Scenario: Barre at base fret

- GIVEN a shape with `baseFret` > 0
- WHEN the component renders
- THEN a horizontal line spans the barre fret across all strings

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "X" for muted strings at the nut position.

#### Scenario: Open string

- GIVEN a string with fret value 0
- WHEN the component renders
- THEN an "O" appears at the nut for that string

#### Scenario: Muted string

- GIVEN a string with fret value `null`
- WHEN the component renders
- THEN an "X" appears at the nut for that string

### Requirement: Responsive Scaling

The system MUST scale the fretboard via SVG `viewBox` to fit its container.

#### Scenario: Container resize

- GIVEN the fretboard is inside a responsive container
- WHEN the container width changes
- THEN the SVG scales proportionally without scrollbars

### Requirement: Accessibility

The system MUST include ARIA labels for interactive elements.

#### Scenario: Screen reader labels

- GIVEN a screen reader accesses the page
- WHEN the fretboard is rendered
- THEN the SVG or its interactive elements have descriptive `aria-label` attributes
