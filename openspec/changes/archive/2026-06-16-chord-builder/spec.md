# Chord Builder Specification

## Purpose

Define the Chord Builder tool: a chromatic-ruler view that teaches triad construction by showing chord tones at their exact semitone offsets from a root. The spec covers the pure theory module (`chords.ts`), the chromatic ruler UI behaviour, the stateful tool wrapper, and the integration deltas required to make the tool navigable.

---

## Section 1 — Chord Formula Theory Module (`src/lib/theory/chords.ts`)

### Requirement: Triad Quality Type

The system MUST define a `TriadQuality` type as the union `'maj' | 'min' | 'dim' | 'aug'`.

#### Scenario: Type includes all four qualities

- GIVEN the `TriadQuality` type is defined
- WHEN a variable is typed as `TriadQuality`
- THEN each of `'maj'`, `'min'`, `'dim'`, `'aug'` is accepted as a valid value
- AND no other string literal is accepted

### Requirement: TRIAD_OFFSETS Table

The system MUST export a constant `TRIAD_OFFSETS` mapping each `TriadQuality` to a tuple of three semitone offsets `[root, third, fifth]`.

The offsets MUST be exactly:

| Quality | Offsets  | Formula    |
|---------|----------|------------|
| `maj`   | [0, 4, 7] | `1 - 3 - 5`  |
| `min`   | [0, 3, 7] | `1 - ♭3 - 5` |
| `dim`   | [0, 3, 6] | `1 - ♭3 - ♭5`|
| `aug`   | [0, 4, 8] | `1 - 3 - ♯5` |

#### Scenario: Major triad offsets

- GIVEN `TRIAD_OFFSETS` is imported
- WHEN `TRIAD_OFFSETS['maj']` is accessed
- THEN the result is `[0, 4, 7]`

#### Scenario: Minor triad offsets

- GIVEN `TRIAD_OFFSETS` is imported
- WHEN `TRIAD_OFFSETS['min']` is accessed
- THEN the result is `[0, 3, 7]`

#### Scenario: Diminished triad offsets

- GIVEN `TRIAD_OFFSETS` is imported
- WHEN `TRIAD_OFFSETS['dim']` is accessed
- THEN the result is `[0, 3, 6]`

#### Scenario: Augmented triad offsets

- GIVEN `TRIAD_OFFSETS` is imported
- WHEN `TRIAD_OFFSETS['aug']` is accessed
- THEN the result is `[0, 4, 8]`

### Requirement: TRIAD_FORMULA Table

The system MUST export a constant `TRIAD_FORMULA` mapping each `TriadQuality` to its canonical formula string, using Unicode flat (♭) and sharp (♯) symbols.

| Quality | Formula string   |
|---------|-----------------|
| `maj`   | `'1 - 3 - 5'`    |
| `min`   | `'1 - ♭3 - 5'`   |
| `dim`   | `'1 - ♭3 - ♭5'`  |
| `aug`   | `'1 - 3 - ♯5'`   |

#### Scenario: Formula strings are exact

- GIVEN `TRIAD_FORMULA` is imported
- WHEN each quality key is accessed
- THEN the string matches the table above exactly (including symbols)

### Requirement: TRIAD_INTERVAL_JUMPS Table

The system MUST export a constant `TRIAD_INTERVAL_JUMPS` mapping each `TriadQuality` to an array of two strings representing the semitone jumps between adjacent chord tones (`root→third`, `third→fifth`).

| Quality | Jumps         |
|---------|---------------|
| `maj`   | `['+4', '+3']` |
| `min`   | `['+3', '+4']` |
| `dim`   | `['+3', '+3']` |
| `aug`   | `['+4', '+4']` |

#### Scenario: Interval jumps are exact

- GIVEN `TRIAD_INTERVAL_JUMPS` is imported
- WHEN each quality key is accessed
- THEN the array matches the table above

### Requirement: chordTones — note names from root + offsets

The system MUST export a pure function `chordTones(rootPc: number, offsets: readonly number[]): string[]` that maps each offset to a note name by adding it to `rootPc` (modulo 12) and resolving via `semitoneToNoteName` from `src/lib/theory/notes.ts`.

- `rootPc` is a pitch class (0–11; 0 = C, 1 = C#, …, 11 = B).
- The returned array has the same length as `offsets`.
- The function is pure (no side effects, no DOM, no audio).

#### Scenario: C major chord tones

- GIVEN `rootPc` is `0` (C) and `offsets` is `[0, 4, 7]`
- WHEN `chordTones(0, [0, 4, 7])` is called
- THEN the result is `['C', 'E', 'G']`

#### Scenario: C minor chord tones

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 7]`
- WHEN `chordTones(0, [0, 3, 7])` is called
- THEN the result is `['C', 'D#', 'G']`

#### Scenario: C diminished chord tones

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 6]`
- WHEN `chordTones(0, [0, 3, 6])` is called
- THEN the result is `['C', 'D#', 'F#']`

#### Scenario: C augmented chord tones

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 8]`
- WHEN `chordTones(0, [0, 4, 8])` is called
- THEN the result is `['C', 'E', 'G#']`

#### Scenario: G major chord tones (non-zero root)

- GIVEN `rootPc` is `7` (G) and `offsets` is `[0, 4, 7]`
- WHEN `chordTones(7, [0, 4, 7])` is called
- THEN the result is `['G', 'B', 'D']`

#### Scenario: A# minor chord tones (wraps around chromatic cycle)

- GIVEN `rootPc` is `10` (A#) and `offsets` is `[0, 3, 7]`
- WHEN `chordTones(10, [0, 3, 7])` is called
- THEN the result is `['A#', 'C#', 'F']`

#### Scenario: All 12 roots × all 4 qualities produce 3-element arrays

- GIVEN any `rootPc` from 0 to 11 and any `quality` in `TriadQuality`
- WHEN `chordTones(rootPc, TRIAD_OFFSETS[quality])` is called
- THEN the result is an array of exactly 3 strings, each a valid `NoteName`

### Requirement: chordName — resolved chord name string

The system MUST export a pure function `chordName(rootName: string, quality: TriadQuality): string` that returns the resolved human-readable name for the chord.

The naming convention MUST follow the pattern `"{rootName} {qualityWord}"` where `qualityWord` is:

| Quality | Word         |
|---------|-------------|
| `maj`   | `major`      |
| `min`   | `minor`      |
| `dim`   | `diminished` |
| `aug`   | `augmented`  |

#### Scenario: C major chord name

- GIVEN `rootName` is `'C'` and `quality` is `'maj'`
- WHEN `chordName('C', 'maj')` is called
- THEN the result is `'C major'`

#### Scenario: C minor chord name

- GIVEN `rootName` is `'C'` and `quality` is `'min'`
- WHEN `chordName('C', 'min')` is called
- THEN the result is `'C minor'`

#### Scenario: C diminished chord name

- GIVEN `rootName` is `'C'` and `quality` is `'dim'`
- WHEN `chordName('C', 'dim')` is called
- THEN the result is `'C diminished'`

#### Scenario: C augmented chord name

- GIVEN `rootName` is `'C'` and `quality` is `'aug'`
- WHEN `chordName('C', 'aug')` is called
- THEN the result is `'C augmented'`

#### Scenario: Non-C roots produce correct chord names

- GIVEN `rootName` is `'F#'` and `quality` is `'min'`
- WHEN `chordName('F#', 'min')` is called
- THEN the result is `'F# minor'`

- GIVEN `rootName` is `'A#'` and `quality` is `'dim'`
- WHEN `chordName('A#', 'dim')` is called
- THEN the result is `'A# diminished'`

- GIVEN `rootName` is `'G#'` and `quality` is `'aug'`
- WHEN `chordName('G#', 'aug')` is called
- THEN the result is `'G# augmented'`

#### Scenario: All 12 roots × all 4 qualities produce non-empty strings

- GIVEN any `rootName` from the 12-note chromatic set and any `quality` in `TriadQuality`
- WHEN `chordName(rootName, quality)` is called
- THEN the result is a non-empty string matching the pattern `"{rootName} {qualityWord}"`

### Requirement: chordMidi — MIDI note numbers for playback

The system MUST export a pure function `chordMidi(rootPc: number, offsets: readonly number[], octave?: number): number[]` that returns MIDI note numbers for the chord tones, suitable for passing to `NotePlayer.playSequence`.

- `rootPc` is 0–11.
- `octave` defaults to `4` when not supplied.
- The MIDI value for the root is `(octave + 1) * 12 + rootPc` (convention: C4 = MIDI 60, so `(4 + 1) * 12 + 0 = 60`).
- Each subsequent offset adds to the root MIDI value; notes that would wrap past the octave boundary MUST be kept in the same or the immediately next octave (i.e., simple addition: `rootMidi + offset`).
- The function is pure.

#### Scenario: C major MIDI notes at octave 4

- GIVEN `rootPc` is `0`, `offsets` is `[0, 4, 7]`, and `octave` is `4`
- WHEN `chordMidi(0, [0, 4, 7], 4)` is called
- THEN the result is `[60, 64, 67]`

#### Scenario: G major MIDI notes at default octave

- GIVEN `rootPc` is `7` and `offsets` is `[0, 4, 7]`
- WHEN `chordMidi(7, [0, 4, 7])` is called
- THEN the result is `[67, 71, 74]`

#### Scenario: C augmented MIDI notes at octave 4

- GIVEN `rootPc` is `0`, `offsets` is `[0, 4, 8]`, and `octave` is `4`
- WHEN `chordMidi(0, [0, 4, 8], 4)` is called
- THEN the result is `[60, 64, 68]`

---

## Section 2 — Chromatic Ruler Component (`src/lib/components/ChromaticRuler.svelte`)

### Requirement: Semitone Slot Rendering

The system MUST render exactly 12 semitone slots (indices 0–11) in a horizontal strip. Slot 0 is the root (always a chord tone). Slots are labelled 0–11 visually or by their note names relative to the current root.

#### Scenario: Always 12 slots

- GIVEN the `ChromaticRuler` component is rendered with any root and any quality
- WHEN the slot list is inspected
- THEN exactly 12 slots are present

### Requirement: Chord Tone Highlighting

The system MUST visually distinguish chord-tone slots from non-chord-tone slots. The three chord-tone slots (at the offsets for the active quality) MUST use the semantic token for an active/highlighted state; non-chord-tone slots MUST use a neutral/inactive token. No hardcoded hex or rgb values are permitted.

#### Scenario: Major chord tones lit

- GIVEN root is C and quality is `maj`
- WHEN the ruler renders
- THEN slots at positions 0, 4, 7 are in the highlighted state
- AND slots at all other positions are in the neutral state

#### Scenario: Minor chord tones lit

- GIVEN root is C and quality is `min`
- WHEN the ruler renders
- THEN slots at positions 0, 3, 7 are in the highlighted state

#### Scenario: Diminished chord tones lit

- GIVEN root is C and quality is `dim`
- WHEN the ruler renders
- THEN slots at positions 0, 3, 6 are in the highlighted state

#### Scenario: Augmented chord tones lit

- GIVEN root is C and quality is `aug`
- WHEN the ruler renders
- THEN slots at positions 0, 4, 8 are in the highlighted state

#### Scenario: No hardcoded colors

- GIVEN the ruler's CSS/Svelte markup is inspected
- WHEN color declarations are reviewed
- THEN there are no hardcoded hex, rgb, hsl, or SVG `fill="…"`/`stroke="…"` attribute values
- AND all colors reference design token CSS variables via Tailwind semantic classes

### Requirement: Interval Jump Annotations

The ruler MUST display the semitone jump between adjacent chord tones. The jump labels MUST be taken from `TRIAD_INTERVAL_JUMPS` for the active quality.

#### Scenario: Major jump labels

- GIVEN quality is `maj`
- WHEN the ruler renders
- THEN the annotation between the root and third shows `'+4'`
- AND the annotation between the third and fifth shows `'+3'`

#### Scenario: Diminished jump labels

- GIVEN quality is `dim`
- WHEN the ruler renders
- THEN the annotation between the root and third shows `'+3'`
- AND the annotation between the third and fifth shows `'+3'`

### Requirement: Formula Display

The ruler (or an adjacent element) MUST display the formula string for the active quality, sourced from `TRIAD_FORMULA`.

#### Scenario: Minor formula shown

- GIVEN quality is `min`
- WHEN the formula region is inspected
- THEN it contains the text `'1 - ♭3 - 5'`

#### Scenario: Augmented formula shown

- GIVEN quality is `aug`
- WHEN the formula region is inspected
- THEN it contains the text `'1 - 3 - ♯5'`

### Requirement: Note Name Labels

The ruler MUST display the resolved note name for each of the three chord-tone slots. Note names are derived from `chordTones(rootPc, TRIAD_OFFSETS[quality])`.

#### Scenario: C major note names shown

- GIVEN root is C and quality is `maj`
- WHEN the chord-tone labels are inspected
- THEN the labels contain `'C'`, `'E'`, and `'G'` at slots 0, 4, and 7 respectively

#### Scenario: G minor note names shown

- GIVEN root is G and quality is `min`
- WHEN the chord-tone labels are inspected
- THEN the labels contain `'G'`, `'A#'`, and `'D'` at slots 0, 3, and 7 respectively

### Requirement: Chord Name Display

The ruler area MUST display the resolved chord name, sourced from `chordName(rootName, quality)`.

#### Scenario: Chord name updates with root

- GIVEN root is `'F'` and quality is `maj`
- WHEN the chord name element is inspected
- THEN it contains the text `'F major'`

#### Scenario: Chord name updates with quality

- GIVEN root is `'C'`
- WHEN the user toggles from `maj` to `dim`
- THEN the chord name element updates to `'C diminished'`

### Requirement: Animated Marker Slide on Quality Change

When quality changes, chord-tone markers MUST animate from their old offset positions to their new positions. The animation represents the lesson: the learner sees a marker slide by exactly the number of semitones changed.

The animation MUST be gated on the CSS media query `prefers-reduced-motion`. When `prefers-reduced-motion: reduce` is active, the transition MUST be instant (no animation, direct state change).

#### Scenario: Marker animates on maj → min switch

- GIVEN quality is `maj`, the 3rd marker is at slot 4
- WHEN quality changes to `min`
- THEN the 3rd marker animates from slot 4 to slot 3
- AND the 5th marker remains at slot 7 (no movement)

#### Scenario: Marker animates on maj → aug switch

- GIVEN quality is `maj`, the 5th marker is at slot 7
- WHEN quality changes to `aug`
- THEN the 5th marker animates from slot 7 to slot 8
- AND the 3rd marker remains at slot 4 (no movement)

#### Scenario: No animation when prefers-reduced-motion is active

- GIVEN the user has `prefers-reduced-motion: reduce` set
- WHEN quality changes from any value to any other value
- THEN markers reposition instantly without any CSS transition or animation
- AND the final state is visually correct

### Requirement: Presentational Props API

`ChromaticRuler` MUST be a stateless presentational component. It MUST accept `rootPc: number` and `quality: TriadQuality` as `$props()`. All display values (offsets, formula, jumps, note names, chord name) MUST be derived inside the component via `$derived` from these two props.

#### Scenario: Props drive all display state

- GIVEN the component is mounted with `rootPc=0` and `quality='maj'`
- WHEN `rootPc` is updated to `7` by the parent
- THEN the displayed note names, chord name, and highlighted slots update to reflect G major without any internal mutation

---

## Section 3 — Chord Builder Tool (`src/lib/components/ChordBuilder.svelte`)

### Requirement: Root and Quality State

The `ChordBuilder` component MUST own the reactive state for the current root and quality. Root MUST default to `'C'` (pitch class 0). Quality MUST default to `'maj'`.

The root state MUST be a `NoteName` value from `src/lib/types/chord`. The quality state MUST be a `TriadQuality` value.

#### Scenario: Initial state

- GIVEN the user navigates to Chord Builder
- WHEN the view first renders
- THEN root is `'C'` and quality is `'maj'`
- AND the ruler shows the C major chord (slots 0, 4, 7 lit, chord name `'C major'`)

### Requirement: Root Selection via RootSelector

The tool MUST reuse the existing `RootSelector` component for root selection. Selecting a new root updates the root state, which $derived-updates the ruler and all display values.

#### Scenario: Root change updates ruler

- GIVEN the tool is rendered with root `'C'`
- WHEN the user selects `'G'` via `RootSelector`
- THEN the ruler's highlighted slots reflect G major offsets (slots at 7, 11, 14 mod 12 → 7, 11, 2)
- AND the chord name updates to `'G major'`
- AND the note names update to `'G'`, `'B'`, `'D'`

### Requirement: Quality Toggle

The tool MUST render a quality toggle with exactly four options: `maj`, `min`, `dim`, `aug`. Only one quality can be active at a time.

#### Scenario: Quality toggle shows four options

- GIVEN the tool is rendered
- WHEN the quality toggle is inspected
- THEN it contains exactly 4 controls labelled `maj`, `min`, `dim`, `aug`
- AND one of them is in the active/selected state

#### Scenario: Quality change updates all derived display

- GIVEN root is `'C'` and quality is `'maj'`
- WHEN the user selects `'dim'`
- THEN quality becomes `'dim'`
- AND the ruler reflects dim offsets (slots 0, 3, 6)
- AND the formula shows `'1 - ♭3 - ♭5'`
- AND the chord name shows `'C diminished'`

#### Scenario: Toggling back to original quality restores state

- GIVEN quality was changed from `'maj'` to `'min'`
- WHEN the user selects `'maj'` again
- THEN the ruler reflects major offsets (slots 0, 4, 7)
- AND all display values match the original C major state

### Requirement: Play Button — Arpeggio Then Block

The tool MUST render a Play button. When activated, the system MUST:

1. Play the three chord tones sequentially (arpeggio) — note by note in ascending order, using `NotePlayer.playSequence` with the MIDI values from `chordMidi`.
2. Immediately after the arpeggio completes, play all three chord tones simultaneously (block chord) — by scheduling them with `AudioContext` at the same start time.

Both sounds MUST reuse `midiToFreq` (or an equivalent pure MIDI-to-frequency function) and the `createNotePlayer` factory from `src/lib/audio/playNote.ts`. The Play button MUST NOT trigger audio on mount — only on explicit user activation.

#### Scenario: Play button exists

- GIVEN the tool is rendered
- WHEN the Play button area is inspected
- THEN a Play control is present and accessible (keyboard activatable with `aria-label`)

#### Scenario: Play triggers arpeggio then block

- GIVEN root is `'C'` and quality is `'maj'`
- WHEN the user activates the Play button
- THEN `playSequence` is called with the arpeggio frequencies for C, E, G
- AND after the arpeggio, the block (all three notes simultaneously) is scheduled

#### Scenario: Play does not fire on mount

- GIVEN the Chord Builder component is mounted
- WHEN no user interaction has occurred
- THEN no audio playback occurs

#### Scenario: Play uses correct MIDI for current state

- GIVEN root is `'F#'` and quality is `'min'`
- WHEN the user activates Play
- THEN the frequencies played correspond to F# minor MIDI notes (`chordMidi(6, [0, 3, 7])`)

### Requirement: Back-to-Home Navigation

The tool MUST provide a back-to-home control that calls `navigate('home')` when activated, matching the pattern used by Interval Trainer and other tools.

#### Scenario: Back navigation

- GIVEN the user is on the Chord Builder view
- WHEN the user activates the back-to-home control
- THEN `navigate('home')` is called
- AND the home page renders

### Requirement: Svelte 5 Runes and Composition Conventions

`ChordBuilder.svelte` MUST use Svelte 5 runes exclusively:

- Mutable state: `$state`
- Computed values: `$derived`
- Side effects (audio setup/teardown): `$effect`
- Props (if any): `$props()`
- No `on:click` syntax — use `onclick` handler props
- No `createEventDispatcher` — use callback props
- No `<slot>` — use `{#snippet}` / `{@render}` if composable content is needed

---

## Section 4 — Integration Deltas

### Requirement: TriadQuality Added to Type System

The system MUST add `TriadQuality` as an exported type to `src/lib/types/chord.ts` (or a new `src/lib/types/triad.ts`). This type is the union `'maj' | 'min' | 'dim' | 'aug'`.

#### Scenario: TriadQuality type is importable

- GIVEN `TriadQuality` is exported from its module
- WHEN it is imported in `chords.ts` and `ChordBuilder.svelte`
- THEN TypeScript accepts the import without error

### Requirement: ViewName Union Extended

The system MUST add `'chord-builder'` to the `ViewName` union in `src/lib/types/chord.ts`.

(Previously: `ViewName` did not include `'chord-builder'`.)

#### Scenario: Type includes chord-builder

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'chord-builder'` is accepted as a valid value

#### Scenario: Existing views remain valid

- GIVEN the `ViewName` type is extended
- WHEN any of the existing view names (`'home'`, `'caged'`, `'progression'`, `'note-trainer'`, `'tone-generator'`, `'pentatonic'`, `'signal-lab'`, `'interval-trainer'`, `'tab-player'`) are used
- THEN they remain accepted as valid values

### Requirement: VIEW_NAMES Array Extended

The system MUST add `'chord-builder'` to the `VIEW_NAMES` array in `src/lib/routing.ts`. The compile-time exhaustiveness guard in `routing.ts` ensures `tsc` fails if `ViewName` and `VIEW_NAMES` are out of sync — adding to the union without updating the array MUST break the build.

#### Scenario: VIEW_NAMES contains chord-builder

- GIVEN `routing.ts` is imported
- WHEN `VIEW_NAMES` is inspected
- THEN it contains `'chord-builder'`

#### Scenario: Exhaustiveness guard prevents omission

- GIVEN `'chord-builder'` is added to the `ViewName` union
- WHEN `'chord-builder'` is NOT added to `VIEW_NAMES`
- THEN `tsc` compilation fails on the exhaustiveness guard

### Requirement: Client Routing Extended

The system MUST ensure `pathToView('/chord-builder')` returns `'chord-builder'` and `viewToPath('chord-builder')` returns `'/chord-builder'`. The round-trip `pathToView(viewToPath('chord-builder'))` MUST equal `'chord-builder'`.

(The existing `pathToView`/`viewToPath` implementations derive correctness from `VIEW_NAMES`; no new logic is required — only the `VIEW_NAMES` addition above suffices.)

#### Scenario: Path resolves to chord-builder

- GIVEN `pathname` is `'/chord-builder'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'chord-builder'`

#### Scenario: View maps to correct path

- GIVEN `view` is `'chord-builder'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/chord-builder'`

#### Scenario: Round-trip for chord-builder

- GIVEN `view` is `'chord-builder'`
- WHEN `pathToView(viewToPath('chord-builder'))` is evaluated
- THEN the result equals `'chord-builder'`

### Requirement: App Shell Route Branch

The system MUST render `ChordBuilder` when `currentView` is `'chord-builder'`. The branch MUST be wrapped in `<svelte:boundary>` with the same `errorFallback` pattern used for all other tools in `App.svelte`.

#### Scenario: Route to Chord Builder

- GIVEN `currentView` is `'chord-builder'`
- WHEN `App.svelte` renders
- THEN `ChordBuilder` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page

- GIVEN the user is on the home page
- WHEN the user clicks the Chord Builder card
- THEN `navigate('chord-builder')` is called
- AND `currentView` becomes `'chord-builder'`

#### Scenario: Back to home from Chord Builder

- GIVEN the user is on the Chord Builder view
- WHEN the back-to-home control is activated
- THEN `navigate('home')` is called
- AND `currentView` resets to `'home'`

### Requirement: Home Page Tool Registry Entry

The system MUST add an active `ToolEntry` for Chord Builder to the **Fretboard & Theory** category in `src/lib/data/tools.ts`. The entry MUST have `status: 'active'` and `view: 'chord-builder'`.

(Previously: Chord Builder was not present in `TOOL_CATEGORIES`.)

#### Scenario: Chord Builder card appears in Fretboard & Theory

- GIVEN the home page renders
- WHEN the Fretboard & Theory category is inspected
- THEN a Chord Builder card is present
- AND it uses the same active-card styling as other active cards in the category

#### Scenario: Chord Builder card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Chord Builder card
- THEN `navigate('chord-builder')` is called

#### Scenario: Existing cards in Fretboard & Theory remain

- GIVEN the Chord Builder entry is added
- WHEN the Fretboard & Theory category is inspected
- THEN CAGED Visualizer, Scales Explorer, Note Trainer, and Tab Player cards are still present

---

## Section 5 — Quality and Constraint Invariants

### Requirement: Test Coverage — Pure Theory Module

The module `src/lib/theory/chords.ts` MUST have unit tests (in `tests/unit/`) covering:

- `TRIAD_OFFSETS`: all four qualities
- `TRIAD_FORMULA`: all four formula strings
- `TRIAD_INTERVAL_JUMPS`: all four jump arrays
- `chordTones`: all four qualities at root C (pitch class 0); at minimum two additional roots (e.g. G and A#) to verify modular arithmetic
- `chordName`: all four qualities at root C; at minimum two additional roots
- `chordMidi`: C major and G major at the default octave

Tests MUST be written before any UI component is implemented (strict TDD — pure module first).

#### Scenario: Unit tests exist for chords.ts

- GIVEN the test suite runs (`vitest run`)
- WHEN `tests/unit/chords.test.ts` (or equivalent) is executed
- THEN all scenarios listed in Section 1 pass as unit assertions
- AND the existing 834+ tests continue to pass

### Requirement: No Hardcoded Colors

All CSS color values in `ChromaticRuler.svelte` and `ChordBuilder.svelte` MUST use semantic design-token CSS variables via Tailwind utility classes. No hardcoded hex, rgb(), hsl(), or SVG presentation attribute color values are permitted.

#### Scenario: Token inspection passes

- GIVEN the source of `ChromaticRuler.svelte` and `ChordBuilder.svelte` is inspected
- WHEN all CSS class attributes and inline styles are reviewed
- THEN no `#rrggbb`, `rgb(...)`, `hsl(...)`, or `fill="..."` / `stroke="..."` values are present
- AND all color classes reference the design token system (e.g. `bg-surface-*`, `text-accent-*`, semantic Tailwind tokens)

### Requirement: Suite Stays Green

The existing test suite MUST continue to pass after all changes are applied. No new `svelte-check` errors are permitted.

#### Scenario: Full suite passes after implementation

- GIVEN all changes in Sections 1–4 are applied
- WHEN `vitest run` executes
- THEN all tests (existing + new) pass
- AND `svelte-check` reports no new errors

### Requirement: Phase 2 Items Are Absent

The following capabilities MUST NOT be present in this implementation:

- Fretboard mirror (showing chord tones on the neck)
- 7th chords, 9th chords, or any chord type with more than 3 tones
- Drag mode (user drags markers to build arbitrary intervals)

#### Scenario: No fretboard component in Chord Builder

- GIVEN the Chord Builder view is rendered
- WHEN the DOM is inspected
- THEN no fretboard or neck visualization component is present

---

## REMOVED Requirements

None. This is a fully additive change.

## RENAMED Requirements

None.
