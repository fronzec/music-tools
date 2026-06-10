# Design: Fix Open/Muted String Indicators

## Architecture Decision: Pre-computed indicator rows

**Decision**: Compute indicator data as a derived `Map<number, IndicatorEntry[]>` before the SVG template, then render one `<g>` per string.

**Rationale**:
- The current approach (inner loop inside `CAGED_ORDER`) causes 5× overlap — fundamentally wrong data structure
- Pre-computing per-string indicator arrays enables a single render loop over strings (0-5), eliminating overlap
- Derived reactivity ($derived) ensures indicators recompute when `visibleShapes` or `shapes` change
- Separates indicator data from shape rendering concerns

## Data Structure

```ts
type IndicatorType = 'open' | 'muted';

interface IndicatorEntry {
  shape: CagedShape;
  type: IndicatorType;     // 'open' → O, 'muted' → ×
  color: string;           // SHAPE_COLORS[shape]
}
```

Computation (`$derived.by`):
1. Init `Map<number, IndicatorEntry[]>` — key is `stringIndex` (0-5)
2. Iterate `CAGED_ORDER` shapes that are in `visibleShapes`
3. For each `stringIndex` 0-5: check `shape.frets[i]`
   - `null` → push `{ shape, type: 'muted', color }`
   - `0` → push `{ shape, type: 'open', color }`
   - `> 0` → skip
4. Only compute when `isOpenPosition` is true

## Layout Constants

Add to `FL` in `src/lib/theory/layout.ts`:

```ts
/** Center-to-center horizontal spacing between per-shape indicators. */
INDICATOR_SP: 12,
/** Font size for O/× indicator text. */
INDICATOR_FS: 8,
```

## SVG Rendering

### Position computation

- Row center X: `LEFT_PAD + NUT_W / 2` (= 15)
- Y per string: `stringY(i) - L.ROOT_R - 2` (same as prior, tight above the string)
- Individual indicator X for entry at index `j` in array of length `n`:
  ```
  indicatorX = rowCenterX + (j - (n - 1) / 2) × INDICATOR_SP
  ```

### SVG template

Single loop over strings 0-5, after the nut and before the shape rendering loop:

```svelte
<!-- Open/muted indicators — deduplicated per-string row -->
{#if isOpenPosition}
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    {@const row = indicatorMap.get(i) ?? []}
    {#if row.length > 0}
      <g>
        {#each row as entry, j (entry.shape)}
          <text
            x={L.LEFT_PAD + L.NUT_W / 2 + (j - (row.length - 1) / 2) * FL.INDICATOR_SP}
            y={stringY(i) - L.ROOT_R - 2}
            text-anchor="middle"
            font-size={FL.INDICATOR_FS}
            fill={entry.color}
            font-weight="bold"
          >{entry.type === 'open' ? 'O' : '×'}</text>
        {/each}
      </g>
    {/if}
  {/each}
{/if}
```

### Z-order

Indicators render AFTER the nut line and BEFORE the shape rendering loop (`{#each CAGED_ORDER}`). They are static elements — no CSS transition.

## Component Tree Impact

```
FullFretboard.svelte
├── SVG viewBox
│   ├── Fret lines
│   ├── String lines
│   ├── Fret markers
│   ├── Nut / base-fret indicator
│   ├── [NEW] Indicator rows (one <g> per string, pre-computed)  ← CHANGED
│   ├── Shape loop (CAGED order — NO MORE O/× inside)            ← CHANGED
│   │   ├── Barre indicators
│   │   └── (O/× indicators REMOVED from here)                    ← CHANGED
│   ├── Note rendering (allNotes)
│   └── Fret numbers
```

## Fretboard Changes

Minimal — replace hardcoded `#6B7280` (O) and `#9CA3AF` (×) with a shape color. Since Fretboard receives a single `shape: ChordShape`, use its color from `SHAPE_COLORS`:

```ts
import { SHAPE_COLORS } from '$lib/theory/layout';

// In template — replace static fills:
fill={SHAPE_COLORS[shape.shape]}   // was: #6B7280 for O
fill={SHAPE_COLORS[shape.shape]}   // was: #9CA3AF for ×
```

Fretboard uses its own layout constants (`L`) and does not need `FL.INDICATOR_SP`/`FL.INDICATOR_FS` — it keeps its current font-size and spacing since there's only one indicator per string.

## Data Flow

```
shapes[] + visibleShapes + isOpenPosition
        │
        ▼
  $derived indicatorMap ───► computed per-string arrays
        │
        ▼
  SVG template ───► one <g> per string, one <text> per indicator
```
