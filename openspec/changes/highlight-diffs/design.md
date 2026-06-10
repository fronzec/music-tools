# Design: Highlight Diffs in Dual Compare

## Technical Approach

Extract `NoteEntry` + `buildPositionMap()` from `FullFretboard.svelte` into a shared `src/lib/theory/fretboard.ts` module. Add an optional `highlightPositions` prop to `FullFretboard` that renders diff rings outside existing note shapes. `DualFretboard` computes a `diffPositions` map by intersecting both fretboards' position maps and classifying shared keys as `same` or `different`, then passes the map to both `FullFretboard` instances.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| Utility location | `src/lib/theory/fretboard.ts` | Keep inline or put in `types/` | Matches existing `src/lib/theory/` pattern (`layout.ts`, `notes.ts`). Pure computation, not a type. |
| Key format | `{absFret},{stringIndex}` | Nested Map or object | Matches existing `positionMap` key format in FullFretboard — zero re-keying. |
| Ring shape | Matches note shape (diamond for root, circle for tone) | Always circle | Diamond root notes are visually distinct; a circular ring around a diamond looks mismatched. |
| Diff computation location | Inline `$derived.by()` in DualFretboard | Separate `computeDiffPositions()` in util | Diff only matters for dual mode; keeping it near the consumer avoids premature abstraction. |
| Prop type | `Map<string, DiffEntry>` | Signal/store | Svelte 5 `$derived.by()` returns a plain Map — no reactivity wrapper needed. |

## Data Flow

```
DualFretboard
  │
  ├─ shapes1 / visibleShapes1 ──→ buildPositionMap() ──→ map1
  ├─ shapes2 / visibleShapes2 ──→ buildPositionMap() ──→ map2
  │
  ├─ diffPositions = $derived.by(): intersect map1 ∩ map2, classify by interval
  │   └── Map<string, DiffEntry>  (keyed by "absFret,stringIndex")
  │
  ├─ <FullFretboard ... highlightPositions={diffPositions} />
  └─ <FullFretboard ... highlightPositions={diffPositions} />
```

Each `FullFretboard` renders notes as before, then checks `highlightPositions?.has(key)` per position and draws a ring outside the note shape.

## Component Architecture

```
DualFretboard.svelte
  ├── $derived: shapes1, shapes2 (from getShapes)
  ├── $derived.by: diffPositions (intersect + classify)
  ├── <FullFretboard shapes={s1} visibleShapes={vs1} highlightPositions={diffPositions} ... />
  └── <FullFretboard shapes={s2} visibleShapes={vs2} highlightPositions={diffPositions} ... />

FullFretboard.svelte
  ├── Import buildPositionMap, NoteEntry from $lib/theory/fretboard
  ├── $derived.by: positionMap = buildPositionMap(shapes, visibleShapes)
  ├── Prop: highlightPositions?: Map<string, DiffEntry>
  └── SVG render loop: note shapes + optional diff rings
```

## Shared Utility Design

### `src/lib/theory/fretboard.ts`

```typescript
import type { ChordShape, CagedShape } from '$lib/types/chord';
import { CAGED_ORDER } from '$lib/types/chord';
import { SHAPE_COLORS } from '$lib/theory/layout';

export interface NoteEntry {
  shape: CagedShape;
  color: string;
  isRoot: boolean;
  interval: string | null;
  absFret: number;
  stringIndex: number;
}

export interface DiffEntry {
  type: 'same' | 'different';
  interval1: string | null;
  interval2: string | null;
}

export function buildPositionMap(
  shapes: ChordShape[],
  visibleShapes: Set<CagedShape>,
): Map<string, NoteEntry[]> {
  const map = new Map<string, NoteEntry[]>();

  for (const shapeType of CAGED_ORDER) {
    const shape = shapes.find((s) => s.shape === shapeType);
    if (!shape || !visibleShapes.has(shapeType)) continue;

    const isBarre = shape.baseFret > 0;
    for (let i = 0; i < 6; i++) {
      const fret = shape.frets[i];
      if (fret === null) continue;
      const absFret = isBarre ? shape.baseFret + fret : fret;
      const key = `${absFret},${i}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        shape: shapeType,
        color: SHAPE_COLORS[shapeType],
        isRoot: shape.intervals[i] === 'R',
        interval: shape.intervals[i],
        absFret,
        stringIndex: i,
      });
    }
  }

  for (const notes of map.values()) {
    notes.sort((a, b) => CAGED_ORDER.indexOf(a.shape) - CAGED_ORDER.indexOf(b.shape));
  }

  return map;
}
```

> Extracted verbatim from FullFretboard `positionMap` $derived.by — identical logic.

## FullFretboard Changes

### New Prop

```typescript
interface Props {
  shapes: ChordShape[];
  visibleShapes: Set<CagedShape>;
  labelMode: LabelMode;
  width?: number;
  highlightPositions?: Map<string, DiffEntry>;  // NEW
}
```

### Refactor

Replace the inline `positionMap` $derived.by block with:

```typescript
let positionMap = $derived(buildPositionMap(shapes, visibleShapes));
```

Import `buildPositionMap`, `NoteEntry`, `DiffEntry` from `$lib/theory/fretboard`.

### Ring Rendering

Inside the `{#each [...positionMap.entries()]}` loop, after the note shape (circle/diamond) and before the label text, add:

```svelte
{#if highlightPositions?.has(_key)}
  {@const diff = highlightPositions.get(_key)!}
  {@const ringR = (entry.isRoot ? FL.ROOT_DIAMOND_R : L.TONE_R) + 4}
  {#if diff.type === 'different'}
    {#if entry.isRoot}
      <polygon
        points={diamondPoints(cx, cy, ringR)}
        fill="none"
        stroke="#F59E0B"
        stroke-width="2"
        stroke-dasharray="3 2"
        opacity="0.6"
      />
    {:else}
      <circle
        cx={cx} cy={cy} r={ringR}
        fill="none"
        stroke="#F59E0B"
        stroke-width="2"
        stroke-dasharray="3 2"
        opacity="0.6"
      />
    {/if}
  {:else if diff.type === 'same'}
    {#if entry.isRoot}
      <polygon
        points={diamondPoints(cx, cy, ringR)}
        fill="none"
        stroke="#22C55E"
        stroke-width="1.5"
        opacity="0.5"
      />
    {:else}
      <circle
        cx={cx} cy={cy} r={ringR}
        fill="none"
        stroke="#22C55E"
        stroke-width="1.5"
        opacity="0.5"
      />
    {/if}
  {/if}
{/if}
```

**SVG z-order**: Rings render after the note shape (circle/diamond) but before the label `<text>`, ensuring labels stay legible.

**Accessibility**: Rings have no `aria-label` or `<title>` — they are purely visual. Screen readers describe notes only.

## DualFretboard Changes

### New Import

```typescript
import { buildPositionMap, type DiffEntry } from '$lib/theory/fretboard';
```

### New Derived

```typescript
let diffPositions = $derived.by(() => {
  const result = new Map<string, DiffEntry>();
  const map1 = buildPositionMap(shapes1, visibleShapes1);
  const map2 = buildPositionMap(shapes2, visibleShapes2);

  for (const [key, entries1] of map1) {
    const entries2 = map2.get(key);
    if (!entries2) continue;

    const interval1 = entries1[0]!.interval;
    const interval2 = entries2[0]!.interval;

    if (interval1 === null || interval2 === null) continue;

    result.set(key, {
      type: interval1 === interval2 ? 'same' : 'different',
      interval1,
      interval2,
    });
  }

  return result;
});
```

### Pass to FullFretboard

```svelte
<FullFretboard shapes={shapes1} visibleShapes={visibleShapes1} {labelMode} {width} highlightPositions={diffPositions} />
<FullFretboard shapes={shapes2} visibleShapes={visibleShapes2} {labelMode} {width} highlightPositions={diffPositions} />
```

## Visual Design — Ring Specs

| Property | Same (green) | Different (amber) |
|---|---|---|
| Color | `#22C55E` | `#F59E0B` |
| Stroke | Solid, `1.5` | Dashed `3 2`, `2` |
| Opacity | `0.5` | `0.6` |
| Fill | `none` | `none` |
| Radius (circle) | `L.TONE_R + 4` | `L.TONE_R + 4` |
| Radius (diamond) | `FL.ROOT_DIAMOND_R + 4` | `FL.ROOT_DIAMOND_R + 4` |
| Shape | Circle or diamond (matches note) | Circle or diamond (matches note) |
| Z-order | After note fill, before label | After note fill, before label |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| **Unit** | `buildPositionMap()` extracted utility | Vitest: verify identical output to inline logic — same keys, entries, sort order |
| **Unit** | `DiffEntry` classification | Vitest: same interval → `'same'`, different → `'different'`, null excluded, unique positions excluded |
| **Component** | FullFretboard with no `highlightPositions` | Existing tests unchanged — backward compat |
| **Component** | FullFretboard with green ring | Render with `highlightPositions` containing a `'same'` entry; assert `<polygon>` or `<circle>` with stroke `#22C55E` |
| **Component** | FullFretboard with amber dashed ring | Render with `'different'` entry; assert `stroke-dasharray="3 2"`, stroke `#F59E0B` |
| **Integration** | DualFretboard diff computation | Render DualFretboard with different roots; verify both SVGs contain highlight rings at shared positions |
| **Integration** | No overlap → no rings | Render with roots that share no positions; assert zero highlight SVG elements |

## File Inventory

| File | Action | Description |
|---|---|---|
| `src/lib/theory/fretboard.ts` | **Create** | `NoteEntry`, `DiffEntry` types; `buildPositionMap()` function |
| `src/lib/components/FullFretboard.svelte` | **Modify** | Import shared util; add `highlightPositions` prop; add ring rendering |
| `src/lib/components/DualFretboard.svelte` | **Modify** | Import util + `DiffEntry`; add `diffPositions` $derived; pass to FullFretboard |
| `tests/components/FullFretboard.test.ts` | **Modify** | Add highlight ring rendering tests |
| `tests/components/DualFretboard.test.ts` | **Modify** | Add diff computation + ring integration tests |

## Open Questions

- [ ] None — all decisions resolved in proposal and specs.