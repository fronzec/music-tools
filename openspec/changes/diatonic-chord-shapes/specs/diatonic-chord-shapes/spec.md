# Diatonic Chord Shapes Specification

## Purpose

Defines the voicing data contract, correctness invariants, compact shape-diagram rendering, shape geometry, and wiring into the Diatonic Harmonizer for all 84 open-position diatonic triad voicings (12 major keys × 7 degrees).

## Requirements

### Requirement: Voicing Data Contract

The `OpenVoicing` type MUST carry: `frets` (6-element tuple, low E index 0 → high e index 5; values are absolute fret numbers where `null` = muted, `0` = open string, `>0` = fretted); `fingers` (6-element tuple of `1|2|3|4|null`); optional `barre` (`{ fret, fromString, toString }`); `baseFret` (1 = open position / thick nut, >1 = shape window start); `roman`, `name`, `quality`, `rootPc`.

`OPEN_VOICINGS` MUST contain exactly 84 entries covering all 12 `NoteName` keys and all 7 scale degrees (1–7).

`getOpenVoicing(keyRoot, degree)` MUST return the matching `OpenVoicing`. It MUST throw a descriptive error if the entry is missing.

#### Scenario: Lookup returns correct voicing

- GIVEN `OPEN_VOICINGS` is populated
- WHEN `getOpenVoicing('C', 1)` is called
- THEN it returns an `OpenVoicing` with `rootPc === 0`, `baseFret === 1`, and `frets` indexed low E → high e

#### Scenario: Missing entry throws

- GIVEN a key/degree pair that is absent from `OPEN_VOICINGS`
- WHEN `getOpenVoicing` is called with that pair
- THEN it throws an error whose message names the missing key and degree

#### Scenario: Sharp-key voicing uses baseFret > 1

- GIVEN any sharp key (C#, F#, G#, D#, A#) and any degree
- WHEN `getOpenVoicing` is called
- THEN the returned voicing has `baseFret > 1` (a barre window shape)

---

### Requirement: Voicing Correctness Invariants

For every one of the 84 voicings the following MUST hold (enforced by the correctness test suite):

1. **Subset**: every played string's pitch class (`(STANDARD_TUNING[i] + frets[i]) % 12` for `frets[i] !== null`) MUST be a member of the diatonic triad's tone set as returned by `diatonicTriads(key)[degree-1]`.
2. **Root present**: the chord's `rootPc` MUST appear in the set of played pitch classes.
3. **Minimum strings**: at least 3 strings MUST be played (i.e., `frets[i] !== null`).
4. **Finger coverage**: every fretted string (`frets[i] > 0`) MUST have a non-null `fingers[i]` value (1–4).
5. **Barre coverage**: when `barre` is present, every string index in `[barre.fromString, barre.toString]` at `barre.fret` MUST either be covered by the barre or have an explicit higher finger.

#### Scenario: All 84 voicings pass the correctness suite

- GIVEN `OPEN_VOICINGS` is fully populated
- WHEN the correctness test iterates all 12 keys × 7 degrees
- THEN every voicing satisfies subset, root-present, ≥3 strings played, finger coverage, and barre coverage — all 84 pass

#### Scenario: Out-of-chord note is detected

- GIVEN a voicing with one string producing a pitch class not in the triad's tone set
- WHEN the correctness test checks that voicing
- THEN the test fails with a message naming the key, degree, string index, and offending pitch class

#### Scenario: Missing root is detected

- GIVEN a voicing where no played string has `pc === rootPc`
- WHEN the correctness test checks that voicing
- THEN the test fails naming the key and degree

#### Scenario: Diminished (vii°) partial voicing is valid

- GIVEN the vii° voicing for any key uses only 4 strings (2 muted)
- WHEN the correctness test runs
- THEN it passes (≥3 strings played is satisfied)

---

### Requirement: Compact Shape Diagram Rendering

`ChordShapeDiagram.svelte` MUST render an SVG showing 6 guitar strings and a compact fret window (approximately 5 frets).

- Played strings MUST show a filled dot whose class is determined by the string's interval role: root → `fill-note-root`; third → `fill-note-third`; fifth → `fill-note-tone`.
- Open strings MUST show an unfilled ring in the top gutter with `data-open` attribute.
- Muted strings MUST show a `×` symbol in the top gutter with `data-muted` attribute.
- When `barre` is present the component MUST render a horizontal bar spanning `[barre.fromString, barre.toString]` at the barre fret row.
- A note-name column MUST appear to the right of the fretboard; each cell MUST be colored by the string's interval role using the same token classes.
- When `baseFret === 1` the top edge MUST render as a thick nut.
- When `baseFret > 1` the top edge MUST render as a thin line and a fret-number label (e.g. `"5fr"`) MUST appear in the left gutter; the component MUST expose `data-base-fret` with the numeric value.
- Color values MUST be expressed exclusively via Tailwind token classes. Inline `#rrggbb`, `rgb(...)`, or `hsl(...)` values are PROHIBITED.
- The component MUST expose the following `data-*` attributes for testing: `data-role` (per dot), `data-string` (string index 0–5 per slot), `data-open`, `data-muted`, `data-barre`, `data-base-fret`.

#### Scenario: Root dot uses fill-note-root

- GIVEN a voicing for C major (degree I, rootPc=0) with string 5 (high e) playing C
- WHEN `ChordShapeDiagram` renders
- THEN the dot on string 5 has class `fill-note-root` and `data-role="root"`

#### Scenario: Open string renders ring with data-open

- GIVEN a voicing where string 1 (B string) has `frets[1] === 0`
- WHEN the component renders
- THEN a ring element is present in the gutter with `data-open` and `data-string="1"`

#### Scenario: Muted string renders × with data-muted

- GIVEN a voicing where string 0 (low E) has `frets[0] === null`
- WHEN the component renders
- THEN a `×` symbol is present in the gutter with `data-muted` and `data-string="0"`

#### Scenario: Barre bar is rendered

- GIVEN a voicing with `barre: { fret: 2, fromString: 1, toString: 5 }`
- WHEN the component renders
- THEN a horizontal bar element is present with `data-barre` spanning strings 1 through 5 at fret 2

#### Scenario: Thick nut when baseFret === 1

- GIVEN a voicing with `baseFret === 1`
- WHEN the component renders
- THEN the top edge element has a visual weight indicating a nut (e.g. stroke-width ≥ 3) and `data-base-fret="1"`

#### Scenario: Fret label when baseFret > 1

- GIVEN a voicing with `baseFret === 5`
- WHEN the component renders
- THEN a text element reading `"5fr"` is present in the left gutter and `data-base-fret="5"`

#### Scenario: No inline color values

- GIVEN any voicing
- WHEN the rendered SVG markup is inspected
- THEN no `fill="#..."`, `fill="rgb(..."`, or `fill="hsl(..."` attribute values are present

---

### Requirement: Shape Geometry Module

`shapeLayout.ts` MUST export pure functions that compute SVG coordinates for a compact ~5-fret window given a `baseFret` offset.

Required exports: `slStringY(stringIndex)`, `slFretLineX(fretIndex)`, `slNoteX(absFret, baseFret)`, `slViewBoxW()`, `slViewBoxH()`.

These functions MUST be independent of `layout.ts` and MUST NOT import from it.

#### Scenario: slNoteX maps absolute fret to window-relative X

- GIVEN `baseFret = 3` and `absFret = 4`
- WHEN `slNoteX(4, 3)` is called
- THEN it returns the X coordinate for the second visible fret column (relative window fret 1)

#### Scenario: Open strings are handled

- GIVEN `absFret = 0` (open string)
- WHEN `slNoteX(0, baseFret)` is called for any `baseFret`
- THEN it returns a sentinel value or the gutter X coordinate (defined by the module) indicating the string is played open, not in the fret grid

---

### Requirement: DiatonicHarmonizer Wiring

`DiatonicHarmonizer.svelte` MUST render exactly one `ChordShapeDiagram` per diatonic triad card in the chord grid, using the voicing from `getOpenVoicing(selectedKey, degree)`.

The component MUST react to changes in the selected key: when the user changes the key, all 7 diagrams MUST update to show voicings for the new key.

No new reactive state MUST be introduced; `selectedKey` already in scope is sufficient.

`ChordFretboard.svelte`, `ChordBuilder.svelte`, and `layout.ts` MUST remain unmodified; their existing tests MUST continue to pass.

#### Scenario: All 7 diagrams render on mount

- GIVEN `DiatonicHarmonizer` is mounted with `selectedKey = "C"`
- WHEN the component renders
- THEN exactly 7 `ChordShapeDiagram` instances are present, one per degree (I–VII)

#### Scenario: Key change updates all diagrams

- GIVEN `DiatonicHarmonizer` is displaying diagrams for key C
- WHEN the user changes the selected key to G
- THEN all 7 `ChordShapeDiagram` instances re-render with voicings sourced from `getOpenVoicing("G", degree)` for degrees 1–7

#### Scenario: ChordFretboard and ChordBuilder tests still pass

- GIVEN this change has been applied
- WHEN the full test suite runs
- THEN tests for `ChordFretboard.svelte`, `ChordBuilder.svelte`, and `layout.ts` produce no new failures
