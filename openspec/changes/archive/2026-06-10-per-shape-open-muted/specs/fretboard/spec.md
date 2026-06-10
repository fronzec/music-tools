# Delta for Fretboard

## MODIFIED Requirements

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "×" for muted strings at the appropriate position based on `baseFret`: for `baseFret === 0`, indicators MUST appear at the nut position (`x = LEFT_PAD + NUT_W / 2`); for `baseFret > 0`, indicators MUST appear to the left of the barre fret line (`x = fretLineX(0) - FRET_SP / 2 - 8`, since the barre is at displayed fret 0 in the single-shape view). The system MUST use the shape's designated color for visual consistency. The system MUST NOT skip indicator rendering for barre positions.

(Previously: indicators only rendered at the nut position and were skipped entirely for barre positions (`baseFret > 0`).)

#### Scenario: Open string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 1 has `fret === 0`
- WHEN Fretboard renders
- THEN an "O" appears at the nut for string 1
- AND the "O" is rendered in C shape color (`#2563EB`)
- AND the "O" is positioned at `x = LEFT_PAD + NUT_W / 2`

#### Scenario: Muted string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 6 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears at the nut for string 6
- AND the "×" is rendered in C shape color (`#2563EB`)
- AND the "×" is positioned at `x = LEFT_PAD + NUT_W / 2`

#### Scenario: Muted string in barre position

- GIVEN a G shape chord with `baseFret === 3`
- AND string 5 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears left of the barre line for string 5
- AND the "×" is rendered in G shape color (`#16A34A`)
- AND the "×" is positioned at `x = fretLineX(0) - FRET_SP / 2 - 8`

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
- THEN O/× indicators appear at the left of the barre line
- AND the base fret label remains visible above the barre

## RENAMED Requirements

None.

## REMOVED Requirements

None.
