# Arpeggio Sweep Mode Specification

## Purpose

Defines a sweep-practice mode in Progression Builder that animates diatonic arpeggio notes one-by-one on a movable 5th-string-root barre shape over a 24-fret neck. Extends `ChordQuality` to include `'dim'` for complete diatonic progressions (vii°).

---

## Requirements

### Requirement: Mode Toggle

Progression Builder MUST expose a toggle that switches between chord/CAGED mode and sweep/arpeggio mode inside the `progression` view. Modes MUST be mutually exclusive. Switching MUST NOT reset the progression, active chord index, or playback speed.

#### Scenario: Activate sweep mode

- GIVEN the Progression Builder is in chord/CAGED mode
- WHEN the user activates the sweep mode toggle
- THEN the fretboard switches to sweep/arpeggio display
- AND the progression content and active chord index are unchanged

#### Scenario: Deactivate sweep mode

- GIVEN the Progression Builder is in sweep mode
- WHEN the user deactivates the sweep mode toggle
- THEN the fretboard returns to CAGED chord display with a 14-fret span

---

### Requirement: Arpeggio Note-Event Model

A pure function MUST derive an `ArpeggioNote[]` from `(root: NoteName, quality: ChordQuality)`. Each event MUST carry: `string` (0–5, 0 = low E), `fret` (0–24), `midi` (`STRING_OPEN_MIDI[string] + fret`), `stepIndex` (0-based). Events MUST be ordered ascending: string 1 (A string, root) through string 5 (high E). The function MUST be side-effect-free and unit-tested with Vitest.

#### Scenario: Major arpeggio — event structure

- GIVEN root = 'C', quality = 'major'
- WHEN `buildArpeggio` is called
- THEN it returns exactly 5 events for strings 1–5 in ascending order
- AND each `event.midi === STRING_OPEN_MIDI[event.string] + event.fret`
- AND `event[0].string === 1`

#### Scenario: dim arpeggio — valid frets

- GIVEN root = 'D', quality = 'dim'
- WHEN `buildArpeggio` is called
- THEN all 5 events have `fret` in [0, 24] and correct diminished-triad intervals

---

### Requirement: Note-by-Note Playback Animation

In sweep mode, each timer tick MUST advance one `ArpeggioNote` within the active chord. After the final note of the active chord, the next tick MUST advance to note[0] of the next chord. Play/pause and speed controls MUST retain their existing semantics; in sweep mode, speed drives the per-note step interval.

#### Scenario: Step within a chord

- GIVEN sweep mode is active, playback is running, active chord = C major
- WHEN the timer fires N times (N < total notes for the chord)
- THEN the fretboard highlights note[N] without advancing to the next chord

#### Scenario: Advance to next chord

- GIVEN the last note of chord[i] just fired
- WHEN the timer fires next
- THEN activeChordIndex becomes i+1 and the highlighted note is note[0] of chord[i+1]

---

### Requirement: Loop Toggle

Progression Builder MUST expose a loop toggle defaulting to OFF. When loop is ON and the last note of the last chord fires, playback MUST restart at note[0] of chord[0]. When loop is OFF, playback MUST stop after the last note.

#### Scenario: Loop OFF — stop at end

- GIVEN loop is OFF and the last note of the last chord fires
- WHEN the timer fires next
- THEN `isPlaying` becomes false and activeChordIndex does not reset

#### Scenario: Loop ON — restart

- GIVEN loop is ON and the last note of the last chord fires
- WHEN the timer fires next
- THEN activeChordIndex resets to 0, stepIndex resets to 0, playback continues

---

### Requirement: 24-Fret Sweep Fretboard

In sweep mode, the fretboard component MUST render with a 24-fret span. In chord/CAGED mode, FullFretboard MUST retain a 14-fret span. The 24-fret span MUST be supplied as a mode-scoped parameter; `FL.MIN_FRET_SPAN` and `FL.MAX_FRET_SPAN` (used by CAGED mode) MUST NOT be modified.

#### Scenario: Sweep mode fret span

- GIVEN sweep mode is active
- WHEN the fretboard renders
- THEN the viewBox width corresponds to a 24-fret span

#### Scenario: CAGED mode fret span unchanged

- GIVEN chord/CAGED mode is active
- WHEN FullFretboard renders
- THEN the visible fret span equals `FL.MIN_FRET_SPAN` (14)

---

### Requirement: ChordQuality dim Extension

`ChordQuality` MUST be extended to `'major' | 'minor' | 'dim'`. ProgressionBar MUST allow selecting `dim` quality for any chord. The arpeggio note-event builder MUST produce a correct diminished triad for `quality = 'dim'`.

#### Scenario: Set dim quality on a chord

- GIVEN the user opens quality selection for chord[i]
- WHEN they select 'dim'
- THEN `chord[i].quality` becomes `'dim'`
- AND the chord is valid for playback in both chord and sweep modes

#### Scenario: Sweep animates dim arpeggio

- GIVEN chord[i].quality === 'dim' and sweep mode is active
- WHEN chord[i] is the active chord during playback
- THEN the fretboard highlights diminished triad notes in ascending string order (string 1→5)

---

## Scope Boundaries (v1)

- The system MUST NOT emit audio signals. `ArpeggioNote.midi` is precomputed for future use only.
- The system MUST NOT support descending sweep order.
- The system MUST NOT display more than one arpeggio position per chord.
