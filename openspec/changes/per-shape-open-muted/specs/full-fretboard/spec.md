# Delta for Full Fretboard

## MODIFIED Requirements

### Requirement: Open/Muted Strings

The system MUST compute and render per-(baseFret, stringIndex) groups of O/× indicators across all visible shapes. The system MUST remove the `isOpenPosition` guard so that ALL visible shapes display their indicators regardless of `baseFret`. Each group MUST be positioned at its shape's base position: `baseFret=0` → near the nut area; `baseFret>0` → left of the barre fret line. Multiple shapes sharing the same `baseFret` and `stringIndex` MUST stack horizontally with `INDICATOR_SP` center-to-center spacing. Indicator groups MUST animate alongside their shape's notes on root change via CSS `transition: transform` matching `ANIM_DURATION` and `ANIM_EASING`. The system MUST honor `prefers-reduced-motion: reduce` by disabling indicator transitions. Indicator visual properties (O/× glyphs, `SHAPE_COLORS`, `INDICATOR_FS`, opacity) MUST remain unchanged.

(Previously: computed one deduplicated set per stringIndex only, rendered only when `isOpenPosition` was true, positioned at fixed nut area, did not animate.)

#### Scenario: All shapes at open position — per-string indicators at nut

- GIVEN all five CAGED shapes visible with `baseFret === 0`
- AND high E string is open (fret 0) in C, A, G, E and muted (fret null) in D
- WHEN FullFretboard renders
- THEN high E string shows a horizontal row at the nut: [O C-color] [O A-color] [O G-color] [O E-color] [× D-color]
- AND indicators are spaced `INDICATOR_SP` (14px) apart, center-to-center
- AND each indicator uses its shape's `SHAPE_COLORS` fill

#### Scenario: Barre shape shows indicators left of barre line

- GIVEN the G shape visible with `baseFret === 3` and `barreFirst = 0, barreLast = 2`
- AND string 5 (high E) is muted (`fret === null`)
- WHEN FullFretboard renders
- THEN a × indicator appears at the left of the barre fret line (fret 3)
- AND the × is positioned at X = `fretLineX(3) - FRET_SP/2 - 8`
- AND the × uses G shape color

#### Scenario: Mixed open and barre positions

- GIVEN C shape at `baseFret=0` and A shape at `baseFret=5` both visible
- AND string 0 (low E) is open in C shape and muted in A shape
- WHEN FullFretboard renders
- THEN string 0 shows an O indicator near the nut for C shape
- AND string 0 shows a × indicator left of fret 5 barre line for A shape
- AND both indicators are in separate groups due to different `baseFret`

#### Scenario: Multiple shapes at same barre baseFret

- GIVEN C shape at `baseFret=3` and A shape at `baseFret=3` both visible
- AND string 1 is muted in both shapes
- WHEN FullFretboard renders
- THEN a single group at `baseFret=3, stringIndex=1` contains two × indicators stacked horizontally
- AND the first × is C-color, second × is A-color
- AND the group is positioned left of the barre line at fret 3

#### Scenario: No visible shapes

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
- THEN the indicator group translates to the new barre position (left of fret 5)
- AND the transition completes smoothly over `ANIM_DURATION` (0.3s) with `ANIM_EASING`

#### Scenario: prefers-reduced-motion disables indicator animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN indicator groups snap instantly to new positions (no CSS transition)

## REMOVED Requirements

### Requirement: isOpenPosition guard

(Reason: Superseded by per-shape indicator rendering; all shapes now show indicators regardless of baseFret.)
(Migration: Remove `isOpenPosition` derived and its uses; no replacement needed.)

### Requirement: Static Elements — O/× indicators

(Reason: Indicators now animate alongside their shape groups via CSS `transform` transition, so they are no longer static elements.)
(Migration: The "Static Elements" requirement in the main spec should no longer mention O/× indicators.)

## RENAMED Requirements

None.
