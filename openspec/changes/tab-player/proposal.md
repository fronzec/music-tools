# Proposal: Tab Player

## Intent

Beginners struggle to read guitar tablature because the notation, the physical fretboard, and the resulting sound stay disconnected in their head. A "3 on the D string" never becomes "this spot on the neck" never becomes "this note". This change adds a new top-level **Tab Player** tool that closes that loop: pick a short tab from a curated library, see the notation, watch the current position highlight on the fretboard step by step, and hear it play back with a moving playhead. v1 is read/visualize + play — not an editor, not a quiz.

## Scope

### In Scope
- New top-level tool registered via the existing 4-edit pattern (ViewName, App router, HomePage card, component Props).
- Curated built-in **library** of short tabs (riffs/exercises) as structured data — small set for v1.
- Structured **tab data model** (ordered steps of explicit `(string, fret)` positions).
- Fretboard step-highlight by EXACT `(string, fret)` (new `TabFretboard` or generalized fretboard — design decides).
- **Playback** with a moving playhead synced to fretboard highlights, equal-duration steps (v1).
- `fretToMidi(stringIndex, fret)` helper using standard-tuning open-string MIDI anchors.
- Strict TDD: bounded, cancellable timers; playback tests use `vi.useFakeTimers`, never real waits.

### Out of Scope
- ASCII-tab text parsing (later slice).
- Grid / interactive tab editor (later slice).
- Real rhythm / per-note durations, ties, rests (later slice — v1 is equal-duration).
- Quiz / scoring / ear-training modes.

## Capabilities

### New Capabilities
- `tab-player`: curated tab library, tab data model, fretboard step-highlight by explicit position, and synced playback with playhead.

### Modified Capabilities
- None.

## Approach

Model a tab as an ordered list of steps; each step references explicit `(string, fret)` positions and resolves to MIDI via a new `fretToMidi` helper (open-string anchors + fret offset, reusing `STANDARD_TUNING` and `midiToFreq`). Render notation plus a fretboard that highlights the active step's exact position — either a new `TabFretboard` or a generalization of `IntervalFretboard` (which currently marks by pitch class, not exact position). A playback engine advances steps on a bounded, cancellable timer, driving both the playhead and the highlight, and plays each step through `createNotePlayer`. All timers are torn down on Stop, unmount, and tab switch.

**Delivery note**: scope exceeds a single ~400-line PR. Likely chained PRs with a natural cut line:
1. Data layer — tab model + library entries + `fretToMidi` + `TabFretboard` (or fretboard generalization) + tests.
2. Player — playback engine (timing/playhead/sync), tempo, tool component + wiring + tests.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/` | New | `fretToMidi` helper + tab data model / library |
| `src/lib/components/` | New | `TabPlayer.svelte`, `TabFretboard.svelte` (or generalize `IntervalFretboard`) |
| `src/lib/audio/playNote.ts` | Modified? | Maybe extend for timed stepping (design decides) |
| `src/lib/types/chord.ts`, `App.svelte`, HomePage | Modified | Tool registration (4-edit pattern) |
| `tests/unit/` | New | theory + audio + component playback tests |

## Open Questions (for design)

1. **Tab data model shape** — step holds a single note, or allow multiple notes/chords per step?
2. **Playback engine** — extend `playNote.ts` vs component-driven timer; how playhead/highlight stay in sync; exact bounding/cancellation on Stop, unmount, tab switch.
3. **Fretboard** — new `TabFretboard` vs generalizing `IntervalFretboard` to accept explicit `(string, fret)` marks.
4. **Controls** — tempo control and optional step-through (prev/next) in v1 or deferred?
5. **Library** — how many / which entries for v1 (keep small, e.g. 3-5)?
6. **`fretToMidi`** — confirm standard-tuning open-string MIDI anchors (E2 A2 D3 G3 B3 E4).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Uncancelled/unbounded playback timer hangs tests or browser (prior incident) | Med | Mandatory bounded + cancellable timers; fake timers in tests; cleanup on Stop/unmount/switch |
| `IntervalFretboard` (pitch-class) can't express exact `(string,fret)` | High | Design chooses new `TabFretboard` or explicit-position generalization |
| Scope too large for one PR | High | Chained PRs at the cut line above |
| Highlight/playhead drift out of sync with audio | Med | Single timing source drives both highlight and playback |

## Rollback Plan

Revert the tool-registration edits (chord.ts ViewName, App router branch, HomePage card) to hide the tool, then drop the new files. No shared modules are mutated destructively; `fretToMidi` is additive. If only the player slice fails, ship the data layer alone — it has no UI entry point until wired.

## Dependencies

- None external. Reuses `layout.ts`, `playNote.ts`, `intervals.ts` (`midiToFreq`), `STANDARD_TUNING`, `notes.ts`.

## Success Criteria

- [ ] Tab Player appears as a top-level tool from the home page.
- [ ] Selecting a library tab renders its notation.
- [ ] Pressing play highlights each step's exact `(string, fret)` and plays the matching pitch with a moving playhead.
- [ ] Stop, unmount, and switching tabs leave no running timers (verified by tests).
- [ ] `fretToMidi` is unit-tested against known standard-tuning positions.
