# Proposal: Diatonic Sweep Practice (Arpeggio Sweep Mode in Progression Builder)

## Intent

Guitarists practicing sweep picking need to see a diatonic progression arpeggiated **note by note** on a movable 5th-string-root shape, across the full neck. Progression Builder already provides the configurable progression, fretboard, and transport — but it animates chord-by-chord and shows block CAGED shapes. This change adds a sweep practice MODE so the existing tool covers the real exercise without a new tool or rebuilding the engine.

## Scope

### In Scope
- Note-by-note sub-stepping through the active chord's arpeggio (driven by the existing timer).
- Movable 5th-string-root barre arpeggio shape, anchored at each chord root's A-string fret.
- New pure data + theory: movable major/minor templates, root-fret-on-5th-string lookup, arpeggio modeled as ordered `{ string, fret, midi, stepIndex }` events (Vitest-tested).
- 24-fret fretboard geometry (extend the 14-fret span).
- Loop at end of progression; mode toggle (CAGED/chord view ↔ arpeggio/sweep view); loop toggle.

### Out of Scope
- Audio playback (architected as a drop-in: future `midiToFreq(midi)` → `playSequence`).
- Descending sweeps, other root-string shapes, tempo/metronome rework.

## Capabilities

### New Capabilities
- `arpeggio-sweep-mode`: note-by-note arpeggio animation on a movable 5th-string-root shape over 24 frets, with mode/loop toggles, audio-ready note-event model.

### Modified Capabilities
- None (Progression Builder has no spec file; existing behavior is reused, not respecified).

## Approach

Add a sweep mode atop the existing playback loop. Pure theory layer emits ordered note events per chord; the component sub-steps through them on each timer tick instead of advancing whole chords. A mode toggle switches FullFretboard between the current CAGED overlay and a single highlighted arpeggio note. Geometry extends to 24 frets. Precomputed `midi` keeps the event list audio-ready with zero audio code now.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `theory/` (new arpeggio module) | New | Movable templates, root lookup, note-event builder + tests |
| `theory/layout.ts` | Modified | 24-fret span (variant or extended `FL` span) |
| `components/ProgressionBuilder.svelte` | Modified | Mode/loop state, note sub-stepping, toggle wiring |
| `components/FullFretboard.svelte` | Modified | Single-note arpeggio render path + 24-fret support |
| `types/progression.ts` | Modified | Note-event type, per-note step semantics |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `ChordQuality` lacks `dim`; diatonic vii° needs it | High | Decide in spec: v1 = major/minor only, or add `dim` (touches type, chord data, ProgressionBar) |
| Per-chord `PLAYBACK_MS` too coarse for per-note steps | Med | Treat speed as per-note step in sweep mode; revisit granularity in spec |
| 24-fret span breaks 14-fret layout assumptions | Med | Mode-scoped span variant; keep CAGED view at 14 |
| Single PR exceeds 400-line budget | Med | Defer split decision to tasks (PR1 data+geometry, PR2 wiring+toggle+loop) |

## Rollback Plan

Revert the PR(s). New theory module is additive; layout/component changes are mode-gated, so reverting restores the current CAGED chord-by-chord behavior with no data migration.

## Dependencies

- None new. Reuses `midiToFreq` (intervals.ts) and `playSequence` (playNote.ts) only in future audio work.

## Success Criteria

- [ ] Toggle switches between CAGED chord view and arpeggio sweep view.
- [ ] Sweep mode highlights one arpeggio note at a time across a 24-fret neck, anchored to each chord's 5th-string root.
- [ ] Progression loops at the end; existing transport (play/pause, speed, prev/next, select) still works.
- [ ] Arpeggio note-event builder is pure and unit-tested; each event carries precomputed `midi`.

## Proposal question round (assumptions for user review)

1. Sweep mode **coexists via toggle** with CAGED view (does not replace it) — confirm.
2. v1 arpeggio order is **low-to-high (ascending) sweep**; descending deferred — confirm.
3. v1 qualities = **major/minor only** (matches existing engine); `dim` for vii° is a separate decision — confirm or expand.
4. In sweep mode the existing **speed control drives the per-note step** (finer than per-chord) — confirm.
5. **Loop toggle** is new UI in the transport; default off — confirm.
