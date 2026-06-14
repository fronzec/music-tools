# Tab Player Specification

## Purpose

Curated-library tab reader with fretboard step-highlight and synced audio playback. Teaches the connection between notation, neck position, and sound.

## Requirements

### Requirement: Tab Data Model

The system MUST represent a tab as metadata plus an ordered list of steps. Each step MUST be an array of one or more `{ string: number, fret: number }` positions (0-indexed; string 0 = low E, string 5 = high E). A step with one position is a single note; a step with multiple positions is a chord or double-stop.

#### Scenario: Single-note step

- GIVEN a tab step defined as `[{ string: 3, fret: 2 }]`
- WHEN the data model is inspected
- THEN it holds exactly one position on string 3 (G string), fret 2

#### Scenario: Chord step

- GIVEN a tab step defined as `[{ string: 4, fret: 0 }, { string: 5, fret: 0 }]`
- WHEN the data model is inspected
- THEN it holds two positions representing a double-stop on strings 4 and 5

#### Scenario: Empty step is rejected

- GIVEN a tab step with zero positions
- WHEN the step is validated
- THEN it is treated as malformed and excluded from playback

### Requirement: Curated Tab Library

The system MUST expose a built-in library of at least 3 and no more than 5 short tabs at v1. Each library entry MUST have a unique id and a human-readable title. The library MUST be accessible as a deterministic ordered list.

#### Scenario: Library loads at startup

- GIVEN the Tab Player view is mounted
- WHEN the library is read
- THEN at least 3 entries are present, each with a unique id and a non-empty title

#### Scenario: Library order is stable

- GIVEN the Tab Player view is mounted multiple times
- WHEN the library list is read each time
- THEN the order is identical across renders

### Requirement: Library Selection

The system MUST allow the user to choose a tab from the library. Selecting a tab MUST load it, display its notation, and position the playhead at step 0 without auto-playing.

#### Scenario: Initial state

- GIVEN the Tab Player view is mounted
- WHEN no tab has been selected yet
- THEN the first library tab is selected by default and its notation is visible

#### Scenario: Select a different tab

- GIVEN a tab is already loaded and playing
- WHEN the user selects a different library tab
- THEN playback stops immediately
- AND the new tab's notation is displayed
- AND the playhead resets to step 0

#### Scenario: Re-selecting the current tab

- GIVEN a tab is loaded at step 3
- WHEN the user selects the same tab again
- THEN playback stops and the playhead resets to step 0

### Requirement: Tab Notation Display

The system MUST render a visual representation of the selected tab showing all steps in order, with each step's positions indicated. The current playhead step MUST be visually distinguished from other steps (e.g., highlighted column or marker).

#### Scenario: All steps rendered

- GIVEN a tab with 8 steps
- WHEN notation renders
- THEN all 8 step columns are visible

#### Scenario: Playhead marker at step 0

- GIVEN a tab is loaded
- WHEN the playhead is at step 0
- THEN step 0's column is visually marked as current

#### Scenario: Playhead advances in notation

- GIVEN playback is running and the playhead is at step 2
- WHEN the timer fires advancing to step 3
- THEN step 3's column becomes the active marker

### Requirement: fretToMidi Mapping

The system MUST provide a `fretToMidi(stringIndex, fret)` function that maps a guitar position to its MIDI note number using standard tuning open-string anchors: string 0 (low E) = MIDI 40, string 1 (A) = 45, string 2 (D) = 50, string 3 (G) = 55, string 4 (B) = 59, string 5 (high E) = 64. The output MUST equal `openStringMidi[stringIndex] + fret`.

#### Scenario: Open low E

- GIVEN `stringIndex = 0, fret = 0`
- WHEN `fretToMidi` is called
- THEN the result is 40 (E2)

#### Scenario: Open high E

- GIVEN `stringIndex = 5, fret = 0`
- WHEN `fretToMidi` is called
- THEN the result is 64 (E4)

#### Scenario: Fret offset

- GIVEN `stringIndex = 2, fret = 2`
- WHEN `fretToMidi` is called
- THEN the result is 52 (E3 = D open 50 + 2)

#### Scenario: All open strings

- GIVEN each `stringIndex` from 0 to 5, `fret = 0`
- WHEN `fretToMidi` is called for each
- THEN results are [40, 45, 50, 55, 59, 64] respectively

### Requirement: TabFretboard Display

The system MUST render a guitar fretboard (TabFretboard) that highlights the exact `(string, fret)` positions of the current playhead step. Positions not in the current step MUST NOT be highlighted. The fretboard MUST update synchronously whenever the playhead advances.

#### Scenario: Single-note highlight

- GIVEN a step with one position `{ string: 4, fret: 2 }`
- WHEN the playhead is on that step
- THEN exactly one marker appears at string 4, fret 2 on the fretboard
- AND all other positions are unmarked

#### Scenario: Chord highlight

- GIVEN a step with positions `[{ string: 3, fret: 0 }, { string: 4, fret: 0 }, { string: 5, fret: 3 }]`
- WHEN the playhead is on that step
- THEN markers appear at all three positions simultaneously

#### Scenario: Highlight clears on step change

- GIVEN the playhead is at step 1 with markers on string 2 fret 3
- WHEN the playhead advances to step 2 (different positions)
- THEN markers from step 1 are removed before step 2's markers appear

#### Scenario: Fretboard is an accessible figure

- GIVEN the TabFretboard is rendered
- WHEN accessibility attributes are inspected
- THEN the fretboard container has `role="img"` and a non-empty `aria-label` describing its current content

### Requirement: Playback Engine

The system MUST play a tab by advancing the playhead one step at a time on a fixed timer driven by the tempo setting. At each step, the engine MUST highlight the current positions on the fretboard AND schedule the corresponding MIDI note(s) via the audio module. Reaching the last step MUST stop playback and leave the playhead at the final step.

The timer MUST be bounded and cancellable: it MUST stop on Stop command, unmount, and tab switch.

#### Scenario: First step plays on press

- GIVEN a tab is loaded at step 0 and playback is stopped
- WHEN the user presses Play
- THEN the playhead stays at step 0, highlights its positions, and plays its audio immediately
- AND a timer is scheduled for the next step

#### Scenario: Step advances at tempo interval

- GIVEN playback is running at tempo T (step interval = 60000/T ms)
- WHEN exactly one interval elapses (via fake timers)
- THEN the playhead moves from step N to step N+1
- AND step N+1's positions are highlighted on the fretboard
- AND step N+1's notes are scheduled via the audio module

#### Scenario: Playback stops at end

- GIVEN playback is running and the playhead is at the last step
- WHEN the timer fires
- THEN the engine plays the last step's audio
- AND no further timer is scheduled
- AND the Play button returns to its initial state

#### Scenario: Stop halts and resets

- GIVEN playback is running at step 4
- WHEN the user presses Stop
- THEN the timer is cancelled immediately
- AND the playhead resets to step 0
- AND the fretboard shows step 0's positions (or parks at the initial state)

#### Scenario: No runaway timers on unmount

- GIVEN playback is running
- WHEN the Tab Player component unmounts
- THEN all pending timers are cancelled
- AND no audio is scheduled after unmount

#### Scenario: No runaway timers on tab switch

- GIVEN playback is running on tab A
- WHEN the user selects tab B
- THEN the timer for tab A is cancelled before tab B begins loading

#### Scenario: Testable with fake timers

- GIVEN `vi.useFakeTimers()` is active
- WHEN `vi.advanceTimersByTime(stepInterval)` is called N times
- THEN the playhead has advanced exactly N steps
- AND the audio module was called exactly N+1 times (including step 0)
- AND no real async waits are needed

### Requirement: Tempo Control

The system MUST expose a tempo control (BPM). Changing the tempo MUST take effect on the next step boundary; it MUST NOT require stopping and restarting playback. The valid range MUST be at least 40–200 BPM.

#### Scenario: Default tempo

- GIVEN the Tab Player is mounted
- WHEN the tempo control is inspected
- THEN a default tempo value between 60 and 120 BPM is set

#### Scenario: Tempo change mid-playback

- GIVEN playback is running at 80 BPM
- WHEN the user changes tempo to 120 BPM
- THEN subsequent step intervals use the 120 BPM interval
- AND the current step completes before the new interval applies

#### Scenario: Tempo out of range is clamped

- GIVEN the tempo control is set programmatically to 250 BPM
- WHEN the tempo is read
- THEN it is clamped to 200 BPM

### Requirement: Step-Through Navigation

The system SHOULD allow the user to advance or retreat one step at a time while stopped (Next/Previous). Step-through MUST NOT be available during active playback.

#### Scenario: Step forward while stopped

- GIVEN playback is stopped and the playhead is at step 2
- WHEN the user presses Next
- THEN the playhead moves to step 3
- AND the fretboard highlights step 3's positions

#### Scenario: Step backward while stopped

- GIVEN playback is stopped and the playhead is at step 3
- WHEN the user presses Previous
- THEN the playhead moves to step 2

#### Scenario: Previous at step 0 is a no-op

- GIVEN the playhead is at step 0
- WHEN the user presses Previous
- THEN the playhead remains at step 0

### Requirement: Accessibility — Controls

The system MUST provide `aria-label` attributes on all interactive controls: the tab selector, the Play button, the Stop button, the tempo control, and (if present) the Next/Previous step buttons.

#### Scenario: Tab selector label

- GIVEN the Tab Player is rendered
- WHEN the tab selector is inspected
- THEN it has `aria-label` containing "Select tab" or equivalent

#### Scenario: Playback controls labelled

- GIVEN the Tab Player is rendered
- WHEN the Play and Stop buttons are inspected
- THEN each has a descriptive `aria-label` (e.g., "Play", "Stop")

#### Scenario: Tempo control labelled

- GIVEN the Tab Player is rendered
- WHEN the tempo control is inspected
- THEN it has `aria-label` containing "Tempo" or equivalent (e.g., "Tempo (BPM)")
