# Delta: fretboard — Animated Transitions

## MODIFIED Requirements

### Requirement: Note Position Rendering

The system MUST render note positions as circles on the fretboard and animate them smoothly when `shape` data changes.

(Previously: circles rendered statically without CSS transition)

#### Scenario: Note circle slides to new position

- GIVEN a note circle at `cx=250, cy=100` (fret 5, string 0)
- WHEN root changes and the same shape moves to fret 7
- THEN the circle’s `cx`/`cy` attributes animate via CSS `transition: transform 300ms ease-out`
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

The system MUST display labels on active note positions and animate them alongside their notes.

(Previously: labels rendered statically without animation)

#### Scenario: Label follows note in grid mode

- GIVEN a label "R" positioned above its note circle
- WHEN the note circle animates to a new fret
- THEN the label translates alongside the note via the same CSS transition

### Requirement: Barre Indicator

The system MUST render a horizontal barre rectangle and animate it when the barre fret changes.

(Previously: barre rectangle rendered statically without animation)

#### Scenario: Barre rect slides in grid mode

- GIVEN a barre rectangle at base fret 3
- WHEN root changes and barre moves to base fret 5
- THEN the barre rect translates to its new horizontal position via CSS transition

## ADDED Requirements

None.

## REMOVED Requirements

None.

## RENAMED Requirements

None.

## Backward Compatibility

- The existing string-indexed `{#each [0,1,2,3,4,5] as i (i)}` loop provides stable DOM keys automatically.
- No consumer API changes (props unchanged).
- All existing tests MUST pass after adding CSS transition styles.
