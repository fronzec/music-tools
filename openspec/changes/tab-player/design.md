# Design: Tab Player

## Technical Approach

A new top-level tool that visualizes and plays curated guitar tabs. Three new pure/data modules feed a presentational `TabFretboard.svelte` and a stateful `TabPlayer.svelte`. The player owns ALL timing via a single bounded, cancellable recursive `setTimeout`, which drives both the fretboard highlight and audio (one timing source = no playhead/audio drift). Reuses `createNotePlayer` (per-step `playSequence`), `midiToFreq`, and the `IntervalFretboard` SVG geometry conventions verbatim. Registration via the existing 4-edit pattern.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Open-string anchors | New `OPEN_MIDI = [40,45,50,55,59,64]` (E2..E4), string 0 = low E (MIDI 40) .. 5 = high E (64) | Reuse `STANDARD_TUNING` | `STANDARD_TUNING = [4,9,2,7,11,4]` is pitch CLASSES, not MIDI — unusable for absolute pitch. Same string indexing as `intervalPositions`/`stringY`. |
| `fretToMidi` location | New `src/lib/theory/tab.ts` (co-located with types + `fretToMidi`) | Add to `intervals.ts`/`notes.ts` | Keeps the tab domain self-contained; `intervals.ts` is interval-quiz-specific. One pure module, one test surface. |
| Fretboard component | New `TabFretboard.svelte` | Generalize `IntervalFretboard` | `IntervalFretboard` marks by PITCH CLASS (every matching position lights up). Tabs need EXACT `(string,fret)`. Different domain; copy geometry, not behavior. |
| Playback timing | Component-owned recursive `setTimeout`, one tick per step | Extend `playNote.ts`; `setInterval` | `playSequence` already schedules a whole array at fixed internal STEP — its timing is decoupled from visual state and not per-step-cancellable. Component timer keeps highlight + audio on ONE clock. Recursive `setTimeout` re-reads tempo each tick and has a single clear point. |
| Audio per step | `player.playSequence(step.map(p => midiToFreq(fretToMidi(...))))` | Custom scheduler | A chord = one `playSequence` call with N freqs; reuses the existing anti-click envelope. |
| State | Flat `$state` runes (mirrors IntervalTrainer/NoteTrainer) | Class store | Project convention. |

## Data Flow

```
tabs.ts (data) ──┐
                 ▼
   TabPlayer.svelte ($state: selectedTab, stepIndex, isPlaying, tempo)
        │  recursive setTimeout tick (single timing source)
        │     ├─→ stepIndex++  ──→ TabFretboard (currentStep highlight, playhead)
        │     └─→ player.playSequence(freqs)  [fretToMidi → midiToFreq]
        └─ Stop / end / switchTab / unmount ─→ cancelTick()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/theory/tab.ts` | Create | `TabStep`/`Tab` types, `OPEN_MIDI`, pure `fretToMidi(stringIndex, fret)` |
| `src/lib/data/tabs.ts` | Create | Curated `TABS: Tab[]` (3–5 short riffs/exercises) |
| `src/lib/components/TabFretboard.svelte` | Create | Presentational neck; highlights current step's `(string,fret)`; no audio/timer |
| `src/lib/components/TabPlayer.svelte` | Create | Stateful tool: selection, playback engine, controls; drives fretboard + audio |
| `src/lib/types/chord.ts` | Modify | Add `'tab-player'` to `ViewName` union |
| `src/App.svelte` | Modify | Import + `{:else if currentView === 'tab-player'}` boundary branch |
| `src/lib/components/HomePage.svelte` | Modify | Active tool card → `navigate('tab-player')` |
| `tests/unit/theory/tab.test.ts` | Create | `fretToMidi` against known positions |
| `tests/unit/components/TabFretboard.svelte.test.ts` | Create | Correct marks for a known step |
| `tests/unit/components/TabPlayer.svelte.test.ts` | Create | Playback w/ `vi.useFakeTimers`; cancellation proofs |

## Interfaces / Contracts

```ts
// src/lib/theory/tab.ts
export interface TabNote { string: number; fret: number; } // string 0=low E .. 5=high E
export type TabStep = TabNote[];                            // chord = multiple notes
export interface Tab { title: string; steps: TabStep[]; }
export const OPEN_MIDI: readonly number[] = [40, 45, 50, 55, 59, 64];
export function fretToMidi(stringIndex: number, fret: number): number; // OPEN_MIDI[s] + fret

// TabFretboard.svelte — presentational, no audio/timer
interface Props { steps: TabStep[]; currentStep: number; width?: number; }
// Marks: data-role="active" + data-testid="mark-{string}-{fret}" for current step.
// Optional: faint data-role="ghost" marks for all other step positions.

// TabPlayer.svelte
interface Props { navigate: (v: ViewName) => void; }
```

## Playback engine (TabPlayer)

State: `selectedTab` (Tab), `stepIndex` ($state number), `isPlaying` ($state bool), `tempo` ($state bpm). Timer handle:
`let tick: ReturnType<typeof setTimeout> | null = null;` (mirrors IntervalTrainer `pendingNext`).

`stepMs = $derived(60000 / tempo)`. `cancelTick()` = `if (tick !== null) { clearTimeout(tick); tick = null; }`.

- **play()**: if at end, reset `stepIndex = 0`; `isPlaying = true`; `scheduleNext()`.
- **scheduleNext()**: play current step's freqs; `tick = setTimeout(() => { if (stepIndex >= last) { stop(); return; } stepIndex++; playStep(); scheduleNext(); }, stepMs)`. Bounded — terminates at end, no loop.
- **stop()**: `isPlaying = false; cancelTick();`
- **stepTo(i)** (prev/next): `cancelTick(); isPlaying = false; stepIndex = i; playStep();`
- **selectTab(t)**: `cancelTick(); isPlaying = false; selectedTab = t; stepIndex = 0;`

**Cancellation points (every one enumerated):** Stop button → `stop()`; reaching end → guard in `scheduleNext` callback calls `stop()`; switching tabs → `selectTab()`; prev/next → `stepTo()`; unmount → `$effect` cleanup `return () => { cancelTick(); player.dispose(); }`. NO unbounded loop anywhere.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | `fretToMidi` | `(0,0)→40`, `(5,0)→64`, `(2,3)→53`, `(0,12)→52`; anchors correct |
| Component | `TabFretboard` marks | mount via `@testing-library/svelte`; assert `data-testid="mark-{s}-{f}"` present for currentStep, absent for others |
| Component | `TabPlayer` playback | `vi.useFakeTimers()` + mock `AudioContext` (mirror `playNote.test.ts`): play → `advanceTimersByTime(stepMs)` advances `stepIndex` and schedules the right freqs; Stop cancels (advance → no further change); reaching end auto-stops; `unmount()` then `advanceTimersByTime` → no step change AND `getTimerCount()===0` (no timer survives) |

All playback tests use fake timers — never real waits. Assert `vi.getTimerCount() === 0` after stop/unmount/end as the resource-safety proof.

## Migration / Rollout

No migration. Additive only. Chained-PR cut:
- **Slice 1** (~210 lines): `tab.ts` + `tabs.ts` + `TabFretboard.svelte` + `fretToMidi`/`TabFretboard` tests. No UI entry point yet.
- **Slice 2** (~250 lines): `TabPlayer.svelte` + playback engine + 4 registration edits + `TabPlayer` tests.

**Review Workload Forecast**: est. total ~460 lines > 400 → chained PRs recommended: Yes. Each slice < 400 and independently shippable (Slice 1 has no entry point, so it can merge dark).

## Open Questions

- [ ] Notation rendering for v1: render `steps` as a simple text/tab-grid row, or only the fretboard + playhead? (Lean: lightweight text row above the fretboard; not ASCII parsing.)
