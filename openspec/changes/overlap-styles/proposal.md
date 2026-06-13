# Proposal: Overlap Visualization Styles

## Intent

Overlapping notes on the full fretboard render as concentric rings—adequate but visually cluttered with 3+ overlaps. Users need interchangeable visualization styles for clarity and preference.

## Scope

### In Scope
- `OverlapStyle` type: `'split'` | `'dots'` | `'gradient'`
- Three rendering branches in `FullFretboard.svelte` replacing concentric rings
- Style constants in `FL` (layout.ts): dot overlap offset, gradient orientation
- `<defs>` for gradient style (per position pair, first 2 colors)
- Style toggle card in `CagedTool.svelte` (segmented control, Full Neck + Dual modes only)
- `localStorage` persistence of selected style
- Remove `OverlapDemo.svelte` and its import

### Out of Scope
- Overlap styles for single-shape `Fretboard.svelte` (no overlaps by definition)
- Per-chord style memory (global preference only)
- Animating between styles on toggle (instant swap acceptable)

## Capabilities

### New Capabilities
- `overlap-styles`: user-selectable visual representation for overlapping notes on the full fretboard with three interchangeable render modes

### Modified Capabilities
- `full-fretboard`: overlap rendering behavior changes from hardcoded concentric rings to style-branched rendering; new `OverlapStyle` prop added
- `caged-visualizer`: controls bar gains a Style card with segmented toggle and localStorage persistence

## Approach

1. Add `type OverlapStyle = 'split' | 'dots' | 'gradient'` to `chord.ts`
2. Add `OVERLAP_DOT_OFFSET` and `OVERLAP_GRADIENT_DIR` to `FL` in `layout.ts`
3. Replace lines 466-521 in `FullFretboard.svelte` (overlapIndex ≥ 1 block) with three branches:
   - **split**: semicircle left/right using `<path>` arcs, note name centered
   - **dots**: overlapping `<circle>` elements offset ±`OVERLAP_DOT_OFFSET`, note in overlap zone
   - **gradient**: `<circle>` fill `url(#grad-posKey)`, `<linearGradient>` in `<defs>`
4. 3+ overlaps: split/gradient use first 2 colors only; dots chain N circles horizontally
5. Add `<defs>` block per overlap position requiring gradient style
6. Add `overlapStyle` state + segmented toggle card in `CagedTool.svelte`; read/write `localStorage`
7. Delete `OverlapDemo.svelte`, remove import

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/types/chord.ts` | Modified | Add `OverlapStyle` type export |
| `src/lib/theory/layout.ts` | Modified | Add dot/gradient constants to `FL` |
| `src/lib/components/FullFretboard.svelte` | Modified | Replace overlap rendering with style branches; accept `overlapStyle` prop; add `<defs>` |
| `src/lib/components/CagedTool.svelte` | Modified | Add Style card; remove OverlapDemo import and render |
| `src/lib/components/OverlapDemo.svelte` | Removed | Delete file |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Gradient `<defs>` ID collision with multiple FullFretboard instances (dual mode) | Low | Scoped IDs include position key; SVG viewBox isolation |
| Dots style readability with 5 overlapping shapes | Medium | Design review before merge; chain offset keeps circles legible |
| localStorage parse failure on corrupt value | Low | Fallback to default `'split'` on parse error |

## Rollback Plan

Revert commit. Style toggle card removed from CagedTool, `overlapStyle` prop removed from FullFretboard, concentric ring rendering restored. OverlapDemo.svelte is already deleted—recovery from git history.

## Dependencies

- None (no new packages, no external APIs)

## Success Criteria

- [ ] All 3 styles render correctly for 2, 3, 4, and 5 overlapping shapes
- [ ] Style toggle persists across page reloads (localStorage)
- [ ] Dual Compare mode: each fretboard uses the same shared style preference
- [ ] Empty state (0 shapes) and single-shape states render identically to current
- [ ] OverlapDemo.svelte is removed with no unused imports
