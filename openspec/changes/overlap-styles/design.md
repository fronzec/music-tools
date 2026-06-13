# Design: Overlap Visualization Styles

## Technical Approach

Replace the hardcoded concentric-ring overlap rendering in `FullFretboard.svelte` (lines 466–521) with three interchangeable styles: **split** (semicircle arcs), **dots** (offset overlapping circles), and **gradient** (single circle with linear gradient fill). A new `overlapStyle` prop drives a branch in the SVG render loop. `CagedTool.svelte` adds a segmented-toggle card persisted to `localStorage`, and `OverlapDemo.svelte` is deleted.

## Architecture Decisions

### Decision: OverlapStyle union type in chord.ts

**Choice**: `type OverlapStyle = 'split' | 'dots' | 'gradient'`
**Alternatives**: (1) String enum, (2) numeric constants, (3) runtime-validated object
**Rationale**: Literal union keeps type-narrowing in Svelte templates while staying minimal. No runtime overhead. Matches existing `LabelMode` pattern in the same file.

### Decision: Style constants in FL (not CSS custom properties)

**Choice**: Add `DEFAULT_OVERLAP_STYLE`, `OVERLAP_DOT_OFFSET`, `OVERLAP_ROOT_DOT_OFFSET`, `OVERLAP_SPLIT_OPACITY`, `OVERLAP_DOTS_OPACITY`, `OVERLAP_GRADIENT_OPACITY` to `FL` in layout.ts
**Alternatives**: (1) CSS custom properties, (2) Svelte component constants
**Rationale**: `FL` already owns all FullFretboard layout values. SVG attributes can't consume CSS custom properties without `var()` in `style=`, which breaks Svelte's reactive assignment. Keeping them in `FL` matches the established pattern and makes constants discoverable.

### Decision: Gradient defs generated inside FullFretboard SVG

**Choice**: Reactive `$derived` block produces gradient def objects; `<defs>` renders them at the top of the SVG, each with ID `grad-{posKey}`.
**Alternatives**: (1) Global `<defs>` in a shared SVG sprite, (2) Inline `fill` computed per note
**Rationale**: Scoped IDs per position key (`grad-3,2`) avoid collisions in Dual Compare mode where two FullFretboard SVGs coexist on the page. Svelte reactivity ensures the `<defs>` block updates when shapes change.

### Decision: localStorage key `caged-overlap-style` with parse fallback

**Choice**: Read on mount with `JSON.parse` + validation; write on change; fall back to `'split'` on any error
**Alternatives**: (1) `localStorage` direct string (no JSON), (2) Zustand/Svelte store with persistence middleware
**Rationale**: Existing codebase has no global state store. Direct `localStorage` is the simplest approach and matches how selection state is managed in the tools. JSON parse + type guard prevents corrupted values from crashing the UI.

### Decision: Segmented toggle card hidden in Grid mode

**Choice**: Switch on `viewMode !== 'grid'` for the Style card
**Alternatives**: Always show, disabled in Grid mode
**Rationale**: Grid mode renders `ShapeCard` per shape — no `FullFretboard`, no overlaps. Showing the control would be misleading. Hiding it entirely is cleaner and matches how the Shapes bar is already conditionally rendered (line 243).

## Data Flow

```
CagedTool.svelte
  │
  ├─ localStorage('caged-overlap-style') → overlapStyle state
  │
  ├─ Style card (segmented toggle)
  │     ↓ sets overlapStyle
  │
  └─ <FullFretboard overlapStyle={overlapStyle} .../>
        │
        ├─ if style='gradient': compute gradientDefs → <defs>
        │
        └─ Note render loop (allNotes)
              │
              ├─ overlaps.length === 1 → unchanged rendering
              │
              ├─ overlaps.length > 1 && style='split'
              │     → semicircle <path> arcs (left/right)
              │
              ├─ overlaps.length > 1 && style='dots'
              │     → offset <circle> chain
              │
              └─ overlaps.length > 1 && style='gradient'
                    → single <circle fill="url(#grad-posKey)">
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types/chord.ts` | Modify | Add `OverlapStyle` type export |
| `src/lib/theory/layout.ts` | Modify | Add 6 overlap constants to `FL` |
| `src/lib/components/FullFretboard.svelte` | Modify | Add `overlapStyle` prop; add gradient-defs derived block; replace ring rendering (lines 466–521) with style-branched SVG |
| `src/lib/components/CagedTool.svelte` | Modify | Add `overlapStyle` state + localStorage card; pass prop to FullFretboard instances; remove OverlapDemo import and render |
| `src/lib/components/OverlapDemo.svelte` | Delete | Remove file — functionality absorbed by Style toggle |

## Interfaces / Contracts

### OverlapStyle type

```typescript
// src/lib/types/chord.ts
export type OverlapStyle = 'split' | 'dots' | 'gradient';
```

### FL new constants

```typescript
// src/lib/theory/layout.ts — additions to FL
DEFAULT_OVERLAP_STYLE: 'split' as const,
OVERLAP_DOT_OFFSET: 4,         // px offset for tone circle in dots style
OVERLAP_ROOT_DOT_OFFSET: 5.5,   // px offset for root diamond in dots style
OVERLAP_SPLIT_OPACITY: 0.8,
OVERLAP_DOTS_OPACITY: 0.75,
OVERLAP_GRADIENT_OPACITY: 0.85,
```

### FullFretboard Props (diff)

```typescript
interface Props {
  shapes: ChordShape[];
  visibleShapes: Set<CagedShape>;
  labelMode: LabelMode;
  width?: number;
  highlightPositions?: Map<string, DiffEntry>;
  overlapStyle?: OverlapStyle;  // ← added, defaults to 'split'
}
```

### gradientDefs derived block (FullFretboard)

```typescript
let gradientDefs = $derived.by(() => {
  if (overlapStyle !== 'gradient') return [];
  const defs: { posKey: string; color1: string; color2: string }[] = [];
  for (const [posKey, notes] of overlapGroups) {
    if (notes.length >= 2) {
      defs.push({
        posKey,
        color1: notes[0].color,
        color2: notes[1].color,
      });
    }
  }
  return defs;
});
```

### split rendering SVG pattern (overlapIndex === 0)

Two semicircle `<path>` arcs using SVG arc commands. Left arc uses `overlaps[0].color`, right arc uses `overlaps[1].color`. Note name centered.

### dots rendering SVG pattern (overlapIndex === 0)

Chain of `<circle>` elements offset by `±OVERLAP_DOT_OFFSET` (or `±OVERLAP_ROOT_DOT_OFFSET` for roots). Each circle gets its shape's color. Note name centered across the chain.

### gradient rendering SVG pattern (overlapIndex === 0)

Single `<circle>` with `fill="url(#grad-posKey)"` referencing the `<linearGradient>` in `<defs>`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `OverlapStyle` type narrowing | TypeScript compiler — `FL.DEFAULT_OVERLAP_STYLE` resolves to literal `'split'` |
| Unit | localStorage parse + fallback | Vitest: valid `'dots'` → `'dots'`; invalid `'rings'` → `'split'`; missing key → `'split'` |
| Integration | FullFretboard render per style | Svelte Testing Library: mount with each `overlapStyle`, assert SVG structure |
| Integration | Gradient defs update on shape change | Mount full+dual, toggle shapes, assert `<defs>` count matches overlaps |
| E2E | Style toggle persists across reload | Playwright: select 'gradient', reload, assert gradient renders |
| Visual | 2, 3, 4, 5 overlap rendering per style | Manual review + screenshot comparison |

## Migration / Rollout

No migration required. The `overlapStyle` prop defaults to `'split'`, which renders semicircles (visually distinct from current rings but functionally equivalent). The existing ring rendering code is replaced, not extended — if rollback is needed, revert the commit to restore concentric rings.

## Open Questions

- [ ] Should the dots style for 5+ overlapping shapes use a smaller offset to prevent circles from extending past the fret column? Current `OVERLAP_DOT_OFFSET: 4` may cause horizontal overflow at the extremes.