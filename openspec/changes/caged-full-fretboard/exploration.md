## Exploration: Full-Neck CAGED Fretboard (All 5 Shapes Overlay)

### Current State

The CAGED visualizer (`CagedTool.svelte`) displays 5 `ShapeCard` components in a responsive grid (1-3 columns). Each card contains a mini `Fretboard.svelte` SVG showing a single `ChordShape`. The fretboard component:

- Accepts **one** `ChordShape` via props
- Computes its own fret range from `baseFret` + max fret in the shape
- Uses `viewBoxW(displaySpan)` to size the SVG (FRET_SP=50px per fret)
- Renders: nut/barre indicator, 6 string lines, fret lines, fret markers, O/× indicators, barre rect, note circles (root=blue, tone=green, other=gray outline), and labels

Data: `caged-shapes.json` has 120 shapes (12 roots × 2 qualities × 5 shapes). Each shape has `frets: [6]`, `intervals: [6]`, `baseFret`, `rootString`.

### Affected Areas

- `src/lib/components/Fretboard.svelte` — needs multi-shape rendering or a sibling component
- `src/lib/components/CagedTool.svelte` — replace grid with single full fretboard + controls
- `src/lib/components/ShapeCard.svelte` — may become obsolete or repurposed as shape legend
- `src/lib/theory/layout.ts` — may need wider-range helpers or configurable FRET_SP
- `src/lib/types/chord.ts` — may need a `ShapeVisibility` type for toggles

### Fret Range Analysis (Sampled Across All Chords)

Computed absolute fret ranges for representative chords:

| Chord | Min Fret | Max Fret | Span |
|-------|----------|----------|------|
| C major | 1 | 13 | 13 |
| C minor | 1 | 15 | 15 |
| E major | 1 | 12 | 12 |
| E minor | 1 | 12 | 12 |
| G major | 1 | 13 | 13 |
| G minor | 3 | 15 | 13 |
| F# major | 2 | 14 | 13 |
| F# minor | 2 | 14 | 13 |

**Key finding**: The widest span is **15 frets** (C minor: frets 1-15). At current FRET_SP=50px, that's 750px for fret columns + ~34px padding = ~784px viewBox width. This is manageable on desktop but requires careful sizing.

### Approaches

#### Approach 1: Extend `Fretboard.svelte` to Accept `ChordShape[]`

Modify the existing component to accept an optional `shapes: ChordShape[]` prop alongside the existing `shape` prop. When `shapes` is provided, compute global fret range and render all shapes overlaid.

- **Pros**: Single component, no duplication, backward compatible (keep `shape` prop for single-shape mode)
- **Cons**: Component becomes more complex, two rendering modes in one file
- **Effort**: Medium

#### Approach 2: New `FullFretboard.svelte` Component

Create a dedicated component for multi-shape rendering. `CagedTool` switches from `ShapeCard` grid to `FullFretboard`. Keep `Fretboard.svelte` unchanged.

- **Pros**: Clean separation, no risk of breaking existing single-shape rendering, easier to test
- **Cons**: Some code duplication (fret lines, string lines, markers are shared)
- **Effort**: Medium

**Recommendation**: **Approach 2** — new `FullFretboard.svelte`. The rendering logic for overlay is fundamentally different (multiple barre rects, overlapping notes, shape visibility). Keeping them separate is cleaner. We can extract shared SVG primitives (string lines, fret lines, markers) into a helper if duplication becomes problematic.

### Visual Differentiation Strategy

#### Per-Shape Color Scheme (Recommended)

Assign each CAGED shape a distinct color used for its **note circles and barre indicators**:

| Shape | Color | Hex |
|-------|-------|-----|
| C | Blue | `#3B82F6` |
| A | Orange | `#F97316` |
| G | Green | `#22C55E` |
| E | Red | `#EF4444` |
| D | Purple | `#A855F7` |

This replaces the current semantic coloring (root=blue, tone=green, other=gray). In the overlay view, **shape identity is more important than interval type** — the user needs to see "where is the C shape vs the G shape."

#### Shape Legend

Add a small legend above/below the fretboard showing each shape's color + letter. This doubles as the toggle controls (click to show/hide).

#### Overlapping Notes

When two shapes place a note on the same (string, fret) position:
- **Same interval** (e.g., both have root on string 5, fret 3): render a single circle with a subtle double-ring or slightly larger radius
- **Different intervals** (rare but possible): render the circle for the first visible shape, with a small badge or tooltip showing both

#### Barre Overlaps

Multiple shapes may have barre indicators at different fret positions. Render each barre with its shape's color at reduced opacity (0.5-0.65). Since barres are horizontal rects spanning multiple strings, they won't visually conflict unless two shapes barre at the exact same fret range (unlikely given different baseFrets).

### Component Architecture

```
CagedTool.svelte
├── Controls bar (existing: chord selector, quality, label mode)
├── Shape toggle bar (NEW: 5 colored buttons, click to toggle visibility)
├── FullFretboard.svelte (NEW: single SVG with all visible shapes)
└── Shape legend (inline or integrated into toggle bar)
```

**`FullFretboard.svelte` props**:
```ts
interface Props {
  shapes: ChordShape[];           // All 5 shapes for current chord
  labelMode: LabelMode;
  showNotes?: boolean;
  visibleShapes: Set<CagedShape>; // Which shapes to render
  width?: number;                 // Optional fixed width
}
```

**Fret range computation** (inside `FullFretboard`):
```ts
// For each visible shape, compute absolute fret range
let allAbsFrets = $derived.by(() => {
  const frets: number[] = [];
  for (const shape of shapes.filter(s => visibleShapes.has(s.shape))) {
    const isBarre = shape.baseFret > 1;
    for (const f of shape.frets) {
      if (f !== null) {
        frets.push(isBarre ? shape.baseFret + f : f);
      }
    }
  }
  return frets;
});

let minFret = $derived(allAbsFrets.length > 0 ? Math.min(...allAbsFrets) : 0);
let maxFret = $derived(allAbsFrets.length > 0 ? Math.max(...allAbsFrets) : 0);
let displaySpan = $derived(maxFret - minFret + 2); // +1 for padding
```

**ViewBox**: The X origin shifts to `minFret` instead of always starting at 0 or baseFret. All `noteX` calls need to account for this offset.

### Shape Toggle Behavior

- Default: all 5 shapes visible
- Toggle buttons: colored pills with shape letter (C, A, G, E, D)
- Click to toggle individual shapes on/off
- "Show All" / "Hide All" quick actions
- When only 1 shape is visible, the fretboard auto-shrinks to that shape's range
- State persists per chord selection (reset when chord changes)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back          CAGED Chord Visualizer                     │
├─────────────────────────────────────────────────────────────┤
│  Chord: [C] [C#] [D] [D#] [E] [F] [F#] [G] [G#] [A] [A#] [B] │
│  Quality: [Major] [Minor]    Labels: [Intervals] [Notes]    │
├─────────────────────────────────────────────────────────────┤
│  Shapes: [C] [A] [G] [E] [D]  [Show All] [Hide All]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          FULL FRETBOARD SVG (700-900px wide)         │   │
│  │  [nut] ||--|--|--|--|--|--|--|--|--|--|--|--||       │   │
│  │        o  o  o  o  o  o  o  o  o  o  o  o           │   │
│  │  (colored circles per shape, barres, markers)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Legend: C=🔵 A=🟠 G=🟢 E=🔴 D=🟣                          │
└─────────────────────────────────────────────────────────────┘
```

### Edge Cases

1. **Null (muted) strings**: Different shapes mute different strings. In overlay, show O/× per shape only when that shape is the sole user of that position, or aggregate: if ANY visible shape plays a string open, show O; if ALL visible shapes mute it, show ×.

2. **Nut vs barre**: Shapes with `baseFret=1` render from fret 0 (open). Shapes with `baseFret>1` render from their base fret. The global fret range must include fret 0 if any visible shape is open-position.

3. **Very wide ranges**: If a chord's shapes span frets 1-15, the SVG is ~784px at FRET_SP=50. On smaller desktop screens, consider:
   - Reducing FRET_SP to 40px for wide ranges
   - Making the SVG horizontally scrollable
   - Adding a "zoom" control

4. **All shapes hidden**: If user hides all 5 shapes, show a message "Select at least one shape" or auto-show all.

5. **Root note overlap**: All 5 shapes share the same root note (e.g., C). The root circles will appear at different positions but represent the same note. Consider a unified root indicator style (e.g., double ring or star) to emphasize "these are all C roots."

### Open Questions for User

1. **Color scheme**: The proposed per-shape colors (blue/orange/green/red/purple) replace the current semantic coloring (root/tone/other). Is this acceptable? Should there be a toggle between "shape view" and "interval view"?

2. **Shape toggle default**: Should all 5 shapes be visible by default, or should the user start with a subset?

3. **Fret range display**: Should the fretboard show fret numbers along the bottom edge? (Currently no fret numbers are shown.)

4. **Scrolling vs fitting**: If the fretboard is wider than the viewport, should it scroll horizontally or scale down to fit?

5. **ShapeCard retention**: Should the individual ShapeCard view be kept as an alternative view mode (toggle between "grid" and "full neck"), or completely replaced?

### Risks

- **Visual clutter**: 5 shapes with ~5 notes each = up to 25 circles on one fretboard. Color coding + toggles mitigate this.
- **Performance**: SVG with many elements is fine for 25 circles, but reactivity (chord change, toggle) should be smooth. Svelte 5 runes handle this well.
- **Accessibility**: Screen readers need meaningful descriptions for the composite fretboard. Each shape's notes should be described in aggregate.

### Ready for Proposal

**Yes.** The exploration identifies a clear path:
1. Create `FullFretboard.svelte` accepting `ChordShape[]` + visibility set
2. Compute global fret range across visible shapes
3. Per-shape color coding with toggle controls
4. Replace `CagedTool` grid with single fretboard + controls
5. Keep `Fretboard.svelte` unchanged for backward compatibility

Open questions above should be resolved during the proposal phase.
