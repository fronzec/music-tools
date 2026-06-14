# Proposal: Interval Explorer (Visual Explore mode in Interval Trainer)

## Intent

The just-shipped Interval Ear Trainer teaches intervals through quiz pressure (hear it, name it). It does NOT show WHERE an interval lives on the guitar fretboard. Guitarists learn intervals best by their recognizable SHAPE on the neck — a perfect 5th is always the same fret pattern regardless of position. We need a visual-first, exploratory mode: pick a root + an interval, SEE every place that pair falls across the neck, and HEAR it. No score, no failure state — pure free exploration.

## Scope

### In Scope (v1)
- A **Practice ↔ Explore toggle** inside the existing `IntervalTrainer.svelte`. Explore reuses the same root + interval selection and audio.
- A new `IntervalFretboard.svelte` rendering an SVG neck (built on `layout.ts` geometry) with highlighted note positions.
- Visual highlight of all ROOT positions and all TARGET (root+interval) positions across a fixed fret range / 6 standard-tuning strings, root vs target visually distinguished.
- A "Play" action that sounds the interval (root then target) via `createNotePlayer`.
- A short caption naming the interval and reinforcing the shape idea.

### Out of Scope (deferred)
- Quiz/scoring inside Explore (that is Practice mode).
- Alternate tunings, capo, left-handed neck, 7+ string necks.
- Click-to-play on individual fretboard dots (see open question — recommend deferring).
- Scale/chord overlays, multiple intervals at once, persisted preferences.
- A separate top-level tool or HomePage card.

## Capabilities

### New Capabilities
- `interval-explorer`: visual exploration of a chosen root+interval across the fretboard, with audio playback, delivered as an Explore mode within the Interval Trainer.

### Modified Capabilities
- None at the spec level. The Interval Trainer gains a mode toggle, but the existing quiz behavior (Practice mode) is unchanged.

## Approach

Add an `Explore` mode to `IntervalTrainer.svelte` via a Practice/Explore toggle. Explore mode hoists/shares the existing root + interval state and the note player. It renders `IntervalFretboard.svelte`, a new presentational SVG component built on the pure `layout.ts` functions (`stringY`, `fretLineX`, `noteX`, `viewBoxW/H`). The fretboard takes computed highlight positions (root set + target set) as props and renders them with distinct styling. Position math reuses `CHROMATIC`, `STANDARD_TUNING`, `semitoneToNoteName`, and `intervalBySemitones`/`INTERVALS`. Playback reuses `midiToFreq` + `createNotePlayer.playSequence`.

Rationale for Explore-as-mode (not separate tool): it shares root/interval selection and audio with the quiz, keeps a single mental model of "interval training", and avoids a third HomePage card. Design may still argue for separation if the fretboard UI dominates and crowds the quiz layout — flagged below.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/IntervalTrainer.svelte` | Modified | Add Practice/Explore toggle; share root/interval state + player |
| `src/lib/components/IntervalFretboard.svelte` | New | SVG neck with root/target highlights, built on `layout.ts` |
| `src/lib/theory/intervals.ts` | Reuse | `INTERVALS`, `intervalBySemitones`, `midiToFreq` |
| `src/lib/audio/playNote.ts` | Reuse | `createNotePlayer` for hearing the interval |
| `src/lib/theory/layout.ts`, `notes.ts`, `types/chord.ts` | Reuse | Geometry + note/tuning math |

## Open Questions (for design)

1. **Position computation/display**: show ALL root + target positions across the whole neck (paired by color), OR one movable "shape" (a single root + its nearest target) at a time? Recommendation: v1 = show ALL positions, root in one color, target in another — simplest to compute and best demonstrates the repeating shape.
2. **Fret range**: recommend 0–14 across the 6 standard-tuning strings (matches `FullFretboard` reference scale).
3. **Root vs target distinction + "shape"**: recommend distinct fill colors plus a thin connector line for each adjacent root→target pair on the same/neighbor string to suggest the shape. Final visual is a design decision.
4. **Clickable positions**: recommend NO per-dot click-to-play in v1 — keep it to select root + interval, then a single Play button. Click-to-play is a fast follow.
5. **Octave for playback**: recommend a fixed reference octave (e.g. root at MIDI 60 / C4-relative) so playback is consistent regardless of which fret positions are shown; positions on the neck are illustrative, the sounded interval is canonical.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| New fretboard component pushes change past ~400 lines | Med | Keep `IntervalFretboard` presentational; reuse `layout.ts`; defer click-to-play |
| Explore UI crowds existing quiz layout | Med | Toggle swaps views (not stacked); design reviews layout |
| Visual "pairing" of root→target is ambiguous on multi-string neck | Med | v1 = color-only distinction; connector lines optional, decided in design |
| Playback octave vs displayed positions confuses users | Low | Caption clarifies sounded octave; consistent fixed reference |

## Rollback Plan

Explore is additive behind a mode toggle. Revert by removing the toggle + `IntervalFretboard.svelte` import/render from `IntervalTrainer.svelte` and deleting the new component file. No data, routes, or shared APIs change, so Practice mode is unaffected.

## Dependencies

- None new. All theory, audio, and geometry primitives already merged.

## Success Criteria

- [ ] Interval Trainer shows a Practice/Explore toggle; Practice behavior unchanged.
- [ ] Selecting a root + interval in Explore highlights root and target positions across the neck, visually distinguished.
- [ ] A Play action sounds the chosen interval.
- [ ] Component is presentational and reuses `layout.ts`; total change stays within ~400 lines.
- [ ] Unit-testable position math (root/target sets) with Vitest.
