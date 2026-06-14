# Tasks: Interval Ear Trainer

Execution order: RED → GREEN within each slice. Tasks marked `[PARALLEL-SAFE]` have no
dependency on other in-progress tasks and can be started at the same time. Sequential
dependencies are called out explicitly.

---

## PR1 — Pure logic + audio (no UI) ~255 lines

> Branch: `feat/interval-ear-trainer-pr1`
> Target: `main`
> Files: `src/lib/theory/intervals.ts`, `src/lib/audio/playNote.ts`,
>         `tests/unit/theory/intervals.test.ts`, `tests/unit/audio/playNote.test.ts`

---

### TASK 1.1 — [RED] intervals.test.ts: skeleton + midiToFreq
**Spec**: interval-data / noteToFreq helper (4 scenarios)
**ADRs**: ADR-2 (MIDI internal unit, formula 440*2^((midi-69)/12))

Create `tests/unit/theory/intervals.test.ts`. Write FAILING tests:
- `midiToFreq(69)` equals exactly 440
- `midiToFreq(57)` equals exactly 220
- `midiToFreq(81)` equals exactly 880
- `midiToFreq(60)` is within 0.01 of 261.63

**Acceptance**: `npx vitest run tests/unit/theory/intervals.test.ts` fails (import error or assertion).

---

### TASK 1.2 — [RED] intervals.test.ts: IntervalName type + INTERVALS table
**Spec**: interval-data / IntervalName type (1 scenario) + Interval Table (3 scenarios)
**ADRs**: ADR-3 (12-entry table, no enum, canonical 'Tritone' for semitone 6)

Append FAILING tests to `tests/unit/theory/intervals.test.ts`:
- `INTERVALS` has length 12
- Each `INTERVALS[i].semitones` equals `i+1` for i in 0..11
- All 12 canonical names present (exact list from spec, including 'Tritone')
- No duplicate names (Set size === 12)
- No duplicate semitone values (Set size === 12)
- `intervalBySemitones(n)` returns correct entry for n = 1..12
- `intervalBySemitones(0)` throws (out of range)
- `intervalBySemitones(13)` throws (out of range)

**Acceptance**: new tests fail; midiToFreq tests may still fail (file does not exist yet).

---

### TASK 1.3 — [RED] intervals.test.ts: generateQuestion with scripted RNG
**Spec**: interval-trainer / Question Generation (2 scenarios) + Answer Panel / No duplicate choices (1 scenario)
**ADRs**: ADR-4 (pure function, Rng injection, Fisher-Yates shuffle, dedup distractors), ADR-5 (ROOT_MIN=57, ROOT_SPAN=13)

Append FAILING tests to `tests/unit/theory/intervals.test.ts`.
Create a deterministic array-backed `fakeRng(values: number[]): Rng` helper at the top of the file.

Tests:
- `generateQuestion(fakeRng([0, 0, ...]))` produces `rootMidi` in range 57..69
- `generateQuestion(...)` returns `choices` array of length 4
- All 4 choice names are distinct (Set size === 4)
- Correct interval name is among the 4 choices
- `lowMidi` equals `rootMidi`, `highMidi` equals `rootMidi + interval.semitones`
- With known RNG sequence, specific `rootMidi` and interval name are deterministic (pin one concrete case)

**Acceptance**: tests fail with import error.

---

### TASK 1.4 — [GREEN] Implement `src/lib/theory/intervals.ts`
**Spec**: interval-data (all), interval-trainer / Question Generation
**ADRs**: ADR-2, ADR-3, ADR-4, ADR-5

Create `src/lib/theory/intervals.ts`. Export:
- `type Rng = () => number`
- `type IntervalName` — string-literal union of exactly 12 canonical names
- `interface Interval { semitones: number; name: IntervalName; short: string }`
- `const INTERVALS: readonly Interval[]` — 12 entries, semitones 1..12, index i → semitones i+1, name 'Tritone' for semitone 6
- `function midiToFreq(midi: number): number` — formula: `440 * 2 ** ((midi - 69) / 12)`
- `function intervalBySemitones(n: number): Interval` — throws `RangeError` for n < 1 or n > 12
- `const ROOT_MIN = 57`, `const ROOT_SPAN = 13` (roots 57..69 inclusive)
- `interface Question { rootMidi: number; interval: Interval; lowMidi: number; highMidi: number; choices: IntervalName[] }`
- `function generateQuestion(rng: Rng = Math.random): Question` — pick interval via `rng`, pick root via `rng`, build 3 distractors via dedup loop with `rng`, Fisher-Yates shuffle all 4 choices with `rng`

**Acceptance**: `npx vitest run tests/unit/theory/intervals.test.ts` passes all tests (0 failures).

---

### TASK 1.5 — [RED] playNote.test.ts: skeleton + stub shape + isolation test
**Spec**: audio-playback / Module Isolation (1 scenario) + Note Scheduling / schedules without throwing (1 scenario)
**ADRs**: ADR-6 (factory, not class/singleton; lazy AudioContext; sine oscillator; anti-click envelope)

Create `tests/unit/audio/playNote.test.ts`.

Build a `MockAudioContext` stub with the same shape used in `ToneGenerator.test.ts`:
- `createOscillator()` returns mock oscillator (`connect`, `start`, `stop`, `frequency.value`, `type`)
- `createGain()` returns mock gain node (`connect`, `gain.setValueAtTime`, `gain.linearRampToValueAtTime`, `gain.cancelScheduledValues`)
- `destination: {}`, `currentTime: 0`

Use `vi.stubGlobal('AudioContext', MockAudioContext)` in `beforeEach`; restore in `afterEach`.

Write FAILING tests:
- Import `createNotePlayer` from `$lib/audio/playNote` succeeds with no side effects (no ctx constructed at import time)
- `player.playSequence([440, 880])` does not throw

**Acceptance**: tests fail (module does not exist).

---

### TASK 1.6 — [RED] playNote.test.ts: oscillator count, frequency, envelope, scheduling, dispose
**Spec**: audio-playback / Note Scheduling (2 envelope scenarios) + Module Isolation
**ADRs**: ADR-6 (STEP=0.7s, NOTE_DUR=0.6, GAP=0.1, ATTACK=0.015, RELEASE=0.03; sequential offsets; dispose stops all)

Append FAILING tests to `tests/unit/audio/playNote.test.ts`:
- `playSequence([440, 880])` calls `createOscillator` exactly twice
- `playSequence([440, 880])` calls `createGain` exactly twice
- First oscillator's `frequency.value` is 440, second is 880
- Gain envelope: `setValueAtTime(0, startTime)` called for attack ramp start
- Gain envelope: `linearRampToValueAtTime` called for attack and release ramps (not immediate step)
- Second note start time is offset by 0.7 s from first (STEP = NOTE_DUR + GAP)
- `dispose()` calls `close()` on the underlying AudioContext

**Acceptance**: tests fail (module does not exist).

---

### TASK 1.7 — [GREEN] Implement `src/lib/audio/playNote.ts`
**Spec**: audio-playback (all scenarios)
**ADRs**: ADR-1 (no import from ToneGenerator), ADR-6 (factory, lazy ctx, sine, anti-click envelope, sequential scheduling)

Create `src/lib/audio/playNote.ts`. Export:
- `interface NotePlayer { playSequence(freqs: number[]): void; dispose(): void }`
- `function createNotePlayer(): NotePlayer` — factory (no class, no module singleton)

`createNotePlayer` internals:
- `let ctx: AudioContext | null = null`
- `playSequence(freqs)`: lazy-initialise `ctx = new AudioContext()` on first call; for each freq at index `i`, schedule one note at `ctx.currentTime + i * STEP` where `STEP = NOTE_DUR + GAP`
- Each note: fresh `OscillatorNode` (type='sine') + `GainNode`, anti-click envelope (`setValueAtTime(0, t)` → `linearRampToValueAtTime(peak, t+ATTACK)` → `linearRampToValueAtTime(0, t+NOTE_DUR-RELEASE)`) → `oscillator.connect(gain)` → `gain.connect(ctx.destination)` → `oscillator.start(t)` → `oscillator.stop(t+NOTE_DUR)`
- Constants (unexported or exported): `NOTE_DUR = 0.6`, `GAP = 0.1`, `STEP = 0.7`, `ATTACK = 0.015`, `RELEASE = 0.03`
- `dispose()`: `ctx?.close(); ctx = null`

No import from `ToneGenerator.svelte` or any Svelte file.

**Acceptance**: `npx vitest run tests/unit/audio/playNote.test.ts` passes all tests. Full unit suite `npx vitest run` stays green.

---

## PR2 — Component + wiring (depends on PR1 merged) ~254 lines

> Branch: `feat/interval-ear-trainer-pr2` (from `main` after PR1 merges)
> Target: `main`
> Files: `src/lib/components/IntervalTrainer.svelte`,
>         `tests/components/IntervalTrainer.test.ts`,
>         `src/lib/types/chord.ts`, `src/App.svelte`,
>         `src/lib/components/HomePage.svelte`, `tests/components/HomePage.test.ts`

---

### TASK 2.1 — [RED] IntervalTrainer.test.ts: render + back navigation
**Spec**: interval-trainer / Back-to-Home Navigation (1 scenario)
**ADRs**: ADR-7 (flat runes, navigate prop), ADR-8 (Props interface with navigate)

Create `tests/components/IntervalTrainer.test.ts`.

Stub AudioContext (same mock shape as in `playNote.test.ts`) via `vi.stubGlobal` in `beforeEach`/`afterEach`.

Write FAILING tests:
- Renders without throwing
- Renders title "Interval Trainer"
- Renders a back-to-home control (button text "← Back to Home" or aria-label containing "Back")
- Clicking back-to-home calls `navigate('home')`

**Acceptance**: tests fail (component does not exist).

---

### TASK 2.2 — [RED] IntervalTrainer.test.ts: question renders 4 answer buttons + audio plays
**Spec**: interval-trainer / Multiple-Choice Answer Panel (panel shows 4 buttons, no duplicates) + Audio Playback / two notes play on question start
**ADRs**: ADR-4 (choices from generateQuestion), ADR-6 (playSequence called on mount)

Append FAILING tests:
- On mount, exactly 4 answer buttons are rendered
- All 4 button labels are distinct
- The correct interval name is among the 4 buttons
- `playSequence` is called once on initial render (mock the `createNotePlayer` factory via `vi.mock('$lib/audio/playNote', ...)`)

**Acceptance**: tests fail.

---

### TASK 2.3 — [RED] IntervalTrainer.test.ts: correct answer flow
**Spec**: interval-trainer / Answer Checking — correct scenario + Score Tracking
**ADRs**: ADR-7 (total++, correct++, lastAnswer='correct', setTimeout next on correct)

Append FAILING tests:
- Clicking the correct answer button: score display shows "1 / 1"
- Score region has `aria-live="polite"`
- Answer buttons are disabled after selecting an answer

**Acceptance**: tests fail.

---

### TASK 2.4 — [RED] IntervalTrainer.test.ts: wrong answer flow + replay
**Spec**: interval-trainer / Answer Checking — wrong scenario + Audio Playback / Replay
**ADRs**: ADR-7 (total++ only, reveal correct), ADR-6 (playSequence called again on replay)

Append FAILING tests:
- Clicking a wrong answer: correct count stays 0, total becomes 1 (score "0 / 1")
- Correct answer name is visually revealed after wrong answer
- Replay control exists with accessible aria-label (e.g. "Replay interval")
- Clicking replay calls `playSequence` again without generating a new question

**Acceptance**: tests fail.

---

### TASK 2.5 — [RED] IntervalTrainer.test.ts: Next control
**Spec**: interval-trainer / Score Tracking and Next Question (next control scenario)
**ADRs**: ADR-7 (next resets state, new generateQuestion, playSequence)

Append FAILING tests:
- After answering, a "Next" control appears
- Clicking Next re-enables answer buttons
- Clicking Next calls `playSequence` again
- "Next" control has aria-label "Next question"

**Acceptance**: tests fail.

---

### TASK 2.6 — [GREEN] Implement `src/lib/components/IntervalTrainer.svelte`
**Spec**: interval-trainer (all 13 scenarios)
**ADRs**: ADR-6 (component owns one NotePlayer, cleanup in $effect return), ADR-7 (flat $state runes, quiz state machine), ADR-8 (Props interface with navigate)

Create `src/lib/components/IntervalTrainer.svelte`. Use Svelte 5 runes exclusively (`$state`, `$derived`, `$effect`, `$props`). No `on:` event syntax; use `onclick` handlers. No `createEventDispatcher`.

State:
- `correct = $state(0)`, `total = $state(0)`
- `question = $state<Question | null>(null)`
- `lastAnswer = $state<'correct' | 'incorrect' | null>(null)`
- `selected = $state<IntervalName | null>(null)`

Props: `interface Props { navigate: (view: ViewName) => void }` — destructure via `$props()`.

Lifecycle:
- Create `player = createNotePlayer()` at module-instance scope
- `$effect(() => { next(); return () => player.dispose(); })` — initialises first question on mount, disposes on unmount
- `next()`: calls `generateQuestion()`, sets `question`, clears `lastAnswer`/`selected`, calls `player.playSequence([midiToFreq(lowMidi), midiToFreq(highMidi)])`

`answer(iv: IntervalName)`: guard if `selected !== null`; `total++`; if correct `correct++, lastAnswer='correct', setTimeout(next, 1500)` else `lastAnswer='incorrect'`; `selected = iv`.

UI must include:
- Back button calling `navigate('home')`
- Score `{correct} / {total}` in region with `aria-live="polite"`
- Replay button with `aria-label="Replay interval"`, calls `player.playSequence([...])`
- 4 answer buttons with `aria-label` including interval name, disabled when `selected !== null`
- Next button (visible after answering) with `aria-label="Next question"`, calls `next()`

**Acceptance**: `npx vitest run tests/components/IntervalTrainer.test.ts` passes all tests.

---

### TASK 2.7 — [RED+GREEN] chord.ts: add 'interval-trainer' to ViewName [PARALLEL-SAFE after PR1]
**Spec**: app-shell delta / View Name Union
**ADRs**: ADR-8 (edit 1 of 4)

First write a type-level test or confirm existing `tests/components/IntervalTrainer.test.ts` already imports `ViewName` and uses `'interval-trainer'` — that acts as the RED signal. Then apply the edit:

Edit `src/lib/types/chord.ts`: append `| 'interval-trainer'` to the `ViewName` union.

**Acceptance**: TypeScript compilation error for `'interval-trainer'` disappears; `npx vitest run` stays green.

> Note: tasks 2.7, 2.8, and 2.9 are sequentially independent of each other but all depend on 2.6 being done (component must exist before wiring is testable end-to-end). They CAN be applied in any order once 2.6 is complete.

---

### TASK 2.8 — [GREEN] App.svelte: add interval-trainer route branch
**Spec**: app-shell delta / View Routing (Route to Interval Trainer scenario)
**ADRs**: ADR-8 (edit 2 of 4)

Edit `src/App.svelte`:
- Import `IntervalTrainer` from `$lib/components/IntervalTrainer.svelte`
- Add `{:else if currentView === 'interval-trainer'}` branch with `<svelte:boundary>` and same `errorFallback` snippet pattern used by existing routes

**Acceptance**: `npx vitest run` stays green; no TypeScript errors.

---

### TASK 2.9 — [RED] HomePage.test.ts: Interval Trainer card tests
**Spec**: home-page delta / Interval Trainer card exists + card content + card navigates
**ADRs**: ADR-8 (edit 3 of 4)

Append FAILING tests to `tests/components/HomePage.test.ts`:
- Interval Trainer card renders ("Interval Trainer" text is in the DOM)
- Interval Trainer card shows ear-training description text
- `getAllByText('Open')` count increases by 1 (from 6 to 7 — update existing count assertions accordingly)
- Clicking Interval Trainer card calls `navigate('interval-trainer')`
- Interval Trainer card button has aria-label containing "Interval Trainer"
- Card is positioned after Tone Generator card (DOM order check or index check on Open buttons)

**Acceptance**: new tests fail; existing HomePage tests still pass.

---

### TASK 2.10 — [GREEN] HomePage.svelte: add Interval Trainer card
**Spec**: home-page delta / Interval Trainer card (all scenarios)
**ADRs**: ADR-8 (edit 4 of 4)

Edit `src/lib/components/HomePage.svelte`:
- Add Interval Trainer active card after the Tone Generator card, before placeholder cards
- Card: icon (👂 or similar), title "Interval Trainer", description "Train your ear to recognize musical intervals by sound"
- Card is a `<button>` with `aria-label="Open Interval Trainer tool"` calling `navigate('interval-trainer')`
- Matches active-card styling of other cards (same CSS classes)

**Acceptance**: `npx vitest run tests/components/HomePage.test.ts` passes all tests including new ones.

---

### TASK 2.11 — Final green run
**Spec**: All 47 scenarios
Run `npx vitest run` (full suite). All tests pass, no regressions.

**Acceptance**: 0 failures across the full suite.

---

## Review Workload Forecast

| Metric | PR1 | PR2 | Total |
|---|---|---|---|
| Estimated production lines | ~130 | ~169 | ~299 |
| Estimated test lines | ~110 | ~100 | ~210 |
| Estimated total changed lines | ~240 | ~269 | ~509 |
| 400-line budget risk | Low (240) | Low (269) | High (509) |
| Chained PRs recommended | — | — | **Yes** |
| Decision needed before apply | — | — | **No** (chain already decided) |

**Chained PRs recommended: Yes**
**400-line budget risk (per-slice): Low — both slices land under 300 lines**
**400-line budget risk (single PR): High — total ~509 lines**
**Decision needed before apply: No — chained-PR delivery is the selected strategy**

PR1 is fully self-contained (pure TS modules, no UI dependencies). PR2 depends on PR1 being merged to `main` before branching. No circular dependencies between tasks within each slice.
