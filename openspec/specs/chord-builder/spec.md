# Chord Builder Specification

## Purpose

Define the Chord Builder tool: a graphical interface for teaching triad construction through a chromatic ruler. Users select a root note and triad quality (major, minor, diminished, augmented) and see chord tones light up at their exact semitone offsets. Animated marker transitions show how quality changes affect the chord. A Play button arpeggiates the chord tones then plays them simultaneously.

## Requirements

### Requirement: Pure Theory Module for Triads

The system MUST export a `TriadQuality` type as the union `'maj' | 'min' | 'dim' | 'aug'` from `src/lib/theory/chords.ts`. The system MUST export a `TRIAD_OFFSETS` constant mapping each quality to semitone offsets: `maj` → `[0, 4, 7]`, `min` → `[0, 3, 7]`, `dim` → `[0, 3, 6]`, `aug` → `[0, 4, 8]`. The system MUST export a `TRIAD_FORMULA` constant mapping each quality to its formula string: `maj` → `'1 - 3 - 5'`, `min` → `'1 - ♭3 - 5'`, `dim` → `'1 - ♭3 - ♭5'`, `aug` → `'1 - 3 - ♯5'`. The system MUST export a `TRIAD_INTERVAL_JUMPS` constant mapping each quality to interval jump labels: `maj` → `['+4', '+3']`, `min` → `['+3', '+4']`, `dim` → `['+3', '+3']`, `aug` → `['+4', '+4']`.

#### Scenario: Triad offsets are available

- GIVEN `TRIAD_OFFSETS` is imported
- WHEN any quality is accessed
- THEN the result matches the table: maj `[0, 4, 7]`, min `[0, 3, 7]`, dim `[0, 3, 6]`, aug `[0, 4, 8]`

#### Scenario: Formulas use correct symbols

- GIVEN `TRIAD_FORMULA` is imported
- WHEN maj and min are accessed
- THEN maj returns `'1 - 3 - 5'` and min returns `'1 - ♭3 - 5'` (with exact Unicode flat symbols)

#### Scenario: Interval jumps reflect semitone distances

- GIVEN `TRIAD_INTERVAL_JUMPS` is imported
- WHEN maj is accessed
- THEN the result is `['+4', '+3']` (major third = 4 semitones, minor third = 3)

### Requirement: chordTones Function

The system MUST export a pure function `chordTones(rootPc: number, offsets: readonly number[]): string[]` that maps each offset to a note name by adding it to `rootPc` (modulo 12) and resolving via `semitoneToNoteName` from `src/lib/theory/notes.ts`. The function is pure and returns an array of note names.

#### Scenario: C major chord tones

- GIVEN `rootPc` is `0` (C) and `offsets` is `[0, 4, 7]`
- WHEN `chordTones(0, [0, 4, 7])` is called
- THEN the result is `['C', 'E', 'G']`

#### Scenario: G minor chord tones

- GIVEN `rootPc` is `7` (G) and `offsets` is `[0, 3, 7]`
- WHEN `chordTones(7, [0, 3, 7])` is called
- THEN the result is `['G', 'A#', 'D']`

#### Scenario: All 12 roots with any quality produce valid note names

- GIVEN any `rootPc` from 0 to 11 and any quality's offsets
- WHEN `chordTones(rootPc, offsets)` is called
- THEN the result is an array of exactly 3 valid note name strings

### Requirement: chordName Function

The system MUST export a pure function `chordName(rootName: string, quality: TriadQuality): string` that returns the resolved human-readable chord name following the pattern `"{rootName} {qualityWord}"`. The quality words MUST be: `maj` → `'major'`, `min` → `'minor'`, `dim` → `'diminished'`, `aug` → `'augmented'`.

#### Scenario: C major chord name

- GIVEN `rootName` is `'C'` and `quality` is `'maj'`
- WHEN `chordName('C', 'maj')` is called
- THEN the result is `'C major'`

#### Scenario: F# minor chord name

- GIVEN `rootName` is `'F#'` and `quality` is `'min'`
- WHEN `chordName('F#', 'min')` is called
- THEN the result is `'F# minor'`

#### Scenario: All 12 roots × 4 qualities produce correct names

- GIVEN any `rootName` from the chromatic scale and any `TriadQuality`
- WHEN `chordName(rootName, quality)` is called
- THEN the result is a non-empty string matching `"{rootName} {qualityWord}"`

### Requirement: chordMidi Function

The system MUST export a pure function `chordMidi(rootPc: number, offsets: readonly number[], octave?: number): number[]` that returns MIDI note numbers for the chord tones. The octave parameter defaults to `4`. The MIDI value for the root MUST be `(octave + 1) * 12 + rootPc` (C4 = MIDI 60). Each subsequent offset adds to the root MIDI value.

#### Scenario: C major MIDI notes at octave 4

- GIVEN `rootPc` is `0`, `offsets` is `[0, 4, 7]`, and `octave` is `4`
- WHEN `chordMidi(0, [0, 4, 7], 4)` is called
- THEN the result is `[60, 64, 67]`

#### Scenario: G major MIDI notes at default octave

- GIVEN `rootPc` is `7` and `offsets` is `[0, 4, 7]`
- WHEN `chordMidi(7, [0, 4, 7])` is called
- THEN the result is `[67, 71, 74]`

### Requirement: Chromatic Ruler Component

The system MUST render a `ChromaticRuler` component that displays a horizontal strip of exactly 12 semitone slots (indices 0–11) measured from the current root. Slot 0 is always the root. The three chord-tone slots (at the offsets for the active quality) MUST use a semantic token for highlighting; non-chord-tone slots MUST use a neutral token. No hardcoded hex, rgb, or hsl color values are permitted.

#### Scenario: Always 12 slots rendered

- GIVEN the `ChromaticRuler` component is rendered with any root and any quality
- WHEN the slot list is inspected
- THEN exactly 12 slots are present

#### Scenario: Major chord tones highlighted

- GIVEN root is C and quality is `maj`
- WHEN the ruler renders
- THEN slots at positions 0, 4, 7 are highlighted
- AND slots at all other positions are neutral

#### Scenario: No hardcoded colors in ruler

- GIVEN the ruler's CSS/Svelte markup is inspected
- WHEN color declarations are reviewed
- THEN all colors reference design token CSS variables via Tailwind semantic classes
- AND there are no hardcoded hex, rgb, or SVG `fill="..."` values

### Requirement: Interval Jump and Formula Display

The chromatic ruler MUST display interval jump annotations between adjacent chord tones, sourced from `TRIAD_INTERVAL_JUMPS` for the active quality. The ruler MUST also display the formula string from `TRIAD_FORMULA`.

#### Scenario: Major interval jumps shown

- GIVEN quality is `maj`
- WHEN the ruler renders
- THEN annotations show `'+4'` between root and third
- AND `'+3'` between third and fifth

#### Scenario: Formula displayed

- GIVEN quality is `min`
- WHEN the formula region is inspected
- THEN it contains the text `'1 - ♭3 - 5'`

### Requirement: Chord Tone Note Names and Chord Name Display

The ruler MUST display the resolved note names for each of the three chord-tone slots, derived from `chordTones(rootPc, TRIAD_OFFSETS[quality])`. The ruler area MUST display the resolved chord name from `chordName(rootName, quality)`.

#### Scenario: C major note names shown

- GIVEN root is C and quality is `maj`
- WHEN the chord-tone labels are inspected
- THEN the labels contain `'C'`, `'E'`, and `'G'` at slots 0, 4, and 7 respectively

#### Scenario: Chord name updates with quality

- GIVEN root is `'C'` and quality is `'maj'`
- WHEN the user toggles to `'dim'`
- THEN the chord name element updates to `'C diminished'`

### Requirement: Animated Marker Slide on Quality Change

When quality changes, chord-tone markers MUST animate from their old offset positions to their new positions. The animation MUST be gated on the CSS media query `prefers-reduced-motion: reduce`. When `prefers-reduced-motion` is active, the transition MUST be instant with no animation.

#### Scenario: Marker slides on maj → min

- GIVEN quality is `maj` and the 3rd marker is at slot 4
- WHEN quality changes to `min`
- THEN the 3rd marker animates from slot 4 to slot 3
- AND the 5th marker remains at slot 7

#### Scenario: No animation when prefers-reduced-motion is active

- GIVEN the user has `prefers-reduced-motion: reduce` set
- WHEN quality changes
- THEN markers reposition instantly without CSS transitions
- AND the final state is visually correct

### Requirement: Presentational Ruler Props API

`ChromaticRuler` MUST be a stateless presentational component accepting `rootPc: number` and `quality: TriadQuality` as props. All display values (offsets, formula, jumps, note names, chord name) MUST be derived inside the component via Svelte `$derived` from these two props.

#### Scenario: Props drive all display state

- GIVEN the component is mounted with `rootPc=0` and `quality='maj'`
- WHEN `rootPc` is updated to `7` by the parent
- THEN all displayed values update to reflect G major without any internal mutation

### Requirement: Chord Builder Tool Stateful Wrapper

The `ChordBuilder` component MUST own the reactive state for the current root and quality. Root MUST default to `'C'` (pitch class 0). Quality MUST default to `'maj'`. The component MUST reuse the existing `RootSelector` component for root selection.

#### Scenario: Initial state is C major

- GIVEN the user navigates to Chord Builder
- WHEN the view first renders
- THEN root is `'C'` and quality is `'maj'`
- AND the ruler shows the C major chord

#### Scenario: Root change via RootSelector updates ruler

- GIVEN root is `'C'`
- WHEN the user selects `'G'` via `RootSelector`
- THEN the ruler reflects G major
- AND the chord name updates to `'G major'`
- AND note names update to `'G'`, `'B'`, `'D'`

### Requirement: Quality Toggle with Four Options

The tool MUST render a quality toggle with exactly four options: `maj`, `min`, `dim`, `aug`. Only one quality can be active at a time.

#### Scenario: Quality toggle has four options

- GIVEN the tool is rendered
- WHEN the quality toggle is inspected
- THEN it contains exactly 4 controls labelled `maj`, `min`, `dim`, `aug`
- AND one of them is in the active state

#### Scenario: Quality change updates all derived display

- GIVEN root is `'C'` and quality is `'maj'`
- WHEN the user selects `'dim'`
- THEN the ruler reflects dim offsets (slots 0, 3, 6)
- AND the formula shows `'1 - ♭3 - ♭5'`
- AND the chord name shows `'C diminished'`

### Requirement: Play Button — Arpeggio Then Block Chord

The tool MUST render a Play button. When activated, the system MUST play the three chord tones sequentially (arpeggio) — note by note in ascending order. Immediately after the arpeggio completes, the system MUST play all three chord tones simultaneously (block chord). Both sounds reuse `midiToFreq` and the note player from `src/lib/audio/playNote.ts`. The Play button MUST NOT trigger audio on mount — only on explicit user activation.

#### Scenario: Play button exists

- GIVEN the tool is rendered
- WHEN the Play button area is inspected
- THEN a Play control is present and accessible

#### Scenario: Play triggers arpeggio then block

- GIVEN root is `'C'` and quality is `'maj'`
- WHEN the user activates the Play button
- THEN the chord tones are played as an arpeggio (note by note)
- AND after the arpeggio, all three notes play simultaneously

#### Scenario: Play does not fire on mount

- GIVEN the Chord Builder component is mounted
- WHEN no user interaction has occurred
- THEN no audio playback occurs

#### Scenario: Play uses correct MIDI for current state

- GIVEN root is `'F#'` and quality is `'min'`
- WHEN the user activates Play
- THEN the frequencies correspond to F# minor MIDI notes

### Requirement: Back-to-Home Navigation

The tool MUST provide a back-to-home control that calls `navigate('home')` when activated.

#### Scenario: Back navigation

- GIVEN the user is on the Chord Builder view
- WHEN the back-to-home control is activated
- THEN `navigate('home')` is called
- AND the home page renders

### Requirement: Svelte 5 Runes and Composition

`ChordBuilder.svelte` MUST use Svelte 5 runes exclusively: `$state`, `$derived`, `$effect`, and `$props()`. No `on:click` event syntax, no `createEventDispatcher`, and no `<slot>` are permitted.

#### Scenario: Svelte 5 compliance

- GIVEN the component source is inspected
- WHEN rune usage is reviewed
- THEN `$state`, `$derived`, `$effect`, and `$props()` are used
- AND no `on:` event handlers, `createEventDispatcher`, or `<slot>` are present

### Requirement: Unit Tests for Pure Theory Module

The module `src/lib/theory/chords.ts` MUST have unit tests covering all four qualities at multiple roots, including wraparound cases. Tests MUST be written before any UI component is implemented (strict TDD).

#### Scenario: Unit tests exist for chords.ts

- GIVEN the test suite runs
- WHEN `tests/unit/chords.test.ts` is executed
- THEN all scenarios listed in this spec pass as unit assertions
- AND the existing test suite continues to pass

### Requirement: No Hardcoded Colors

All CSS color values in `ChromaticRuler.svelte` and `ChordBuilder.svelte` MUST use semantic design-token CSS variables via Tailwind utility classes. No hardcoded hex, rgb, hsl, or SVG presentation attribute color values are permitted.

#### Scenario: Token inspection passes

- GIVEN the source of both components is inspected
- WHEN all CSS class attributes and inline styles are reviewed
- THEN no `#rrggbb`, `rgb(...)`, `hsl(...)`, or `fill="..."` values are present
- AND all color classes reference the design token system

### Requirement: Suite Stays Green

The existing test suite MUST continue to pass after all changes are applied. No new `svelte-check` errors are permitted.

#### Scenario: Full suite passes after implementation

- GIVEN all changes are applied
- WHEN `npm test` executes
- THEN all tests (existing + new) pass
- AND `svelte-check` reports no new errors

### Requirement: Phase 2 Items Are Absent

The following capabilities MUST NOT be present: fretboard mirror (showing chord tones on the neck), 7th chords or any chord type with more than 3 tones, and drag mode for building arbitrary intervals.

#### Scenario: No fretboard component in Chord Builder

- GIVEN the Chord Builder view is rendered
- WHEN the DOM is inspected
- THEN no fretboard or neck visualization component is present

---

## MODIFIED Capabilities

(Previously: Chord Builder did not exist.)

The app gains a graphical chord-construction tool called Chord Builder, accessible from the home page and at `/chord-builder`. Users learn how triads are constructed by seeing chord tones light up at their exact semitone offsets on a chromatic ruler, with animated transitions when changing qualities.
