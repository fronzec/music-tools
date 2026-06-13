# Delta for full-fretboard

## MODIFIED Requirements

### Requirement: Overlapping Notes

The system MUST handle same (string, fret) from multiple shapes. When `overlapStyle` is `'split'`, overlapping notes MUST render as semicircle arcs (`<path>`) forming left and right halves. When `overlapStyle` is `'dots'`, overlapping notes MUST render as overlapping `<circle>` elements offset horizontally by `FL.OVERLAP_DOT_OFFSET`. When `overlapStyle` is `'gradient'`, overlapping notes MUST render as a single `<circle>` with a `fill="url(#grad-{posKey})"` referencing a `<linearGradient>` defined in `<defs>`. The note name MUST be centered on the overlap position regardless of style. For 3+ overlapping shapes, split and gradient styles MUST use only the first 2 colors (CAGED order); the dots style MUST chain N circles horizontally with `FL.OVERLAP_DOT_OFFSET` spacing between each pair.
(Previously: Rendered all overlaps as concentric rings with no style selection; labels and colors stacked without branching.)

#### Scenario: Split style rendering

- GIVEN two shapes share the same (string, fret) position and `overlapStyle` is `'split'`
- WHEN `FullFretboard` renders
- THEN the note renders as two semicircle arcs forming a complete circle
- AND the left semicircle uses the first shape's color
- AND the right semicircle uses the second shape's color
- AND the note name is centered on the overlap position

#### Scenario: Dots style rendering

- GIVEN two shapes share the same (string, fret) position and `overlapStyle` is `'dots'`
- WHEN `FullFretboard` renders
- THEN two overlapping circles render with horizontal offset
- AND the offset distance is `FL.OVERLAP_DOT_OFFSET`
- AND the note name is centered in the overlap zone

#### Scenario: Gradient style rendering

- GIVEN two shapes share the same (string, fret) position and `overlapStyle` is `'gradient'`
- WHEN `FullFretboard` renders
- THEN a single circle renders with a linear gradient fill
- AND the gradient transitions from the first shape's color to the second shape's color
- AND the gradient is defined in a `<defs>` block with an ID scoped to the position key (`#grad-{posKey}`)
- AND the note name is centered on the circle

#### Scenario: 3+ overlaps with split style

- GIVEN three or more shapes share the same (string, fret) position and `overlapStyle` is `'split'`
- WHEN `FullFretboard` renders
- THEN the first two shapes' colors are used for the left and right semicircles
- AND additional shapes do not contribute to the overlap visualization

#### Scenario: 3+ overlaps with gradient style

- GIVEN three or more shapes share the same (string, fret) position and `overlapStyle` is `'gradient'`
- WHEN `FullFretboard` renders
- THEN the gradient uses the first two shapes' colors only
- AND additional shapes do not contribute to the overlap visualization

#### Scenario: 3+ overlaps with dots style

- GIVEN three or more shapes share the same (string, fret) position and `overlapStyle` is `'dots'`
- WHEN `FullFretboard` renders
- THEN circles chain horizontally with `FL.OVERLAP_DOT_OFFSET` spacing between each
- AND each circle uses its corresponding shape's color
- AND the note name is centered across the chain

#### Scenario: Overlap style prop

- GIVEN `FullFretboard` receives an `overlapStyle` prop of type `OverlapStyle`
- WHEN it renders
- THEN the overlap rendering branch uses the provided style
- AND the default value is `'split'` when the prop is omitted

#### Scenario: Overlap rendering follows style on root change

- GIVEN two shapes share the same (string, fret) position and `overlapStyle` is `'gradient'`
- WHEN root changes and both shapes move
- THEN the overlap renders according to the current `overlapStyle`
- AND colors and labels remain accurate for both shapes
- AND the `<defs>` gradient updates if the shape order changes

#### Scenario: Empty state unchanged

- GIVEN `visibleShapes` is empty
- WHEN `FullFretboard` renders
- THEN no overlap visualization renders
- AND the background remains unchanged

#### Scenario: Single shape unchanged

- GIVEN only one shape is visible
- WHEN `FullFretboard` renders
- THEN notes render as standard circles or diamonds with no overlap styling
- AND visual output is identical to current behavior

## ADDED Requirements

### Requirement: OverlapStyle Type

The system MUST export an `OverlapStyle` type from `src/lib/types/chord.ts` with three literal values: `'split'`, `'dots'`, `'gradient'`.

#### Scenario: Type usage

- GIVEN `OverlapStyle` is imported into `FullFretboard.svelte`
- WHEN the component receives the prop
- THEN the type narrows to exactly the three allowed values

### Requirement: Gradient Definitions

The system MUST render a `<defs>` block inside `FullFretboard` containing `<linearGradient>` elements for every position key that requires a gradient overlap. Each gradient ID MUST be unique and scoped to the position key to avoid collisions across multiple `FullFretboard` instances (e.g., Dual Compare mode).

#### Scenario: Gradient definitions in Full Neck

- GIVEN `overlapStyle` is `'gradient'` and two overlaps exist
- WHEN `FullFretboard` renders
- THEN two `<linearGradient>` elements are defined in `<defs>`
- AND each has a unique ID based on its position key

#### Scenario: Gradient definitions in Dual Compare

- GIVEN Dual Compare mode renders two `FullFretboard` instances
- WHEN both instances have overlapping shapes at the same absolute position
- THEN each instance's `<defs>` contains its own gradient definitions
- AND IDs do not collide because they are scoped per instance

### Requirement: Layout Constants

The system MUST add `OVERLAP_DOT_OFFSET` and `OVERLAP_GRADIENT_DIR` to the `FL` constants object in `src/lib/theory/layout.ts`.

#### Scenario: Constants usage

- GIVEN `FL` is imported into `FullFretboard.svelte`
- WHEN the dots style renders
- THEN the circle offset uses `FL.OVERLAP_DOT_OFFSET`

## REMOVED Requirements

### Requirement: Concentric Ring Overlap Rendering

(Reason: Replaced by style-branched overlap rendering; concentric rings are no longer the default or only option.)
(Migration: None — the new `overlapStyle` prop defaults to `'split'`, which renders semicircles instead of rings.)

#### Scenario: Overlap rendering after restructure (removed)

(Reason: Scenario referenced concentric rings explicitly; superseded by new style-specific scenarios.)
