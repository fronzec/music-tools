# Proposal: Highlight Diffs in Dual Compare

## Intent

Dual Compare shows two fretboards side-by-side, but users must mentally match positions to identify what changed. Add diff highlighting: shared positions get a colored ring — green (same interval) or dashed amber (different) — so the eye goes straight to differences.

## Scope

### In Scope
- Extract `NoteEntry` type + `buildPositionMap()` from `FullFretboard.svelte` to `src/lib/theory/fretboard.ts`
- Optional `highlightPositions` prop on `FullFretboard`: green ring (same) or dashed amber ring (different) around notes
- `$derived` diff in `DualFretboard`: intersect position maps from both fretboards, classify each shared position
- Rings draw outside existing shape markers; highlights absent in non-dual modes

### Out of Scope
- Positions unique to one fretboard (render normally)
- Animations, hover tooltips, grid mode diff, configurable colors

## Capabilities

### New Capabilities
- `highlight-diffs`: visual diff between two fretboards — same-interval (green ring) vs different-interval (dashed amber ring)

### Modified Capabilities
- `dual-fretboard`: position-set intersection via `$derived`; passes `highlightPositions` to each `FullFretboard`
- `full-fretboard`: optional `highlightPositions` prop; `NoteEntry`/`buildPositionMap()` extracted to shared util (no behavior change)

## Approach

1. **Extract `NoteEntry` + `buildPositionMap()`** → `src/lib/theory/fretboard.ts` — pure relocation.
2. **`highlightPositions` prop** on `FullFretboard` (`Map<string, { interval1, interval2 }> | null`): green ring (same interval), dashed amber ring (different). Rings draw outside shape markers at low opacity.
3. **Diff in `DualFretboard`** via `$derived.by()`: build maps from both fretboards using shared util, intersect keys, pass to each `FullFretboard`.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/lib/theory/fretboard.ts` | New |
| `src/lib/components/FullFretboard.svelte` | Modified — import util, add prop + rings |
| `src/lib/components/DualFretboard.svelte` | Modified — add `$derived` diff |
| `FullFretboard.test.ts` / `DualFretboard.test.ts` | Modified — new test cases |
| `openspec/specs/full-fretboard/spec.md` | Modified — delta for prop + rings |
| `openspec/specs/dual-fretboard/spec.md` | Modified — delta for diff logic |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Visual noise from rings on colored shapes | Medium | Low opacity (0.5–0.6); rings outside markers; gated behind prop |
| Extraction breaks FullFretboard | Low | Pure refactor commit first; run existing tests before adding highlights |
| Diff wrong for barre positions | Low | Reuse same `baseFret + fret` logic from extracted util |

## Rollback Plan

Revert `FullFretboard` to inline `NoteEntry`/`buildPositionMap()`, remove `highlightPositions`, delete `fretboard.ts`, drop `$derived` diff from `DualFretboard`.

## Dependencies

- Archived `dual-fretboard` change complete — `DualFretboard.svelte` exists

## Success Criteria

- [ ] Same-interval positions: green ring on both fretboards in Dual Compare
- [ ] Different-interval positions: dashed amber ring on both fretboards
- [ ] Unique positions: no ring, normal rendering
- [ ] Full Neck / Grid modes unchanged (no highlights)
- [ ] All existing tests pass
