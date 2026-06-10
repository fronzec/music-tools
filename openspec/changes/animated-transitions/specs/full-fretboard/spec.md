# Delta: full-fretboard — Animated Transitions

## MODIFIED Requirements

### Requirement: Multi-Shape Overlay

The system MUST accept `ChordShape[]` and render overlaid on shared fretboard; the rendering loop SHALL be restructured from `{#each positionMap.entries()}` keyed by `${absFret},${stringIndex}` to a flat list keyed by `${shape}-${stringIndex}`, with each note element wrapped in a `<g>` element.

(Previously: keyed by `absFret,stringIndex` via `positionMap.entries()`; no `<g>` wrappers, no animation)

#### Scenario: Shape-string keyed iteration

- GIVEN `CAGED_ORDER` = `['C','A','G','E','D']`
- WHEN `FullFretboard` renders
- THEN the loop iterates over all shape/stringIndex combinations
- AND each note is wrapped in `<g>` with a unique `key="${shape}-${stringIndex}"`
- AND the DOM element persists across root changes

#### Scenario: Note slides to new fret position

- GIVEN a C shape note at stringIndex 0, absolute fret 3
- WHEN root changes from C to A
- THEN the note’s `<g>` translates to the new fret position via CSS transition
- AND the transition completes smoothly over 300ms

#### Scenario: prefers-reduced-motion disables animation

- GIVEN the user has `prefers-reduced-motion: reduce` enabled
- WHEN a root change occurs
- THEN notes snap instantly to new positions (no CSS transition)

#### Scenario: Overlap rendering after restructure

- GIVEN two shapes share the same (string, fret) position
- WHEN root changes and both shapes move
- THEN concentric rings render correctly for each overlapping shape
- AND colors and labels remain accurate for both shapes

### Requirement: Barre Indicators

The system MUST render per-shape colored barre rectangles and animate them when root changes.

(Previously: barre rectangles rendered inside shape iteration but without animation)

#### Scenario: Barre slides with shape

- GIVEN a G shape barre at baseFret 3
- WHEN root changes from C to A
- THEN the barre rectangle translates to its new absolute fret position via CSS transition
- AND barre dimensions remain correct (width/height unchanged, position animated)

### Requirement: Interval and Note Labels

The system MUST display labels on active note positions and animate them alongside their notes.

(Previously: labels rendered statically without animation)

#### Scenario: Label follows note animation

- GIVEN a note with label "R" at fret 5
- WHEN root changes and the note moves to fret 7
- THEN the label text translates alongside its parent note via the same `<g>` transition

### Requirement: Static Elements

The system MUST NOT animate fret lines, string lines, fret numbers, O/× indicators, nut markers, or fret markers.

(Previously: no elements were animated)

#### Scenario: Fret lines remain static

- GIVEN a root change occurs
- WHEN the fretboard re-renders
- THEN vertical fret lines and horizontal string lines do NOT move
- AND fret numbers below the board remain in place

### Requirement: highlightPositions Prop

The system MUST continue rendering highlight diff rings at the correct positions alongside animated notes.

(Previously: rings rendered statically at note positions)

#### Scenario: Diff ring follows animated note

- GIVEN a note with `type: 'different'` at fret 3
- WHEN root changes and the note animates to fret 5
- THEN the amber dashed ring follows the note’s `<g>` translation
- AND the ring renders above the note fill but below the label

## ADDED Requirements

### Requirement: Animation Constants

The system MUST define `ANIM_DURATION` and `ANIM_EASING` in `src/lib/theory/layout.ts` (FL constants).

| Constant | Value | Purpose |
|---|---|---|
| `ANIM_DURATION` | `300` | CSS transition duration in milliseconds |
| `ANIM_EASING` | `'ease-out'` | CSS transition timing function |

#### Scenario: Constants used in FullFretboard

- GIVEN `ANIM_DURATION` and `ANIM_EASING` are exported from `layout.ts`
- WHEN `FullFretboard` renders a note `<g>` element
- THEN the inline style is `transition: transform {{ANIM_DURATION}}ms {{ANIM_EASING}}`

## REMOVED Requirements

None.

## RENAMED Requirements

None.

## Backward Compatibility

- All existing tests MUST pass after the restructure.
- The `positionMap` computation via `buildPositionMap()` remains available for overlap detection logic.
- No consumer API changes (props unchanged).
- `highlightPositions` prop behavior unchanged (no visual change when absent).
