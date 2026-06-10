# Proposal: Animated CAGED Shape Transitions

## Intent

When the root note changes, CAGED shapes snap instantly to new fret positions. Add CSS transitions so shapes smoothly slide across the neck — making the geometric relationship of CAGED shapes visually apparent.

## Scope

### In Scope
- FullFretboard: restructure rendering from `absFret,stringIndex` keys to `shape,stringIndex` keys with `<g transform>` wrappers → DOM persists, only transform changes
- Fretboard: add `transition` CSS to note circles (already keyed by stringIndex — persistent DOM)
- `layout.ts`: add `ANIM_DURATION`, `ANIM_EASING` constants
- Respect `prefers-reduced-motion` (CSS media query disables animation)
- Grid mode covered (Fretboard component, zero extra work)

### Out of Scope
- DualFretboard, CagedTool, ShapeCard — animation is internal to FullFretboard/Fretboard, no consumer changes needed
- Hover/keyboard-driven preview; staggered per-string animation; page-transition framework

## Capabilities

### New Capabilities
- `animated-transitions`: smooth SVG slide animation when CAGED root changes

### Modified Capabilities
- `full-fretboard`: rendering loop restructured from `{#each positionMap}` (keyed `${absFret},${stringIndex}`) to flat list keyed `${shape}-${stringIndex}` with `<g style="transition: transform {{ANIM_DURATION}}ms {{ANIM_EASING}}" transform="translate(cx,cy)">`
- `fretboard`: CSS transition added to existing `<circle>` elements

## Approach

1. **FullFretboard loop restructure**: iterate CAGED_ORDER shapes + string indices (flat list, key `${shape}-${stringIndex}`). Each note wrapped in `<g transform="translate(cx,cy)">`. When root changes, `cx`/`cy` change → CSS animates the transform. `<g>` transform is GPU-accelerated, universal SVG support.
2. **Fretboard CSS**: add `style="transition: transform {{ANIM_DURATION}}ms {{ANIM_EASING}}"` to note circles. String-index keys already persist across re-renders.
3. **Constants**: `ANIM_DURATION = 300`, `ANIM_EASING = 'ease-out'` in `layout.ts`.
4. **Motion respect**: `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0s !important; } }` in a component `<style>` block.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/FullFretboard.svelte` | Modified | Restructure rendering loop; add `<g>` wrappers + transition style |
| `src/lib/components/Fretboard.svelte` | Modified | Add CSS transition to note circles |
| `src/lib/theory/layout.ts` | Modified | Add `ANIM_DURATION`, `ANIM_EASING` constants |
| `openspec/specs/full-fretboard/spec.md` | Modified | Delta for shape-string keying and transform animation |
| `openspec/specs/fretboard/spec.md` | Modified | Delta for CSS transition on notes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Highlight rings + transition z-order | Low | `<g>` wrappers preserve existing render order; rings already inside `<g>` |
| Overlap detection becomes per-shape instead of merged | Low | `NoteEntry` data unchanged; `buildPositionMap()` still callable — dual usage path |
| Barre indicators move separately from notes | Medium | Barres rendered inside same shape iteration with same key structure |

## Rollback Plan

Revert FullFretboard rendering to `{#each positionMap}` keyed by `absFret,stringIndex`; remove `<g>` wrappers and transition styles; drop `ANIM_DURATION`/`ANIM_EASING` from layout.ts. Fretboard: remove transition CSS from circles.

## Dependencies

- `buildPositionMap()` extracted to `src/lib/theory/fretboard.ts` (completed — highlight-diffs archive)
- `DualFretboard.svelte` exists with `highlightPositions` prop (completed)

## Success Criteria

- [ ] Changing root from C (open) to A (fret 5): shapes slide smoothly over 300ms
- [ ] Changing root via keyboard: animation plays without jank or flicker
- [ ] `prefers-reduced-motion: reduce`: shapes snap instantly (no animation)
- [ ] Full Neck, Grid, Dual Compare, Shape Card views all render correctly
- [ ] Highlight diff rings render at correct positions alongside animated notes
- [ ] All existing tests pass
