# Full Fretboard Component Specification

## Purpose

Multi-shape SVG fretboard overlay rendering 2–5 CAGED shapes on a single neck with per-shape color coding.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Multi-Shape Overlay** | MUST accept `ChordShape[]` and render overlaid on shared fretboard; rendering loop SHALL iterate a flat list keyed by `${shape}-${stringIndex}` with each note wrapped in a `<g transform>` for CSS transition animation; `positionMap` is still computed via `buildPositionMap()` for overlap detection | 5 shapes visible; subset via `visibleShapes`; shapes slide smoothly on root change | Empty set → background only (strings, frets, markers) |
| **Per-Shape Colors** | MUST use distinct colors for all shape elements | C=#2563EB, A=#F97316, G=#16A34A, E=#EF4444, D=#9333EA | Consistent across notes, barres, labels |
| **Dynamic Fret Range** | MUST compute range from min to max fret across visible shapes | Wide span (1–15); narrow span (3–7) | Open position includes fret 0 (nut) |
| **Root Note Diamonds** | MUST render roots as diamonds; others as circles | Distinct shape per root | Overlapping roots show both colors |
| **Fret Numbers** | MUST render numbers below 6th string | Sequential from min fret | Barre offset: first visible = base fret label |
| **Barre Indicators** | MUST render per-shape colored barre rects and animate them when root changes via CSS transition on `<g>` wrapper | Barre at baseFret > 1, animates via CSS transition | Multiple barres visible simultaneously |
| **Open/Muted Strings** | MUST compute and render per-(baseFret, stringIndex) groups of O/× indicators across all visible shapes; MUST remove the `isOpenPosition` guard so ALL visible shapes display indicators regardless of `baseFret`; each group MUST be positioned at the right edge of the fret space via `indicatorX(baseFret, minFret) - 8`; multiple shapes sharing the same `baseFret` and `stringIndex` MUST stack horizontally with `INDICATOR_SP` (14px) spacing; indicator groups MUST animate alongside their shape's notes on root change via CSS `transition: transform` matching `ANIM_DURATION` and `ANIM_EASING`; MUST honor `prefers-reduced-motion: reduce` by disabling indicator transitions; indicator visual properties (O/× glyphs, `SHAPE_COLORS`, `INDICATOR_FS`, opacity) MUST remain unchanged | All five shapes at open position → indicators at right edge of fret space per shape; barre shapes → indicators at right edge of fret space; mixed positions → separate groups per baseFret; root change → indicators slide smoothly with shapes | No visible shapes → no indicators; all-fretted string on all shapes → no indicator group; `prefers-reduced-motion` → instant snap (no transition)
| **Shape Visibility** | MUST accept `visibleShapes: Set<CagedShape>` | Toggle on/off adds/removes shape | — |
| **Label Mode** | MUST support `labelMode: 'intervals' \| 'notes' \| 'both'`; labels animate alongside their parent notes via the same `<g>` transition | R, 3, 5; C, E, G; C (R) | — |
| **Scale-to-Fit** | MUST scale via SVG viewBox to container width | Fills container | No horizontal scroll |
| **Accessibility** | MUST include ARIA labels describing visible shapes | Lists visible shapes and chord | Empty state labeled as empty fretboard |
| **Overlapping Notes** | MUST handle same (string, fret) from multiple shapes | Same interval: both colors, one label | Different intervals: both labels or tooltip |
| **ViewBox Offset** | MUST offset X origin to min visible fret | Left edge aligns to min fret | Open position: nut at left edge |
| **highlightPositions Prop** | MUST accept optional `highlightPositions?: Map<string, { type: 'same' \| 'different' }>` prop; highlight rings MUST render at correct positions alongside animated notes (inside the same `<g>` translation) | Present with `'same'` → green ring; present with `'different'` → amber dashed ring; absent → no change | Absent → fully backward compatible (no visual change) |
| **Highlight Ring Visual Properties** | MUST render rings: same = green (`#22C55E`) solid `stroke-width="1.5"` opacity 0.5, different = amber (`#F59E0B`) dashed `stroke-dasharray="3 2"` `stroke-width="2"` opacity 0.6, outside note shape; root diamond gets polygon ring, non-root circle gets circle ring | Root with `'same'` → green diamond ring polygon; non-root with `'different'` → dashed amber circle ring | Position not in `highlightPositions` → no ring renders |
| **Animation Constants** | MUST define `ANIM_DURATION` (300ms) and `ANIM_EASING` ('ease-out') in `src/lib/theory/layout.ts` FL constants | Used in FullFretboard `<g>` transition: `transition: transform 300ms ease-out` | — |
| **Static Elements** | MUST NOT animate fret lines, string lines, fret numbers, nut markers, or fret markers | Fret lines, string lines remain static during root changes | — |

## Scenarios

### Scenario: highlightPositions absent (backward compatible)

- GIVEN `highlightPositions` is absent
- WHEN `FullFretboard` renders
- THEN no visual change occurs (backward compatible)

### Scenario: Same-interval green ring

- GIVEN `highlightPositions` is present with `"5,2" → { type: 'same' }`
- WHEN a note at absFret 5, stringIndex 2 renders
- THEN a green ring renders OUTSIDE the existing note shape
- AND the ring does NOT affect the note label, aria-label, or shape fill

### Scenario: Different-interval amber dashed ring

- GIVEN `highlightPositions` is present with `"3,4" → { type: 'different' }`
- WHEN a note at absFret 3, stringIndex 4 renders
- THEN an amber dashed ring renders OUTSIDE the existing note shape
- AND the ring does NOT affect the note label, aria-label, or shape fill

### Scenario: Root diamond with same ring

- GIVEN a root note (diamond) with `type: 'same'`
- WHEN the highlight renders
- THEN the ring is a polygon stroke outside the diamond
- AND the diamond fill remains unchanged

### Scenario: Non-root circle with different ring

- GIVEN a non-root note (circle) with `type: 'different'`
- WHEN the highlight renders
- THEN the ring is a dashed circle stroke outside the circle
- AND the circle fill remains unchanged

### Scenario: Position not in highlight map

- GIVEN a position is NOT in `highlightPositions`
- WHEN the note renders
- THEN no highlight ring is rendered
- AND the note renders exactly as before

### Scenario: Multi-Shape Overlay with extracted utility

- GIVEN any set of shapes
- WHEN `FullFretboard` renders
- THEN `positionMap` is computed via imported `buildPositionMap()`
- AND the visual output is identical to the previous inline implementation

### Scenario: Shape-string keyed iteration

- GIVEN `CAGED_ORDER` = `['C','A','G','E','D']`
- WHEN `FullFretboard` renders
- THEN the loop iterates over all shape/stringIndex combinations
- AND each note is wrapped in `<g>` with a unique `key="${shape}-${stringIndex}"`
- AND the DOM element persists across root changes

### Scenario: Note slides to new fret position

- GIVEN a C shape note at stringIndex 0, absolute fret 3
- WHEN root changes from C to A
- THEN the note's `<g>` translates to the new fret position via CSS transition
- AND the transition completes smoothly over 300ms

### Scenario: prefers-reduced-motion disables animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN notes snap instantly to new positions (no CSS transition)

### Scenario: Overlap rendering after restructure

- GIVEN two shapes share the same (string, fret) position
- WHEN root changes and both shapes move
- THEN concentric rings render correctly for each overlapping shape
- AND colors and labels remain accurate for both shapes

### Scenario: Barre slides with shape

- GIVEN a G shape barre at baseFret 3
- WHEN root changes from C to A
- THEN the barre rectangle translates to its new absolute fret position via CSS transition
- AND barre dimensions remain correct (width/height unchanged, position animated)

### Scenario: Label follows note animation

- GIVEN a note with label "R" at fret 5
- WHEN root changes and the note moves to fret 7
- THEN the label text translates alongside its parent note via the same `<g>` transition

### Scenario: Fret lines remain static

- GIVEN a root change occurs
- WHEN the fretboard re-renders
- THEN vertical fret lines and horizontal string lines do NOT move
- AND fret numbers below the board remain in place

### Scenario: Diff ring follows animated note

- GIVEN a note with `type: 'different'` at fret 3
- WHEN root changes and the note animates to fret 5
- THEN the amber dashed ring follows the note's `<g>` translation
- AND the ring renders above the note fill but below the label

### Scenario: Constants used in FullFretboard

- GIVEN `ANIM_DURATION` and `ANIM_EASING` are exported from `layout.ts`
- WHEN `FullFretboard` renders a note `<g>` element
- THEN the inline style is `transition: transform {{ANIM_DURATION}}ms {{ANIM_EASING}}`

### Scenario: All shapes at open position — per-string indicators at right edge of fret space

- GIVEN all five CAGED shapes visible with `baseFret === 0`
- AND high E string is open (fret 0) in C, A, G, E and muted (fret null) in D
- WHEN FullFretboard renders
- THEN high E string shows a horizontal row at the right edge of the fret space: [O C-color] [O A-color] [O G-color] [O E-color] [× D-color]
- AND indicators are spaced `INDICATOR_SP` (14px) apart, center-to-center
- AND each indicator uses its shape's `SHAPE_COLORS` fill

### Scenario: Barre shape shows indicators at right edge of fret space

- GIVEN the G shape visible with `baseFret === 3` and `barreFirst = 0, barreLast = 2`
- AND string 5 (high E) is muted (`fret === null`)
- WHEN FullFretboard renders
- THEN a × indicator appears at the right edge of the fret space
- AND the × is positioned at translate X = `indicatorX(3, minFret) - 8` which equals `fretLineX(4) - 12 - 8`
- AND the × uses G shape color

### Scenario: Mixed open and barre positions

- GIVEN C shape at `baseFret=0` and A shape at `baseFret=5` both visible
- AND string 0 (low E) is open in C shape and muted in A shape
- WHEN FullFretboard renders
- THEN string 0 shows an O indicator at the right edge of the fret space for C shape
- AND string 0 shows a × indicator at the right edge of the fret space (fret 5) for A shape
- AND both indicators are in separate groups due to different `baseFret`

### Scenario: Multiple shapes at same barre baseFret

- GIVEN C shape at `baseFret=3` and A shape at `baseFret=3` both visible
- AND string 1 is muted in both shapes
- WHEN FullFretboard renders
- THEN a single group at `baseFret=3, stringIndex=1` contains two × indicators stacked horizontally
- AND the first × is C-color, second × is A-color
- AND the group is positioned at the right edge of the fret space

### Scenario: No visible shapes — no indicators

- GIVEN `visibleShapes` is empty
- WHEN FullFretboard renders
- THEN no O/× indicators are rendered

### Scenario: All-fretted string across all shapes

- GIVEN all visible shapes have `fret > 0` on string 2
- WHEN FullFretboard renders
- THEN string 2 shows no indicator group

### Scenario: Indicator group animates on root change

- GIVEN a C shape at `baseFret=3` with a muted string 5 indicator group
- WHEN root changes from C to A, moving the shape to `baseFret=5`
- THEN the indicator group translates to the right edge of the fret space at the new base fret
- AND the transition completes smoothly over `ANIM_DURATION` (0.3s) with `ANIM_EASING`

### Scenario: prefers-reduced-motion disables indicator animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN indicator groups snap instantly to new positions (no CSS transition)

## Notes

- **Z-order**: C → A → G → E → D (CAGED order), last shape on top
- **Opacity**: Non-root notes at 0.7–0.8 opacity to reduce visual clutter
- **Props interface**: `FullFretboardProps` added to `src/lib/types/chord.ts`
- **Zero impact on non-dual modes**: `FullFretboard` used in Full Neck or Grid mode never receives `highlightPositions`; visual output unchanged
- **Ring z-order**: Highlight rings MUST render above note fills but below labels so text remains legible
- **Accessibility**: `aria-label` and `<title>` MUST NOT reference highlight state; screen readers describe notes, not diff classification
- **Opacity range**: 0.5–0.6 chosen to reduce visual noise on colored shapes
