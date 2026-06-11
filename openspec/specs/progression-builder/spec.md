# Progression Builder Specification

## Purpose

Define the Progression Builder tool that allows guitarists to sequence chords, control playback, and see CAGED shapes for the active chord.

## Requirements

### Requirement: Data Model

The system MUST define a `ProgressionChord` type with `id` (string), `root` (NoteName), and `quality` (ChordQuality). The system MUST define a `ProgressionState` type with `chords` (ProgressionChord[]), `activeIndex` (number), `isPlaying` (boolean), and `playbackSpeed` (string: 'slow' | 'medium' | 'fast').

#### Scenario: Type structure

- GIVEN the types are defined
- WHEN a progression is instantiated
- THEN each chord has a unique `id`, a valid `root`, and a valid `quality`

### Requirement: Default Progression

The system MUST initialize the progression to C–F–G–C (I–IV–V–I) in major quality. `activeIndex` MUST default to `0`. `isPlaying` MUST default to `false`. `playbackSpeed` MUST default to `'medium'`.

#### Scenario: Initial load

- GIVEN the user navigates to Progression Builder
- WHEN the view renders
- THEN the progression contains exactly 4 chords: C, F, G, C
- AND all chords have quality `'major'`
- AND `activeIndex` is `0`
- AND `isPlaying` is `false`
- AND `playbackSpeed` is `'medium'`

### Requirement: Add Chord

The system MUST provide a control that opens a chord picker to append a new `ProgressionChord` to the end of the progression. The new chord MUST inherit the shared `quality`.

#### Scenario: Add a chord

- GIVEN the progression has 4 chords
- WHEN the user opens the chord picker and selects D
- THEN a new chord with root D is appended as the 5th chord
- AND the new chord has the same quality as the existing chords

#### Scenario: Add at max limit

- GIVEN the progression already contains 32 chords
- WHEN the user attempts to add another chord
- THEN the add control is disabled or the action is prevented
- AND a visual indicator shows the limit is reached

### Requirement: Remove Chord

The system MUST allow removing a chord at a specific index. If the removed chord was before `activeIndex`, `activeIndex` MUST decrement by 1. If the removed chord was the last one and `activeIndex` was at the end, `activeIndex` MUST move to the new last index.

#### Scenario: Remove middle chord

- GIVEN the progression has 4 chords and `activeIndex` is `2`
- WHEN the user removes chord at index `1`
- THEN the progression has 3 chords
- AND `activeIndex` becomes `1`

#### Scenario: Remove last chord

- GIVEN the progression has 4 chords and `activeIndex` is `3`
- WHEN the user removes chord at index `3`
- THEN the progression has 3 chords
- AND `activeIndex` becomes `2`

#### Scenario: Remove active chord

- GIVEN the progression has 4 chords and `activeIndex` is `1`
- WHEN the user removes chord at index `1`
- THEN `activeIndex` becomes `1` (next chord becomes active, or last if at end)

#### Scenario: Remove from single-chord progression

- GIVEN the progression has exactly 1 chord
- WHEN the user removes it
- THEN the progression becomes empty
- AND `activeIndex` becomes `-1` or `null` (no active chord)

### Requirement: Shared Quality

The system MUST apply a single `quality` value to all chords in the progression. Changing `quality` MUST update every chord simultaneously.

#### Scenario: Toggle quality

- GIVEN the progression has 4 major chords
- WHEN the user toggles quality to minor
- THEN all 4 chords become minor
- AND the fretboard updates to show minor shapes

#### Scenario: Quality applies to new chords

- GIVEN the current quality is minor
- WHEN the user adds a new chord
- THEN the new chord is minor

#### Scenario: Quality label

- GIVEN the Progression Builder is loaded
- WHEN the quality control is inspected
- THEN a label indicates that quality applies to all chords

### Requirement: Active Chord Display

The system MUST pass the active chord's CAGED shapes to `FullFretboard` for display. The shapes MUST be computed via `getShapes(activeChord.root, activeChord.quality)`.

#### Scenario: Display active chord

- GIVEN the active chord is C major
- WHEN the fretboard renders
- THEN `FullFretboard` receives 5 C major shapes
- AND `visibleShapes` contains all 5 shapes

#### Scenario: Active chord changes

- GIVEN the active chord is C major
- WHEN the user navigates to the next chord (F major)
- THEN `FullFretboard` receives 5 F major shapes
- AND the fretboard updates without page reload

#### Scenario: Empty progression

- GIVEN the progression has no chords
- WHEN the fretboard area renders
- THEN `FullFretboard` receives an empty shapes array
- AND the empty state message is displayed

### Requirement: Playback

The system MUST provide play/pause controls. When playing, the system MUST auto-advance `activeIndex` by 1 at intervals determined by `playbackSpeed`. Playback MUST stop when `activeIndex` reaches the last chord. `setInterval` MUST be cleaned up on unmount.

#### Scenario: Play from start

- GIVEN `activeIndex` is `0` and `isPlaying` is `false`
- WHEN the user clicks play
- THEN `isPlaying` becomes `true`
- AND `activeIndex` advances to `1` after the first interval

#### Scenario: Playback speed

- GIVEN `playbackSpeed` is `'slow'`
- WHEN the user clicks play
- THEN the interval between advances is longer than when speed is `'fast'`

#### Scenario: Pause

- GIVEN playback is active
- WHEN the user clicks pause
- THEN `isPlaying` becomes `false`
- AND the interval timer is cleared
- AND `activeIndex` stays at its current value

#### Scenario: Playback reaches end

- GIVEN `activeIndex` is the last chord
- WHEN the advance interval fires
- THEN playback stops (does not loop)
- AND `isPlaying` becomes `false`

#### Scenario: Unmount cleanup

- GIVEN playback is active
- WHEN the component unmounts
- THEN the interval timer is cleared
- And no memory leak occurs

### Requirement: Timeline

The system MUST render a timeline with step dots equal to the number of chords. The active dot MUST be visually highlighted. The system MUST provide prev/next controls to navigate `activeIndex`.

#### Scenario: Timeline dots

- GIVEN the progression has 4 chords
- WHEN the timeline renders
- THEN exactly 4 dots are displayed
- AND the dot at index `0` is highlighted

#### Scenario: Active dot updates

- GIVEN the timeline is rendered with `activeIndex` at `0`
- WHEN the user clicks next
- THEN `activeIndex` becomes `1`
- AND dot at index `1` is highlighted
- AND dot at index `0` is no longer highlighted

#### Scenario: Prev at start

- GIVEN `activeIndex` is `0`
- WHEN the user clicks prev
- THEN `activeIndex` stays at `0`
- OR the action is disabled

#### Scenario: Next at end

- GIVEN `activeIndex` is the last chord
- WHEN the user clicks next
- THEN `activeIndex` stays at the last index
- OR the action is disabled

#### Scenario: Click dot to navigate

- GIVEN the timeline shows 4 dots
- WHEN the user clicks dot at index `2`
- THEN `activeIndex` becomes `2`
- AND the fretboard updates to show chord at index `2`

### Requirement: Progression Bar

The system MUST render a horizontal scrollable bar of chord pills. Each pill MUST show the chord root. The active pill MUST be visually highlighted. The bar MUST support adding and removing chords via controls within the bar.

#### Scenario: Pills display

- GIVEN the progression has 4 chords
- WHEN the progression bar renders
- THEN 4 pills are visible with roots C, F, G, C
- AND the active pill is highlighted

#### Scenario: Overflow scroll

- GIVEN the progression has 20 chords
- WHEN the bar is narrower than the total pill width
- THEN the bar is horizontally scrollable
- AND overflow is accessible via scroll or swipe

#### Scenario: Active pill highlighted

- GIVEN `activeIndex` is `1`
- WHEN the progression bar renders
- THEN the pill at index `1` uses the active style
- AND the other pills use the inactive style

### Requirement: Progression Builder Route

The system MUST provide a navigable entry point to the Progression Builder tool.

#### Scenario: Navigation from home page

- GIVEN the user is on the home page
- WHEN the user clicks the Progression Builder card
- THEN the Progression Builder view is displayed
