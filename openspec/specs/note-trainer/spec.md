# Note Trainer Specification

## Purpose

Interactive note learning on a 6×12 fretboard grid. Users explore note positions, visualize octave and unison patterns, and test knowledge with a scored quiz.

## Requirements

### Requirement: Fretboard Grid

The system MUST render an SVG grid of 6 strings × 12 frets with a note name label at each string–fret intersection.

#### Scenario: Grid renders on load

- GIVEN the Note Trainer view is active
- WHEN it renders in Explore mode
- THEN the SVG shows 6 horizontal string lines, 12 vertical fret lines, a nut, and fret markers at positions 3, 5, 7, 9, 12
- AND each intersection displays a note label derived from `STANDARD_TUNING` and `semitoneToNoteName`

#### Scenario: Mobile readability

- GIVEN the viewport is < 640px wide
- WHEN the fretboard renders
- THEN note labels remain readable via a minimum font size or horizontal scroll

### Requirement: Note Filter Bar

The system MUST display 12 chromatic note buttons. Clicking a button MUST highlight all fretboard positions where that note occurs.

#### Scenario: Select and highlight

- GIVEN the filter bar is visible
- WHEN the user clicks the "C" button
- THEN all positions containing the note C are visually highlighted
- AND the button appears selected/active

#### Scenario: Deselect

- GIVEN a note is currently selected
- WHEN the user clicks the same note button again
- THEN all highlights are removed
- AND the button returns to its default state

### Requirement: Octave Pattern Overlay

When a note is selected, the system MUST draw lines connecting octave positions if the toggle is enabled.

#### Scenario: Octave lines render

- GIVEN the user selected a note and the Octave toggle is ON
- WHEN the fretboard renders
- THEN SVG `<line>` elements connect matching-note positions that are octave equivalents

#### Scenario: Octave toggle off

- GIVEN the Octave toggle is OFF
- WHEN a note is selected
- THEN no octave lines are rendered

### Requirement: Unison Pattern Overlay

When a note is selected, the system MUST highlight same-pitch positions on different strings if the toggle is enabled.

#### Scenario: Unison markers render

- GIVEN the user selected a note and the Unison toggle is ON
- WHEN the fretboard renders
- THEN small dots or rings appear at positions with the exact same pitch (same note, different string)

### Requirement: Quiz Mode

The system MUST provide a Quiz mode that highlights a random string–fret position and presents 4 answer options.

#### Scenario: New question

- GIVEN the user is in Quiz mode and the difficulty is set
- WHEN a new question is generated
- THEN one random position within the difficulty fret range is highlighted
- AND 4 answer buttons are shown, including the correct note and 3 distractors

#### Scenario: Correct answer

- GIVEN a quiz question is active
- WHEN the user clicks the correct answer
- THEN the score increments correct and total
- AND the streak increments
- AND best streak updates if exceeded

#### Scenario: Wrong answer

- GIVEN a quiz question is active
- WHEN the user clicks a wrong answer
- THEN the score increments total only
- AND the streak resets to 0
- AND the correct answer is revealed

### Requirement: Difficulty Selector

The system MUST constrain the quiz fret range based on difficulty: Easy (0–5), Medium (0–9), Hard (0–12).

#### Scenario: Easy difficulty

- GIVEN the difficulty is set to Easy
- WHEN a new quiz question is generated
- THEN the random fret is between 0 and 5 inclusive

#### Scenario: Hard difficulty

- GIVEN the difficulty is set to Hard
- WHEN a new quiz question is generated
- THEN the random fret is between 0 and 12 inclusive

### Requirement: Score Display

The system MUST display current score, streak, and best streak during quiz mode.

#### Scenario: Score updates

- GIVEN the user answered several quiz questions
- WHEN the score display is inspected
- THEN it shows the format "correct/total · Streak: N · Best: M"

### Requirement: Responsive Layout

The system MUST be usable on both mobile and desktop.

#### Scenario: Single column on mobile

- GIVEN the viewport is < 768px wide
- WHEN the Note Trainer renders
- THEN controls and fretboard are stacked vertically

#### Scenario: Wider layout on desktop

- GIVEN the viewport is ≥ 768px wide
- WHEN the Note Trainer renders
- THEN controls and fretboard may use a wider or side-by-side layout
