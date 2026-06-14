# Proposal: Interval Trainer (Ear Training)

## Intent

Musicians who can read interval names often cannot *recognize* them by ear — the gap between "knowing what a perfect fifth is" and "hearing one" is where real musicianship lives. music-tools has visual/theory tools and Signal Lab (the acoustic/DSP angle), but nothing trains the *musical-recognition* skill. This tool plays two notes, asks the user to name the interval from multiple choice, and gives immediate right/wrong feedback plus a running score — closing that recognition gap through repetition.

## Scope

### In Scope (v1)
- New top-level `IntervalTrainer.svelte` tool: hear two notes, pick the interval, get feedback + score
- Audio playback of two notes via Web Audio API (anti-click envelope, replay control)
- Multiple-choice answer buttons (interval names), correct/wrong feedback, next-question flow
- Score tracking (correct/total, streak)
- New theory data: 12-entry chromatic interval-name table + `IntervalName` type
- New `noteToFreq(note, octave)` audio-math helper (`440 * 2^((midi-69)/12)`)
- Quiz state machine: question generation, answer check, scoring
- Navigation wiring (extend `ViewName`, App router branch, HomePage card)
- Keyboard-accessible controls with aria-labels (answer buttons, score, replay)

### Out of Scope
- **Clickable interval fretboard visualization — deliberate SLICE 2** (needs a ~150-line new component with click handlers that don't exist yet)
- Acoustic/DSP analysis (that is Signal Lab's domain)
- Chord/scale recognition, descending or harmonic interval modes (see open questions), difficulty tiers, persistence of scores across sessions

## Capabilities

### New Capabilities
- `interval-trainer`: ear-training quiz that plays two notes, accepts a multiple-choice interval answer, gives feedback, and tracks score
- `interval-data`: chromatic interval-name table (`IntervalName` type, 12 semitone entries) — new theory data, distinct from existing chord-tone naming
- `audio-playback`: shared `noteToFreq` + note-playback helper for tone scheduling (v1 scope per design's extraction decision below)

### Modified Capabilities
- `home-page`: Tool Card Content gains an Interval Trainer card in the active card grid
- `app-shell`: route table gains an `'interval-trainer'` branch

## Approach

Single `IntervalTrainer.svelte` (Svelte 5 runes, Tailwind, `{ navigate }: Props`, back-to-home button, card layout — matching Note Trainer / Tone Generator conventions). State: target interval, root note, score counters via `$state`. On new question: pick a root + interval, compute both frequencies via `noteToFreq`, play sequentially. Answer buttons compare selection to target. New theory lives in a small interval table reusing `CHROMATIC` / `semitoneToNoteName` from existing `notes.ts` / `chord.ts`. Audio reuses the AudioContext + envelope pattern from `ToneGenerator.svelte`; the **extraction fork (below) is the design's call**.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/IntervalTrainer.svelte` | New | Full quiz component (audio, choices, scoring) |
| `src/lib/theory/intervals.ts` | New | `IntervalName` type + 12-entry interval table |
| `src/lib/audio/playNote.ts` | New | `noteToFreq` + note-playback helper |
| `src/lib/types/chord.ts` | Modified | Extend `ViewName` with `'interval-trainer'` |
| `src/App.svelte` | Modified | Add `'interval-trainer'` route branch |
| `src/lib/components/HomePage.svelte` | Modified | Add Interval Trainer nav card |
| `src/lib/components/ToneGenerator.svelte` | Modified (only if design picks extraction) | Refactor to use shared `playNote.ts` |

## Open Questions for Design

1. **Audio-extraction fork**: (a) extract `playNote.ts` AND refactor `ToneGenerator` to use it (cleaner, but touches ToneGenerator + its tests = regression risk + more lines), or (b) create `playNote.ts` fresh for the new tool only and DEFER the ToneGenerator refactor (leaner, lower-risk). **Recommend (b) for v1** to protect the 400-line budget; framing it as design's call.
2. **Interval set**: all 12 chromatic intervals (m2…P8) or a curated v1 subset (e.g. the "common" intervals)?
3. **Interval direction**: ascending only for v1, or also descending / harmonic (simultaneous)? Recommend ascending-only for v1.
4. **Answer choices**: how many options per question (e.g. 4 vs full 12)?

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 400-line review budget exceeded | Medium | Defer ToneGenerator refactor (fork option b); fretboard is slice 2 |
| ToneGenerator refactor regresses existing audio/tests | Medium | Prefer fresh `playNote.ts`; if extraction chosen, keep ToneGenerator tests green |
| AudioContext autoplay/unlock differences across browsers | Low | Mirror existing ToneGenerator unlock-on-gesture pattern |
| Interval naming ambiguity (tritone, enharmonics) | Low | Single canonical name per semitone in the table |

## Rollback Plan

Remove `'interval-trainer'` from `ViewName`, delete `IntervalTrainer.svelte`, `intervals.ts`, `playNote.ts`, remove the HomePage card and route branch. If ToneGenerator was refactored, revert it to its inline audio. No data migrations.

## Dependencies

- Reuses `semitoneToNoteName` / `noteNameToSemitone` / `getNoteName` (`notes.ts`), `CHROMATIC` / `STANDARD_TUNING` / `ViewName` (`chord.ts`), AudioContext + envelope pattern from `ToneGenerator.svelte`, Vitest + `vi.stubGlobal` AudioContext stubbing from `ToneGenerator.test.ts`.

## Success Criteria

- [ ] Interval Trainer reachable from a HomePage card
- [ ] Two notes play audibly on each question (with replay control)
- [ ] Multiple-choice answer gives correct/wrong feedback
- [ ] Score (correct/total + streak) updates and advances to next question
- [ ] `noteToFreq` and interval table covered by unit tests (strict TDD)
- [ ] Controls keyboard-accessible with aria-labels
- [ ] v1 ships within the 400-line review budget
