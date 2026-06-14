# Interval Explorer Specification

## Purpose

Defines the behavior of the new Explore mode delivered inside the Interval Trainer: root + interval selection, fretboard highlight computation, audio playback, and accessibility requirements.

## Requirements

### Requirement: Fretboard Position Highlight Set

The system MUST compute two disjoint position sets given a root pitch class (0–11) and an interval (1–12 semitones):

- **Root set**: every `(string, fret)` pair where `(STANDARD_TUNING[string] + fret) % 12 === rootPitchClass`.
- **Target set**: every `(string, fret)` pair where `(STANDARD_TUNING[string] + fret) % 12 === (rootPitchClass + intervalSemitones) % 12`.

String indices are 0–5 (low E to high E). Fret range is 0–14 inclusive. STANDARD_TUNING = `[4, 9, 2, 7, 11, 4]`.

When `intervalSemitones === 12` (Perfect Octave), `(rootPitchClass + 12) % 12 === rootPitchClass`, so all positions fall in the root set and the target set is empty.

#### Scenario: Root set — E (pitch class 4) on standard tuning, frets 0–14

- GIVEN root pitch class 4 (E) and any interval
- WHEN the position sets are computed
- THEN the root set includes `(string:0, fret:0)`, `(string:5, fret:0)` (open low-E and high-E), `(string:0, fret:12)`, `(string:5, fret:12)` (octave equivalents), and `(string:1, fret:7)` (A string fret 7: 9+7=16, 16%12=4)
- AND no position in the root set has pitch class other than 4

#### Scenario: Target set — root C (pitch class 0), Perfect 5th (7 semitones)

- GIVEN root pitch class 0 (C) and interval 7 (Perfect 5th)
- WHEN the position sets are computed
- THEN the target set contains every `(string, fret)` where `(STANDARD_TUNING[string] + fret) % 12 === 7`
- AND `(string:1, fret:10)` is in the target set (A string: 9+10=19, 19%12=7)
- AND the root set and target set have no positions in common

#### Scenario: Perfect Octave — root set absorbs all positions

- GIVEN any root pitch class R and interval 12 (Perfect Octave)
- WHEN the position sets are computed
- THEN the target set is empty
- AND the root set contains every `(string, fret)` with pitch class R

#### Scenario: Root pitch class wrapping

- GIVEN root pitch class 11 (B) and interval 3 (Minor 3rd)
- WHEN the position sets are computed
- THEN the target pitch class is `(11 + 3) % 12 = 2` (D)
- AND all positions in the target set have pitch class 2

#### Scenario: Fret boundary

- GIVEN any root and interval
- WHEN the position sets are computed
- THEN no position has fret < 0 or fret > 14
- AND no position has string index < 0 or string index > 5

---

### Requirement: Explore Mode Audio Playback

The system MUST play the interval as an ascending two-note sequence (root then target) when the user triggers the Play action. Playback MUST use `createNotePlayer().playSequence([rootFreq, targetFreq])`.

The root note MUST be derived from a fixed reference MIDI note: `referenceMidi = 60 + (rootPitchClass - 0 + 12) % 12` (i.e., root mapped to the octave containing MIDI 60). The target frequency MUST be `midiToFreq(referenceMidi + intervalSemitones)`.

#### Scenario: Play sounds root then target

- GIVEN Explore mode is active with root C (pitch class 0) and interval 7 (Perfect 5th)
- WHEN the user activates the Play button
- THEN `playSequence` is called with `[midiToFreq(60), midiToFreq(67)]`

#### Scenario: Play with non-zero root pitch class

- GIVEN Explore mode is active with root E (pitch class 4) and interval 4 (Major 3rd)
- WHEN the user activates the Play button
- THEN `playSequence` is called with `[midiToFreq(64), midiToFreq(68)]`

#### Scenario: Play button is accessible

- GIVEN Explore mode is active
- WHEN the Play button is rendered
- THEN it has an `aria-label` that names the action and the selected interval (e.g. "Play Perfect 5th")

---

### Requirement: Explore Mode Controls

The Explore mode UI MUST provide:

- A root note selector exposing all 12 chromatic pitch classes (`CHROMATIC`: C, C#, D, D#, E, F, F#, G, G#, A, A#, B).
- An interval selector exposing all 12 intervals from `INTERVALS` (Minor 2nd through Perfect Octave).
- Both selectors MUST have an accessible `aria-label`.
- Default state: root = C (pitch class 0), interval = Perfect 5th (7 semitones).

#### Scenario: Root selector exposes all 12 pitch classes

- GIVEN Explore mode is active
- WHEN the root selector is rendered
- THEN it contains exactly 12 options matching `CHROMATIC` in order

#### Scenario: Interval selector exposes all 12 intervals

- GIVEN Explore mode is active
- WHEN the interval selector is rendered
- THEN it contains exactly 12 options matching `INTERVALS[0..11].name` in order

#### Scenario: Changing root updates highlights

- GIVEN Explore mode is active with root C and interval P5
- WHEN the user changes the root to A (pitch class 9)
- THEN the fretboard re-renders with root set recomputed for pitch class 9 and target set for pitch class `(9+7)%12 = 4`

#### Scenario: Changing interval updates highlights

- GIVEN Explore mode is active with root C (0) and interval P5 (7)
- WHEN the user changes the interval to Minor 3rd (3 semitones)
- THEN the target set is recomputed for pitch class `(0+3)%12 = 3`

---

### Requirement: Fretboard Accessibility

The fretboard SVG MUST be wrapped in a `<figure>` element with `role="img"` and an `aria-label` that describes the current selection (e.g. "Fretboard showing Perfect 5th from C"). A `<figcaption>` MUST name the interval and the root note.

#### Scenario: Aria-label reflects selection

- GIVEN Explore mode is active with root D and interval Major 3rd
- WHEN the fretboard is rendered
- THEN the figure's `aria-label` contains "Major 3rd" and "D"

#### Scenario: Figcaption is present

- GIVEN Explore mode is active
- WHEN the fretboard is rendered
- THEN a `<figcaption>` element is present and non-empty
