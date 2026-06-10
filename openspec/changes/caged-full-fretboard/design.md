# Design: CAGED Full Fretboard

## Technical Approach

New `FullFretboard.svelte` renders all visible CAGED shapes overlaid on a single neck — computing a global fret range, color-coding each shape, and drawing shared background strings/frets once. `CagedTool.svelte` gains a view mode toggle and shape visibility bar. Additive only: existing `Fretboard.svelte` and `ShapeCard.svelte` untouched.

## Architecture Decisions

### Decision: Separate FullFretboard component vs extending Fretboard

**Choice**: New `FullFretboard.svelte` component
**Alternatives**: Extend existing `Fretboard.svelte` with a `multi` mode
**Rationale**: Different rendering model (global range vs single-shape range, color per shape vs semantic interval colors, diamonds for roots, fret numbers at bottom). Separate component keeps Fretboard.svelte stable for Shape Grid mode and avoids conditional branching inside a component that works well today.

### Decision: Layout constants location

**Choice**: Add `FL` (Full Layout) constants to `layout.ts`
**Alternatives**: Inline constants in FullFretboard.svelte; separate `full-layout.ts` file
**Rationale**: `layout.ts` already exports `L`, `stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`. FullFretboard reuses all these functions. Adding `FL` (full layout constants) alongside `L` in the same file keeps layout math co-located and importable. A separate file would add import indirection for no gain.

### Decision: Dynamic fret range vs fixed 15-fret display

**Choice**: Dynamic range clamped to [5, 17] frets
**Alternatives**: Always show 15 frets; always show frets 0–15
**Rationale**: Dynamic range avoids wasted space when all shapes cluster in a narrow band (e.g., open chords spanning frets 0–5) while the clamp prevents absurdly wide SVG. Max 17 assures even C minor (frets 1–15) fits with 2 padding frets.

### Decision: Overlapping note rendering

**Choice**: Render all overlapping circles; later CAGED shape renders on top (higher z)
**Alternatives**: Double-ring with inner/outer colors; tooltip on hover; merge into single circle with gradient
**Rationale**: Simplest to implement. Per-shape color at 0.7 opacity already provides visual distinction. Later shapes in CAGED order (D last) draw on top, so even exact overlaps show the top shape's color. Double-ring can be a future enhancement.

### Decision: Root diamond rendering

**Choice**: SVG `<polygon>` with 4 rotated-square points
**Alternatives**: SVG `<rect transform="rotate(45)">`; custom `<path>`
**Rationale**: Polygon is explicit, needs no transform attribute, and uses the same center/radius math as circles. The 4 points are trivial: center ± offset on both axes where offset = radius / √2 (or simply use radius for a slightly larger diamond at the same visual weight).

### Decision: FullFretboardProps lives in component file

**Choice**: Define interface inline in `FullFretboard.svelte`
**Alternatives**: Export from `chord.ts`
**Rationale**: FullFretboardProps is only consumed by CagedTool.svelte as prop-passing. It's a presentation-layer contract, not a domain type. Keeping it local avoids a half-empty type file and follows Svelte's pattern of `interface Props` in the component script. `chord.ts` is not modified.

### Decision: Shape visibility bar stays in CagedTool.svelte

**Choice**: Inline reactive UI in `CagedTool.svelte`, not a separate component
**Alternatives**: Extract `<ShapeToggleBar>` component
**Rationale**: 5 buttons with color + toggle logic is ~20 lines of template. Not worth a separate file for a single-use UI element that tightly couples to `visibleShapes` state. If reused later, extract then.

## Data Flow

```
CagedTool.svelte
│  selectedRoot, selectedQuality, labelMode, viewMode, visibleShapes
│
├── [Full Neck mode]
│   └── FullFretboard.svelte
│       ├── shapes (all 5 ChordShape[])
│       ├── visibleShapes (Set<CagedShape>)
│       ├── labelMode
│       └── width (optional)
│
│       Computes: minFret, maxFret, displaySpan, viewBox
│       Renders: background → barres → notes → fret numbers
│
└── [Shape Grid mode]
    └── ShapeCard.svelte × 5 (unchanged)
        └── Fretboard.svelte × 5 (unchanged)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/components/FullFretboard.svelte` | Create | Multi-shape overlay SVG component |
| `src/lib/components/CagedTool.svelte` | Modify | Add viewMode state, visibleShapes Set, view toggle, shape toggle bar, conditional rendering |
| `src/lib/theory/layout.ts` | Modify | Add `FL` constant object and `SHAPE_COLORS` map |

## Interfaces / Contracts

### FullFretboard.svelte Props

```typescript
interface FullFretboardProps {
  shapes: ChordShape[];           // all 5 CAGED shapes
  visibleShapes: Set<CagedShape>;  // which shapes to render
  labelMode: LabelMode;            // 'intervals' | 'notes' | 'both'
  width?: number;                  // optional, auto from viewBox
}
```

### New layout.ts constants

```typescript
export const FL = {
  MIN_FRET_SPAN: 5,
  MAX_FRET_SPAN: 17,
  FRET_PAD: 1,             // extra fret column for right padding
  FRET_NUM_Y_OFFSET: 14,   // below bottom string
  FRET_NUM_FS: 9,          // font-size for fret numbers
  ROOT_DIAMOND_R: 11,      // same visual weight as ROOT_R
  NOTE_OPACITY: 0.7,        // non-root notes
  BARRE_OPACITY: 0.35,      // barre indicator rectangles
  FRET_MARKER_FS: 9,       // fret number font size
} as const;

export const SHAPE_COLORS: Record<CagedShape, string> = {
  C: '#2563EB',   // blue-600
  A: '#F97316',   // orange-500
  G: '#16A34A',   // green-600
  E: '#EF4444',   // red-500
  D: '#9333EA',   // purple-600
};
```

### Fret range derivation (inside FullFretboard.svelte)

```typescript
let visibleShapeData = $derived(
  shapes.filter(s => visibleShapes.has(s.shape))
);

let minFret = $derived(() => {
  if (visibleShapeData.length === 0) return 0;
  return Math.min(...visibleShapeData.map(s => {
    if (s.baseFret <= 1) return 0; // open position includes nut
    return s.baseFret;
  }));
});

let maxFret = $derived(() => {
  if (visibleShapeData.length === 0) return FL.MIN_FRET_SPAN - 1;
  return Math.max(...visibleShapeData.map(s => {
    const absFrets = s.frets.filter((f): f is number => f !== null);
    const topFret = absFrets.length > 0
      ? (s.baseFret > 1 ? s.baseFret + Math.max(...absFrets) : Math.max(...absFrets))
      : (s.baseFret > 1 ? s.baseFret : 0);
    return topFret;
  }));
});

let displaySpan = $derived(() => {
  const span = maxFret - minFret + 1 + FL.FRET_PAD;
  return Math.max(FL.MIN_FRET_SPAN, Math.min(FL.MAX_FRET_SPAN, span));
});
```

### Root diamond helper

```typescript
function diamondPoints(cx: number, cy: number, r: number): string {
  // 4 points of a rotated square (diamond)
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}
```

## Visual Design

### SVG rendering order (bottom → top)

1. Fret lines (gray-400, 1px; nut line 4px)
2. String lines (gray-300, 1px)
3. Fret markers (gray-400 dots at 3,5,7,9,12,15)
4. Per-shape barre rectangles (shape color, `BARRE_OPACITY`)
5. Per-shape note circles (shape color, `NOTE_OPACITY`; root diamonds at full opacity with white stroke)
6. Per-shape labels (gray-700, above circles)
7. Fret numbers (gray-500, font-size 9, below string 5)
8. Open O / muted × (above nut, per visible shape)

Shape iteration order: `CAGED_ORDER` → C first (bottom), D last (top).

### Color application

| Element | Fill | Stroke | Opacity |
|---------|------|--------|---------|
| Root diamond | SHAPE_COLORS[shape] | white, 2px | 1.0 |
| Non-root circle | SHAPE_COLORS[shape] | none | 0.7 |
| Barre rect | SHAPE_COLORS[shape] | none | 0.35 |
| Label text | gray-700 | — | 1.0 |
| Fret number | gray-500 | — | 1.0 |
| String line | — | gray-300 | 1.0 |
| Fret line | — | gray-400 | 1.0 |
| Nut line | — | gray-900 (4px) | 1.0 |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Fret range calculation | Vitest: test minFret/maxFret/displaySpan with various shape configs |
| Unit | Diamond point generation | Vitest: verify polygon coordinates |
| Unit | SHAPE_COLORS mapping | Vitest: assert all CAGED shapes have entries |
| Integration | FullFretboard rendering | Svelte Testing Library: render with visible shapes, verify SVG structure |
| Integration | CagedTool view toggle | Test that mode switch renders correct component |
| Visual | Full Neck overlay | Manual: verify color coding, overlapping notes, diamond roots |

## Migration / Rollout

No migration required. FullFretboard is an additive component. CagedTool switches default view from grid to full neck. Rollback: revert CagedTool to always render Shape Grid, delete FullFretboard.svelte and FL constants from layout.ts.

## Open Questions

- [ ] None — all design decisions resolved per user input