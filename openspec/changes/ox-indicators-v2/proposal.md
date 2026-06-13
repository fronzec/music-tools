# Proposal: Fix O/× Indicator Positioning v2

## Intent

PR #21 unified `indicatorX()` but introduced 3 bugs: opacity asymmetry (O=0.85 vs ×=0.4), nut indicators misplaced right of fret 0 line, and barre indicators in wrong fret column. This v2 fixes all three while preserving the unified formula approach.

## Scope

### In Scope
- Add `INDICATOR_OPACITY: 0.6` to `FL` constants in `layout.ts`
- Replace 3-state `indicatorX()` with context-aware formula handling both caller conventions
- Update `Fretboard.svelte` and `FullFretboard.svelte` to use `INDICATOR_OPACITY`
- Update tests for new `indicatorX()` expected values

### Out of Scope
- Changing badge size, colors, font, or shape
- Refactoring barre rendering logic
- Altering `fretLineX()` or `noteX()` formulas

## Capabilities

### Modified Capabilities
- `fretboard`: Update "Open and Muted String Indicators" positioning values (opacity, nut position, barre column)
- `full-fretboard`: Update "Open/Muted Strings" positioning constants for `indicatorX()` and opacity

## Approach

**Three-branch `indicatorX()`** to handle divergent calling conventions:

| Branch | Condition | Caller | Formula | Result |
|--------|-----------|--------|----------|--------|
| Nut | `baseFret === 0` | Both | `fretLineX(0) + 8` | Centered on nut line |
| Barre (shifted) | `minFret === baseFret` | Fretboard | `fretLineX(1) - 22` | Correct barre column |
| Absolute | default | FullFretboard | `fretLineX(baseFret) + 20` | Correct fret column |

**Opacity**: Add `INDICATOR_OPACITY: 0.6` to `FL` constants, replace hardcoded `0.85`/`0.4` in both components.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/layout.ts` | Modified | New `indicatorX()` branches + `FL.INDICATOR_OPACITY` |
| `src/lib/components/Fretboard.svelte` | Modified | Use `INDICATOR_OPACITY` (lines 204, 213) |
| `src/lib/components/FullFretboard.svelte` | Modified | Use `INDICATOR_OPACITY` (line 410) |
| `tests/unit/theory/layout.test.ts` | Modified | Updated expected values |
| `tests/components/Fretboard.test.ts` | Modified | Updated barre X assertion |
| `tests/components/FullFretboard.test.ts` | Modified | Updated indicator X assertion |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Branched formula breaks unknown caller | Low | Both callers audited; branches are disjoint |
| Visual regression in edge cases | Low | Manual verification of all CAGED shapes at open + barre |

## Rollback Plan

Revert to single-branch formula `fretLineX(baseFret + 1 - minFret) - 12` and restore hardcoded opacities. No data migration needed.

## Dependencies

None. Self-contained fix within existing components.

## Success Criteria

- [ ] O and × share same opacity (0.6) between note (0.75) and barre (0.35)
- [ ] Open position: O/× centered on nut line (`fretLineX(0)` = x=18)
- [ ] Barre position: indicators in same fret column as barre (not fret+1)
- [ ] All existing tests pass with updated expected values
- [ ] TypeScript compilation clean (`pnpm tsc --noEmit`)
