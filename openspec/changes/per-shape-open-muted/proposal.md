# Proposal: Per-Shape Open/Muted Indicators

## Intent

O/× indicators are currently stacked in a fixed horizontal row at the nut — only for shapes at `baseFret=0`. Barre-only shapes get NO indicators. Users can't see which strings are open/muted per shape, forcing guesswork when comparing CAGED voicings. Indicators should follow each shape's position on the neck.

## Scope

### In Scope
- Group O/× indicators by `(baseFret, stringIndex)` instead of `stringIndex` alone
- Position each group at the shape's base position: nut area for `baseFret=0`, left of barre line for `baseFret>0`
- Remove `isOpenPosition` guard — ALL visible shapes show their indicators
- Animate indicator groups alongside their shapes on root change
- Update Fretboard's indicator X position if inconsistent with new approach

### Out of Scope
- Vertical stacking or multi-line indicator layouts
- Per-shape toggle for indicator visibility
- Changes to mute/open detection logic (`fret === 0`, `fret === null`)

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `full-fretboard`: O/× indicator rendering MUST group by `(baseFret, stringIndex)` and position each group at its shape's base position; the `isOpenPosition` guard MUST be removed
- `fretboard`: indicator X position consistency with per-baseFret positioning approach

## Approach

**Per-(baseFret, stringIndex) grouping.** `stringIndicators` derived restructured to group first by `baseFret`, then `stringIndex`. Each group's X position: `baseFret=0` → left of the nut (around `LEFT_PAD - indicatorOffset`); `baseFret>0` → left of the barre fret line (`fretLineX(baseFret) - offset`). Multiple shapes at the same baseFret stack horizontally within their group (current `INDICATOR_SP`).

**Layout constants.** Add an `INDICATOR_X_OFFSET` constant or helper function in `layout.ts` returning X position for a given `baseFret`. Fretboard reuses same logic.

**Animation.** Wrap each indicator group in `<g>` with CSS transition matching `ANIM_DURATION`/`ANIM_EASING` so indicators slide with their shape on root changes. Must honor `prefers-reduced-motion`.

**Backward compat.** Indicator shapes (O/×), colors, font sizes, and opacity unchanged. Only positioning and grouping change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/FullFretboard.svelte` | Modified | `stringIndicators` derived + rendering loop (lines 57–86, 365–383) |
| `src/lib/components/Fretboard.svelte` | Modified | Indicator X position (lines 187–207) if inconsistent |
| `src/lib/theory/layout.ts` | Modified | New `indicatorX()` helper or `INDICATOR_OFFSET` constant |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Visual density at high baseFrets (crowding) | Low | Indicators are small (9px font); only 1–5 per shape group |
| Fret=0 ambiguity in barre position (open vs barre) | Low | `isBarre` flag already in both components; use it to distinguish |
| Animation jank with many indicator groups | Low | CSS `transform` transitions are GPU-friendly; test with all-5-shapes scenario |

## Rollback Plan

Revert `stringIndicators` to single `stringIndex` grouping, restore `isOpenPosition` guard. Single commit revert.

## Dependencies

None.

## Success Criteria

- [ ] CAGED shapes at `baseFret=0`: O/× indicators appear at nut area for each shape
- [ ] Shapes at `baseFret>0`: O/× indicators appear left of their barre fret line
- [ ] All 5 shapes visible: all display indicators regardless of baseFret
- [ ] Root change (e.g., C→A): indicators animate smoothly alongside notes
- [ ] `prefers-reduced-motion`: indicators snap instantly, no animation
- [ ] Single-shape Fretboard: indicators correctly positioned (no regression)
