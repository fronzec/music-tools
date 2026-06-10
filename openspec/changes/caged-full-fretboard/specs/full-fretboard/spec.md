# Full Fretboard Component Specification

## Purpose

Multi-shape SVG fretboard overlay rendering 2–5 CAGED shapes on a single neck with per-shape color coding.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Multi-Shape Overlay** | MUST accept `ChordShape[]` and render overlaid on shared fretboard | 5 shapes visible; subset via `visibleShapes` | Empty set → background only (strings, frets, markers) |
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

## Notes

- **Z-order**: C → A → G → E → D (CAGED order), last shape on top
- **Opacity**: Non-root notes at 0.7–0.8 opacity to reduce visual clutter
- **Props interface**: `FullFretboardProps` added to `src/lib/types/chord.ts`
