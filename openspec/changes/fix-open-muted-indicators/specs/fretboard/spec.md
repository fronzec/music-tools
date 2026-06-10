# Fretboard — Delta Spec: Fix Open/Muted Indicators

## MODIFIED Requirements

### Requirement: Open and Muted String Indicators

The system MUST render "O" for open strings and "×" for muted strings at the nut position,
using the shape's designated color for visual consistency with FullFretboard.

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Open String** | MUST render "O" at the nut using the shape's color (from `SHAPE_COLORS` or a single-shape equivalent) | C shape → blue O | — |
| **Muted String** | MUST render "×" at the nut using the shape's color | C shape muted → blue × | Previously used `#9CA3AF` gray |
| **Visual Consistency** | O/× color MUST match the color used for notes and barre in the same shape | FullFretboard and Fretboard indicators share color scheme | — |

### Scenario: Open string in C shape uses shape color

- GIVEN a C shape chord (`baseFret === 0`)
- AND string 1 has `fret === 0`
- WHEN Fretboard renders
- THEN an "O" appears at the nut for string 1
- AND the "O" is rendered in C shape color (`#2563EB`)

### Scenario: Muted string in C shape uses shape color

- GIVEN a C shape chord (`baseFret === 0`)
- AND string 6 has `fret === null`
- WHEN Fretboard renders
- THEN an "×" appears at the nut for string 6
- AND the "×" is rendered in C shape color (`#2563EB`)

### Scenario: Barre position — no indicators

- GIVEN a shape with `baseFret > 0`
- WHEN Fretboard renders
- THEN no O/× indicators are rendered (nut area shows base fret label only)

### Scenario: All strings fretted — no indicators

- GIVEN a shape where all six strings have `fret > 0` or `fret === 0` (shown as fretted)
- WHEN Fretboard renders
- THEN no O/× indicators are rendered
