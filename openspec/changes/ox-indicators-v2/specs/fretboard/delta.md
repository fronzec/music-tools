# Delta for Fretboard

## MODIFIED Requirements

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "×" for muted strings. The system MUST use the shape's designated color for visual consistency. The system MUST NOT skip indicator rendering for barre positions.

The system MUST use a unified opacity value `INDICATOR_OPACITY` (0.6) for both open and muted indicators.

For `baseFret === 0`, indicators MUST be centered on the nut line at `x = fretLineX(0) + 8`.

For `baseFret > 0`, indicators MUST be positioned in the same fret column as the barre at `x = fretLineX(1) - 22` (via `indicatorX(baseFret, baseFret)` branch).

(Previously: opacity was hardcoded to 0.85 for open and 0.4 for muted; both open and barre positions placed indicators at the right edge of the first visible fret column via `indicatorX(baseFret, minFret) - 8` which evaluated to `fretLineX(1) - 20`)

#### Scenario: Open string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 1 has `fret === 0`
- WHEN Fretboard renders
- THEN an "O" appears centered on the nut line for string 1
- AND the "O" is rendered in C shape color (`#2563EB`)
- AND the "O" is positioned at `x = fretLineX(0) + 8`
- AND the "O" uses opacity `INDICATOR_OPACITY` (0.6)

#### Scenario: Muted string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 6 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears centered on the nut line for string 6
- AND the "×" is rendered in C shape color (`#2563EB`)
- AND the "×" is positioned at `x = fretLineX(0) + 8`
- AND the "×" uses opacity `INDICATOR_OPACITY` (0.6)

#### Scenario: Muted string in barre position

- GIVEN a G shape chord with `baseFret === 3`
- AND string 5 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears in the same fret column as the barre for string 5
- AND the "×" is rendered in G shape color (`#16A34A`)
- AND the "×" is positioned at `x = fretLineX(1) - 22` (via `indicatorX(3, 3)` barre branch)
- AND the "×" uses opacity `INDICATOR_OPACITY` (0.6)

#### Scenario: Open string in barre position (barred string)

- GIVEN a G shape chord with `baseFret === 3`
- AND string 0 has `fret === 0` (barred)
- WHEN Fretboard renders
- THEN the string is rendered as part of the barre rectangle
- AND no "O" indicator is rendered for that string (barre takes precedence)

#### Scenario: All strings fretted — no indicators

- GIVEN a shape where all six strings have `fret > 0` (or `fret === 0` in a barre)
- WHEN Fretboard renders
- THEN no O/× indicators are rendered

#### Scenario: Barre position — open/muted indicators appear

- GIVEN a shape with `baseFret > 0` and at least one open or muted string
- WHEN Fretboard renders
- THEN O/× indicators appear in the barre fret column
- AND the base fret label remains visible above the barre

#### Scenario: Unified opacity between note and barre opacity

- GIVEN `INDICATOR_OPACITY` is 0.6, `NOTE_OPACITY` is 0.75, `BARRE_OPACITY` is 0.35
- WHEN the indicator renders
- THEN the indicator opacity (0.6) sits between note opacity and barre opacity
- AND creates a visual hierarchy: barre (0.35) < indicator (0.6) < note (0.75)

## ADDED Requirements

### Requirement: `indicatorX()` Three-Branch Formula

The system MUST compute indicator positions via a context-aware `indicatorX(baseFret, minFret)` function with three disjoint branches:

| Branch | Condition | Caller | Formula |
|--------|-----------|--------|---------|
| Nut | `baseFret === 0` | Both | `fretLineX(0) + 8` |
| Barre (shifted) | `minFret === baseFret` | Fretboard | `fretLineX(1) - 22` |
| Absolute | default | FullFretboard | `fretLineX(baseFret) + 20` |

#### Scenario: Nut branch at open position

- GIVEN `baseFret === 0` and `minFret === 0`
- WHEN `indicatorX(0, 0)` is called
- THEN the result is `fretLineX(0) + 8`

#### Scenario: Barre branch for single-shape fretboard

- GIVEN `baseFret === 3` and `minFret === 3`
- WHEN `indicatorX(3, 3)` is called
- THEN the result is `fretLineX(1) - 22`

#### Scenario: Absolute branch for full fretboard

- GIVEN `baseFret === 3` and `minFret === 0`
- WHEN `indicatorX(3, 0)` is called
- THEN the result is `fretLineX(3) + 20`

### Requirement: `INDICATOR_OPACITY` Constant

The system MUST define `INDICATOR_OPACITY: 0.6` in the `FL` constants in `src/lib/theory/layout.ts`.

#### Scenario: Constant exported and used

- GIVEN `FL.INDICATOR_OPACITY` is defined
- WHEN both `Fretboard.svelte` and `FullFretboard.svelte` render indicators
- THEN both components use `FL.INDICATOR_OPACITY` instead of hardcoded values
