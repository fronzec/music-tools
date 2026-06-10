# Proposal: CAGED Full Fretboard Overlay

## Intent

Replace the 5 disconnected mini-fretboards with a unified full-neck view showing all CAGED shapes overlaid. Users can see how shapes connect across the neck — the core pedagogical value of CAGED. Keep the grid view as a toggleable alternative.

## Scope

### In Scope
- `FullFretboard.svelte`: new SVG component rendering 2–5 shapes overlaid on a single 15-fret neck
- Per-shape color scheme: C=#2563EB, A=#F97316, G=#16A34A, E=#EF4444, D=#9333EA
- Shape visibility toggles (colored pills, all 5 visible by default)
- Fret numbers along bottom edge
- Root-note diamond marker (distinct from standard circles)
- Barre indicators per shape (shape-colored rects at 0.5–0.65 opacity)
- "Full Neck" / "Shape Grid" view mode toggle in `CagedTool.svelte`
- Default to Full Neck mode

### Out of Scope
- Mobile/responsive layout (desktop only for this iteration)
- Sound playback, URL routing, left-handed mode
- Chords beyond major/minor (existing 120-shape dataset unchanged)
- Modifying `Fretboard.svelte` (unchanged, used in Shape Grid mode)

## Capabilities

### New Capabilities
- `full-fretboard`: multi-shape SVG overlay on a single guitar neck with per-shape color coding, visibility toggles, barre indicators, and fret numbers

### Modified Capabilities
- `caged-visualizer`: "Simultaneous 5-Shape Display" requirement gains a second rendering mode (Full Neck). Default display changes from grid to Full Neck. View mode toggle added alongside existing controls.

## Approach

New `FullFretboard.svelte` component (Approach 2 from exploration) — clean separation from existing `Fretboard.svelte`. The component:

1. Computes global fret range across visible shapes (min/max absolute fret)
2. Offsets viewBox X origin to `minFret` so the left edge aligns to the earliest fretted note
3. Renders string lines, fret lines, and fret markers once (shared neck background)
4. Iterates visible shapes: draws barre rects + note circles per shape
5. Root notes use diamond marker; overlapping same-interval notes on same (string, fret) render with double-ring
6. SVG viewBox width adapts to required span; `w-full h-auto` for scale-to-fit
7. Fret numbers rendered as small gray text below the 6th string

`CagedTool.svelte` adds `viewMode` state (`'full' | 'grid'`) and a toggle bar. Shape visibility lives as `Set<CagedShape>` with reset on chord change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/FullFretboard.svelte` | New | Multi-shape overlay SVG component |
| `src/lib/components/CagedTool.svelte` | Modified | Add view mode toggle, conditional rendering, shape visibility controls |
| `src/lib/types/chord.ts` | Modified | Add `FullFretboardProps` interface |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Visual clutter with 5 shapes (25+ circles) | Medium | Per-shape colors + opacity 0.7–0.8 for non-root notes + per-shape toggle |
| Wide fret spans (15 frets) cause small text | Low | Scale-to-fit viewBox; 784px worst case, manageable on desktop |
| Overlapping note circles on same position | Low | Double-ring for same-interval overlap; tooltip for different intervals |

## Rollback Plan

Revert `CagedTool.svelte` to always render Shape Grid (remove view mode toggle). Delete `FullFretboard.svelte`. No data or type changes block rollback.

## Dependencies

- None (no new packages, no data changes)

## Success Criteria

- [ ] All 5 CAGED shapes render overlaid on a single fretboard with distinct per-shape colors
- [ ] Individual shapes can be toggled on/off; at least one shape always visible
- [ ] Shape Grid view remains functional and accessible via toggle
- [ ] Fret numbers display along bottom edge
- [ ] Root notes show distinctive diamond marker
- [ ] SVG scales to fit container without horizontal scroll
