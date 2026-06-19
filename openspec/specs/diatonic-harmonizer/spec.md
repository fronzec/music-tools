# Diatonic Harmonizer Specification

## Purpose

Define the Diatonic Harmonizer tool: a new top-level tool that shows the seven diatonic triads of any major key in degree order, each with its Roman-numeral label, quality, notes, and a full-neck fretboard diagram. This spec covers the pure theory module (`diatonics.ts`), the presentational component (`DiatonicHarmonizer.svelte`), and the four-point app-shell registration.

## Requirements

### Requirement: MAJOR_SCALE_INTERVALS Constant

The module `src/lib/theory/diatonics.ts` MUST export a `readonly` constant:

```
MAJOR_SCALE_INTERVALS: readonly [0, 2, 4, 5, 7, 9, 11]
```

These are the semitone offsets of the seven major-scale degrees from the root.

#### Scenario: Constant is exported and correct

- GIVEN `MAJOR_SCALE_INTERVALS` is imported from `diatonics.ts`
- WHEN its values are inspected
- THEN it equals `[0, 2, 4, 5, 7, 9, 11]` exactly
- AND it has length 7

### Requirement: DiatonicTriad Interface

The module MUST export an interface `DiatonicTriad` with exactly the following shape:

```
interface DiatonicTriad {
  degree:   1 | 2 | 3 | 4 | 5 | 6 | 7;   // scale degree (1-based)
  roman:    string;                         // Roman-numeral label, e.g. 'I', 'ii', 'vii°'
  quality:  'maj' | 'min' | 'dim';         // derived, never hardcoded
  rootPc:   number;                        // 0..11, pitch class of this triad's root
  rootName: string;                        // note name, e.g. 'D'
  notes:    readonly string[];             // [root, third, fifth] note names
  name:     string;                        // human-readable name, e.g. 'D minor'
}
```

#### Scenario: Interface shape

- GIVEN `DiatonicTriad` is imported
- WHEN a value of that type is inspected
- THEN it has exactly the fields `degree`, `roman`, `quality`, `rootPc`, `rootName`, `notes`, `name`
- AND `quality` is one of `'maj'`, `'min'`, `'dim'` (never `'aug'`)
- AND `notes` is a tuple of exactly three strings

### Requirement: diatonicTriads Function — Signature and Return Shape

The module MUST export a pure function:

```
diatonicTriads(rootName: NoteName): DiatonicTriad[]
```

Behavior:

- Accepts any `NoteName` from `CHROMATIC` (12 chromatic roots).
- Returns an array of exactly 7 `DiatonicTriad` items.
- Items are ordered by degree: index 0 is degree I, index 6 is degree vii°.
- The function is pure: no DOM, no audio, no side effects.
- Reuses `chordTones` and `chordName` from `src/lib/theory/chords.ts` for note building and naming.
- Does NOT import `TRIAD_OFFSETS` for quality classification. Quality is derived from the measured semitone gaps (see below).

#### Scenario: Return array has exactly 7 items

- GIVEN `diatonicTriads('C')` is called
- WHEN the result is inspected
- THEN the array has length 7
- AND degrees are `[1, 2, 3, 4, 5, 6, 7]` in that order

### Requirement: Diatonic Third Stacking — Scale-Degree Indices

Each triad is built by taking scale-degree indices `i`, `i+2`, and `i+4` (mod 7 with octave carry) from the major scale of the given root. The semitone for scale-degree index `j` is:

```
(rootSemitone + MAJOR_SCALE_INTERVALS[j % 7] + 12 * Math.floor(j / 7)) % 12
```

where `j` is the raw (non-modded) index used to determine octave carry, and the pitch class wraps mod 12 only for display / note naming.

No chromatic notes outside the scale are used to build any triad. Every note in every triad is a member of the major scale.

#### Scenario: C major — degree I triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 1 (index 0) is inspected
- THEN `rootName` is `'C'`, `rootPc` is `0`
- AND `notes` is `['C', 'E', 'G']`

#### Scenario: C major — degree ii triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 2 (index 1) is inspected
- THEN `rootName` is `'D'`, `rootPc` is `2`
- AND `notes` is `['D', 'F', 'A']`

#### Scenario: C major — degree iii triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 3 (index 2) is inspected
- THEN `rootName` is `'E'`, `rootPc` is `4`
- AND `notes` is `['E', 'G', 'B']`

#### Scenario: C major — degree IV triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 4 (index 3) is inspected
- THEN `rootName` is `'F'`, `rootPc` is `5`
- AND `notes` is `['F', 'A', 'C']`

#### Scenario: C major — degree V triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 5 (index 4) is inspected
- THEN `rootName` is `'G'`, `rootPc` is `7`
- AND `notes` is `['G', 'B', 'D']`

#### Scenario: C major — degree vi triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 6 (index 5) is inspected
- THEN `rootName` is `'A'`, `rootPc` is `9`
- AND `notes` is `['A', 'C', 'E']`

#### Scenario: C major — degree vii° triad notes

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 7 (index 6) is inspected
- THEN `rootName` is `'B'`, `rootPc` is `11`
- AND `notes` is `['B', 'D', 'F']`

### Requirement: Quality Classification — Derived from Semitone Gaps

The `quality` of each triad MUST be derived by measuring the semitone interval between the root and the third, and between the third and the fifth:

| root→3rd | 3rd→5th | quality |
|----------|---------|---------|
| 4        | 3       | `'maj'` |
| 3        | 4       | `'min'` |
| 3        | 3       | `'dim'` |

Quality is NEVER hardcoded by degree index. It is computed from the actual semitone distances between the three diatonic notes of each triad. This is an invariant: if the computation is correct for any one major key, the `maj,min,min,maj,maj,min,dim` pattern MUST emerge for all 12 keys without additional logic.

#### Scenario: C major — quality sequence

- GIVEN `diatonicTriads('C')` is called
- WHEN the `quality` of all 7 triads is extracted in degree order
- THEN the sequence is `['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']`

#### Scenario: Quality pattern holds for all 12 major keys

- GIVEN `diatonicTriads(root)` is called for each of the 12 values in `CHROMATIC`
- WHEN the `quality` sequence is extracted in degree order for each root
- THEN EVERY key produces `['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']`
- AND no key ever produces any other sequence

#### Scenario: Quality is derived, not hardcoded — dim is vii° for all 12 keys

- GIVEN `diatonicTriads(root)` is called for each root in `CHROMATIC`
- WHEN degree 7 (index 6) is inspected for each root
- THEN `quality` is always `'dim'`
- AND the semitone gap root→3rd is always 3
- AND the semitone gap 3rd→5th is always 3

### Requirement: Roman-Numeral Labels — Casing and Symbols

Roman labels MUST follow this mapping, derived from quality:

| degree | quality | roman   |
|--------|---------|---------|
| 1      | maj     | `'I'`   |
| 2      | min     | `'ii'`  |
| 3      | min     | `'iii'` |
| 4      | maj     | `'IV'`  |
| 5      | maj     | `'V'`   |
| 6      | min     | `'vi'`  |
| 7      | dim     | `'vii°'`|

Rules:
- Uppercase Roman for `'maj'` quality.
- Lowercase Roman for `'min'` quality.
- Lowercase Roman + `°` suffix for `'dim'` quality.
- The `°` character (U+00B0 DEGREE SIGN) MUST be used, not a letter `o` or `0`.

These labels are the same for all 12 major keys because quality is fixed.

#### Scenario: C major — Roman labels

- GIVEN `diatonicTriads('C')` is called
- WHEN the `roman` of all 7 triads is extracted in degree order
- THEN the sequence is `['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']`

#### Scenario: Roman labels match quality casing for G major

- GIVEN `diatonicTriads('G')` is called
- WHEN `roman` values are extracted
- THEN all `'maj'` triads have uppercase-only Roman labels
- AND all `'min'` triads have lowercase Roman labels
- AND the single `'dim'` triad has a lowercase Roman label ending in `°`

#### Scenario: vii° uses DEGREE SIGN (U+00B0), not the letter 'o'

- GIVEN `diatonicTriads('C')` is called
- WHEN degree 7's `roman` field is inspected
- THEN `roman` is `'vii°'`
- AND `roman.charCodeAt(3)` is `176` (U+00B0)

### Requirement: rootPc is a Pitch Class (0..11)

The `rootPc` of each `DiatonicTriad` MUST be in the range 0..11 inclusive, computed as `(keyRootSemitone + MAJOR_SCALE_INTERVALS[i]) % 12` for scale-degree index `i`.

#### Scenario: All rootPc values in C major are in 0..11

- GIVEN `diatonicTriads('C')` is called
- WHEN all `rootPc` values are inspected
- THEN each is in the range 0..11
- AND the set is `{0, 2, 4, 5, 7, 9, 11}`

#### Scenario: rootPc in a non-C key (G major)

- GIVEN `diatonicTriads('G')` is called
- WHEN all `rootPc` values are inspected
- THEN the set is `{7, 9, 11, 0, 2, 4, 6}` (in degree order: G, A, B, C, D, E, F#)

### Requirement: Unit Tests Written Before UI (Strict TDD)

Unit tests for `diatonicTriads` and `MAJOR_SCALE_INTERVALS` MUST be written and passing BEFORE `DiatonicHarmonizer.svelte` is implemented.

Test file location: `tests/unit/theory/diatonics.test.ts`.

Tests MUST cover:
- `MAJOR_SCALE_INTERVALS` value and length.
- C major: all 7 triads — full note tuples, `rootPc`, `rootName`, `quality`, `roman`, `degree`, `name`.
- Quality sequence for all 12 major roots (`CHROMATIC.forEach`).
- Roman label sequence for C major.
- `vii°` `charCodeAt` check for the DEGREE SIGN.
- `rootPc` range (0..11) for all triads across all 12 roots.
- G major `rootPc` set.
- Determinism: two calls with same root produce equal results.

#### Scenario: Unit test suite passes before component exists

- GIVEN `tests/unit/theory/diatonics.test.ts` is written
- WHEN `vitest run tests/unit/theory/diatonics.test.ts` executes
- THEN all assertions pass
- AND `DiatonicHarmonizer.svelte` does NOT yet exist

### Requirement: State Ownership

`DiatonicHarmonizer.svelte` MUST own one piece of mutable state: the selected major-key root (type `NoteName`, default `'C'`). All other values are derived.

```
let root = $state<NoteName>('C');
```

No child component owns or mutates `root`. It is passed down as props or read via derived values.

#### Scenario: Default root is C

- GIVEN `DiatonicHarmonizer.svelte` is mounted with no props
- WHEN the component renders
- THEN it shows the 7 diatonic triads of C major
- AND the `RootSelector` reflects `'C'` as the active selection

### Requirement: RootSelector Integration

The component MUST render a `RootSelector` component covering all 12 chromatic roots. Selecting a root updates `root` state, which re-derives all 7 triads live.

#### Scenario: Changing root re-derives all 7 triads

- GIVEN the component is rendered with default root `'C'`
- WHEN the user selects `'G'` via `RootSelector`
- THEN 7 chord cards for G major appear (I=G, ii=Am, iii=Bm, IV=C, V=D, vi=Em, vii°=F#°)
- AND the previous C major cards are no longer shown

### Requirement: Derived Triads via diatonicTriads

The 7 triads displayed MUST be sourced exclusively from `diatonicTriads(root)`. The derivation MUST use `$derived` or `$derived.by`:

```
const triads = $derived(diatonicTriads(root));
```

No triad data is stored in `$state`. No quality or note values are hardcoded in the component.

#### Scenario: Triads are derived, not hardcoded

- GIVEN `DiatonicHarmonizer.svelte` source is inspected
- WHEN `$state` declarations are counted
- THEN exactly one `$state` is present (the root)
- AND no chord name, quality, or note value is hardcoded as a literal

### Requirement: 7 Chord Cards — Content

The component MUST render exactly 7 chord cards, one per degree, in degree order (I through vii°). Each card MUST display:

| Field | Content | Example (C major, degree ii) |
|-------|---------|------------------------------|
| Chord name | `rootName` + quality suffix: `''` for maj, `'m'` for min, `'°'` for dim | `'Dm'` |
| Roman degree | `roman` field | `'ii'` |
| Quality label | `quality` field | `'min'` |
| Notes | `notes` tuple, comma-separated or dash-separated | `'D – F – A'` |
| Fretboard | `<ChordFretboard>` for this triad | (see below) |

The chord name format is: `rootName` + `'m'` for min, `'°'` for dim, and no suffix for maj. Example chord names for C major: C, Dm, Em, F, G, Am, B°.

#### Scenario: C major — card content for degree I

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-I card is inspected
- THEN it shows chord name `'C'`, Roman `'I'`, quality `'maj'`, notes containing `'C'`, `'E'`, `'G'`

#### Scenario: C major — card content for degree ii

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-ii card is inspected
- THEN it shows chord name `'Dm'`, Roman `'ii'`, quality `'min'`, notes containing `'D'`, `'F'`, `'A'`

#### Scenario: C major — card content for degree vii°

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-vii° card is inspected
- THEN it shows chord name `'B°'`, Roman `'vii°'`, quality `'dim'`, notes containing `'B'`, `'D'`, `'F'`

#### Scenario: Exactly 7 cards rendered

- GIVEN the component is rendered with any major-key root
- WHEN all chord cards are counted
- THEN exactly 7 cards are present

### Requirement: ChordFretboard Integration per Card

Each chord card MUST embed a `<ChordFretboard>` component. The props passed MUST be:

| ChordFretboard prop | Source |
|--------------------|--------|
| `rootPc`           | `triad.rootPc` |
| `offsets`          | `TRIAD_OFFSETS[triad.quality]` (from `src/lib/theory/chords.ts`) |
| `degrees`          | `TRIAD_DEGREES[triad.quality]` (from `src/lib/theory/chords.ts`) |
| `rootName`         | `triad.rootName` |
| `chordName`        | computed chord name string (e.g. `'Dm'`) |

No `offsets` or `degrees` value is hardcoded inline in the template — they are always resolved through `TRIAD_OFFSETS` and `TRIAD_DEGREES` keyed by `triad.quality`.

#### Scenario: ChordFretboard receives correct offsets for degree I (C major)

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-I card's `<ChordFretboard>` is inspected
- THEN `rootPc` is `0`, `offsets` is `[0, 4, 7]`, `degrees` is `['1', '3', '5']`

#### Scenario: ChordFretboard receives correct offsets for degree ii (C major)

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-ii card's `<ChordFretboard>` is inspected
- THEN `rootPc` is `2`, `offsets` is `[0, 3, 7]`, `degrees` is `['1', '♭3', '5']`

#### Scenario: ChordFretboard receives correct offsets for degree vii° (C major)

- GIVEN the component is rendered with root `'C'`
- WHEN the degree-vii° card's `<ChordFretboard>` is inspected
- THEN `rootPc` is `11`, `offsets` is `[0, 3, 6]`, `degrees` is `['1', '♭3', '♭5']`

### Requirement: No Audio

The component MUST NOT include any `<audio>` element, Web Audio API usage, or play/pause controls.

#### Scenario: No audio element present

- GIVEN `DiatonicHarmonizer.svelte` is rendered
- WHEN the DOM is inspected
- THEN no `<audio>` element is present
- AND no `AudioContext` is instantiated

### Requirement: Tokens Only — No Hardcoded Colors

All color references in `DiatonicHarmonizer.svelte` and its card markup MUST use semantic design tokens via Tailwind utility classes. No `#rrggbb`, `rgb(...)`, `hsl(...)`, or inline `style="color:..."` values are permitted. The `<ChordFretboard>` component already enforces this internally; the card wrapper must not break it.

#### Scenario: No inline color values in component source

- GIVEN `DiatonicHarmonizer.svelte` source is inspected
- WHEN all color references are reviewed
- THEN no `#rrggbb`, `rgb(...)`, or `hsl(...)` values appear
- AND all color classes reference the token system

### Requirement: Svelte 5 Runes

The component MUST use Svelte 5 runes exclusively:

- `let root = $state<NoteName>('C')` for the single piece of mutable state.
- `$derived` or `$derived.by` for all computed values (triads, chord names).
- `$props()` for the component's props.
- No `on:*` event directive syntax; use `onclick={...}` or equivalent rune-idiomatic form.
- No `createEventDispatcher`.
- No `<slot>` — use `{#snippet}` / `{@render}` if composable content is needed.

### Requirement: Out-of-Scope Items Absent

The following MUST NOT be introduced in this change:

- Minor key or modal harmonization (any non-major scale).
- 7th chords, 9th chords, or any triad extended beyond three notes.
- Audio / playback of any kind.
- Progression builder, function labels (tonic/subdominant/dominant), or cadence suggestions.
- Enharmonic key-signature spelling (e.g. choosing B♭ vs A# per key context).
- Quality selection UI — quality is always derived from `diatonicTriads`, never chosen by the user.

#### Scenario: No minor key UI

- GIVEN `DiatonicHarmonizer.svelte` is rendered
- WHEN the component is inspected
- THEN no "minor key" toggle, mode selector, or non-major scale UI is present

#### Scenario: No 7th chord data

- GIVEN `diatonics.ts` source is inspected
- WHEN all exported values are reviewed
- THEN no 7th-chord interval tables, `SEVENTH` offsets, or 4-note chord types are exported

### Requirement: Existing Suite Stays Green

After all changes are applied:

- `vitest run` MUST pass all pre-existing tests.
- `svelte-check` MUST report no new errors beyond the pre-existing project baseline.
- No existing test file is modified to accommodate the new code.
- `tsc --noEmit` MUST pass (exhaustiveness guard in `routing.ts` satisfied).

#### Scenario: Full suite passes after implementation

- GIVEN all changes in Sections 1–3 are applied
- WHEN `vitest run` executes
- THEN all pre-existing tests pass (991 total as of this change)
- AND new tests in `tests/unit/theory/diatonics.test.ts` also pass
- AND `svelte-check` reports no new errors beyond the pre-existing baseline
- AND `tsc --noEmit` exits cleanly

### Requirement: Additive Only — Full Rollback Possible

The change is purely additive with one exception: the four-point registration (types, routing, App.svelte, tools.ts) modifies existing files in a revertible way.

Reverting consists of:
1. Deleting `src/lib/theory/diatonics.ts`
2. Deleting `src/lib/components/DiatonicHarmonizer.svelte`
3. Deleting `tests/unit/theory/diatonics.test.ts`
4. Deleting `tests/components/DiatonicHarmonizer.test.ts`
5. Removing `'diatonic-harmonizer'` from the `ViewName` union in `src/lib/types/chord.ts`
6. Removing `'diatonic-harmonizer'` from `VIEW_NAMES` in `src/lib/routing.ts`
7. Removing the `'diatonic-harmonizer'` route branch from `src/App.svelte`
8. Removing the `'diatonic-harmonizer'` entry from `src/lib/data/tools.ts`

No shared theory module (`chords.ts`, `notes.ts`), no existing component (`ChordFretboard.svelte`, `RootSelector.svelte`), and no existing test is modified destructively. Reverting restores the prior tool set exactly.

---

## REMOVED Requirements

None. This spec is purely additive.

## RENAMED Requirements

None.

## New Files

| File | Type | Description |
|------|------|-------------|
| `src/lib/theory/diatonics.ts` | New | `MAJOR_SCALE_INTERVALS` + `DiatonicTriad` + `diatonicTriads(rootName)` |
| `src/lib/components/DiatonicHarmonizer.svelte` | New | Stateful tool wrapper: root `$state`, `RootSelector`, 7 chord cards with `<ChordFretboard>` |
| `tests/unit/theory/diatonics.test.ts` | New | Unit tests for theory module — ALL 12 roots, quality pattern, Roman labels, notes, rootPc |
| `tests/components/DiatonicHarmonizer.test.ts` | New | Component tests — renders, reactivity, back navigation, no audio |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/types/chord.ts` | Add `'diatonic-harmonizer'` to `ViewName` union |
| `src/lib/routing.ts` | Add `'diatonic-harmonizer'` to `VIEW_NAMES` array |
| `src/App.svelte` | Add route branch rendering `<DiatonicHarmonizer>` in `<svelte:boundary>` |
| `src/lib/data/tools.ts` | Add `active` entry in **Fretboard & Theory** category (icon: `'🔑'`) |
