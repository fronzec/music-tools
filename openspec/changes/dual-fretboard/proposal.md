# Proposal: Dual Fretboard Comparison

## Intent

Show two CAGED chords side-by-side so guitarists can visually compare how shapes shift when transposing or changing key. The core use case: "What happens to my C major shapes when I move to G major?" — you see both fretboards stacked vertically, each with independent root note and shape visibility.

## Scope

### In Scope
- `DualFretboard.svelte`: layout wrapper stacking two `FullFretboard` instances vertically with ~gap-3
- Side-by-side root selectors ("From → To") for independent root-per-fretboard control
- Independent shape visibility toggles per fretboard (each has its own 5-shape pill bar)
- New `'dual'` view mode in `CagedTool.svelte` (`'full' | 'grid' | 'dual'`)
- Shared quality and labelMode between both fretboards
- Default second root: `'G'` (perfect 5th from default C)
- Component unit tests

### Out of Scope
- Independent quality per fretboard (shared for first iteration)
- Highlighting shape differences between the two chords
- Animations, audio playback, URL state, favorites
- Mobile layout optimization for dual view

## Capabilities

### New Capabilities
- `dual-fretboard`: side-by-side CAGED chord comparison with independent root selectors, per-fretboard shape visibility toggles, and vertically stacked full-neck SVG overlays

### Modified Capabilities
- `caged-visualizer`: "Simultaneous 5-Shape Display" requirement gains a third rendering mode (Dual). View mode toggle extends to three options. Root selector renders as paired "From → To" selectors in dual mode.

## Approach

New `DualFretboard.svelte` wraps two `FullFretboard` instances — **zero changes to FullFretboard**. The wrapper:

1. Renders a "From → To" label with two chromatic button rows (compact, 12 notes each)
2. Below each root row, renders a per-fretboard shape toggle bar (colored pills, CAGED order)
3. Stacks both `FullFretboard` SVGs vertically with `gap-3`
4. Each `FullFretboard` receives its own `shapes[]`, `visibleShapes`, shared `labelMode`

`CagedTool.svelte` adds `secondRoot` state (`'G'` default), `secondVisibleShapes` (`SvelteSet`), and extends `viewMode` to `'full' | 'grid' | 'dual'`. When `viewMode === 'dual'`, it computes `secondShapes` via `getShapes(secondRoot, selectedQuality)` and renders `<DualFretboard>`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/DualFretboard.svelte` | New | Wrapper with two root selectors, two toggle bars, two FullFretboards |
| `src/lib/components/CagedTool.svelte` | Modified | Add `secondRoot`, `secondVisibleShapes` state; extend `viewMode` union; conditional `<DualFretboard>` rendering |
| `src/lib/types/chord.ts` | Modified | Possibly `DualFretboardProps` (optional — may inline in component) |
| `openspec/specs/caged-visualizer/spec.md` | Modified | Delta for dual view mode requirements |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vertical space: two full fretboards may not fit viewport | Medium | SVG viewBox scales to container; `overflow-auto` on wrapper |
| UI clutter with two root selectors + two toggle bars | Low | Collapse toggles behind disclosure; compact root buttons |
| Users expect independent quality (major/minor per side) | Medium | Explicit "Quality is shared" label; track as v2 feedback |

## Rollback Plan

Revert `viewMode` union to `'full' | 'grid'`, remove `secondRoot`/`secondVisibleShapes` state, delete `DualFretboard.svelte`. No data migrations.

## Dependencies

- None (no new packages, no data changes, `FullFretboard.svelte` unchanged)

## Success Criteria

- [ ] Two `FullFretboard` instances render stacked vertically with independent root notes
- [ ] Each fretboard has its own shape visibility toggles that operate independently
- [ ] Changing one fretboard's root does not affect the other
- [ ] Quality and labelMode remain synchronized across both fretboards
- [ ] Grid and Full Neck views continue working unchanged
- [ ] Default state: C major (top) vs G major (bottom), all shapes visible
