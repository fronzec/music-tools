# Full Fretboard Component Specification

## Purpose

Multi-shape SVG fretboard overlay rendering 2–5 CAGED shapes on a single neck with per-shape color coding.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Multi-Shape Overlay** | MUST accept `ChordShape[]` and render overlaid on shared fretboard; `positionMap` is computed via imported `buildPositionMap()` from `src/lib/theory/fretboard.ts` (extracted from inline `$derived.by`, no behavioral change) | 5 shapes visible; subset via `visibleShapes` | Empty set → background only (strings, frets, markers) |
| **Per-Shape Colors** | MUST use distinct colors for all shape elements | C=#2563EB, A=#F97316, G=#16A34A, E=#EF4444, D=#9333EA | Consistent across notes, barres, labels |
| **Dynamic Fret Range** | MUST compute range from min to max fret across visible shapes | Wide span (1–15); narrow span (3–7) | Open position includes fret 0 (nut) |
| **Root Note Diamonds** | MUST render roots as diamonds; others as circles | Distinct shape per root | Overlapping roots show both colors |
| **Fret Numbers** | MUST render numbers below 6th string | Sequential from min fret | Barre offset: first visible = base fret label |
| **Barre Indicators** | MUST render per-shape colored barre rects | Barre at baseFret > 1 | Multiple barres visible simultaneously |
| **Open/Muted Strings** | MUST show O / × at nut position | Open string (fret 0); muted (null) | — |
| **Shape Visibility** | MUST accept `visibleShapes: Set<CagedShape>` | Toggle on/off adds/removes shape | — |
| **Label Mode** | MUST support `labelMode: 'intervals' \| 'notes' \| 'both'` | R, 3, 5; C, E, G; C (R) | — |
| **Scale-to-Fit** | MUST scale via SVG viewBox to container width | Fills container | No horizontal scroll |
| **Accessibility** | MUST include ARIA labels describing visible shapes | Lists visible shapes and chord | Empty state labeled as empty fretboard |
| **Overlapping Notes** | MUST handle same (string, fret) from multiple shapes | Same interval: both colors, one label | Different intervals: both labels or tooltip |
| **ViewBox Offset** | MUST offset X origin to min visible fret | Left edge aligns to min fret | Open position: nut at left edge |
| **highlightPositions Prop** | MUST accept optional `highlightPositions?: Map<string, { type: 'same' \| 'different' }>` prop | Present with `'same'` → green ring; present with `'different'` → amber dashed ring; absent → no change | Absent → fully backward compatible (no visual change) |
| **Highlight Ring Visual Properties** | MUST render rings: same = green (`#22C55E`) solid `stroke-width="1.5"` opacity 0.5, different = amber (`#F59E0B`) dashed `stroke-dasharray="3 2"` `stroke-width="2"` opacity 0.6, outside note shape; root diamond gets polygon ring, non-root circle gets circle ring | Root with `'same'` → green diamond ring polygon; non-root with `'different'` → dashed amber circle ring | Position not in `highlightPositions` → no ring renders |

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

## Notes

- **Z-order**: C → A → G → E → D (CAGED order), last shape on top
- **Opacity**: Non-root notes at 0.7–0.8 opacity to reduce visual clutter
- **Props interface**: `FullFretboardProps` added to `src/lib/types/chord.ts`
- **Zero impact on non-dual modes**: `FullFretboard` used in Full Neck or Grid mode never receives `highlightPositions`; visual output unchanged
- **Ring z-order**: Highlight rings MUST render above note fills but below labels so text remains legible
- **Accessibility**: `aria-label` and `<title>` MUST NOT reference highlight state; screen readers describe notes, not diff classification
- **Opacity range**: 0.5–0.6 chosen to reduce visual noise on colored shapes
