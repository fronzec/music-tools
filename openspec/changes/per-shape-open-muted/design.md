# Design: Per-Shape Open/Muted Indicators

## Overview

Restructure O/× indicators from a single per-string row at the nut (guarded by `isOpenPosition`) to per-(baseFret, stringIndex) groups positioned at each shape's base position. Indicators animate alongside their shape on root changes.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `FullFretboard.svelte` | Modified | Restructure `stringIndicators` → `positionIndicators` derived; update rendering loop |
| `Fretboard.svelte` | Modified | Adjust indicator X position for barre shapes; remove barre-guard on indicators |
| `layout.ts` | Modified | Add `indicatorX()` helper |

## Refactored `stringIndicators` → `positionIndicators`

In `FullFretboard.svelte`, replace the existing `stringIndicators` derived (lines 57–86) with:

```typescript
let positionIndicators = $derived.by(() => {
  const groups = new Map<string, {
    baseFret: number;
    stringIndex: number;
    indicators: Array<{ shape: CagedShape; type: 'open' | 'muted'; color: string }>;
  }>();

  for (const shapeType of CAGED_ORDER) {
    const shape = shapes.find((s) => s.shape === shapeType);
    if (!shape || !visibleShapes.has(shapeType)) continue;

    for (let i = 0; i < 6; i++) {
      const fret = shape.frets[i];
      if (fret === 0 || fret === null) {
        const key = `${shape.baseFret}-${i}`;
        if (!groups.has(key)) {
          groups.set(key, { baseFret: shape.baseFret, stringIndex: i, indicators: [] });
        }
        groups.get(key)!.indicators.push({
          shape: shapeType,
          type: fret === 0 ? 'open' : 'muted',
          color: SHAPE_COLORS[shapeType],
        });
      }
    }
  }

  return [...groups.values()];
});
```

**Key changes:**
- Groups by composite key `${baseFret}-${stringIndex}` instead of just `stringIndex`
- Iterates over all visible shapes, not just open-position shapes
- No `isOpenPosition` guard
- Returns flat array of group objects for `{#each}` iteration

## Indicator X Positioning

Add a helper in `layout.ts`:

```typescript
/**
 * Returns the X coordinate for an indicator group at a given baseFret.
 * baseFret=0 → near nut; baseFret>0 → left of barre fret line.
 */
export function indicatorX(baseFret: number, minFret: number): number {
  if (baseFret === 0) {
    return L.LEFT_PAD + L.NUT_W + 6; // near nut, matching current offset
  }
  return fretLineX(baseFret - minFret) - L.FRET_SP / 2 - 8;
}
```

**Rationale for constants:**
- `+6` (nut): visually aligns the first indicator with the nut area; preserves current visual offset
- `-8` (barre): centers the indicator group to the left of the barre fret line; `FRET_SP/2` gets midpoint between fret lines, `-8` nudges left for visual balance

## Rendering Template (FullFretboard)

Replace the existing indicator block (lines 365–383) with:

```svelte
<!-- Open/Muted indicators — per-(baseFret, stringIndex) groups -->
{#each positionIndicators as group (group.baseFret + '-' + group.stringIndex)}
  {@const cx = indicatorX(group.baseFret, minFret)}
  {@const cy = stringY(group.stringIndex) - L.ROOT_R - 4}

  <g
    style={reducedMotion ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
    transform="translate({cx}, {cy})"
  >
    {#each group.indicators as indicator, j}
      <text
        x={j * FL.INDICATOR_SP}
        y="0"
        text-anchor="middle"
        font-size={FL.INDICATOR_FS}
        fill={indicator.color}
        font-weight="bold"
        opacity={indicator.type === 'muted' ? 0.6 : 0.85}
      >
        {indicator.type === 'open' ? 'O' : '×'}
      </text>
    {/each}
  </g>
{/each}
```

**Key changes:**
- Each group is wrapped in `<g>` with `transform` for animation
- `key` is `${baseFret}-${stringIndex}` for stable DOM identity
- `transition` on `transform` slides the group with its shape on root change
- `reducedMotion` disables the transition (instant snap)
- Horizontal stacking within group uses `j * FL.INDICATOR_SP`

## Fretboard Changes

In `Fretboard.svelte`, modify the indicator block (lines 184–207):

**Current logic:**
- Only renders for `fret === 0 && !isBarre` (open) or `fret === null` (muted)
- Fixed X position: `LEFT_PAD + NUT_W / 2`

**New logic:**
- Render for `fret === null` (muted) regardless of `isBarre`
- Render for `fret === 0 && !isBarre` (open) — open strings in a barre are rendered as barre, not as O
- For `baseFret === 0`: `x = LEFT_PAD + NUT_W / 2` (same as current)
- For `baseFret > 0`: `x = fretLineX(0) - L.FRET_SP / 2 - 8` (left of barre, since barre is at displayed fret 0)

```svelte
<!-- Open (O) / muted (×) indicators -->
{#each [0, 1, 2, 3, 4, 5] as i (i)}
  {@const fret = shape.frets[i]!}
  {@const indicatorXPos = isBarre
    ? fretLineX(0) - L.FRET_SP / 2 - 8
    : L.LEFT_PAD + L.NUT_W / 2}

  {#if fret === 0 && !isBarre}
    <text
      x={indicatorXPos}
      y={stringY(i) - L.ROOT_R - 2}
      text-anchor="middle"
      font-size={L.LABEL_FS + 2}
      fill={SHAPE_COLORS[shape.shape]}
      font-weight="bold"
    >O</text>
  {:else if fret === null}
    <text
      x={indicatorXPos}
      y={stringY(i) - L.ROOT_R - 2}
      text-anchor="middle"
      font-size={L.LABEL_FS + 2}
      fill={SHAPE_COLORS[shape.shape]}
      opacity="0.6"
      font-weight="bold"
    >×</text>
  {/if}
{/each}
```

**Note:** `fret === 0 && isBarre` is handled by the barre rectangle, not by an O indicator.

## Animation Strategy

- **FullFretboard:** Group-level `<g>` with `transform` + `transition: transform`.
- **Fretboard:** Individual `<text>` elements with `transition` on `x` (or keep static if no root-change animation is needed for single-shape view). For consistency, add `transition: x` to the `<text>` elements.

**Reduced motion:** Both components already have `reducedMotion` state. Wrap transition styles in `{#if !reducedMotion}`.

## Test Updates

| Test File | Update |
|-----------|--------|
| `FullFretboard.test.ts` | Assert indicators grouped by `${baseFret}-${stringIndex}`; assert barre shapes have indicators; assert animation class/transition present |
| `Fretboard.test.ts` | Assert barre shape shows × at left of barre; assert X position for `baseFret > 0` |

## Backward Compatibility

- Indicator glyphs (O/×), colors, font sizes, and opacities unchanged
- Only positioning and grouping behavior change
- `isOpenPosition` derived can be removed entirely (no other consumers)
- `layout.ts` addition is a new export; no existing code affected

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Visual density at high baseFrets | Indicators are small (9px font); only 1–5 per group; groups spread across neck |
| `fret=0` ambiguity in barre position | `isBarre` flag already distinguishes; barre rect renders, no O indicator |
| Animation jank | CSS `transform` is GPU-composited; low element count per group |

## Rollback

Single commit revert: restore `stringIndicators` and `isOpenPosition` guard, revert rendering blocks.
