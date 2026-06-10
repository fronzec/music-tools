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

The system MUST render note positions as circles on the fretboard, colored by chord function, and animate them smoothly when `shape` data changes using CSS `transition: transform`.

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

#### Scenario: Note circle slides to new position

- GIVEN a note circle at `cx=250, cy=100` (fret 5, string 0)
- WHEN root changes and the same shape moves to fret 7
- THEN the circle's `cx`/`cy` attributes animate via CSS `transition: transform 300ms ease-out`
- AND the DOM element persists because the key is `stringIndex`

#### Scenario: Root diamond animates

- GIVEN a root note rendered as a filled circle with blue stroke
- WHEN root changes and the shape moves
- THEN the root note circle translates to the new position via CSS transition

#### Scenario: prefers-reduced-motion disables grid animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN root changes in grid mode
- THEN notes snap instantly to new positions

### Requirement: Interval and Note Labels

The system MUST display labels on active note positions, controlled by a `labelType` prop, and animate them alongside their notes when position changes.

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

#### Scenario: Label follows note in grid mode

- GIVEN a label "R" positioned above its note circle
- WHEN the note circle animates to a new fret
- THEN the label translates alongside the note via the same CSS transition

### Requirement: Barre Indicator

The system MUST render a horizontal barre line when a shape has a barre fret, and animate it when the barre fret changes.

#### Scenario: Barre at base fret

- GIVEN a shape with `baseFret` > 0
- WHEN the component renders
- THEN a horizontal line spans the barre fret across all strings

#### Scenario: Barre rect slides in grid mode

- GIVEN a barre rectangle at base fret 3
- WHEN root changes and barre moves to base fret 5
- THEN the barre rect translates to its new horizontal position via CSS transition

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "×" for muted strings at the nut position,
using the shape's designated color for visual consistency with FullFretboard.

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Open String** | MUST render "O" at the nut using the shape's color (from `SHAPE_COLORS` or a single-shape equivalent) | C shape → blue O | — |
| **Muted String** | MUST render "×" at the nut using the shape's color | C shape muted → blue × | Previously used `#9CA3AF` gray |
| **Visual Consistency** | O/× color MUST match the color used for notes and barre in the same shape | FullFretboard and Fretboard indicators share color scheme | — |

#### Scenario: Open string in C shape uses shape color

- GIVEN a C shape chord (`baseFret === 0`)
- AND string 1 has `fret === 0`
- WHEN Fretboard renders
- THEN an "O" appears at the nut for string 1
- AND the "O" is rendered in C shape color (`#2563EB`)

#### Scenario: Muted string in C shape uses shape color

- GIVEN a C shape chord (`baseFret === 0`)
- AND string 6 has `fret === null`
- WHEN Fretboard renders
- THEN an "×" appears at the nut for string 6
- AND the "×" is rendered in C shape color (`#2563EB`)

#### Scenario: Barre position — no indicators

- GIVEN a shape with `baseFret > 0`
- WHEN Fretboard renders
- THEN no O/× indicators are rendered (nut area shows base fret label only)

#### Scenario: All strings fretted — no indicators

- GIVEN a shape where all six strings have `fret > 0` or `fret === 0` (shown as fretted)
- WHEN Fretboard renders
- THEN no O/× indicators are rendered

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
