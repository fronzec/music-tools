# Tasks: Tab Player

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Estimated total changed lines | ~460 |
| Slice 1 estimate | ~210 lines |
| Slice 2 estimate | ~250 lines |
| Chained PRs recommended | Yes |
| 400-line budget risk | High (total) / Low (per slice) |
| Decision needed before apply | No — chain strategy already chosen (stacked-to-main) |

---

## Conventions and constraints

- STRICT TDD: every source file gets its test in the SAME task (RED first, then GREEN).
- Timer cancellation is critical. A prior tool hung the machine via uncancelled timers. Every cancellation point must have a `vi.useFakeTimers` test that asserts `vi.getTimerCount() === 0` after the cancellation occurs.
- `fretToMidi` uses `OPEN_MIDI = [40,45,50,55,59,64]`. Never reference `STANDARD_TUNING`.
- String index 0 = low E (MIDI 40). String index 5 = high E (MIDI 64).
- Playback engine: single bounded recursive `setTimeout`. No `setInterval`. No unbounded loop.
- Svelte 5 runes throughout: `$state`, `$derived`, `$effect`, `$props`, callback props (no `createEventDispatcher`), `onclick` (no `on:click`).
- Test component mounts via `@testing-library/svelte`. AudioContext mocked (mirror `tests/unit/audio/playNote.test.ts` pattern).

---

## PR1 — Slice 1: Theory + Data + Fretboard (~210 lines)

> Merges dark. No user-facing entry point yet.

### T1.1 — [RED] Write failing tests for `fretToMidi` and `Tab` types

**Dependencies**: none
**Can parallelize with**: nothing (must be first in slice 1)
**Spec req**: fretToMidi Mapping; Tab Data Model

Create `tests/unit/theory/tab.test.ts` with failing assertions:
- `fretToMidi(0, 0) === 40` (open low E)
- `fretToMidi(5, 0) === 64` (open high E)
- `fretToMidi(2, 2) === 52` (D string fret 2)
- `fretToMidi(2, 3) === 53` (D string fret 3)
- `fretToMidi(0, 12) === 52` (low E fret 12)
- `[0,1,2,3,4,5].map(s => fretToMidi(s,0)) deepEquals [40,45,50,55,59,64]` (all open strings)
- Type-shape test: `Tab` has `title: string` and `steps: TabStep[]`; `TabNote` has `string` and `fret` fields
- `TabStep` is an array of `TabNote`

**Acceptance**: `npx vitest run` reports these tests as failing (import cannot resolve).

---

### T1.2 — [GREEN] Implement `src/lib/theory/tab.ts`

**Dependencies**: T1.1
**Can parallelize with**: nothing
**Spec req**: fretToMidi Mapping; Tab Data Model

Create `src/lib/theory/tab.ts` exporting:
```ts
export interface TabNote { string: number; fret: number; }
export type TabStep = TabNote[];
export interface Tab { title: string; steps: TabStep[]; }
export const OPEN_MIDI: readonly number[] = [40, 45, 50, 55, 59, 64];
export function fretToMidi(stringIndex: number, fret: number): number {
  return OPEN_MIDI[stringIndex] + fret;
}
```

**Acceptance**: all T1.1 tests pass; `npx vitest run tests/unit/theory/tab.test.ts` exits 0.

---

### T1.3 — [GREEN] Create `src/lib/data/tabs.ts`

**Dependencies**: T1.2
**Can parallelize with**: T1.4 (test setup)
**Spec req**: Curated Tab Library; Library Order Stable

Create curated `TABS: Tab[]` with 3–5 short entries (riffs or exercises, each ≤ 16 steps). Each entry has a `title`. Array order is stable (const, not generated). Include at least one chord step (multiple `TabNote` in a `TabStep`) to exercise that path. No test in this task — covered by T1.5.

**Acceptance**: module imports without error; `TABS.length >= 3 && TABS.length <= 5`; each entry has non-empty `title` and at least one step with at least one `TabNote`.

---

### T1.4 — [RED] Write failing tests for `TabFretboard`

**Dependencies**: T1.2 (types must exist for import)
**Can parallelize with**: T1.3
**Spec req**: TabFretboard Display; Tab Notation Display; Accessibility — Controls (fretboard role)

Create `tests/unit/components/TabFretboard.svelte.test.ts`:
- Mount with a known `steps` and `currentStep = 0`. Assert `data-testid="mark-0-2"` present when step 0 has `{ string: 0, fret: 2 }`.
- Assert a position NOT in currentStep has no marker (`data-testid="mark-3-5"` absent).
- Mount with chord step (2+ positions). Assert all chord markers present simultaneously.
- Change `currentStep` prop from 0 to 1. Assert step 0 markers gone, step 1 markers present.
- Assert container has `role="img"` and non-empty `aria-label`.

**Acceptance**: all assertions fail (component does not exist yet).

---

### T1.5 — [RED] Write failing library tests (TABS data assertions)

**Dependencies**: T1.3
**Can parallelize with**: T1.4
**Spec req**: Curated Tab Library; Library Selection (initial state)

Add to or create `tests/unit/theory/tabs.test.ts`:
- `TABS.length >= 3`
- `TABS.length <= 5`
- All `title` values unique and non-empty
- All `steps` arrays non-empty
- No step in any tab is an empty array (empty step is rejected by spec)

**Acceptance**: tests run; all pass immediately if T1.3 is correct. (These are data-contract tests — they should go green in the same batch as T1.3 is implemented, but are authored before T1.3 so intent is documented first.)

---

### T1.6 — [GREEN] Implement `src/lib/components/TabFretboard.svelte`

**Dependencies**: T1.4 (tests defined), T1.2 (types)
**Can parallelize with**: nothing
**Spec req**: TabFretboard Display; Tab Notation Display; Accessibility — Controls (fretboard role)

Create `src/lib/components/TabFretboard.svelte` (presentational, no audio, no timer):
- Props: `steps: TabStep[]`, `currentStep: number`, `width?: number`
- SVG fretboard with 6 strings and at least 12 frets. Copy geometry conventions from `IntervalFretboard.svelte` (stringY, noteX, fretLineX constants). Do NOT generalize `IntervalFretboard`.
- For each `TabNote` in `steps[currentStep]`: render a visible marker with `data-role="active"` and `data-testid="mark-{string}-{fret}"`.
- Optional: faint markers with `data-role="ghost"` for all other step positions.
- Lightweight notation row above the SVG: render step columns (text/tab-grid style) so all steps are visible. Mark the column at `currentStep` visually distinct (e.g., different background or border).
- Container: `role="img"` and `aria-label` describing current state (e.g., "Guitar fretboard at step {currentStep + 1} of {steps.length}").
- Svelte 5: `let { steps, currentStep, width = 600 } = $props();`

**Acceptance**: all T1.4 tests pass; `npx vitest run tests/unit/components/TabFretboard.svelte.test.ts` exits 0.

---

## PR2 — Slice 2: TabPlayer engine + registration (~250 lines)

> Slice 1 must be merged to main before this branch is cut.

### T2.1 — [RED] Write failing tests for `TabPlayer` — playback engine

**Dependencies**: T1.2 (types), T1.3 (tabs data, for fixtures), T1.6 (fretboard exists so full mount works)
**Can parallelize with**: nothing (must be first in slice 2)
**Spec req**: Playback Engine; Tempo Control; Step-Through Navigation; Library Selection; Accessibility — Controls

Create `tests/unit/components/TabPlayer.svelte.test.ts`. Use `vi.useFakeTimers()` in `beforeEach`, restore in `afterEach`. Mock `AudioContext` (mirror `tests/unit/audio/playNote.test.ts` pattern). All tests use `vi.advanceTimersByTime`, never real waits.

Write the following test cases (all RED at this point):

**Group A — basic play**
- A1: Play from step 0 → after no time elapses, `stepIndex` is 0 and audio was called once (immediate play).
- A2: Play → advance `stepMs` once → `stepIndex === 1`, audio called twice total.
- A3: Play → advance `stepMs` N times → `stepIndex === N`, audio called `N+1` times.

**Group B — stop cancellation (CRITICAL — prior machine hang)**
- B1: Play → Stop → assert `vi.getTimerCount() === 0` (no pending timer).
- B2: Play → Stop → advance `stepMs` arbitrarily → `stepIndex` unchanged from reset value (0).
- B3: Stop while already stopped → no error, `vi.getTimerCount() === 0`.

**Group C — end-of-tab auto-stop (CRITICAL)**
- C1: Play through all steps of a short tab (advance `stepMs * (steps.length - 1)`) → `isPlaying === false`.
- C2: Same scenario → `vi.getTimerCount() === 0` (timer did not schedule another callback).
- C3: Same scenario → audio was called exactly `steps.length` times.

**Group D — unmount cancellation (CRITICAL — this is what hung the machine)**
- D1: Mount, Play, then `unmount()` → `vi.getTimerCount() === 0` immediately after unmount.
- D2: Mount, Play, `unmount()`, then `vi.advanceTimersByTime(stepMs * 5)` → `stepIndex` did not change (component is gone, no side effects).

**Group E — tab switch cancellation**
- E1: Play on tab 0 → select tab 1 → `vi.getTimerCount() === 0`.
- E2: After E1, `stepIndex === 0` (reset on tab switch).
- E3: Play on tab 0 → select same tab 0 again → `vi.getTimerCount() === 0`, `stepIndex === 0`.

**Group F — tempo**
- F1: Default tempo between 60 and 120 BPM.
- F2: Tempo clamped to 200 when set to 250.
- F3: Tempo clamped to 40 when set to 10.
- F4: Change tempo mid-play (tick-boundary): old interval advances 1 step; new interval advances the next step correctly.

**Group G — step-through while stopped**
- G1: Stopped at step 2, press Next → `stepIndex === 3`.
- G2: Stopped at step 0, press Previous → `stepIndex === 0` (no-op).
- G3: Step-through while playing → buttons disabled / noop.

**Group H — accessibility**
- H1: Tab selector has `aria-label` containing "Select tab" or equivalent.
- H2: Play button has `aria-label` "Play" or equivalent.
- H3: Stop button has `aria-label` "Stop" or equivalent.
- H4: Tempo control has `aria-label` containing "Tempo" or equivalent.

**Acceptance**: all groups fail (component does not exist).

---

### T2.2 — [GREEN] Implement `src/lib/components/TabPlayer.svelte`

**Dependencies**: T2.1 (tests), T1.2, T1.3, T1.6
**Can parallelize with**: nothing
**Spec req**: all tab-player requirements

Create `src/lib/components/TabPlayer.svelte`:

State (`$state` runes):
```ts
let selectedTab: Tab = $state(TABS[0]);
let stepIndex: number = $state(0);
let isPlaying: boolean = $state(false);
let tempo: number = $state(80); // default in 60–120 range
let tick: ReturnType<typeof setTimeout> | null = null;
```

Derived:
```ts
let stepMs = $derived(60_000 / Math.min(200, Math.max(40, tempo)));
```

Core functions — implement EXACTLY as designed:
- `cancelTick()`: `if (tick !== null) { clearTimeout(tick); tick = null; }`
- `playStep()`: calls `player.playSequence(selectedTab.steps[stepIndex].map(p => midiToFreq(fretToMidi(p.string, p.fret))))`
- `scheduleNext()`: calls `playStep()`, then `tick = setTimeout(() => { if (stepIndex >= selectedTab.steps.length - 1) { stop(); return; } stepIndex++; scheduleNext(); }, stepMs)`
- `play()`: if `stepIndex >= selectedTab.steps.length - 1` reset to 0; `isPlaying = true`; `scheduleNext()`
- `stop()`: `isPlaying = false; cancelTick(); stepIndex = 0;`
- `stepTo(i)`: `cancelTick(); isPlaying = false; stepIndex = i; playStep();`
- `selectTab(t)`: `cancelTick(); isPlaying = false; selectedTab = t; stepIndex = 0;`

Unmount cleanup via `$effect`:
```ts
$effect(() => {
  return () => { cancelTick(); player.dispose(); };
});
```

Tempo enforcement: clamp on input (not in derived), so stored `tempo` is always 40–200.

Controls (all with `aria-label`):
- Tab selector (`<select aria-label="Select tab">`) — iterates `TABS`
- Play/Stop buttons (`aria-label="Play"`, `aria-label="Stop"`)
- Tempo `<input type="range" min="40" max="200" aria-label="Tempo (BPM)">`
- Next/Previous buttons (disabled when `isPlaying`)

Renders `<TabFretboard steps={selectedTab.steps} currentStep={stepIndex} />`.

**Acceptance**: all T2.1 groups (A–H) pass; `npx vitest run tests/unit/components/TabPlayer.svelte.test.ts` exits 0.

---

### T2.3 — [GREEN] Registration edit 1 — `ViewName` union

**Dependencies**: none (pure type change, no runtime risk)
**Can parallelize with**: T2.4, T2.5 (all registration edits are independent)
**Spec req**: app-shell — View Name Union

Modify `src/lib/types/chord.ts`: add `'tab-player'` to the `ViewName` union type.

**Acceptance**: TypeScript compiles; existing tests pass; the literal `'tab-player'` is present in the union.

---

### T2.4 — [GREEN] Registration edit 2 — `App.svelte` routing

**Dependencies**: T2.2 (component must exist to import), T2.3 (ViewName must include `'tab-player'`)
**Can parallelize with**: T2.5
**Spec req**: app-shell — View Routing

Modify `src/App.svelte`:
- Import `TabPlayer` from `$lib/components/TabPlayer.svelte`
- Add `{:else if currentView === 'tab-player'}<svelte:boundary><TabPlayer {navigate} /></svelte:boundary>{/if}` branch in the view router

**Acceptance**: app builds without TS errors; navigation to `'tab-player'` renders `TabPlayer`.

---

### T2.5 — [GREEN] Registration edit 3 — `HomePage.svelte` card

**Dependencies**: T2.3 (ViewName must include `'tab-player'` for `navigate` call to type-check)
**Can parallelize with**: T2.4
**Spec req**: home-page — Tool Card Content; Tab Player Card Content

Modify `src/lib/components/HomePage.svelte`:
- Add active Tab Player card after Interval Trainer card and before any placeholder cards
- Card content: icon + title "Tab Player" + description "Read guitar tabs with fretboard highlights and audio playback" + "Open" button
- Button: `onclick={() => navigate('tab-player')}`

**Acceptance**: home page renders the Tab Player card; clicking navigates to `'tab-player'`; no TS errors.

---

## Execution order (dependency DAG)

```
T1.1 → T1.2 → T1.6 (GREEN)
              ↓
         T1.4 → T1.6 (test drives impl)
T1.3 ←→ T1.5 (parallel — data + data tests)

— merge Slice 1 to main —

T2.1 → T2.2 (engine RED → GREEN)
T2.3 ─┬─→ T2.4 (after T2.2)
       └─→ T2.5 (parallel with T2.4)
```

Sequential bottlenecks:
- T1.1 → T1.2 is strictly sequential (test must be red before implementation).
- T1.4 must be authored before T1.6 (TDD contract).
- T2.1 must be authored and red before T2.2.
- T2.4 requires T2.2 (import) and T2.3 (type). T2.5 requires T2.3 only.
- All of Slice 2 is blocked on Slice 1 merging to main.

Parallel opportunities within a slice:
- T1.3 and T1.4/T1.5 can be written concurrently once T1.2 exists.
- T2.3, T2.4, T2.5 can be applied in a single commit batch (they don't conflict).
