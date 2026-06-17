# Chord Fretboard Mirror Specification

## Purpose

Define the delta requirements for Phase 2 of Chord Builder: a full-neck fretboard mirror that lights every chord-tone position across the guitar neck, reacting live to the root + quality state already owned by `ChordBuilder.svelte`. This spec covers the new pure theory helper (`chordFretboard.ts`), the new presentational component (`ChordFretboard.svelte`), and the additive wiring change to `ChordBuilder.svelte`.

This spec is a DELTA — it does not re-specify anything already covered in the Phase 1 chord-builder spec (`openspec/changes/archive/2026-06-16-chord-builder/spec.md`). All Phase 1 requirements remain in force unchanged.

---

## Section 1 — Chord Fretboard Theory Helper (`src/lib/theory/chordFretboard.ts`)

### Requirement: ChordFretboardPosition Interface

The module MUST export an interface `ChordFretboardPosition` with exactly the following shape:

```
interface ChordFretboardPosition {
  stringIndex: number;  // 0..5, tablature order (low E = 0, high E = 5)
  fret:        number;  // 0..14 inclusive (open string through MAX_FRET)
  pitchClass:  number;  // 0..11, the sounding pitch class at this position
  offset:      number;  // the matched chord offset (e.g. 0, 3, 4, 6, 7, 8)
  role:        'root' | 'tone';
}
```

The `role` field MUST be `'root'` when `offset === 0`, and `'tone'` for every other matched offset.

#### Scenario: Interface shape

- GIVEN `ChordFretboardPosition` is imported
- WHEN a value of that type is inspected
- THEN it has exactly the fields `stringIndex`, `fret`, `pitchClass`, `offset`, `role`
- AND `role` is the literal union `'root' | 'tone'`

### Requirement: chordPositions — Pure Neck Position Calculator

The module MUST export a pure function `chordPositions(rootPc: number, offsets: readonly number[]): ChordFretboardPosition[]`.

Behavior:

- Normalizes `rootPc` to `((rootPc % 12) + 12) % 12` before use.
- Iterates all 6 strings (`stringIndex` 0..5) using `STANDARD_TUNING` from `src/lib/types/chord`.
- Within each string, iterates all frets from `0` to `MAX_FRET` (14) inclusive, matching the range used by `IntervalFretboard.svelte`.
- For each `(stringIndex, fret)` cell, computes `pitchClass = (STANDARD_TUNING[stringIndex] + fret) % 12`.
- If `pitchClass` matches `(normalizedRoot + offset) % 12` for any `offset` in `offsets`, the function pushes a `ChordFretboardPosition` with `role: 'root'` when `offset === 0`, else `role: 'tone'`.
- If a pitch class matches multiple offsets (only possible if the offsets array has duplicate values), the first matching offset in the array wins.
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
- THEN every position where `pitchClass === 0` has `role === 'root'` and `offset === 0`
- AND every position where `pitchClass !== 0` has `role === 'tone'`

#### Scenario: C major — correct pitch class coverage per string

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(0, [0, 4, 7])` is called
- THEN on string 0 (low E, open note 4 = E), the open fret (fret 0) appears with `pitchClass === 4` and `role === 'tone'` and `offset === 4`
- AND on string 0, fret 3 appears with `pitchClass === 7` (G), `role === 'tone'`, `offset === 7`
- AND on string 0, fret 8 appears with `pitchClass === 0` (C), `role === 'root'`, `offset === 0`

#### Scenario: Tone appears on multiple strings

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(0, [0, 4, 7])` is called
- THEN the result contains positions with `pitchClass === 4` (E) on MORE THAN ONE distinct `stringIndex`

#### Scenario: G major — non-zero root normalizes correctly

- GIVEN `rootPc` is `7` (G) and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(7, [0, 4, 7])` is called
- THEN every `pitchClass` in the result is a member of `{7, 11, 2}` (G, B, D)
- AND positions with `pitchClass === 7` have `role === 'root'`
- AND positions with `pitchClass !== 7` have `role === 'tone'`

#### Scenario: C minor — offsets [0, 3, 7]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 7]`
- WHEN `chordPositions(0, [0, 3, 7])` is called
- THEN every `pitchClass` in the result is a member of `{0, 3, 7}` (C, D#, G)
- AND every position has `role === 'root'` iff `pitchClass === 0`

#### Scenario: C diminished — offsets [0, 3, 6]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 3, 6]`
- WHEN `chordPositions(0, [0, 3, 6])` is called
- THEN every `pitchClass` in the result is a member of `{0, 3, 6}` (C, D#, F#)
- AND root positions have `pitchClass === 0`

#### Scenario: C augmented — offsets [0, 4, 8]

- GIVEN `rootPc` is `0` and `offsets` is `[0, 4, 8]`
- WHEN `chordPositions(0, [0, 4, 8])` is called
- THEN every `pitchClass` in the result is a member of `{0, 4, 8}` (C, E, G#)
- AND root positions have `pitchClass === 0`

#### Scenario: All 12 roots × all 4 qualities produce non-empty arrays

- GIVEN any `rootPc` from 0 to 11 and any `quality` in `TriadQuality`
- WHEN `chordPositions(rootPc, TRIAD_OFFSETS[quality])` is called
- THEN the result is a non-empty array
- AND every element satisfies `stringIndex` in 0..5, `fret` in 0..14

#### Scenario: All 12 roots × all 4 qualities — no position outside fret range

- GIVEN any `rootPc` from 0 to 11 and any `quality` in `TriadQuality`
- WHEN `chordPositions(rootPc, TRIAD_OFFSETS[quality])` is called
- THEN no position has `fret < 0` or `fret > 14`
- AND no position has `stringIndex < 0` or `stringIndex > 5`

#### Scenario: All 12 roots × all 4 qualities — each position's pitch class is consistent

- GIVEN any `rootPc` from 0 to 11 and any quality
- WHEN `chordPositions(rootPc, TRIAD_OFFSETS[quality])` is called
- THEN for every returned position, `position.pitchClass === (STANDARD_TUNING[position.stringIndex] + position.fret) % 12`
- AND `position.pitchClass === (rootPc + offset) % 12` for the position's matched offset

#### Scenario: Root pitch class at fret 0 on the B string (string index 4, open = B = pitchClass 11)

- GIVEN `rootPc` is `11` (B) and `offsets` is `[0, 4, 7]`
- WHEN `chordPositions(11, [0, 4, 7])` is called
- THEN the position `{ stringIndex: 4, fret: 0 }` is present with `pitchClass === 11`, `role === 'root'`, `offset === 0`

#### Scenario: Negative or out-of-range rootPc normalizes correctly

- GIVEN `rootPc` is `-1` (equivalent to 11, B)
- WHEN `chordPositions(-1, [0, 4, 7])` is called
- THEN the result equals `chordPositions(11, [0, 4, 7])` (same positions)

#### Scenario: rootPc is 12 (wraps to 0, C)

- GIVEN `rootPc` is `12`
- WHEN `chordPositions(12, [0, 4, 7])` is called
- THEN the result equals `chordPositions(0, [0, 4, 7])`

### Requirement: Unit Tests Written Before UI (Strict TDD)

Unit tests for `chordPositions` and `ChordFretboardPosition` MUST be written and passing BEFORE `ChordFretboard.svelte` is implemented.

Test file location: `tests/unit/theory/chordFretboard.test.ts`.

Tests MUST cover:
- C major (rootPc=0, offsets=[0,4,7]): total count > 3, pitchClass set, root/tone split
- G major (rootPc=7): pitch class set verification
- C minor, C diminished, C augmented: pitchClass set verification each
- All 12 roots × all 4 qualities: non-empty results, fret/string bounds, offset-on-position correctness
- Edge: `rootPc = -1` normalizes to 11
- Edge: `rootPc = 12` normalizes to 0
- Edge: open string position (fret 0) captured for a matching string

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
| `degrees` | `readonly DegreeLabel[]` | yes | Degree labels aligned to `offsets`, e.g. from `TRIAD_DEGREES` |
| `rootName` | `string` | no | Optional display label for ARIA (e.g. `'C'`) |
| `width` | `number` | no | Optional SVG width override |

All derived values (position marks, labels, layout geometry) MUST be computed via `$derived` inside the component. The component MUST own no mutable `$state`.

#### Scenario: Props drive all display state

- GIVEN the component is mounted with `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN `rootPc` is updated to `7` by the parent
- THEN the rendered dot positions update to reflect G major without any internal mutation

### Requirement: Full Neck Rendering

The component MUST render a full guitar neck covering frets 0 through 14 (`FL.MAX_FRET_SPAN` = 14), using the same layout helpers as `IntervalFretboard.svelte`:

- `L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`, `FRET_MARKERS` from `src/lib/theory/layout.ts`
- Neck background, fret lines, string lines, fret-marker dots, nut line, fret numbers

The scaffold MUST be structurally identical to `IntervalFretboard.svelte`'s neck scaffold.

#### Scenario: Neck scaffold renders

- GIVEN the component is mounted with any valid props
- WHEN the SVG is inspected
- THEN a `role="img"` SVG element is present
- AND 6 string lines are rendered
- AND 15 fret lines are rendered (frets 0..14)
- AND fret-marker positions 3, 5, 7, 9, 12 are rendered as dots
- AND fret numbers 1..14 appear below the bottom string

### Requirement: Chord Tone Dots — Role-Based Token Classes

The component MUST render exactly one SVG `<circle>` per `ChordFretboardPosition` returned by `chordPositions(rootPc, offsets)`.

- Positions with `role === 'root'` MUST use the class `fill-note-root` (matching the Chord Builder ruler's root color).
- Positions with `role === 'tone'` MUST use the class `fill-note-tone`.
- No hardcoded hex, rgb(), hsl(), or SVG presentation attribute `fill="..."` / `stroke="..."` color values are permitted on chord-tone dots.
- Dot sizes MUST use `L.ROOT_R` for root positions and `L.TONE_R` for tone positions (reusing layout constants).

NOTE: This diverges intentionally from `IntervalFretboard.svelte` which uses `fill-accent` for root and `fill-note-root` for target. The chord mirror uses `fill-note-root` / `fill-note-tone` to match the Chord Builder ruler's existing role colors, not the Interval Trainer's accent color.

#### Scenario: Root dots carry fill-note-root

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `[data-role="root"]` elements are queried
- THEN every element has the class `fill-note-root`
- AND none has the class `fill-accent`

#### Scenario: Tone dots carry fill-note-tone

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `[data-role="tone"]` elements are queried
- THEN every element has the class `fill-note-tone`

#### Scenario: No hardcoded colors in rendered SVG

- GIVEN the component's source and rendered SVG are inspected
- WHEN color declarations are reviewed
- THEN no `#rrggbb`, `rgb(...)`, `hsl(...)`, or `fill="..."` / `stroke="..."` presentation attribute color values are present on chord-tone elements
- AND all colors reference the design token system via Tailwind utility classes

### Requirement: data-role Attribute on Every Dot

Every chord-tone `<circle>` MUST carry a `data-role` attribute with value `'root'` or `'tone'`, matching the position's `role` field. This attribute enables component-level tests to count and classify rendered dots without inspecting classes.

#### Scenario: data-role="root" count matches chordPositions output

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `container.querySelectorAll('[data-role="root"]')` is called
- THEN the count equals `chordPositions(0, [0, 4, 7]).filter(p => p.role === 'root').length`

#### Scenario: data-role="tone" count matches chordPositions output

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN `container.querySelectorAll('[data-role="tone"]')` is called
- THEN the count equals `chordPositions(0, [0, 4, 7]).filter(p => p.role === 'tone').length`

#### Scenario: Total dot count equals total position count

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`
- WHEN all `[data-role]` elements are queried
- THEN the total count equals `chordPositions(0, [0, 4, 7]).length`

### Requirement: Degree Labels on Every Dot

Each chord-tone `<circle>` MUST be accompanied by a centered `<text>` element displaying the degree label sourced from the `degrees` prop, resolved by `offset` (not by render order).

- The degree label for a position with `offset === 0` is `degrees[offsets.indexOf(0)]` — typically `'1'`.
- The degree label for a position with offset `o` is `degrees[offsets.indexOf(o)]`.
- Labels MUST use `text-anchor="middle"` for centering.
- No label is absent — every dot has exactly one label.
- The labels for C major MUST be `'1'`, `'3'`, `'5'` aligned with offsets `[0, 4, 7]` respectively.
- The labels for C minor MUST be `'1'`, `'♭3'`, `'5'` aligned with offsets `[0, 3, 7]` respectively.
- The labels for C diminished MUST be `'1'`, `'♭3'`, `'♭5'` aligned with offsets `[0, 3, 6]` respectively.
- The labels for C augmented MUST be `'1'`, `'3'`, `'♯5'` aligned with offsets `[0, 4, 8]` respectively.

#### Scenario: C major degree labels present

- GIVEN `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN all `<text>` children of chord-tone dot groups are inspected
- THEN the text content set across all dots is exactly `{'1', '3', '5'}` (each appearing multiple times, once per neck position)

#### Scenario: Degree label aligned to correct offset (not render order)

- GIVEN `rootPc=0`, `offsets=[0,3,7]` (minor), `degrees=['1','♭3','5']`
- WHEN a dot with `pitchClass === 3` is inspected
- THEN its associated `<text>` content is `'♭3'`

#### Scenario: Augmented labels include ♯5

- GIVEN `rootPc=0`, `offsets=[0,4,8]`, `degrees=['1','3','♯5']`
- WHEN dots with `pitchClass === 8` are inspected
- THEN their `<text>` content is `'♯5'`

### Requirement: Accessibility

The component MUST render:

- An SVG `role="img"` attribute.
- An `aria-label` describing the chord and instrument context, including the root name when `rootName` is provided (e.g. `"C major chord — positions across the neck"`).
- A `<title>` element inside the SVG.

#### Scenario: aria-label is non-empty

- GIVEN the component is mounted with any valid props
- WHEN the `role="img"` element's `aria-label` is inspected
- THEN it is a non-empty string

#### Scenario: aria-label contains rootName when provided

- GIVEN `rootName="C"` is passed
- WHEN the `role="img"` element's `aria-label` is inspected
- THEN the label contains the string `'C'`

### Requirement: Reactivity to Prop Changes

The component MUST re-derive all marks and re-render correctly whenever `rootPc` or `offsets` change.

#### Scenario: Re-renders when rootPc changes

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN `rerender` is called with `rootPc=7`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- THEN the `[data-role="root"]` count equals `chordPositions(7, [0,4,7]).filter(p => p.role === 'root').length`

#### Scenario: Re-renders when offsets change (quality change)

- GIVEN the component is rendered with `rootPc=0`, `offsets=[0,4,7]`, `degrees=['1','3','5']`
- WHEN `rerender` is called with `rootPc=0`, `offsets=[0,3,7]`, `degrees=['1','♭3','5']`
- THEN the `[data-role="tone"]` count equals `chordPositions(0, [0,3,7]).filter(p => p.role === 'tone').length`

### Requirement: Svelte 5 Runes

The component MUST use Svelte 5 runes exclusively:

- Props via `$props()`
- Derived values via `$derived` or `$derived.by`
- No mutable `$state`
- No `on:*` event directive syntax (not applicable to this presentational component)
- No `createEventDispatcher`
- No `<slot>` — use `{#snippet}` / `{@render}` if composable content is needed

### Requirement: Component Tests

Component tests MUST follow the `IntervalFretboard.test.ts` pattern:

- Use `@testing-library/svelte` `render` and `rerender`.
- Assert `data-role` counts against `chordPositions` output (ground truth).
- Assert token classes (`fill-note-root`, `fill-note-tone`) on each role.
- Assert `role="img"` SVG is present.
- Assert `aria-label` is non-empty.
- Include a reactivity test (re-render on prop change).

Test file location: `tests/components/ChordFretboard.test.ts`.

---

## Section 3 — ChordBuilder Wiring Delta (`src/lib/components/ChordBuilder.svelte`)

### Requirement: ChordFretboard Rendered Below Ruler/Info Card

`ChordBuilder.svelte` MUST render `<ChordFretboard>` below the chromatic ruler / info card area. The element MUST receive:

- `rootPc`: derived from the existing root state (`CHROMATIC.indexOf(root)` or equivalent)
- `offsets`: `triad.offsets` from the existing `$derived` triad value
- `degrees`: `triad.degrees` from the existing `$derived` triad value
- `rootName`: `triad.root` (the note name string, e.g. `'C'`)

No new `$state` is introduced. All inputs to `<ChordFretboard>` are already available from the existing derived `triad` object returned by `getTriad`.

#### Scenario: ChordFretboard present in rendered output

- GIVEN the user navigates to Chord Builder
- WHEN the view renders with root `'C'` and quality `'maj'`
- THEN the DOM contains `[data-role="root"]` elements (from the fretboard) in addition to the ruler
- AND `[data-role="root"]` count matches `chordPositions(0, [0,4,7]).filter(p => p.role === 'root').length`

#### Scenario: Fretboard updates when root changes

- GIVEN the Chord Builder is rendered with root `'C'` and quality `'maj'`
- WHEN the user selects `'G'` via RootSelector
- THEN the fretboard's root dots update to reflect G major positions (pitchClass 7)
- AND no new state owner is introduced

#### Scenario: Fretboard updates when quality changes

- GIVEN the Chord Builder is rendered with root `'C'` and quality `'maj'`
- WHEN the user selects quality `'min'`
- THEN the fretboard's tone dots update to reflect C minor positions
- AND the degree labels update to `'1'`, `'♭3'`, `'5'`

#### Scenario: No new $state in ChordBuilder

- GIVEN the source of `ChordBuilder.svelte` is inspected
- WHEN `$state` declarations are counted
- THEN the count is identical to the pre-change Phase 1 version (no new `$state` added)

### Requirement: No New State Owner

`ChordBuilder.svelte` remains the single state owner for `root` and `quality`. `ChordFretboard.svelte` is purely presentational — it receives data as props and renders; it never holds or mutates `root` or `quality`.

---

## Section 4 — Quality and Constraint Invariants

### Requirement: Token-Only Colors (SVG Token Rule)

All SVG color declarations in `ChordFretboard.svelte` MUST use Tailwind utility classes (`fill-*`, `stroke-*`). No SVG presentation attributes with inline colors (`fill="..."`, `stroke="..."`) are permitted on chord-tone elements. This is because CSS variables do not resolve inside SVG presentation attributes in all browser contexts.

This applies to: chord-tone `<circle>` fills, text fills on degree labels, and any stroke on chord-tone elements.

The nut line, string lines, and fret lines MAY use `class="stroke-*"` tokens (as in `IntervalFretboard.svelte`).

#### Scenario: No fill= attribute on chord-tone circles

- GIVEN the source of `ChordFretboard.svelte` is inspected
- WHEN all `<circle>` elements for chord tones are reviewed
- THEN none has an inline `fill="..."` attribute
- AND all use Tailwind `fill-*` classes

### Requirement: Out-of-Scope Items Absent

The following MUST NOT be introduced in this change:

- 7th chords, 9th chords, or any quality with more than 3 offsets in the fretboard
- Voicing / fingering selection (single chord shape from the full position set)
- Drag mode or any interactive repositioning of dots
- Enharmonic spelling on the neck (D# vs E♭)

#### Scenario: No 7th chord support

- GIVEN `ChordFretboard.svelte` is inspected
- WHEN the props API is reviewed
- THEN it accepts generic `offsets` (any array) but the `ChordBuilder.svelte` wiring passes only triad offsets (length 3)
- AND no 7th-chord offset tables are imported or exposed

### Requirement: Existing Suite Stays Green

After all changes are applied:

- `vitest run` MUST pass all pre-existing tests (currently 910 passing).
- `svelte-check` MUST report no new errors.
- No existing test file is modified to accommodate the new code.

#### Scenario: Full suite passes after implementation

- GIVEN all changes in Sections 1–3 are applied
- WHEN `vitest run` executes
- THEN all tests (910 pre-existing + new chordFretboard unit + new ChordFretboard component tests) pass
- AND `svelte-check` reports no new errors

### Requirement: Additive Only — Full Rollback Possible

The change is purely additive. Reverting consists of:

1. Deleting `src/lib/theory/chordFretboard.ts`
2. Deleting `src/lib/components/ChordFretboard.svelte`
3. Deleting `tests/unit/theory/chordFretboard.test.ts` and `tests/components/ChordFretboard.test.ts`
4. Removing the single `<ChordFretboard ... />` element from `ChordBuilder.svelte`

No shared module is mutated. No state owner changes. No routing or registry is touched.

---

## REMOVED Requirements

None. This spec is additive — it does not remove any Phase 1 requirement.

## RENAMED Requirements

None.

## Reference: Token Color Assignments

| Element | Tailwind class | Rationale |
|---------|---------------|-----------|
| Root dot | `fill-note-root` | Matches Chord Builder ruler's root marker (not IntervalFretboard's `fill-accent`) |
| Tone dot | `fill-note-tone` | Matches Chord Builder ruler's chord-tone markers |
| Degree label text | `fill="white"` via `fill` attribute OR white token class | Legible on colored dot — same as IntervalFretboard label pattern |
| Neck background | `fill-surface-raised` | Same as IntervalFretboard scaffold |
| String/fret lines | `stroke-hairline` | Same as IntervalFretboard scaffold |
| Nut | `stroke-muted` | Same as IntervalFretboard scaffold |

Note: degree label text using `fill="white"` as a literal attribute value is acceptable because white is not a design-token color — it is a rendering necessity for contrast. The prohibition on inline colors applies to role-significant colors (root, tone, accent). If a `fill-white` Tailwind class exists in the project's token set, it SHOULD be used instead.
