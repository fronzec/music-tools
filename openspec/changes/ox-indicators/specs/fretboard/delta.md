# Delta for Fretboard

## MODIFIED Requirements

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "×" for muted strings at the right edge of the fret space, just before the next fret line, for both `baseFret === 0` and `baseFret > 0`. The system MUST use the shape's designated color for visual consistency. The system MUST NOT skip indicator rendering for barre positions.

(Previously: indicators positioned at the nut for `baseFret === 0` and to the left of the barre fret line for `baseFret > 0`.)

#### Scenario: Open string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 1 has `fret === 0`
- WHEN Fretboard renders
- THEN an "O" appears at the right edge of fret space 0 for string 1
- AND the "O" is rendered in C shape color (`#2563EB`)
- AND the "O" is positioned at `x = fretLineX(1) - 12`

#### Scenario: Muted string in open position

- GIVEN a C shape chord with `baseFret === 0`
- AND string 6 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears at the right edge of fret space 0 for string 6
- AND the "×" is rendered in C shape color (`#2563EB`)
- AND the "×" is positioned at `x = fretLineX(1) - 12`

#### Scenario: Muted string in barre position

- GIVEN a G shape chord with `baseFret === 3`
- AND string 5 has `fret === null`
- WHEN Fretboard renders
- THEN a "×" appears at the right edge of the barre fret space for string 5
- AND the "×" is rendered in G shape color (`#16A34A`)
- AND the "×" is positioned at `x = fretLineX(1) - 12`

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
- THEN O/× indicators appear at the right edge of the barre fret space
- AND the base fret label remains visible above the barre
