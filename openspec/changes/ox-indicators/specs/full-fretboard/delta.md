# Delta for Full Fretboard

## MODIFIED Requirements

### Requirement: Open/Muted Strings

The system MUST compute and render per-(baseFret, stringIndex) groups of O/× indicators across all visible shapes; MUST remove the `isOpenPosition` guard so ALL visible shapes display indicators regardless of `baseFret`; each group MUST be positioned at the right edge of its shape's fret space, just before the next fret line, using `indicatorX(baseFret, minFret)` where `indicatorX` returns `fretLineX(baseFret + 1 - minFret) - 12`; multiple shapes sharing the same `baseFret` and `stringIndex` MUST stack horizontally with `INDICATOR_SP` (14px) spacing; indicator groups MUST animate alongside their shape's notes on root change via CSS `transition: transform` matching `ANIM_DURATION` and `ANIM_EASING`; MUST honor `prefers-reduced-motion: reduce` by disabling indicator transitions; indicator visual properties (O/× glyphs, `SHAPE_COLORS`, `INDICATOR_FS`, opacity) MUST remain unchanged.

(Previously: indicators positioned near nut area for `baseFret=0` and left of the barre fret line for `baseFret>0`.)

#### Scenario: All shapes at open position — per-string indicators at right edge

- GIVEN all five CAGED shapes visible with `baseFret === 0`
- AND high E string is open (fret 0) in C, A, G, E and muted (fret null) in D
- WHEN FullFretboard renders
- THEN high E string shows a horizontal row at the right edge of fret space 0: [O C-color] [O A-color] [O G-color] [O E-color] [× D-color]
- AND indicators are spaced `INDICATOR_SP` (14px) apart, center-to-center
- AND each indicator uses its shape's `SHAPE_COLORS` fill

#### Scenario: Barre shape shows indicators at right edge of fret space

- GIVEN the G shape visible with `baseFret === 3` and `barreFirst = 0, barreLast = 2`
- AND string 5 (high E) is muted (`fret === null`)
- WHEN FullFretboard renders
- THEN a × indicator appears at the right edge of fret space 3, just before fret line 4
- AND the × is positioned at X = `indicatorX(3, minFret)` which equals `fretLineX(4) - 12`
- AND the × uses G shape color

#### Scenario: Mixed open and barre positions

- GIVEN C shape at `baseFret=0` and A shape at `baseFret=5` both visible
- AND string 0 (low E) is open in C shape and muted in A shape
- WHEN FullFretboard renders
- THEN string 0 shows an O indicator at the right edge of fret space 0 for C shape
- AND string 0 shows a × indicator at the right edge of fret space 5 for A shape
- AND both indicators are in separate groups due to different `baseFret`

#### Scenario: Multiple shapes at same barre baseFret

- GIVEN C shape at `baseFret=3` and A shape at `baseFret=3` both visible
- AND string 1 is muted in both shapes
- WHEN FullFretboard renders
- THEN a single group at `baseFret=3, stringIndex=1` contains two × indicators stacked horizontally
- AND the first × is C-color, second × is A-color
- AND the group is positioned at the right edge of fret space 3, just before fret line 4

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
- THEN the indicator group translates to the new right-edge position (just before fret line 6)
- AND the transition completes smoothly over `ANIM_DURATION` (0.3s) with `ANIM_EASING`

#### Scenario: prefers-reduced-motion disables indicator animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN indicator groups snap instantly to new positions (no CSS transition)
