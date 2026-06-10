# Proposal: Fix Open/Muted String Indicators

## Intent

FullFretboard renders O/× indicators INSIDE the `CAGED_ORDER` loop — up to 5 overlapping indicators at the same string position, making them illegible. Each shape's indicator overwrites the previous, and muted indicators all use generic gray instead of shape colors, losing shape identity.

## Scope

### In Scope
- FullFretboard: deduplicate indicators to one compact horizontal row per string, color-coded by `SHAPE_COLORS[shape]`
- Fretboard: match visual style — single indicator per string using shape color instead of gray
- Layout constants: add `INDICATOR_SP` (12px), `INDICATOR_FS` (8px) to `FL`
- FullFretboard.test.ts: indicator rendering tests

### Out of Scope
- Vertical stacked indicator layout (deferred alternative)
- Indicator rendering at non-open positions
- Barre position indicator changes

## Capabilities

### Modified Capabilities
- `full-fretboard`: Open/Muted Strings requirement — replace per-shape overlapping indicators with deduplicated per-string horizontal row at the nut, each indicator colored by `SHAPE_COLORS[shape]`
- `fretboard`: Open and Muted String Indicators requirement — use shape color instead of generic gray for single-shape O/× indicators

## Approach

Pre-compute indicator data per string (0-5) across all visible shapes in CAGED order. For each string, render a horizontal row of tiny colored O/× indicators centered in the nut area, using 12px spacing and 8px font size. Each indicator uses its shape's color. Only visible shapes contribute; muted (fret=null) → ×, open (fret=0) → O, fretted → skip. Fretboard gets same visual style applied to its single-shape case.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/FullFretboard.svelte` | Modified | Move indicator rendering out of shape loop; pre-compute per-string rows |
| `src/lib/components/Fretboard.svelte` | Modified | Use shape color for O/× indicators |
| `src/lib/theory/layout.ts` | Modified | Add `FL.INDICATOR_SP`, `FL.INDICATOR_FS` |
| `src/lib/components/FullFretboard.test.ts` | New | Indicator rendering tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Indicator row overflows viewBox left edge | Low | 5 indicators × 12px = 60px; LEFT_PAD (12px) provides buffer |
| Color contrast on dark backgrounds | Low | Existing SHAPE_COLORS are tested on light backgrounds |

## Rollback Plan

Revert FullFretboard.svelte indicator rendering to inner-loop approach. Remove added FL constants. No data migration required.

## Dependencies

- `SHAPE_COLORS` from `layout.ts` (exists)
- `CAGED_ORDER` from `types/chord.ts` (exists)

## Success Criteria

- [ ] Each string shows one indicator row with distinct per-shape O/× markers
- [ ] Each indicator colored by `SHAPE_COLORS[shape]`
- [ ] Indicators appear in CAGED order (C, A, G, E, D) left to right
- [ ] Fretboard single-shape indicators use shape color, consistent with FullFretboard
- [ ] All existing tests pass; new indicator tests pass
