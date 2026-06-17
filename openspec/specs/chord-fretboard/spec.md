# Chord Fretboard Specification

## Purpose

Define the Chord Fretboard capability: a pure theory helper that maps chord tones to guitar neck positions, and a presentational component that renders a full-neck diagram showing every position of a triad's tones, with degree labels and role-based colors. This enables Chord Builder Phase 2 to visualize where chord tones live on the instrument, complementing the abstract chromatic ruler with a concrete neck mirror.

---

## Section 1 — Chord Fretboard Theory Helper (`src/lib/theory/chordFretboard.ts`)

### Requirement: ChordFretboardPosition Interface

The module MUST export an interface `ChordFretboardPosition` with exactly the following shape:

```
interface ChordFretboardPosition {
  stringIndex: number;  // 0..5, tablature order (low E = 0, high E = 5)
  fret:        number;  // 0..14 inclusive (open string through MAX_FRET)
  pitchClass:  number;  // 0..11, the sounding pitch class at this position
  degreeIndex: number;  // index into the offsets array that matched this cell
  role:        'root' | 'tone';
}
```

The `role` field MUST be `'root'` when `degreeIndex === 0`, and `'tone'` for every other matched index.

#### Scenario: Interface shape

- GIVEN `ChordFretboardPosition` is imported
- WHEN a value of that type is inspected
- THEN it has exactly the fields `stringIndex`, `fret`, `pitchClass`, `degreeIndex`, `role`
- AND `role` is the literal union `'root' | 'tone'`

### Requirement: chordPositions — Pure Neck Position Calculator

The module MUST export a pure function `chordPositions(rootPc: number, offsets: readonly number[]): ChordFretboardPosition[]`.

Behavior:

- Normalizes `rootPc` to `((rootPc % 12) + 12) % 12` before use.
- Iterates all 6 strings (`stringIndex` 0..5) using `STANDARD_TUNING` from `src/lib/theory/tuning`.
- Within each string, iterates all frets from `0` to `MAX_FRET` (14) inclusive.
- For each `(stringIndex, fret)` cell, computes `pitchClass = (STANDARD_TUNING[stringIndex] + fret) % 12`.
- If `pitchClass` matches `(normalizedRoot + offsets[degreeIndex]) % 12` for any `degreeIndex` in the offsets array, the function pushes a `ChordFretboardPosition` with `role: 'root'` when `degreeIndex === 0`, else `role: 'tone'`.
- If a pitch class matches multiple offsets, the first matching index wins (lowest index takes precedence).
- The function is pure: no DOM, no audio, no side effects.
- Uses bounded double `for`-loops (no `while`-loops).

#### Scenario: C major — positions exist across all 6 strings

- GIVEN `rootPc` is `0` (C) and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(0, [0, 4, 7])` is called
- THEN the result contains at least one position per string (all 6 strings represented)
- AND every `pitchClass` in the result is a member of `{0, 4, 7}` (C, E, G)
- AND the total count is greater than 3 (chord tones repeat across the neck)

#### Scenario: C major — root positions carry role 'root'

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(0, [0, 4, 7])` is called
- THEN every position where `pitchClass === 0` has `role === 'root'` and `degreeIndex === 0`
- AND every position where `pitchClass !== 0` has `role === 'tone'`

#### Scenario: C major — correct pitch class coverage per string

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(0, [0, 4, 7])` is called
- THEN the positions matching each offset are distributed across the neck
- AND each position's pitch class corresponds to its degreeIndex

#### Scenario: G major — non-zero root normalizes correctly

- GIVEN `rootPc` is `7` (G) and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(7, [0, 4, 7])` is called
- THEN every `pitchClass` in the result is a member of `{7, 11, 2}` (G, B, D)
- AND positions with `pitchClass === 7` have `role === 'root'`

#### Scenario: C minor — offsets [0, 3, 7]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 7]`
- WHEN `chordPositions(0, [0, 3, 7])` is called
- THEN every `pitchClass` in the result is a member of `{0, 3, 7}` (C, D#, G)

#### Scenario: C diminished — offsets [0, 3, 6]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 6]`
- WHEN `chordPositions(0, [0, 3, 6])` is called
- THEN every `pitchClass` in the result is a member of `{0, 3, 6}`

#### Scenario: C augmented — offsets [0, 4, 8]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 8]`
- WHEN `chordPositions(0, [0, 4, 8])` is called
- THEN every `pitchClass` in the result is a member of `{0, 4, 8}`

#### Scenario: All 12 roots × all 4 qualities produce non-empty arrays

- GIVEN any `rootPc` from 0 to 11 and any `quality` in `TriadQuality`
- WHEN `chordPositions(rootPc, TRIAD_OFFSETS[quality])` is called
- THEN the result is a non-empty array
- AND every element satisfies `stringIndex` in 0..5, `fret` in 0..14

#### Scenario: Negative or out-of-range rootPc normalizes correctly

- GIVEN `rootPc` is `-1` (equivalent to 11, B)
- WHEN `chordPositions(-1, [0, 4, 7])` is called
- THEN the result equals `chordPositions(11, [0, 4, 7])` (same positions)

### Requirement: Unit Tests Written Before UI (Strict TDD)

Unit tests for `chordPositions` and `ChordFretboardPosition` MUST be written and passing BEFORE the component is implemented.

Test file location: `tests/unit/theory/chordFretboard.test.ts`.

Tests MUST cover:
- All four qualities (major, minor, diminished, augmented) at multiple roots
- C major, G major, C minor, C diminished, C augmented pitch class verification
- All 12 roots × 4 qualities: non-empty results, bounds, degreeIndex correctness
- Edge cases: negative root normalization, rootPc=12, duplicate offset handling
- Determinism: identical inputs yield identical arrays

#### Scenario: Unit test suite passes before component exists

- GIVEN `tests/unit/theory/chordFretboard.test.ts` is written
- WHEN `vitest run tests/unit/theory/chordFretboard.test.ts` executes
- THEN all assertions pass
- AND `ChordFretboard.svelte` does NOT yet exist

---

## Section 2 — Chord Fretboard Component (`src/lib/components/ChordFretboard.svelte`)

### Requirement: Props API

`ChordFretboard.svelte` MUST be a stateless presentational component accepting the following `$props()`:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rootPc` | `number` | yes | Root pitch class (0..11) |
| `offsets` | `readonly number[]` | yes | Chord tone offsets, e.g. from `TRIAD_OFFSETS` |
| `degrees` | `readonly string[]` | yes | Degree labels aligned to `offsets`, e.g. from `TRIAD_DEGREES` |
| `rootName` | `string` | no | Optional display label for ARIA (e.g. `'C'`) |
| `chordName` | `string` | no | Optional display label for title (e.g. `'C major'`) |
| `width` | `number` | no | Optional SVG width override |

All derived values (position marks, labels, layout geometry) MUST be computed via `$derived` inside the component. The component MUST own no mutable `$state`.

#### Scenario: Props drive all display state

- GIVEN the component is mounted with `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN `rootPc` is updated to `7` by the parent
- THEN the rendered dot positions update to reflect G major without any internal mutation

### Requirement: Full Neck Rendering

The component MUST render a full guitar neck covering frets 0 through 14 using the same layout helpers as `IntervalFretboard.svelte`:

- `L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`, `FRET_MARKERS` from `src/lib/theory/layout.ts`
- Neck background, fret lines, string lines, fret-marker dots, nut line, fret numbers

#### Scenario: Neck scaffold renders

- GIVEN the component is mounted with any valid props
- WHEN the SVG is inspected
- THEN a `role="img"` SVG element is present
- AND 6 string lines are rendered
- AND frets 0..14 are represented

### Requirement: Chord Tone Dots — Role-Based Token Classes

The component MUST render exactly one SVG `<circle>` per `ChordFretboardPosition` returned by `chordPositions(rootPc, offsets)`.

- Positions with `role === 'root'` MUST use the class `fill-note-root` (matching the Chord Builder ruler's root color).
- Positions with `role === 'tone'` MUST use the class `fill-note-tone`.
- No hardcoded hex, rgb(), hsl(), or SVG presentation attribute `fill="..."` color values are permitted on chord-tone dots.
- Dot sizes MUST use `L.ROOT_R` for root positions and `L.TONE_R` for tone positions.

NOTE: This diverges intentionally from `IntervalFretboard.svelte` which uses `fill-accent` for root. The chord mirror uses `fill-note-root` / `fill-note-tone` to match the Chord Builder ruler's existing role colors.

#### Scenario: Root dots carry fill-note-root

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `[data-role="root"]` elements are queried
- THEN every element has the class `fill-note-root`

#### Scenario: Tone dots carry fill-note-tone

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `[data-role="tone"]` elements are queried
- THEN every element has the class `fill-note-tone`

### Requirement: data-role Attribute on Every Dot

Every chord-tone `<circle>` MUST carry a `data-role` attribute with value `'root'` or `'tone'`, matching the position's `role` field.

#### Scenario: data-role counts match theory output

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `container.querySelectorAll('[data-role="root"]')` is called
- THEN the count equals `chordPositions(0, [0, 4, 7]).filter(p => p.role === 'root').length`

### Requirement: Degree Labels on Every Dot

Each chord-tone `<circle>` MUST be accompanied by a centered `<text>` element displaying the degree label sourced from the `degrees` prop, resolved by `degreeIndex`.

- The degree label for a position with `degreeIndex === 0` is `degrees[0]` — typically `'1'`.
- Labels MUST use `text-anchor="middle"` for centering.
- The labels for C major MUST be `'1'`, `'3'`, `'5'` aligned with offsets `[0, 4, 7]` respectively.
- The labels for C minor MUST be `'1'`, `'♭3'`, `'5'` aligned with offsets `[0, 3, 7]` respectively.

#### Scenario: C major degree labels present

- GIVEN `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN all `<text>` children of chord-tone dot groups are inspected
- THEN the text content set includes `{'1', '3', '5'}`

#### Scenario: Degree label aligned to correct offset

- GIVEN `rootPc=0`, `offsets=[0,3,7]` (minor), `degrees=['1','♭3','5']`
- WHEN a dot with `degreeIndex===1` is inspected
- THEN its associated `<text>` content is `'♭3'`

### Requirement: Accessibility

The component MUST render:

- An SVG `role="img"` attribute.
- An `aria-label` describing the chord and instrument context.
- A `<title>` element inside the SVG.

#### Scenario: aria-label is non-empty

- GIVEN the component is mounted with any valid props
- WHEN the `role="img"` element's `aria-label` is inspected
- THEN it is a non-empty string

### Requirement: Reactivity to Prop Changes

The component MUST re-derive all marks and re-render correctly whenever `rootPc` or `offsets` change.

#### Scenario: Re-renders when rootPc changes

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN rerendered with `rootPc=7`, `offsets=[0,4,7]`
- THEN the `[data-role="root"]` count reflects G major positions

#### Scenario: Re-renders when offsets change (quality change)

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN rerendered with `rootPc=0`, `offsets=[0,3,7]`
- THEN the `[data-role="tone"]` count reflects C minor positions

### Requirement: Svelte 5 Runes

The component MUST use Svelte 5 runes exclusively:

- Props via `$props()`
- Derived values via `$derived` or `$derived.by`
- No mutable `$state`
- No `on:*` event directive syntax
- No `createEventDispatcher`
- No `<slot>`

### Requirement: Token-Only Colors

All SVG color declarations in `ChordFretboard.svelte` MUST use Tailwind utility classes (`fill-*`, `stroke-*`). No SVG presentation attributes with inline colors (`fill="..."`, `stroke="..."`) are permitted on chord-tone elements.

---

## Section 3 — Quality and Constraint Invariants

### Requirement: Out-of-Scope Items Absent

The following MUST NOT be introduced:

- 7th chords, 9th chords, or any quality with more than 3 tones in the fretboard
- Voicing / fingering selection (single chord shape from the full position set)
- Drag mode or any interactive repositioning of dots
- Enharmonic spelling on the neck (D# vs E♭)

### Requirement: Existing Suite Stays Green

After all changes are applied:

- Pre-existing tests MUST continue to pass.
- `svelte-check` MUST report no new errors.

#### Scenario: Full suite passes after implementation

- GIVEN all changes in Sections 1–2 are applied
- WHEN `npm test` and `svelte-check` execute
- THEN all tests pass and no new svelte-check errors appear

### Requirement: Additive Only — Full Rollback Possible

The change is purely additive. Reverting consists of:

1. Deleting `src/lib/theory/chordFretboard.ts`
2. Deleting `src/lib/components/ChordFretboard.svelte`
3. Deleting unit and component tests

No shared module is mutated.

---

## Reference: Design Decisions

### ADR-1 — degreeIndex Carries Offset Alignment

The `ChordFretboardPosition` carries `degreeIndex` (index into the offsets array) instead of the raw `offset` value. This allows the component to resolve degree labels via positional alignment (`degrees[degreeIndex]`) without duplicating the offset→label mapping already owned by the caller. It also makes the helper independent of label vocabulary and reusable by future Phase 2 features (7th chords, extensions).

### ADR-2 — Ruler Color Parity

The mirror uses `fill-note-root` (blue) and `fill-note-tone` (green) to match the Chord Builder ruler's role colors, NOT the IntervalFretboard's `fill-accent` (yellow). This deliberate divergence ensures the mirror is a faithful neck reflection of the abstract ruler.

### ADR-3 — Additive Wiring into ChordBuilder

The mirror is wired as a single presentational child, receiving only derived state from the existing `ChordBuilder.svelte` wrapper. No new state owner is introduced; the mirror is a pure consumer of `rootPc` and `triad` derived values.
