# Design: Interval Explorer (Visual Explore mode in Interval Trainer)

## Status
Proposed — design phase. No tasks, no implementation yet.

## Context
The shipped `IntervalTrainer.svelte` is a quiz-only tool: it plays two notes and the
user names the interval. The Explore mode adds a visual-first experience: pick a root
(chromatic) and an interval (12 options), SEE every place that root and its target
note fall across a 6-string, 14-fret neck, and HEAR the interval played from a fixed
reference octave. No score, no failure state.

This design grounds itself in the existing primitives so the change stays additive and
within budget:
- Geometry: `layout.ts` (`stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`, `FRET_MARKERS`, `L`).
- Tuning / pitch classes: `STANDARD_TUNING`, `CHROMATIC` (`types/chord.ts`), `semitoneToNoteName` (`notes.ts`).
- Interval table: `INTERVALS`, `intervalBySemitones` (`intervals.ts`).
- Audio: `createNotePlayer`, `midiToFreq` (`playNote.ts` / `intervals.ts`) — already owned by `IntervalTrainer`.

The rendering reference is `FullFretboard.svelte`: same SVG conventions (nut line,
fret lines, string lines, fret-marker dots, fret numbers, light/dark Tailwind classes,
`role="img"` + `<title>`/`<desc>`).

## Goals
- Pure, independently testable position math (no SVG, no DOM).
- A presentational `IntervalFretboard.svelte` with NO audio and NO internal app state.
- `IntervalTrainer` gains a Practice <-> Explore toggle; Practice behavior is byte-for-byte unchanged.
- Stay within ~400 changed lines; no chained PRs.

## Non-Goals (v1)
- Per-dot click-to-play, connector lines between root/target pairs, alternate tunings,
  capo, left-handed, 7+ strings, persisted prefs, a separate top-level tool or HomePage card.

---

## Architecture Overview

```
IntervalTrainer.svelte  (stateful container — owns mode toggle, selections, player)
├── mode: 'practice' | 'explore'   ($state)
├── Practice branch  → existing quiz (UNCHANGED)
└── Explore branch
     ├── root selector   (CHROMATIC, 12 buttons/select)
     ├── interval selector (INTERVALS, 12 buttons/select)
     ├── Play button     → player.playSequence([midiToFreq(rootMidi), midiToFreq(rootMidi+semitones)])
     ├── caption         (interval name + shape reinforcement)
     └── <IntervalFretboard rootPc targetPc rootName targetName /> (presentational, pure)

intervals.ts  (pure theory — extended)
└── intervalPositions(rootPc, intervalSemitones): IntervalPosition[]   ← NEW pure fn
       reuses STANDARD_TUNING; iterates 6 strings × frets 0..14

layout.ts  (geometry — REUSED unchanged)
```

Data flows ONE WAY: `IntervalTrainer` computes `rootPc` / `targetPc` (and display names)
and passes them down. `IntervalFretboard` computes its marks via the pure
`intervalPositions` function and renders SVG. It raises no events and holds no state.

---

## Decision 1 — Pure position math lives in `intervals.ts`

### Decision
Add a pure function to `src/lib/theory/intervals.ts`:

```ts
export interface IntervalPosition {
  stringIndex: number; // 0..5, tablature order (low E .. high E) — matches STANDARD_TUNING/layout
  fret: number;        // 0..14 absolute fret
  pitchClass: number;  // 0..11
  role: 'root' | 'target';
}

/**
 * Returns every fret position on a 6-string standard-tuned neck (frets 0..MAX_FRET)
 * whose pitch class equals the root or the target (root + intervalSemitones).
 * Pure: no DOM, no audio. Bounded double loop — no while-loops.
 */
export function intervalPositions(
  rootPc: number,
  intervalSemitones: number,
): IntervalPosition[];
```

Algorithm (bounded, deterministic):
```
rootPc   = ((rootPc % 12) + 12) % 12
targetPc = (rootPc + intervalSemitones) % 12
for stringIndex in 0..5:
  open = STANDARD_TUNING[stringIndex]
  for fret in 0..MAX_FRET (14 inclusive):
    pc = (open + fret) % 12
    if pc === rootPc   → push { ..., role: 'root' }
    else if pc === targetPc → push { ..., role: 'target' }
```

Add `export const MAX_FRET = 14;` (or reuse `FL.MAX_FRET_SPAN` from layout — see Decision 3 note).

### Rationale
- Position math is the only logic worth unit-testing; isolating it from SVG keeps tests
  fast and meaningful (count + role + coordinates derivable independently of rendering).
- `intervals.ts` already owns the interval domain (table, `intervalBySemitones`, `midiToFreq`)
  and `notes.ts`/`types/chord.ts` already export the tuning/chromatic primitives it needs —
  this is the natural home, no new module needed.
- **Edge case — unison/octave collision:** if `intervalSemitones % 12 === 0` (Perfect Octave),
  `targetPc === rootPc`. The `else if` ordering means such a position is marked `root`, never
  duplicated. This is correct: octave shares the pitch class with the root on the neck, and
  the *sounded* interval (Decision 4) still ascends a real octave. Caption clarifies.

### Rejected alternatives
- **New `intervalShapes.ts` module** — extra file for one small function; more import churn
  and budget. Rejected.
- **Compute positions inside the Svelte component** — couples the only testable logic to the
  DOM, forces component tests to assert math. Rejected (violates presentational purity).
- **Return a `Map`/grid keyed by `${string},${fret}`** — `FullFretboard` uses position maps
  for *overlap* detection across shapes; here each (string,fret) has at most one role, so a
  flat array is simpler to render and assert. Rejected.

---

## Decision 2 — `IntervalFretboard.svelte` is purely presentational

### Decision
New file `src/lib/components/IntervalFretboard.svelte`.

Prop contract:
```ts
interface Props {
  rootPc: number;          // 0..11
  targetPc: number;        // 0..11  (caller passes (rootPc + semitones) % 12)
  rootName?: string;       // display label for the caption / aria; e.g. 'C'
  targetName?: string;     // e.g. 'G'
  width?: number;          // optional override, mirrors FullFretboard
}
```

Rationale for `rootPc` + `targetPc` (NOT `root` + `intervalSemitones`):
- Keeps the component dumb. The container already knows the names and semitones; it does
  the one trivial mod to derive `targetPc`. The component never imports the interval table.
- Tests can drive it with raw numbers and assert mark counts/colors without theory lookups.

Internals:
- `let marks = $derived(intervalPositions(rootPc, targetPc - rootPc cannot be reconstructed))`
  — IMPORTANT: since the component receives `targetPc` not `semitones`, it cannot call
  `intervalPositions(rootPc, semitones)` directly. **Resolution:** the component computes its
  own marks with an inline bounded double-loop over `STANDARD_TUNING` (frets 0..MAX_FRET),
  marking `pc === rootPc` (root color) or `pc === targetPc` (target color). The SHARED pure
  function `intervalPositions` is what the container/tests use; the component duplicates the
  trivial pitch-class match (a 2-line `$derived`) to stay decoupled from the interval table.
  - Alternative kept open: pass `intervalSemitones` as a prop too and call `intervalPositions`
    directly in the component. See "Open decision for tasks" below. Either is within budget;
    prefer passing `rootPc` + `intervalSemitones` so the component reuses the SAME tested fn
    and there is ONE position algorithm. **Recommended final contract:**
    `{ rootPc, intervalSemitones, rootName?, targetName?, width? }` and
    `let marks = $derived(intervalPositions(rootPc, intervalSemitones));`
    `targetPc` derived internally for coloring. This removes the duplication.
- Geometry: reuse `noteX(fret, 0)`, `stringY(stringIndex)`, `viewBoxW(14)`, `viewBoxH()`,
  `fretLineX`, `FRET_MARKERS`, `L` exactly as `FullFretboard` does (rangeStart = 0, always
  from the nut, span 14).
- Render order (match `FullFretboard`): bg rect → fret lines → marker backgrounds → string
  lines → marker dots → nut (thick line) → marks → fret numbers.
- Each mark: a circle (`r = L.TONE_R`) filled with the role color, plus a small white note-name
  label (`semitoneToNoteName(open+fret)`), mirroring `renderSingle`. Root marks slightly larger
  (`r = L.ROOT_R`) so root reads as the anchor.
- Accessibility: `role="img"`, `aria-label` like
  `"{rootName} {intervalName} interval — root and target positions across the neck"`
  (intervalName resolvable only if the container passes it; otherwise generic). Provide
  `<title>`/`<desc>` like `FullFretboard`.

### Color scheme (light + dark)
Reuse the existing palette vocabulary (do NOT invent a new system):
- **Root**: `ROOT_COLOR` (`#FACC15`, yellow-400) — already the established "root anchor" color
  in `layout.ts` (used across the pentatonic/CAGED neck). Reusing it gives users a consistent
  "yellow = root" mental model across tools.
- **Target**: `#2563EB` (blue-600, i.e. `SHAPE_COLORS.C`) — high contrast against yellow,
  already in the palette.
- Note-name labels: white fill (`fill="white"`), matching `FullFretboard` dots.
- Light/dark: the neck chrome (bg, lines, markers, fret numbers) uses the SAME Tailwind
  `class:`-based light/dark classes as `FullFretboard` (`fill-white dark:fill-gray-900`,
  `stroke-gray-400 dark:stroke-gray-600`, etc.). Mark fills are fixed hex (palette colors read
  well on both backgrounds, as they already do in the CAGED/pentatonic necks).

### Rejected alternatives
- **New green/orange ad-hoc colors** — fragments the visual language; `ROOT_COLOR` + a palette
  blue are already battle-tested on the neck. Rejected.
- **Reusing `FullFretboard.svelte` directly** — it is shaped around `ChordShape[]`, CAGED
  overlap/gradient logic, barres, and O/× indicators; bending it to a root/target pitch-class
  view would add conditional complexity to a 630-line component. A focused new component is
  smaller and clearer. Rejected.
- **Connector lines between root and target** — proposal Open Question 3; deferred to keep v1
  unambiguous and within budget. Color-only distinction in v1.

---

## Decision 3 — `IntervalTrainer` integration via a `mode` rune

### Decision
Add minimal state and a toggle; keep the entire existing quiz untouched.

New state:
```ts
let mode = $state<'practice' | 'explore'>('practice');
// Explore selections (independent of quiz state):
let exploreRootPc = $state(0);                 // default C
let exploreSemitones = $state(7);              // default Perfect 5th (the canonical "shape" interval)
```

Derived:
```ts
let exploreInterval = $derived(intervalBySemitones(exploreSemitones)); // for caption/name
let exploreRootName = $derived(semitoneToNoteName(exploreRootPc));
let exploreTargetName = $derived(semitoneToNoteName(exploreRootPc + exploreSemitones));
```

Playback (reuses the EXISTING `player`):
```ts
const EXPLORE_ROOT_MIDI = 60; // C4 reference octave (proposal Open Q5: fixed reference)
function playExplore() {
  const low = EXPLORE_ROOT_MIDI + exploreRootPc;          // root at/near C4
  player.playSequence([midiToFreq(low), midiToFreq(low + exploreSemitones)]);
}
```

Toggle UI: a 2-button segmented control near the top ("Practice" / "Explore"), `aria-pressed`
to reflect `mode`. Switching mode swaps the rendered branch (NOT stacked) per proposal risk
mitigation.

Template structure:
```svelte
{#if mode === 'practice'}
  <!-- existing quiz block, verbatim -->
{:else}
  <!-- root selector (CHROMATIC) -->
  <!-- interval selector (INTERVALS) -->
  <button aria-label="Play interval" onclick={playExplore}>▶ Play</button>
  <p>caption: "{exploreRootName} → {exploreTargetName}: {exploreInterval.name} ({exploreInterval.short}). Same shape everywhere it repeats."</p>
  <IntervalFretboard
    rootPc={exploreRootPc}
    intervalSemitones={exploreSemitones}
    rootName={exploreRootName}
    targetName={exploreTargetName}
  />
{/if}
```

### Practice-mode preservation (critical)
- The existing `$effect` calls `next()` on mount and plays audio. In Explore mode we must NOT
  auto-advance the quiz, but the quiz state can keep existing as-is; the `$effect` mount logic
  stays. **Decision:** keep the mount `next()` (quiz pre-loads a question once, harmless when
  hidden). Do NOT play on mode switch — Explore audio only fires on the Play button. This keeps
  the existing Practice tests (e.g. "plays the two notes exactly once on mount") GREEN.
- `cancelPending`/`pendingNext` and `dispose` cleanup remain unchanged.
- No change to `generateQuestion`, `answer`, `replay`, `next` signatures or behavior.

### Reference octave
`EXPLORE_ROOT_MIDI = 60` (C4). The sounded interval is always root→(root+semitones) from this
fixed octave so playback is consistent regardless of where the user is looking on the neck
(proposal Open Q5). Caption notes the neck positions are illustrative; the sounded pitch is
canonical from the reference octave.

### Rejected alternatives
- **Separate top-level tool / new `ViewName`** — proposal explicitly scopes Explore as a MODE,
  not a new tool; sharing selection + player is the whole point. Rejected.
- **Sharing one root/interval state between Practice and Explore** — Practice picks its root via
  RNG per question; coupling them would corrupt the quiz. Keep Explore selections independent.
  Rejected.
- **Playing from the displayed neck position** — ambiguous (which of many?), and octave varies.
  Fixed reference octave chosen. Rejected.

---

## Decision 4 — Test strategy

### Pure function (Vitest, `tests/unit/theory/intervals.test.ts` — extend existing)
- `intervalPositions(0, 7)` (C root, P5): assert it returns marks for all 6 strings, every
  root (pc 0) and target (pc 7 = G) within frets 0..14; spot-check known coordinates:
  - low E (open pc 4): root C at fret 8, target G at fret 3 and 15→ but 15 > 14 so excluded.
  - assert NO fret > 14 and NO fret < 0 (bound check — the loop is the safety net).
- `intervalPositions(0, 12)` (octave): assert `targetPc === rootPc` collision → every match is
  role `'root'`, zero `'target'` (the unison/octave edge case).
- Determinism: same inputs → identical array (no RNG, no Date).
- Negative/over-range root: `intervalPositions(-1, 7)` normalizes to pc 11; assert via spot-check.

### Component — `IntervalFretboard` (`tests/components/IntervalFretboard.test.ts`)
- Render with `rootPc=0, intervalSemitones=7`. Assert the SVG renders the expected NUMBER of
  root marks vs target marks (counts equal `intervalPositions` output filtered by role).
- Assert root marks use `ROOT_COLOR` fill and target marks use the target blue (query by
  `fill` attribute or a stable class/data attr — add `data-role` to each mark for testability).
- Assert `role="img"` and a meaningful `aria-label`.
- NO audio assertions (component has no audio). NO timers.

### Component — `IntervalTrainer` additions (extend `tests/components/IntervalTrainer.test.ts`)
- New `describe('mode toggle')`:
  - Practice is the default (existing quiz controls present on mount; existing tests stay green).
  - Clicking "Explore" shows the root selector, interval selector, Play button, and the
    `IntervalFretboard` (query for `role="img"` or a stable test id).
  - Clicking "Explore" then "Play" calls `mockPlaySequence` (reuse the existing
    `vi.mock('$lib/audio/playNote')` harness) — assert it is called with two frequencies.
  - Switching back to "Practice" still shows the 4 answer buttons (Practice untouched).
- **Mock `IntervalFretboard`** in the `IntervalTrainer` test if its SVG is heavy, OR render it
  for real (it is pure + cheap; real render is fine and gives integration coverage). Recommended:
  render real — no audio, no timers, deterministic.

### Hang-prevention rule (explicit)
- The prior apply hung on an unbounded loop. **All loops in this change are bounded `for` loops
  over fixed ranges** (`0..5` strings, `0..14` frets). NO `while` loops anywhere. The pure
  function's bound check test (`no fret > 14`) is the regression guard.
- AudioContext is stubbed in component tests (existing harness). Explore Play uses the mocked
  `playSequence`; no real audio, no real timers. Fake timers only if a test needs them (none do
  for Explore).

---

## Decision 5 — Line budget & PR strategy

Estimated changed lines:

| File | Type | Est. lines |
|------|------|-----------:|
| `intervals.ts` (`IntervalPosition`, `MAX_FRET`, `intervalPositions`) | new code | ~35 |
| `IntervalFretboard.svelte` (script + SVG, modeled on FullFretboard's single-note path) | new file | ~120 |
| `IntervalTrainer.svelte` (mode state, derived, playExplore, toggle UI, explore branch) | modified | ~85 |
| `tests/unit/theory/intervals.test.ts` (position fn cases) | new tests | ~55 |
| `tests/components/IntervalFretboard.test.ts` | new tests | ~70 |
| `tests/components/IntervalTrainer.test.ts` (mode toggle suite) | new tests | ~45 |
| **Total** | | **~410** |

This is right at the ~400 line budget (slightly over on a conservative estimate).

**Recommendation: single PR, no chaining.** The estimate is dominated by tests (~170 lines)
which are low-risk and reviewable in bulk; production code is ~240 lines. The change is cohesive
(one feature, one toggle, one component) and the rollback plan is trivial (remove import + branch +
file). Splitting would fragment a single mental model.

**If a hard 400 cap must hold**, the cut line is:
- Slice 1 (PR): pure `intervalPositions` + `IntervalFretboard.svelte` + their unit/component
  tests (~280 lines) — fully testable, no UI wiring.
- Slice 2 (PR): `IntervalTrainer` toggle + explore branch + integration tests (~130 lines),
  depends on Slice 1.

Default to single PR unless the delivery strategy forbids the slight overage.

---

## Risks & mitigations
- **Component test color assertions brittle** if querying raw `fill` hex. Mitigation: add a
  stable `data-role="root|target"` attribute to each mark and assert on that, not on color.
- **Budget slightly over 400.** Mitigation: cut line above; tests can be trimmed first since
  the pure-fn tests carry most of the correctness guarantee.
- **Octave (P8) visual ambiguity** (root == target pitch class). Mitigation: documented edge
  case; marks render as root; caption clarifies the sounded interval still ascends an octave.
- **Explore audio octave vs neck positions** confuses users. Mitigation: fixed reference octave
  + caption (proposal Open Q5).

## Open decision deferred to tasks
- Final `IntervalFretboard` prop shape: **recommended** `{ rootPc, intervalSemitones, rootName?,
  targetName?, width? }` so the component calls the SHARED `intervalPositions` (one algorithm,
  one test surface). Tasks should adopt this and drop the `targetPc`-only variant.
- Root/interval selector UI form (button grid vs `<select>`): button grid matches the quiz's
  existing button vocabulary; `<select>` is more compact for 12 items. Tasks decide; either fits
  budget. Lean button grid for roots (12 chromatic) is large — consider `<select>` for intervals.
```
