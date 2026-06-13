# Delta for Full Fretboard

## MODIFIED Requirements

### Requirement: Open/Muted Strings

The system MUST compute and render per-(baseFret, stringIndex) groups of O/× indicators across all visible shapes; MUST remove the `isOpenPosition` guard so ALL visible shapes display indicators regardless of `baseFret`.

Each group MUST be positioned using the context-aware `indicatorX(baseFret, minFret)` formula:
- For `baseFret === 0`: `fretLineX(0) + 8` (centered on nut line)
- For `baseFret > 0` and `minFret === 0`: `fretLineX(baseFret) + 20` (absolute branch, same fret column as barre)

Multiple shapes sharing the same `baseFret` and `stringIndex` MUST stack horizontally with `INDICATOR_SP` (14px) spacing.

Indicator groups MUST animate alongside their shape's notes on root change via CSS `transition: transform` matching `ANIM_DURATION` and `ANIM_EASING`.

The system MUST honor `prefers-reduced-motion: reduce` by disabling indicator transitions.

All indicators (both O and ×) MUST use the unified opacity value `INDICATOR_OPACITY` (0.6) instead of per-type hardcoded values.

(Previously: each group was positioned at `indicatorX(baseFret, minFret) - 8` which placed all indicators at the right edge of the first visible fret column; opacity was `indicator.type === 'muted' ? 0.4 : 0.85`)

#### Scenario: All shapes at open position — per-string indicators centered on nut line

- GIVEN all five CAGED shapes visible with `baseFret === 0`
- AND high E string is open (fret 0) in C, A, G, E and muted (fret null) in D
- WHEN FullFretboard renders
- THEN high E string shows a horizontal row centered on the nut line: [O C-color] [O A-color] [O G-color] [O E-color] [× D-color]
- AND indicators are spaced `INDICATOR_SP` (14px) apart, center-to-center
- AND each indicator uses its shape's `SHAPE_COLORS` fill
- AND each indicator uses opacity `INDICATOR_OPACITY` (0.6)
- AND each group is positioned at `x = fretLineX(0) + 8`

#### Scenario: Barre shape shows indicators in barre fret column

- GIVEN the G shape visible with `baseFret === 3` and `barreFirst = 0, barreLast = 2`
- AND string 5 (high E) is muted (`fret === null`)
- WHEN FullFretboard renders
- THEN a × indicator appears in the barre fret column (fret 3)
- AND the × is positioned at `x = indicatorX(3, 0)` which equals `fretLineX(3) + 20`
- AND the × uses G shape color
- AND the × uses opacity `INDICATOR_OPACITY` (0.6)

#### Scenario: Mixed open and barre positions

- GIVEN C shape at `baseFret=0` and A shape at `baseFret=5` both visible
- AND string 0 (low E) is open in C shape and muted in A shape
- WHEN FullFretboard renders
- THEN string 0 shows an O indicator centered on the nut line for C shape at `x = fretLineX(0) + 8`
- AND string 0 shows a × indicator in the barre fret column (fret 5) for A shape at `x = fretLineX(5) + 20`
- AND both indicators are in separate groups due to different `baseFret`

#### Scenario: Multiple shapes at same barre baseFret

- GIVEN C shape at `baseFret=3` and A shape at `baseFret=3` both visible
- AND string 1 is muted in both shapes
- WHEN FullFretboard renders
- THEN a single group at `baseFret=3, stringIndex=1` contains two × indicators stacked horizontally
- AND the first × is C-color, second × is A-color
- AND the group is positioned at `x = fretLineX(3) + 20`

#### Scenario: No visible shapes — no indicators

- GIVEN `visibleShapes` is empty
- WHEN FullFretboard renders
- THEN no O/× indicators are rendered

#### Scenario: All-fretted string across all shapes

- GIVEN all visible shapes have `fret > 0` on string 2
- WHEN FullFretboard renders
- THEN string 2 shows no indicator group

#### Scenario: Indicator group animates on root change

- GIVEN a C shape at `baseFret=3` with a muted string 5 indicator group
- WHEN root changes from C to A, moving the shape to `baseFret=5`
- THEN the indicator group translates to the new barre fret column at `x = fretLineX(5) + 20`
- AND the transition completes smoothly over `ANIM_DURATION` (0.3s) with `ANIM_EASING`

#### Scenario: prefers-reduced-motion disables indicator animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN indicator groups snap instantly to new positions (no CSS transition)

#### Scenario: Unified opacity across all indicator groups

- GIVEN `FL.INDICATOR_OPACITY` is 0.6
- WHEN FullFretboard renders any indicator group
- THEN every O and × in every group uses the same 0.6 opacity
- AND no indicator uses the old hardcoded values (0.4 or 0.85)

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
