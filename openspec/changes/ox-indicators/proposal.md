# Proposal: Fix O/× Indicator Positioning

## Intent

O/× indicators on the CAGED fretboard are positioned to the LEFT of the nut/barre line. They should be at the RIGHT edge of their fret space, just before the next fret line. This affects the FullFretboard multi-shape overlay; single-shape Fretboard already positions indicators correctly.

## Scope

### In Scope
- Replace `indicatorX()` in `src/lib/theory/layout.ts` with unified formula
- Update `tests/unit/theory/layout.test.ts` expected values
- Update `tests/components/FullFretboard.test.ts` barre indicator assertion
- Update `tests/components/Fretboard.test.ts` barre indicator assertion
- Update `openspec/specs/fretboard/spec.md` positioning description

### Out of Scope
- Fretboard.svelte — inline formula already correct (view-shifted coords)
- FullFretboard.svelte — consumes `indicatorX()`, auto-fixes
- Any other component, data file, or visual styling

## Capabilities

### Modified Capabilities
- `fretboard`: O/× indicator positioning requirement changes from "left of barre line" to "right edge of fret space"

## Approach

Replace `indicatorX()` two-branch logic with a single expression:

```typescript
export function indicatorX(baseFret: number, minFret: number): number {
  return fretLineX(baseFret + 1 - minFret) - 12;
}
```

`fretLineX(baseFret + 1 - minFret)` gives the X of the NEXT fret line (right boundary of the fret space). Subtracting 12px provides 3px clearance from the 18px-wide indicator badge. Works identically for open (`baseFret=0`) and barre positions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/layout.ts:100-103` | Modified | `indicatorX()` simplified to single expression |
| `tests/unit/theory/layout.test.ts:108-122` | Modified | Expected values for all three test cases |
| `tests/components/Fretboard.test.ts:485-498` | Modified | Barre indicator X assertion |
| `tests/components/FullFretboard.test.ts:598-614` | Modified | Barre indicator X assertion (translate check) |
| `openspec/specs/fretboard/spec.md:123,150,170` | Modified | "left of barre line" → "right edge of fret space" |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regressions in shape grid / full neck views | Low | One-line formula change, existing test coverage |
| Spec drift between single vs multi-shape views | Low | Both views converge on same positioning contract |

## Rollback Plan

Revert `layout.ts` to two-branch logic, revert test expected values. No data migration or schema change.

## Dependencies

None.

## Success Criteria

- [ ] `pnpm build` — zero errors
- [ ] `pnpm vitest run` — all tests pass with updated expected values
- [ ] Manual: O/× appear at right edge of fret space in Shape Grid (open + barre)
- [ ] Manual: O/× appear at right edge of fret space in Full Neck (open position)
