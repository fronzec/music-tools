# Design: Fix O/× Indicator Positioning v2

## Technical Approach

Replace the single-expression `indicatorX()` with a three-branch formula that correctly handles nut centering, barre column alignment, and absolute positioning. Add `INDICATOR_OPACITY` constant to `FL` and remove hardcoded `0.85`/`0.4` opacity values from both components. Callers drop the `- 8` offset since `indicatorX()` now returns center position directly.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| indicatorX formula | Three-branch conditional | Single expression, two-branch | Divergent caller conventions (Fretboard uses shifted coords, FullFretboard uses absolute) need explicit branch logic |
| Nut offset | `fretLineX(0) + 8` | `fretLineX(0)` (exact center) | 18px badge centered on nut line would be half-covered; +8 offsets badge mostly right of nut, visually "on the nut" |
| Barre offset | `fretLineX(1) - 22` | `fretLineX(0) + X` or `fretLineX(2) - Y` | Fretboard uses shifted coords where `fretLineX(1)` is first column after nut; -22 aligns badge in barre column |
| Absolute offset | `fretLineX(baseFret) + 20` | `fretLineX(baseFret) + FRET_SP/2` | FullFretboard places indicator in barre column; +20 provides consistent visual alignment with note positions |
| Opacity value | 0.6 | 0.75, 0.5 | 0.6 sits between NOTE_OPACITY (0.75) and BARRE_OPACITY (0.35), creating clear visual hierarchy |
| Caller offset removal | Drop `- 8` from both callers | Keep offset in callers | New formula returns center position; `- 8` was an adjustment for the old formula that would double-offset |

## Data Flow

```
Fretboard.svelte
  indicatorX(baseFret, isBarre ? baseFret : 0)
  └── baseFret=0  →  fretLineX(0) + 8     ← nut branch
  └── baseFret>0  →  fretLineX(1) - 22    ← barre branch (minFret===baseFret)

FullFretboard.svelte
  indicatorX(group.baseFret, 0)
  └── baseFret=0  →  fretLineX(0) + 8     ← nut branch
  └── baseFret>0  →  fretLineX(baseFret) + 20  ← absolute branch (minFret=0)
```

Coordinate verification (using `fretLineX(0)=18`, `fretLineX(1)=68`, `fretLineX(3)=168`):

| Case | Caller | Old position | New position |
|------|--------|-------------|--------------|
| Open C (baseFret=0) | Fretboard | `fretLineX(1)-12-8 = 48` | `fretLineX(0)+8 = 26` |
| Barre G (baseFret=3) | Fretboard | `fretLineX(1)-12-8 = 48` | `fretLineX(1)-22 = 46` |
| Open C (baseFret=0) | FullFret | `fretLineX(1)-12-8 = 48` | `fretLineX(0)+8 = 26` |
| Barre G (baseFret=3) | FullFret | `fretLineX(4)-12-8 = 198` | `fretLineX(3)+20 = 188` |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/theory/layout.ts` | Modify | Replace `indicatorX()` with three-branch formula; add `INDICATOR_OPACITY: 0.6` to `FL` |
| `src/lib/components/Fretboard.svelte` | Modify | Remove `- 8` from `indicatorXPos`; replace `opacity="0.85"` and `opacity="0.4"` with `opacity={FL.INDICATOR_OPACITY}` |
| `src/lib/components/FullFretboard.svelte` | Modify | Remove `- 8` from `indicatorX` call; replace `indicator.type === 'muted' ? 0.4 : 0.85` with `FL.INDICATOR_OPACITY` |
| `tests/unit/theory/layout.test.ts` | Modify | Update `indicatorX` tests for three branches; add `FL.INDICATOR_OPACITY` test |
| `tests/components/Fretboard.test.ts` | Modify | Update barre indicator X assertion |
| `tests/components/FullFretboard.test.ts` | Modify | Update indicator X assertion |

## Interfaces / Contracts

```typescript
// layout.ts — three-branch formula
export function indicatorX(baseFret: number, minFret: number): number {
  if (baseFret === 0) return fretLineX(0) + 8;
  if (minFret === baseFret) return fretLineX(1) - 22;
  return fretLineX(baseFret) + 20;
}

// layout.ts — FL constant
INDICATOR_OPACITY: 0.6,
```

```svelte
<!-- Fretboard.svelte — indicator position -->
{@const indicatorXPos = indicatorX(shape.baseFret, isBarre ? shape.baseFret : 0)}
<!-- badge uses: x={indicatorXPos - 9}, text uses: x={indicatorXPos} -->
<!-- badge opacity: opacity={FL.INDICATOR_OPACITY} -->
```

```svelte
<!-- FullFretboard.svelte — indicator position -->
cx: indicatorX(group.baseFret, minFret) + j * FL.INDICATOR_SP,
<!-- badge opacity: opacity={FL.INDICATOR_OPACITY} -->
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `indicatorX` three branches + `FL.INDICATOR_OPACITY` | Assert exact return values per branch |
| Unit | Nut: `indicatorX(0,0) === fretLineX(0)+8` | Numeric assertion |
| Unit | Barre: `indicatorX(3,3) === fretLineX(1)-22` | Numeric assertion |
| Unit | Absolute: `indicatorX(3,0) === fretLineX(3)+20` | Numeric assertion |
| Component | Fretboard barre indicator X | Verify `indicatorX(3,3)` value in rendered output |
| Component | FullFretboard indicator group X | Verify `indicatorX(3,0)` value in rendered translate |
| Component | Both components use `FL.INDICATOR_OPACITY` | Assert `0.6` opacity on indicator rects |

## Migration / Rollout

No migration required. All changes are visual/layout calculations reverted by restoring the old `indicatorX` formula and hardcoded opacities.

## Open Questions

None. All three bugs have clear fixes with verified coordinate math.