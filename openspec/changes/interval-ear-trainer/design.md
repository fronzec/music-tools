# Design: Interval Trainer (Ear Training) — v1

## Context

Ear-training quiz: play two notes ascending, the user names the interval from 4
multiple-choice options, with immediate feedback and a running score. v1 is
ear-training only (no fretboard — that is deliberate Slice 2). Stack: Svelte 5
runes, TypeScript, Tailwind, Web Audio, Vitest. Strict TDD is active for the
pure modules.

This design follows the existing tool conventions verbatim:
- `interface Props { navigate: (view: ViewName) => void }` + `← Back to Home`.
- Quiz state as flat `$state` primitives (`correct`, `total`, `streak`,
  `bestStreak`) plus a single `currentQuestion` object, exactly like
  `NoteTrainer.svelte`.
- Fisher–Yates shuffle and distractor dedup loop borrowed from
  `NoteTrainer.generateQuestion`.
- AudioContext + anti-click envelope (`setValueAtTime(0)` →
  `linearRampToValueAtTime`) mirrored from `ToneGenerator.svelte`.

## Goals / Non-Goals

Goals (v1):
- Pure, unit-tested interval table + `noteToFreq` (equal temperament, A4=440).
- Pure, deterministic `generateQuestion(rng)` for flake-free tests.
- Fresh `src/lib/audio/playNote.ts` testable with the existing AudioContext stub.
- Single `IntervalTrainer.svelte` wired into the nav.
- Keyboard-accessible controls + aria-labels.
- Stay within the 400-line review budget.

Non-Goals (locked, do NOT re-open):
- No fretboard, no clickable interval visualization (Slice 2).
- No DSP/acoustic analysis (Signal Lab's domain).
- No descending/harmonic intervals, no difficulty tiers, no score persistence.
- Do NOT refactor `ToneGenerator.svelte` or touch its tests.

## Decisions

### ADR-1 — Audio extraction fork: fresh `playNote.ts`, defer ToneGenerator refactor

**Decision:** Create a NEW `src/lib/audio/playNote.ts` used only by the new tool.
Do NOT extract from or refactor `ToneGenerator.svelte`.

**Rationale:** ToneGenerator is a *sustained, toggleable, live-updating*
single-oscillator instrument (volume/waveform `$effect`s mutate the live node).
The trainer needs *fire-and-forget, fixed-duration, two-note sequential*
playback. The shapes barely overlap; forcing a shared abstraction now would
distort both. Extraction also means touching ToneGenerator + its 294-line test
suite = regression risk and budget burn for zero v1 value.

**Rejected:** (a) extract a shared audio core and refactor ToneGenerator —
cleaner long-term but higher risk and over budget for v1. Revisit if a third
audio consumer appears (rule of three).

### ADR-2 — `noteToFreq` signature: MIDI number, with a NoteName+octave helper

**Decision:** The primitive is `midiToFreq(midi: number): number`. Provide a
thin `noteToFreq(note: NoteName, octave: number): number` that converts to MIDI
then delegates. The trainer works in MIDI internally.

```ts
// MIDI 69 = A4 = 440 Hz. Equal temperament.
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
```

**Rationale:** Intervals are *semitone arithmetic*. With MIDI, a question is
just `root` and `root + semitones` — two integer additions, no octave-wrap
bookkeeping, no enharmonic ambiguity. `NoteName` (the chromatic `CHROMATIC`
type, pitch-class only) cannot express octaves, so it is the wrong internal
unit for a two-note interval. MIDI↔NoteName mapping reuses the existing
`semitoneToNoteName`: `pitchClass = ((midi % 12) + 12) % 12` →
`semitoneToNoteName(pitchClass)`, `octave = Math.floor(midi / 12) - 1`. The
`noteToFreq(note, octave)` helper exists for display/label code and to satisfy
the proposal's named signature, but the quiz path uses `midiToFreq`.

**Rejected:** NoteName+octave as the primitive — forces every interval add to
round-trip through string lookups and manual octave carry; error-prone and
slower to test.

### ADR-3 — `intervals.ts` shape: 12-entry ordered table keyed by semitone distance

**Decision:**

```ts
export type IntervalName =
  | 'Minor 2nd' | 'Major 2nd' | 'Minor 3rd' | 'Major 3rd'
  | 'Perfect 4th' | 'Tritone' | 'Perfect 5th' | 'Minor 6th'
  | 'Major 6th' | 'Minor 7th' | 'Major 7th' | 'Perfect octave';

export interface Interval {
  semitones: number;   // 1..12
  name: IntervalName;
  short: string;       // 'm2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7','P8'
}

// Ordered ascending m2..P8. Index i → INTERVALS[i].semitones === i + 1.
export const INTERVALS: readonly Interval[] = [ /* 12 entries */ ];

export function intervalBySemitones(semitones: number): Interval { ... }
```

- `IntervalName` is a string-literal union (not `enum`) per project TS style and
  the `NoteName`/`ViewName` precedent.
- One canonical name per semitone distance (Tritone for 6) — resolves the
  enharmonic ambiguity risk. No `b5`/`#4` duplication in v1.
- Distances are 1..12 (m2..P8); unison (0) is intentionally excluded — every
  question has two *different* notes.
- `intervalBySemitones` throws on out-of-range input (1..12 only) so a generator
  bug surfaces loudly in tests rather than producing `undefined`.

**Rejected:** `Record<number, IntervalName>` map — loses ordering, makes "pick N
distinct distractors" awkward; the readonly array indexes cleanly.

### ADR-4 — RNG injection: `Rng = () => number` parameter, defaulting to `Math.random`

**Decision:** Question generation is a pure function that takes an injected RNG:

```ts
export type Rng = () => number;  // returns [0, 1)

export interface Question {
  rootMidi: number;          // comfortable range, see ADR-5
  interval: Interval;        // the correct answer
  lowMidi: number;           // === rootMidi
  highMidi: number;          // === rootMidi + interval.semitones
  choices: Interval[];       // 4 entries: 1 correct + 3 distractors, shuffled
}

export function generateQuestion(rng: Rng = Math.random): Question { ... }
```

Generation algorithm (deterministic given `rng`):
1. `interval = INTERVALS[floor(rng() * 12)]` — pick the correct interval.
2. `rootMidi = ROOT_MIN + floor(rng() * ROOT_SPAN)` — random comfortable root.
3. Distractors: pull 3 *distinct* intervals ≠ correct via a dedup loop
   (`while (choices.length < 4) { pick; if not present push }`) — same pattern
   as `NoteTrainer`.
4. Fisher–Yates shuffle `choices` using `rng`.

**Rationale:** A single `() => number` seam is the minimum needed for
determinism. Tests pass a scripted RNG (an array-backed closure returning known
values) to assert exact root/interval/choice ordering with zero flake. Default
`Math.random` keeps the component call site trivial: `generateQuestion()`.
`generateQuestion` lives in `intervals.ts` (pure, theory-owned), NOT in the
component — so it is unit-testable without rendering.

**Rejected:** Seeded PRNG library — extra dependency for no benefit; a scripted
closure RNG in tests is simpler and exact. Generating inside the component —
not unit-testable without DOM, reintroduces flake.

### ADR-5 — Comfortable root range

**Decision:** `ROOT_MIN = 57` (A3), `ROOT_SPAN = 13` → roots in MIDI 57..69
(A3..A4). With max interval P8 (+12), the highest note is MIDI 81 (A5, ~880 Hz).
Lowest note A3 ≈ 220 Hz. Entire two-note range sits in the well-audible,
non-shrill 220–880 Hz band on laptop speakers. Constants live in `intervals.ts`
and are exported so tests can reference them.

### ADR-6 — `playNote.ts` shape: factory returning a player object, AudioContext owned by component

**Decision:** Plain factory function, no class, no module-level singleton.

```ts
export interface NotePlayer {
  playSequence(freqs: number[]): void;  // ascending, sequential
  dispose(): void;
}
export function createNotePlayer(): NotePlayer { ... }
```

- The factory lazily creates ONE `AudioContext` on first `playSequence` (mirrors
  ToneGenerator's `if (!audioCtx) audioCtx = new AudioContext()` — required for
  the autoplay/unlock-on-gesture pattern; the first call is inside a click).
- Each note = a fresh `OscillatorNode` + `GainNode` with the anti-click envelope
  (attack ramp from 0, release ramp to 0, `stop` scheduled after release),
  copied from ToneGenerator's `play`/`stop`. Sine wave.
- Sequential timing: note `i` starts at `ctx.currentTime + i * STEP` where
  `STEP = NOTE_DUR + GAP`. Constants: `NOTE_DUR = 0.6s`, `GAP = 0.1s`,
  `ATTACK = 0.015`, `RELEASE = 0.03` (envelope values match ToneGenerator).
- Replay = call `playSequence` again with the same freqs (no stored "playing"
  state needed; fire-and-forget oscillators self-terminate via scheduled stop).
- `dispose()` calls `audioCtx?.close()` for the component's teardown `$effect`.

**Lifecycle ownership:** The COMPONENT owns one `NotePlayer` instance
(`const player = createNotePlayer()` at script top — module-instance scope, NOT
SSR module scope, so no cross-request leak). The component's cleanup `$effect`
returns `() => player.dispose()`, exactly like ToneGenerator closes its context.

**Rationale:** A factory is the lightest testable seam: the test calls
`createNotePlayer()` after `vi.stubGlobal('AudioContext', ...)` and asserts on
the same mock objects ToneGenerator's test uses (`createOscillator`,
`createGain`, `frequency.value`, envelope ramps, scheduled `stop`). No class
needed for one instance; no plain free-function-with-hidden-singleton because a
hidden module-level AudioContext would leak across tests and SSR.

**Rejected:** Class (`new NotePlayer()`) — equivalent capability, heavier syntax,
no inheritance/`this` need. Module-level singleton context — SSR leak + test
cross-contamination.

### ADR-7 — Component state machine

Flat runes, mirroring NoteTrainer:

```ts
let correct = $state(0);
let total = $state(0);
let streak = $state(0);
let bestStreak = $state(0);
let question = $state<Question | null>(null);
let lastAnswer = $state<'correct' | 'incorrect' | null>(null);
let selected = $state<IntervalName | null>(null); // for highlighting the picked choice
```

Flow:
- On mount + on "next": `question = generateQuestion(); lastAnswer = null;
  selected = null; player.playSequence([midiToFreq(low), midiToFreq(high)])`.
- "Replay" button: `player.playSequence(...)` with the current question's freqs.
- Answer click `answer(iv: Interval)`: guard `if (!question || lastAnswer ===
  'correct') return;` → `total++`; if `iv.semitones === question.interval
  .semitones` → `correct++`, `streak++`, `bestStreak = max(...)`, `lastAnswer =
  'correct'`, `setTimeout(next, 1500)`; else `streak = 0`, `lastAnswer =
  'incorrect'` (reveal correct, show "Try another"). Same shape as NoteTrainer.
- The 4 choice buttons render from `question.choices`; each shows
  `interval.name`, colors green/red on reveal.

What is pure vs component: ALL question logic (`generateQuestion`, interval
lookup, freq math) is pure in `intervals.ts`/`playNote.ts`. The component is
glue: state, click handlers, markup, audio dispatch. This keeps the component
test focused on render + interaction (with audio stubbed), and the heavy logic
in fast unit tests.

### ADR-8 — Registration (exact 4 edits)

1. `src/lib/types/chord.ts` — add `| 'interval-trainer'` to the `ViewName` union.
2. `src/App.svelte` — `import IntervalTrainer` + add a `{:else if currentView
   === 'interval-trainer'}` branch wrapping `<IntervalTrainer {navigate} />` in
   a `<svelte:boundary failed={errorFallback}>`, matching siblings.
3. `src/lib/components/HomePage.svelte` — add one tool `<button>` card
   (`onclick={() => navigate('interval-trainer')}`, aria-label "Open Interval
   Trainer tool", emoji 👂, title "Interval Trainer", blurb "Train your ear to
   recognize intervals"). Optionally remove/replace the "Chord Library"
   placeholder slot — NOT required.
4. `src/lib/components/IntervalTrainer.svelte` — component with
   `interface Props { navigate: (view: ViewName) => void }` and
   `let { navigate }: Props = $props();`.

## Architecture / Data Flow

```
HomePage card ──navigate('interval-trainer')──▶ App.svelte router
                                                      │
                                                      ▼
                                          IntervalTrainer.svelte
                                          (state machine, ADR-7)
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
        intervals.ts (PURE)          playNote.ts (audio)          $lib/theory/notes
        - INTERVALS table            createNotePlayer()           - semitoneToNoteName
        - intervalBySemitones        - playSequence([f,f])          (MIDI→display)
        - midiToFreq / noteToFreq    - anti-click envelope
        - generateQuestion(rng)      - lazy AudioContext
```

Per-question sequence: `generateQuestion(rng)` → `Question{ low/high MIDI,
interval, 4 shuffled choices }` → component maps MIDI→freq via `midiToFreq` →
`player.playSequence([lowFreq, highFreq])`. User clicks a choice → compare
`semitones` → update score → `setTimeout` next.

## Integration Points

- Reuses: `CHROMATIC`/`semitoneToNoteName` (display only), `ViewName`,
  `navigate` prop contract, error boundary, Tailwind card/back-button classes.
- New isolated modules: `intervals.ts`, `playNote.ts`, `IntervalTrainer.svelte`.
- Test stubs: reuse the `vi.stubGlobal('AudioContext', ...)` mock shape from
  `tests/components/ToneGenerator.test.ts` for both the playNote unit test and
  the component test.

## Testing Strategy (file placement)

- `tests/unit/theory/intervals.test.ts` — `midiToFreq` (A4=440, octave doubling,
  C-1 edge), `intervalBySemitones` (all 12, throws out-of-range),
  `generateQuestion(rng)` with a scripted RNG: asserts exact interval, root in
  range, 4 choices, correct included, no duplicate choices, shuffle order.
- `tests/unit/audio/playNote.test.ts` — with AudioContext stub: `playSequence`
  creates N oscillators with correct `frequency.value`, anti-click ramps,
  scheduled `stop`, lazy single-context creation, `dispose` closes context.
- `tests/components/IntervalTrainer.test.ts` — render title/back/replay/choices,
  answer correct → score/streak up, answer wrong → reveal + streak reset,
  navigate('home'). AudioContext stubbed; assert `playSequence` fires on
  new question and replay (spy on player or on `createOscillator`).

## Review Workload / 400-line Budget

Estimated CHANGED lines (new + modified, incl. tests):

| Artifact | Est. lines |
|---|---|
| `intervals.ts` (table + 3 fns + types) | ~70 |
| `playNote.ts` (factory + envelope) | ~55 |
| `IntervalTrainer.svelte` (script + markup) | ~150 |
| `chord.ts` (ViewName edit) | ~1 |
| `App.svelte` (import + branch) | ~5 |
| `HomePage.svelte` (one card) | ~18 |
| `intervals.test.ts` | ~70 |
| `playNote.test.ts` | ~60 |
| `IntervalTrainer.test.ts` | ~80 |
| **Total** | **~509** |

This EXCEEDS the 400-line budget, driven by the three test files (~210 lines).

**Cut line (recommended for a single PR ≤400):** Ship production code +
`intervals.test.ts` + `playNote.test.ts` first (~509 − 80 component test ≈ 429),
still slightly over. Cleaner split — **two PRs**:

- **PR 1 (~255):** `intervals.ts` + `playNote.ts` + their two unit tests. Pure,
  fully TDD-covered, no UI. Comfortably under budget, independently reviewable.
- **PR 2 (~254):** `IntervalTrainer.svelte` + component test + the 4 wiring
  edits. Depends on PR 1.

If a single PR is mandated, record a `size:exception` (audio + UI + tests are
one cohesive feature). Recommendation: **chained PRs (PR1 → PR2)** so each stays
under 400 and PR1's pure logic lands green before the UI consumes it.

## Risks

- 400-line budget exceeded — MITIGATED by the PR1/PR2 split above.
- Sequential `setTimeout`/scheduled-stop timing assertions can be brittle —
  MITIGATED by asserting *scheduled* values (`stop(arg)` arg is a number >
  start), not real-time playback, matching ToneGenerator's test approach.
- `happy-dom`/jsdom lacks real Web Audio — MITIGATED by `vi.stubGlobal`
  AudioContext mock (proven in ToneGenerator test).
- Enharmonic naming confusion (Tritone) — ACCEPTED: one canonical name per
  semitone, no b5/#4 in v1.

## Rollback

Delete `IntervalTrainer.svelte`, `intervals.ts`, `playNote.ts` + their tests;
remove the `ViewName` entry, the App router branch, and the HomePage card. No
data migrations, no ToneGenerator changes to revert.
