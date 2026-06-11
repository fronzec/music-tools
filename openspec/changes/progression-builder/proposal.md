# Proposal: Progression Builder

## Intent

Build a dedicated Progression Builder view where guitarists sequence chords, control playback, and see CAGED shapes for the active chord — all on one screen. This is a new top-level tool, not a CagedTool mode.

## Scope

### In Scope
- `ProgressionBuilder.svelte`: orchestrator view wiring progression bar, fretboard, and timeline
- `ProgressionBar.svelte`: horizontal scrollable chord pills with add/remove
- `ProgressionTimeline.svelte`: step dots, prev/next, play/pause with configurable auto-advance timer
- Quality toggle (major/minor) shared across all chords in the progression
- 4 default chords: C → F → G → C (I–IV–V–I)
- FullFretboard reuse showing CAGED shapes of the currently active chord
- Route addition (`'progression'`), ViewName union extension, and HomePage nav card

### Out of Scope
- DualFretboard transition mode, drag-to-reorder, roman numeral input
- Persistence, key-based filtering, chord-specific quality override
- Audio playback

## Capabilities

### New Capabilities
- `progression-builder`: sequenced chord progression list, timeline playback with auto-advance, and CAGED visualization of the active chord via FullFretboard

### Modified Capabilities
- `home-page`: Tool Card Content gains a new active Progression Builder card between CAGED Visualizer and placeholder cards

## Approach

Three new components under `src/lib/components/`. `ProgressionBuilder` owns progression state (`ChordStep[]`, active index, quality, labelMode). It delegates chord computation to `getShapes()` (existing utility) and passes resulting `ChordShape[]` + `visibleShapes` to `FullFretboard` — zero changes to FullFretboard.

Quality is shared across all chords for MVP simplicity. Timeline uses `setInterval` with cleanup in Svelte 5 `$effect` return.

Component tree:
```
App.svelte
└── 'progression' → ProgressionBuilder.svelte
    ├── ProgressionBar.svelte (horizontal pill strip, add/remove)
    ├── FullFretboard.svelte (active chord CAGED shapes)
    └── ProgressionTimeline.svelte (dots, prev/next, play/pause)
```

New types in `src/lib/types/progression.ts`: `ChordStep { root: NoteName }`, `ProgressionState`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/ProgressionBuilder.svelte` | New | Orchestrator view, state management |
| `src/lib/components/ProgressionBar.svelte` | New | Horizontal pill scroll bar |
| `src/lib/components/ProgressionTimeline.svelte` | New | Playback controls and step dots |
| `src/lib/types/progression.ts` | New | `ChordStep`, `ProgressionState` types |
| `src/App.svelte` | Modified | Add `'progression'` route branch |
| `src/lib/components/HomePage.svelte` | Modified | Add Progression Builder nav card |
| `src/lib/types/chord.ts` | Modified | Extend `ViewName` with `'progression'` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `setInterval` leak on unmount | Medium | `$effect` return cleanup; cypress test for unmount |
| Large progression (50+ chords) overflows bar | Low | Cap at 32 chords; horizontal scroll with overflow-x |
| Quality shared per-progression surprises users | Medium | Explicit "Quality applies to all chords" label; track per-chord quality as v2 |

## Rollback Plan

Remove `'progression'` from ViewName, delete the three new components and `progression.ts`, remove the HomePage card. No data migrations.

## Dependencies

- None (no new packages; `FullFretboard.svelte`, `getShapes`, `SHAPE_COLORS` reused as-is)

## Success Criteria

- [ ] Progression Builder view accessible from home page card
- [ ] Add/remove chords via pill bar; fretboard updates to show active chord CAGED shapes
- [ ] Timeline play/pause auto-advances through chords with configurable speed
- [ ] Quality toggle affects all chords simultaneously
- [ ] Default progression C–F–G–C renders on first load
- [ ] Returning to home and re-entering preserves progression state
