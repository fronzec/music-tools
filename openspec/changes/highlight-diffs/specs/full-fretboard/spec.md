# Full Fretboard — Delta Specification

## ADDED Requirements

### Requirement: `highlightPositions` Prop

The `FullFretboard` component MUST accept an optional `highlightPositions?: Map<string, { type: 'same' | 'different' }>` prop.

- GIVEN `highlightPositions` is absent
- WHEN `FullFretboard` renders
- THEN no visual change occurs (backward compatible)

- GIVEN `highlightPositions` is present with `"5,2" → { type: 'same' }`
- WHEN a note at absFret 5, stringIndex 2 renders
- THEN a green ring renders OUTSIDE the existing note shape
- AND the ring does NOT affect the note label, aria-label, or shape fill

- GIVEN `highlightPositions` is present with `"3,4" → { type: 'different' }`
- WHEN a note at absFret 3, stringIndex 4 renders
- THEN an amber dashed ring renders OUTSIDE the existing note shape
- AND the ring does NOT affect the note label, aria-label, or shape fill

### Requirement: Highlight Ring Visual Properties

The system MUST render highlight rings with these properties:

| Type | Color | Stroke | Opacity | Placement |
|---|---|---|---|---|
| same | green (#22C55E) | solid | 0.5–0.6 | Outside note shape |
| different | amber (#F59E0B) | dashed | 0.5–0.6 | Outside note shape |

- GIVEN a root note (diamond) with `type: 'same'`
- WHEN the highlight renders
- THEN the ring is a polygon stroke outside the diamond
- AND the diamond fill remains unchanged

- GIVEN a non-root note (circle) with `type: 'different'`
- WHEN the highlight renders
- THEN the ring is a dashed circle stroke outside the circle
- AND the circle fill remains unchanged

- GIVEN a position is NOT in `highlightPositions`
- WHEN the note renders
- THEN no highlight ring is rendered
- AND the note renders exactly as before

## MODIFIED Requirements

### Requirement: Multi-Shape Overlay

The `FullFretboard` component MUST accept `ChordShape[]` and render overlaid on shared fretboard.
(Previously: `buildPositionMap` and `NoteEntry` were inline in `FullFretboard.svelte`; now imported from `src/lib/theory/fretboard.ts`. No behavioral change.)

- GIVEN any set of shapes
- WHEN `FullFretboard` renders
- THEN `positionMap` is computed via imported `buildPositionMap()`
- AND the visual output is identical to the previous inline implementation

## RENAMED Requirements

None.

## REMOVED Requirements

None.

## Notes

- **Zero impact on non-dual modes**: `FullFretboard` used in Full Neck or Grid mode never receives `highlightPositions`; visual output unchanged
- **Ring z-order**: Highlight rings MUST render above note fills but below labels so text remains legible
- **Accessibility**: `aria-label` and `<title>` MUST NOT reference highlight state; screen readers describe notes, not diff classification
- **Opacity range**: 0.5–0.6 chosen to reduce visual noise on colored shapes
