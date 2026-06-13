# Design: Fix O/× Indicator Positioning

## Technical Approach

Replace `indicatorX()`'s two-branch conditional with a single unified expression: `fretLineX(baseFret + 1 - minFret) - 12`. This positions indicators at the right edge of their fret space (just before the next fret line), with 3px clearance from the 18px-wide badge. The fix applies only to `layout.ts`; `Fretboard.svelte` already uses the correct inline formula and needs no change.

## Architecture Decisions

### Decision: Unified formula for indicatorX

**Choice**: `fretLineX(baseFret + 1 - minFret) - 12`
**Alternatives considered**: (1) Keep two-branch logic, fix the open branch; (2) Use `noteX` instead of `fretLineX`
**Rationale**: A single expression eliminates the bug class (branch-dependent positioning). Using `fretLineX` directly mirrors `Fretboard.svelte`'s inline formula (`fretLineX(1) - 12`), ensuring both views converge on the same coordinate contract.

### Decision: Caller offset (-8 + j*20) unchanged

**Choice**: Keep the existing `-8 + j*20` offset in `FullFretboard.svelte` line 102
**Alternatives considered**: Refactor the offset into `indicatorX()` or a new constant
**Rationale**: The offset handles multi-shape horizontal stacking at the same (baseFret, stringIndex). Changing it is out of scope for this positioning fix. The new `indicatorX()` value shifts uniformly; the relative offset logic remains valid.

## Data Flow

```
indicatorX(baseFret, minFret)
    │
    ├─ baseFret=0, minFret=0 ──→ fretLineX(1) - 12 = 68-12 = 56
    │                                Badge span: 47–65, next fret at 68 ✓ (3px gap)
    │
    ├─ baseFret=3, minFret=0 ──→ fretLineX(4) - 12 = 218-12 = 206
    │                                Badge span: 197–215, next fret at 218 ✓ (3px gap)
    │
    ├─ baseFret=5, minFret=0 ──→ fretLineX(6) - 12 = 318-12 = 306
    │                                Badge span: 297–315, next fret at 318 ✓ (3px gap)
    │
    └─ baseFret=3, minFret=3 ──→ fretLineX(1) - 12 = 68-12 = 56
                                 (same as open position, correct in shifted view)
```

`FullFretboard.svelte` line 102 consumes: `cx: indicatorX(group.baseFret, minFret) - 8 + j * 20`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/theory/layout.ts` | Modify | Replace two-branch `indicatorX()` with unified formula (~3 lines) |
| `tests/unit/theory/layout.test.ts` | Modify | Update expected values for 3 test cases (~10 lines) |
| `tests/components/FullFretboard.test.ts` | Modify | Update barre indicator X assertion (~3 lines) |
| `tests/components/Fretboard.test.ts` | Modify | Update barre indicator X assertion (~5 lines) |
| `openspec/specs/fretboard/spec.md` | Modify | "left of barre line" → "right edge of fret space" (~3 lines) |
| `openspec/specs/full-fretboard/spec.md` | Modify | "left of barre line" → "right edge of fret space" (~3 lines) |

## Interfaces / Contracts

```typescript
// src/lib/theory/layout.ts — BEFORE (broken, two branches)
export function indicatorX(baseFret: number, minFret: number): number {
  if (baseFret === 0) return L.LEFT_PAD + L.NUT_W + 6;
  return fretLineX(baseFret - minFret) - L.FRET_SP / 2 - 8;
}

// src/lib/theory/layout.ts — AFTER (unified)
export function indicatorX(baseFret: number, minFret: number): number {
  return fretLineX(baseFret + 1 - minFret) - 12;
}
```

Signature unchanged: `(baseFret: number, minFret: number) => number`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `indicatorX(0,0)`, `indicatorX(3,0)`, `indicatorX(5,2)` | Assert against `fretLineX(baseFret+1-minFret) - 12` |
| Unit | Clearance from next fret line | Verify badge span (x±9) doesn't overlap next fret |
| Component (Fretboard) | Barre-position indicator X | Update assertion to expect `fretLineX(1) - 12 - 8` (inline formula + caller offset) |
| Component (FullFretboard) | Barre indicator X uses indicatorX | Verify translate X ≠ old nut position, matches new formula |

## Migration / Rollout

No migration required. One-line formula change, no data/schema impact. Rollback: revert `layout.ts` + test expected values.

## Open Questions

None. Formula is verified via coordinate trace across all key positions.