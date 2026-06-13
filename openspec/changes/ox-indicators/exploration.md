# Exploration: O/× Indicator Positioning — Right Edge of Fret Space

## Current State

### Layout Constants (`layout.ts`)

```
LEFT_PAD = 12, NUT_W = 6, FRET_SP = 50

fretLineX(f) = 18 + f * 50
  fretLineX(0) = 18   (nut / left edge)
  fretLineX(1) = 68   (1st fret line)
  fretLineX(5) = 268  (5th fret line)
  fretLineX(6) = 318  (6th fret line)
```

### Fretboard.svelte (Shape Grid mode)

**Current formula (line 199):**
```ts
const indicatorXPos = fretLineX(1) - 12  // always = 56
```

**Position analysis:**

| Position | rangeStart | fretLineX(0) | fretLineX(1) | indicatorXPos | Badge span (±9) | Fret line after |
|----------|-----------|-------------|-------------|---------------|-----------------|-----------------|
| Open (baseFret=0) | 0 | 18 (nut) | 68 (fret 1) | **56** | 47–65 | 68 |
| Barre (baseFret=5) | 5 | 18 (=fret 5) | 68 (=fret 6) | **56** | 47–65 | 68 |

**BUG:** For barre position, `indicatorXPos` is always 56 regardless of `baseFret`. The formula `fretLineX(1) - 12` does NOT incorporate `rangeStart`. The indicator renders at the SAME screen position for open AND barre shapes — in the middle of the first visible fret column, not at the right edge of the shape's fret space.

For a barre at fret 5, the indicator at x=56 sits in the space between frets 5–6, but it should be at the right edge of the barre's fret space (near fret 6's line at x=68... wait, that's the same x=68). Let me re-examine.

Actually, the issue is subtler. In Fretboard.svelte, the view shifts so that `fretLineX(0)` is always the barre line. So for barre at fret 5:
- `fretLineX(0) = 18` represents the barre at fret 5
- `fretLineX(1) = 68` represents fret 6
- The indicator at x=56 is in the space between barre(fret 5) and fret 6

But the user wants it at the RIGHT edge of the fret space, just BEFORE the next fret line. The space between fret 5 and fret 6 goes from x=18 to x=68. The right edge is near x=68. Current position x=56 is 12px left of x=68 — that IS near the right edge.

**Wait — re-reading the code more carefully:**

The formula `fretLineX(1) - 12 = 56` positions the indicator center at x=56. The badge spans 47–65. The fret line at x=68 is 3px away from the badge right edge. This IS at the right edge of the fret space.

**So for Fretboard.svelte, the current formula IS correct for both open and barre positions** because `fretLineX` is relative to `rangeStart`, and `rangeStart` shifts with the barre position. The indicator always appears in the first visible fret column, near its right edge.

**However**, the semantic meaning is wrong. For barre position, the indicator appears between the barre line and the next fret, but the user might expect it to appear at the position corresponding to the actual open/muted string — which for a barre shape, open strings (fret=0 in barre context) don't exist (they're barred). Only muted strings (null) would show ×, and those should appear at the right edge of the barre's fret space.

### FullFretboard.svelte (Full Neck mode)

**Current formula via `indicatorX()` (layout.ts line 100-103):**
```ts
if (baseFret === 0) return L.LEFT_PAD + L.NUT_W + 6;       // = 24
return fretLineX(baseFret - minFret) - L.FRET_SP / 2 - 8;  // = fretLineX(baseFret) - 33
```

**Position analysis (minFret is always 0 in FullFretboard):**

| Position | baseFret | fretLineX(baseFret) | indicatorX | Badge span (±9) | Next fret line |
|----------|----------|-------------------|------------|-----------------|----------------|
| Open (baseFret=0) | 0 | 18 (nut) | **24** | 15–33 | 68 (fret 1) |
| Barre (baseFret=3) | 3 | 168 (fret 3) | **135** | 126–144 | 168 (fret 3) |
| Barre (baseFret=5) | 5 | 268 (fret 5) | **235** | 226–244 | 268 (fret 5) |

**BUG:** For barre positions, `indicatorX(baseFret, 0)` places the indicator to the LEFT of the barre fret line, not at the right edge of the fret space. For baseFret=5:
- Indicator center at x=235, badge right edge at x=244
- The barre fret line is at x=268
- The indicator is 24px LEFT of the barre line — in the space between frets 4–5
- User wants it at the right edge of the fret space (between frets 5–6, near fret 6's line at x=318)

For open position, the indicator at x=24 is to the RIGHT of the nut (x=18), in the first fret space. But it's near the LEFT edge (15–33 out of 18–68), not the right edge.

### Asymmetry Between Components

| Aspect | Fretboard.svelte | FullFretboard.svelte |
|--------|-----------------|---------------------|
| Open position X | `fretLineX(1) - 12 = 56` (near right edge ✓) | `indicatorX(0, 0) = 24` (near left edge ✗) |
| Barre position X | `fretLineX(1) - 12 = 56` (relative, correct ✓) | `indicatorX(baseFret, 0)` (left of barre ✗) |
| Shows O/× for barre | Yes (all shapes) | Yes (isOpenPosition guard was removed) |
| Positioning helper | Inline formula | `indicatorX()` in layout.ts |

## Root Cause

1. **FullFretboard.svelte**: The `indicatorX()` helper in `layout.ts` was designed to place indicators to the LEFT of the barre line (`fretLineX(baseFret) - 33`). The user wants them at the RIGHT edge of the fret space, just BEFORE the NEXT fret line.

2. **Fretboard.svelte**: The formula `fretLineX(1) - 12` happens to be correct for both open and barre positions because the view shifts with `rangeStart`. However, it's inconsistent with FullFretboard's approach.

3. **Inconsistency**: The two components use different positioning strategies. Fretboard places indicators at the right edge of the first visible fret column; FullFretboard places them to the left of the barre/nut line.

## Desired Position

User wants indicators at the RIGHT edge of the fret space, just before the next fret line:

```
----|------O|----|
    ^      ^
    fret N  fret N+1 (indicator just before this line)
```

The indicator badge (width 18, center at `cx`) should have its right edge (`cx + 9`) just before the fret line, with ~3px clearance.

## Proposed Fix

### 1. New unified formula

For a shape at `baseFret`, the indicator should be positioned at:
```
cx = fretLineX(baseFret + 1 - rangeStart) - 12
```

Where `rangeStart` is the visible range start (0 for FullFretboard, `baseFret` for Fretboard barre position).

### 2. Fretboard.svelte

**No change needed.** The current formula `fretLineX(1) - 12` is already correct because `rangeStart = baseFret` for barre, making it equivalent to `fretLineX(baseFret + 1 - baseFret) - 12 = fretLineX(1) - 12`.

Verify positions:
- Open: `fretLineX(1) - 12 = 56`, badge 47–65, fret line at 68 → 3px clearance ✓
- Barre @5: `fretLineX(1) - 12 = 56`, badge 47–65, fret line at 68 (=fret 6) → 3px clearance ✓

### 3. FullFretboard.svelte — Update `indicatorX()` in `layout.ts`

**Current:**
```ts
export function indicatorX(baseFret: number, minFret: number): number {
  if (baseFret === 0) return L.LEFT_PAD + L.NUT_W + 6;       // 24
  return fretLineX(baseFret - minFret) - L.FRET_SP / 2 - 8;  // left of barre
}
```

**Proposed:**
```ts
export function indicatorX(baseFret: number, minFret: number): number {
  return fretLineX(baseFret + 1 - minFret) - 12;
}
```

Verify positions (minFret = 0):
- Open (baseFret=0): `fretLineX(1) - 12 = 56`, badge 47–65, fret line at 68 → 3px clearance ✓
- Barre @3: `fretLineX(4) - 12 = 218 - 12 = 206`, badge 197–215, fret line at 218 (=fret 4) → 3px clearance ✓
- Barre @5: `fretLineX(6) - 12 = 318 - 12 = 306`, badge 297–315, fret line at 318 (=fret 6) → 3px clearance ✓

### 4. Should FullFretboard show O/× for barre shapes?

**Yes, and it already does.** The `isOpenPosition` guard was removed in the previous `per-shape-open-muted` change. The `positionIndicators` derivation collects indicators from ALL visible shapes regardless of `baseFret`. The rendering loop at line 403 iterates `flatIndicators` without any position guard.

For barre shapes:
- Strings with `fret === 0` are barred (skip — barre rect renders instead)
- Strings with `fret === null` show × indicators
- Open strings in barre context don't exist (fret=0 means barred)

This behavior is correct. The only fix needed is the X positioning.

## Risks

1. **Spec mismatch**: Current specs (`fretboard/spec.md` line 123, `full-fretboard/spec.md` line 155) specify indicators "to the left of the barre fret line." The new positioning places them at the right edge of the fret space. Specs will need updating.

2. **Visual overlap**: At high baseFrets, indicators near the right edge of a fret space might be close to note circles in that fret. The badge right edge is 3px from the fret line, and note circles are centered in the fret space — no overlap expected.

3. **Animation**: FullFretboard indicators use CSS `transform` transitions. The X position change affects the `cx` value in the derived `flatIndicators`, which feeds into the `translate(cx, cy)` transform. Transitions should still work correctly.

## Ready for Proposal

**Yes.** The fix is straightforward:
1. Update `indicatorX()` in `layout.ts` to use the unified formula
2. Verify Fretboard.svelte's inline formula is consistent (it is)
3. Update specs to reflect new positioning
4. No changes to indicator visibility logic (already correct)
