# Tasks: Diatonic Sweep Practice

Change: `diatonic-sweep-practice`
Delivery: 2-PR chained split — stacked-to-main
Artifact store: hybrid (engram + openspec)

---

## Review Workload Forecast

```
Chained PRs recommended:  Yes
400-line budget risk:      Low-Med (each PR individually under 400; total exceeds)
Estimated changed lines:
  PR1 (theory/data/types):  ~310 lines
    src/lib/types/chord.ts          +8
    src/lib/types/progression.ts   +16
    src/lib/data/chords.ts          +6
    src/lib/theory/layout.ts        +3
    src/lib/theory/arpeggioShape.ts +45 (new file)
    tests/unit/theory/arpeggioShape.test.ts +85 (new file)
    src/lib/theory/transport.ts     +42 (new file)
    tests/unit/theory/transport.test.ts     +85 (new file)
    tests/unit/data/chords.test.ts  +10
    tests/unit/theory/layout.test.ts +8
  PR2 (UI wiring):          ~270 lines
    src/lib/components/SweepFretboard.svelte +100 (new file)
    src/lib/components/ProgressionBuilder.svelte +70
    src/lib/components/ProgressionBar.svelte +20
    src/lib/components/ProgressionTimeline.svelte +20
    tests/components/ProgressionBar.test.ts +15
    tests/components/ProgressionTimeline.test.ts +15
    tests/components/ProgressionBuilder.test.ts +30
  Total:                   ~580 lines across 2 PRs
Decision needed before apply: Yes — confirm 2-PR split and stacked-to-main strategy
Recommended chain strategy: stacked-to-main
  Reason: PR1 is a fully independent theory layer (tests green, zero UI),
  lands to main first; PR2 builds directly on it with no integration concern.
  A feature-branch tracker adds no value here.
```

---

## PR1 — theory/data/types

No visible behavior change. Ships test-green with zero UI changes. Validates
the entire theory layer before any UI is wired.

### Work Unit A — Types foundation
**Commit**: `feat(progression): add ArpeggioNote, PlaybackMode, ChordQuality dim, STRING_OPEN_MIDI`
**Sequential** — must complete before Work Units C and D.

- [ ] **T-01** `src/lib/types/chord.ts`
  Extend `ChordQuality` union from `'major' | 'minor'` to `'major' | 'minor' | 'dim'`.
  Add `STRING_OPEN_MIDI: number[] = [40, 45, 50, 55, 59, 64]` constant with JSDoc
  (E2, A2, D3, G3, B3, E4; consistency: `STRING_OPEN_MIDI[i] % 12 === STANDARD_TUNING[i]`).
  _Satisfies_: Requirement: ChordQuality dim Extension; Requirement: Arpeggio Note-Event Model.

- [ ] **T-02** `src/lib/types/progression.ts`
  Add `ArpeggioNote` interface: `{ string: number; fret: number; midi: number; stepIndex: number }`.
  Add `PlaybackMode = 'caged' | 'sweep'` type.
  _Satisfies_: Requirement: Arpeggio Note-Event Model; Requirement: Note-by-Note Playback Animation.

### Work Unit B — Data & layout tolerance
**Commit**: `fix(chords): tolerate missing quality in getShapes; extend FRET_MARKERS for 24-fret`
**Parallel** with Work Unit A (no dependency between A and B).

- [ ] **T-03** `src/lib/data/chords.ts`
  In `getShapes`: replace `throw new Error(...)` with `return []` when
  `SHAPES[root]?.[quality]` is absent. Update JSDoc to document tolerant behavior
  (covers `dim` which has no CAGED JSON data).
  Add a test in `tests/unit/data/chords.test.ts`: assert `getShapes('D', 'dim')` returns `[]`
  (does not throw).
  _Satisfies_: Requirement: ChordQuality dim Extension (CAGED view renders empty board gracefully).

- [ ] **T-04** `src/lib/theory/layout.ts`
  Extend `FRET_MARKERS` from `[3, 5, 7, 9, 12, 15]` to
  `[3, 5, 7, 9, 12, 15, 17, 19, 21, 24]` — additive.
  FullFretboard guards markers by `mf < minFret + displaySpan` (14), so 14-fret view is byte-identical.
  Add an assertion in `tests/unit/theory/layout.test.ts`: markers above 15 are present in the exported array.
  _Satisfies_: Requirement: 24-Fret Sweep Fretboard (SweepFretboard will consume markers 17–24).

### Work Unit C — arpeggioShape module + tests
**Commit**: `feat(theory): add buildArpeggio pure function with Vitest tests`
**Parallel** with Work Unit D. Both depend on Work Unit A.

- [ ] **T-05** `src/lib/theory/arpeggioShape.ts` (NEW FILE)
  Implement:
  - `rootFretOnAString(root: NoteName): number` — `((CHROMATIC.indexOf(root) - 9) % 12 + 12) % 12`
  - `ARPEGGIO_TEMPLATES` record keyed by `ChordQuality`:
    - `major`: strings [1,2,3,4,5] fretOffsets [+0,+2,+2,+2,+5]
    - `minor`: strings [1,2,3,4,5] fretOffsets [+0,+2,+2,+1,+5]
    - `dim`:   strings [1,2,3,4,5] fretOffsets [+0,+1,+2,+1,+5]
  - `buildArpeggio(root: NoteName, quality: ChordQuality): ArpeggioNote[]` — maps template
    entries to `{ string, fret: rootFret + offset, midi: STRING_OPEN_MIDI[string] + fret, stepIndex: i }`.
  Pure function, no side effects, no DOM/audio.
  _Satisfies_: Requirement: Arpeggio Note-Event Model.

- [ ] **T-06** `tests/unit/theory/arpeggioShape.test.ts` (NEW FILE)
  Test suite (include tests with T-05 in one commit — work-unit-commits rule):
  - Returns exactly 5 events.
  - Events are for strings 1–5 in ascending order; `event[0].string === 1`.
  - Each `event.midi === STRING_OPEN_MIDI[event.string] + event.fret`.
  - `stepIndex` values are `[0,1,2,3,4]` in order.
  - C major → MIDI `[48, 55, 60, 64, 72]` (design worked example).
  - C minor → MIDI `[48, 55, 60, 63, 72]`.
  - C dim → MIDI `[48, 54, 60, 63, 72]`.
  - D dim → all 5 frets in `[0, 24]`; interval set matches R, b5, R, b3, R.
  - All 12 roots for major produce strictly ascending MIDI sequences.
  _Satisfies_: Requirement: Arpeggio Note-Event Model scenarios (major event structure, dim valid frets).

### Work Unit D — transport module + tests
**Commit**: `feat(theory): add advancePlayback pure function with Vitest tests`
**Parallel** with Work Unit C. Depends on Work Unit A.

- [ ] **T-07** `src/lib/theory/transport.ts` (NEW FILE)
  Implement:
  - `PlaybackState` interface: `{ activeIndex: number; activeNoteIndex: number; isPlaying: boolean }`.
  - `advancePlayback(state: PlaybackState, opts: { mode: PlaybackMode; progressionLength: number; arpeggioLength: number; loop: boolean }): PlaybackState`:
    - **caged**: increment `activeIndex`; at `progressionLength` boundary → `loop ? {activeIndex:0} : {isPlaying:false}`; `activeNoteIndex` remains 0.
    - **sweep**: increment `activeNoteIndex`; when `>= arpeggioLength` → reset to 0 and increment `activeIndex`; at progression boundary → `loop ? {activeIndex:0, activeNoteIndex:0} : {isPlaying:false}`.
    - A stopped state (`isPlaying=false`) returns unchanged.
  Pure function, no timer side effects.
  _Satisfies_: Requirement: Note-by-Note Playback Animation; Requirement: Loop Toggle.

- [ ] **T-08** `tests/unit/theory/transport.test.ts` (NEW FILE)
  Test suite (include tests with T-07 in one commit):
  - **caged**: advance increments `activeIndex`; stop at end when `loop=false` (`isPlaying=false`); loop wrap resets `activeIndex` to 0 with `isPlaying=true`.
  - **sweep inner**: `activeNoteIndex` increments; `activeIndex` unchanged.
  - **sweep carry**: last note of a chord → `activeNoteIndex=0`, `activeIndex++`.
  - **sweep stop**: last note of last chord, `loop=false` → `isPlaying=false`; `activeIndex` not wrapped.
  - **sweep loop-wrap**: last note of last chord, `loop=true` → `activeIndex=0`, `activeNoteIndex=0`, `isPlaying=true`.
  - **single-chord single-note** with `loop=true` — does not infinite-advance.
  - Already stopped (`isPlaying=false`) → returns state unchanged.
  _Satisfies_: Requirement: Note-by-Note Playback Animation scenarios; Requirement: Loop Toggle scenarios.

### Work Unit E — PR1 gate (not a commit — verification before PR open)
**Sequential** — must run after A, B, C, D all complete.

- [ ] **T-09** PR1 verification:
  1. `vitest run tests/unit/theory/arpeggioShape.test.ts tests/unit/theory/transport.test.ts tests/unit/data/chords.test.ts tests/unit/theory/layout.test.ts` — all pass.
  2. `tsc --noEmit` — confirms `ChordQuality` widening breaks no consumer (no exhaustive switch/never).
  3. Re-grep `ChordQuality` and `.quality` across the codebase to detect any new exhaustive guard introduced since the design audit (Risk R-6 check).
  4. Confirm `FullFretboard` and all CAGED-path tests pass unchanged.
  _Satisfies_: all PR1 requirements verified; unblocks PR1 → main merge.

---

## PR2 — UI wiring

Depends on PR1 merged to main. Branch from updated main.

### Work Unit F — SweepFretboard component
**Commit**: `feat(components): add SweepFretboard presentational component`
**Parallel** with Work Units G and H.

- [ ] **T-10** `src/lib/components/SweepFretboard.svelte` (NEW FILE)
  Props: `notes: ArpeggioNote[]`, `activeNoteIndex: number`, `fretSpan: number = 24`.
  SVG rendered using `layout.ts` primitives imported from `$lib/theory/layout.ts`:
  - `viewBox`: `"0 0 {viewBoxW(fretSpan)} {viewBoxH()}"`.
  - Fret lines: iterate 0..fretSpan via `fretLineX(f)`.
  - String lines: iterate 0..5 via `stringY(i)`.
  - Fret dot markers: filter `FRET_MARKERS` by `<= fretSpan`; render at mid-string positions.
  - 5 note circles at `noteX(note.fret, 0)` × `stringY(note.string)`: dimmed style for all;
    accent fill + diamond indicator for `notes[activeNoteIndex]`.
  No business logic. All data flows in via props.
  _Satisfies_: Requirement: 24-Fret Sweep Fretboard; Requirement: Note-by-Note Playback Animation (visual highlight).

### Work Unit G — ProgressionBar dim button
**Commit**: `feat(progression-bar): add dim quality selector button`
**Parallel** with Work Units F and H.

- [ ] **T-11** `src/lib/components/ProgressionBar.svelte`
  Add a third quality button `°` to the inline quality radiogroup, mirroring the existing M/m buttons:
  `aria-checked={chord.quality === 'dim'}`, calls `onQualityChange(index, 'dim')` on click.
  Update `tests/components/ProgressionBar.test.ts`:
  - Assert the `°` button is rendered.
  - Assert clicking it calls `onQualityChange` with `'dim'`.
  _Satisfies_: Requirement: ChordQuality dim Extension (UI selection of dim quality).

### Work Unit H — ProgressionTimeline loop toggle
**Commit**: `feat(progression-timeline): add loop toggle prop and button`
**Parallel** with Work Units F and G.

- [ ] **T-12** `src/lib/components/ProgressionTimeline.svelte`
  Add props: `loop: boolean`, `onToggleLoop: () => void`.
  Render a loop toggle button in the Playback card, styled like the existing speed buttons;
  reflects `loop` state via `aria-pressed` or equivalent.
  Update `tests/components/ProgressionTimeline.test.ts`:
  - Assert the loop button renders.
  - Assert clicking it calls `onToggleLoop`.
  - Assert `aria-pressed` matches the `loop` prop.
  _Satisfies_: Requirement: Loop Toggle (UI surface).

### Work Unit I — ProgressionBuilder wiring
**Commit**: `feat(progression-builder): wire sweep mode, note sub-stepping, loop, and board swap`
**Sequential** — depends on Work Units F, G, H. All changes in one commit (single container file + test update).

- [ ] **T-13** `src/lib/components/ProgressionBuilder.svelte` — state declarations
  Add Svelte 5 `$state` declarations:
  - `let mode = $state<PlaybackMode>('caged')`
  - `let activeNoteIndex = $state(0)`
  - `let loop = $state(false)`
  _Satisfies_: Requirement: Mode Toggle; Requirement: Loop Toggle; Requirement: Note-by-Note Playback Animation (state foundation).

- [ ] **T-14** `src/lib/components/ProgressionBuilder.svelte` — derived + reset effect
  Add `const currentArpeggio = $derived(buildArpeggio(currentChord.root, currentChord.quality))`.
  Add a `$effect` that resets `activeNoteIndex` to 0 whenever `activeIndex`, `mode`, or `currentChord`
  changes (ensures highlight starts at note 0 on chord/mode change without resetting speed or progression).
  _Satisfies_: Requirement: Note-by-Note Playback Animation (step reset); Requirement: Mode Toggle (reset on switch).

- [ ] **T-15** `src/lib/components/ProgressionBuilder.svelte` — timer update
  Update the existing timer `$effect` to call `advancePlayback`:
  ```
  const next = advancePlayback(
    { activeIndex, activeNoteIndex, isPlaying },
    { mode, progressionLength: progression.length, arpeggioLength: currentArpeggio.length, loop },
  );
  activeIndex = next.activeIndex;
  activeNoteIndex = next.activeNoteIndex;
  isPlaying = next.isPlaying;
  ```
  Interval duration remains `PLAYBACK_MS[playbackSpeed]` in both modes.
  _Satisfies_: Requirement: Note-by-Note Playback Animation (per-note step in sweep); Requirement: Loop Toggle (loop branch in advancePlayback).

- [ ] **T-16** `src/lib/components/ProgressionBuilder.svelte` — mode toggle control
  Add inline 2-button segmented control (CAGED / Sweep) in the fretboard card header.
  Clicking a button sets `mode`. Switching MUST NOT reset `progression`, `activeIndex`, or `playbackSpeed`.
  _Satisfies_: Requirement: Mode Toggle scenarios (activate/deactivate sweep, unchanged progression state).

- [ ] **T-17** `src/lib/components/ProgressionBuilder.svelte` — board swap
  Replace the static `<FullFretboard …/>` call site with:
  ```svelte
  {#if mode === 'caged'}
    <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
  {:else}
    <SweepFretboard notes={currentArpeggio} {activeNoteIndex} fretSpan={24} />
  {/if}
  ```
  The `<FullFretboard>` props are IDENTICAL to the current call — zero change to CAGED path.
  _Satisfies_: Requirement: 24-Fret Sweep Fretboard (sweep renders 24-fret span); Requirement: Mode Toggle (board switches on toggle).

- [ ] **T-18** `src/lib/components/ProgressionBuilder.svelte` — loop wiring
  Pass `{loop}` and `onToggleLoop={() => { loop = !loop }}` to `<ProgressionTimeline>`.
  _Satisfies_: Requirement: Loop Toggle (container owns loop state; timeline is presentational).

- [ ] **T-19** `tests/components/ProgressionBuilder.test.ts` — update
  Add / update tests:
  - Mode toggle changes `mode` between `'caged'` and `'sweep'`; progression and activeIndex unchanged.
  - Loop toggle button fires `onToggleLoop`.
  - In sweep mode, `SweepFretboard` is rendered (not `FullFretboard`).
  - In caged mode, `FullFretboard` is rendered.
  _Satisfies_: Requirement: Mode Toggle; Requirement: Loop Toggle (component integration tests).

### Work Unit J — PR2 gate (not a commit — verification before PR open)
**Sequential** — after all Work Units F–I complete.

- [ ] **T-20** PR2 verification:
  1. `vitest run` — all tests pass (including existing CAGED-path tests, unchanged).
  2. `tsc --noEmit` — no type errors.
  3. Dev-server smoke tests:
     - Sweep mode active → `SweepFretboard` with 24-fret span replaces `FullFretboard`.
     - Playback in sweep mode → note-by-note highlight, chord advances after 5 notes.
     - Loop ON → playback restarts at note 0 of chord 0.
     - Loop OFF → playback stops after last note of last chord.
     - Dim chord → `°` button works; sweep shows correct arpeggio; CAGED view shows empty board.
     - Switch CAGED → back to 14-fret `FullFretboard`; progression and speed unchanged.
  4. Confirm `FullFretboard` and all CAGED tests are regression-free.
  _Satisfies_: all spec requirements end-to-end.

---

## Dependency Map

```
A (types foundation)
├─ ──parallel──> B (data & layout)
├─ → C (arpeggioShape + tests)
│    └─ ──parallel with D──
└─ → D (transport + tests)
      └─ → E (PR1 gate) ──→ PR1 merge to main
                                │
                        ┌───────┴────────┐
                        │                │
                     F (SweepFretboard)  G (Bar dim btn)  H (Timeline loop)
                        └──────┬─────────┘
                               │
                        I (ProgressionBuilder wiring: T-13→T-14→T-15→T-16→T-17→T-18, T-19)
                               │
                        J (PR2 gate) ──→ PR2 merge to main
```

Tasks within Work Unit I (T-13 through T-19) are sequential modifications to
`ProgressionBuilder.svelte` and its test file; they ship as one commit.

Tasks A ∥ B can proceed simultaneously.
Tasks C ∥ D can proceed simultaneously after A completes.
Tasks F ∥ G ∥ H can proceed simultaneously after PR1 merges.

---

## Spec Coverage Matrix

| Requirement                     | Tasks                     |
|---------------------------------|---------------------------|
| Mode Toggle                     | T-01, T-02, T-13, T-16, T-17, T-19 |
| Arpeggio Note-Event Model       | T-01, T-02, T-05, T-06   |
| Note-by-Note Playback Animation | T-02, T-07, T-08, T-13, T-14, T-15 |
| Loop Toggle                     | T-07, T-08, T-12, T-13, T-15, T-18 |
| 24-Fret Sweep Fretboard         | T-04, T-10, T-17          |
| ChordQuality dim Extension      | T-01, T-03, T-05, T-06, T-11 |
| Out-of-scope (no audio v1)      | T-05 (midi precomputed, no playback call) |

---

## Risks

| ID | Risk | Tasks affected | Mitigation |
|----|------|----------------|------------|
| R-5 | PR1 approaches 400 lines if tests are verbose | T-06, T-08 | Estimate is ~310; keep tests focused on branches, not exhaustive permutations |
| R-6 | New exhaustive switch on ChordQuality introduced between design and apply | T-09 | Re-grep in PR1 gate before opening PR |
| R-3 | Dim in CAGED mode shows empty board — may surprise user | T-03 | Documented in spec; getShapes returns [] gracefully; no code risk |
| R-4 | 24-fret neck cramped on small screens | T-10 | w-full h-auto scales; v1 accepts smaller notes; future: reduced FRET_SP |
