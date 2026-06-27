# Design: Diatonic Sweep Practice (Arpeggio Sweep Mode)

Technical design for adding an arpeggio/sweep practice MODE to the existing
Progression Builder. This is the HOW at architecture level. No task breakdown,
no implementation. Strict-TDD applies to all pure modules.

## 1. Context & Constraints

- Host: `src/lib/components/ProgressionBuilder.svelte` (view `progression`). The
  configurable progression, the active-chord fretboard, and the transport
  (play/pause, speed, prev/next, select-dot) already exist and are REUSED.
- New work only: note-by-note sub-stepping, a movable 5th-string-root arpeggio
  shape, 24-fret geometry, a CAGED↔Sweep mode toggle, a loop toggle, and `dim`
  support.
- Stack: Svelte 5 runes, TypeScript, Tailwind, Vite, Vitest. Theory = pure
  functions with tests. Components stay presentational; `ProgressionBuilder` is
  the single container that owns all state.
- No audio in v1 — design the seam only.
- ~400-line PR budget; a 2-PR split is likely (see §9).

### Existing primitives reused (verbatim, no change)
- `layout.ts`: `stringY(i)`, `fretLineX(f)`, `noteX(absFret, rangeStart)`,
  `viewBoxW(span)`, `viewBoxH()`, `L.*`, `FRET_MARKERS`. These are already pure
  and span-parameterized.
- `intervals.ts`: `midiToFreq(midi)` — consumed ONLY by future audio.
- `audio/playNote.ts`: `createNotePlayer().playSequence(freqs)` — future audio.
- String convention everywhere: index 0 = low E (bottom), 5 = high E (top),
  tablature order. The 5th string (A) is **stringIndex 1**.

## 2. Architecture Overview

```
ProgressionBuilder.svelte  (CONTAINER — owns ALL state & transport)
  ├─ state: progression, activeIndex, activeNoteIndex, mode, loop,
  │         isPlaying, playbackSpeed, visibleShapes
  ├─ derived: currentChord, shapes (CAGED), currentArpeggio (sweep)
  ├─ $effect timer → calls pure advancePlayback() each tick
  │
  ├─ ProgressionBar.svelte        (presentational) + dim quality button
  ├─ ProgressionTimeline.svelte   (presentational) + loop toggle
  ├─ [mode toggle]                 (inline segmented control in container)
  └─ board swap by mode:
       ├─ mode==='caged'  → FullFretboard.svelte   (UNCHANGED)
       └─ mode==='sweep'  → SweepFretboard.svelte  (NEW, presentational)

theory/arpeggioShape.ts  (NEW, pure)  → buildArpeggio(root, quality): ArpeggioNote[]
theory/transport.ts      (NEW, pure)  → advancePlayback(state, ...): next state
types/progression.ts     (MOD)        → ArpeggioNote type, PlaybackMode, advance input/output
types/chord.ts           (MOD)        → ChordQuality += 'dim', STRING_OPEN_MIDI
data/chords.ts           (MOD)        → getShapes tolerant of 'dim'
layout.ts                (MOD)        → FRET_MARKERS extended for 24-fret neck
```

Data flow per tick (sweep mode): `$effect` interval fires → `advancePlayback()`
(pure) computes the next `{activeIndex, activeNoteIndex, isPlaying}` → assigns to
state → `currentArpeggio` + `activeNoteIndex` re-derive → `SweepFretboard`
re-highlights. The highlighted note is `currentArpeggio[activeNoteIndex]`, which
already carries `midi` — the exact value future audio will play.

## 3. Decision 1 — Arpeggio Shape Model (`theory/arpeggioShape.ts`)

A pure, Vitest-tested module producing an ordered, ascending (low→high string)
sweep across strings A→high E (stringIndex 1..5; low E unused). Five notes.

### Note-event type (in `types/progression.ts`)
```ts
export interface ArpeggioNote {
  string: number;     // stringIndex 0..5 (1..5 used); A string = 1
  fret: number;       // absolute fret on the 24-fret neck
  midi: number;       // precomputed: STRING_OPEN_MIDI[string] + fret
  stepIndex: number;  // 0..4 — sweep order, ascending
}
```

### Open-string MIDI table (in `types/chord.ts`, companion to STANDARD_TUNING)
```ts
// Absolute MIDI of each open string, tablature order (low E..high E).
export const STRING_OPEN_MIDI: number[] = [40, 45, 50, 55, 59, 64];
//                                     E2  A2  D3  G3  B3  E4
```
Consistency check: `STRING_OPEN_MIDI[i] % 12 === STANDARD_TUNING[i]` for all i.

### Root fret on the 5th string
```ts
function rootFretOnAString(root: NoteName): number {
  // CHROMATIC is C-indexed, so indexOf gives the pitch class. A string pc = 9.
  return ((CHROMATIC.indexOf(root) - 9) % 12 + 12) % 12; // 0..11
}
```

### Movable fret-offset templates (the voicing; relative to the A-string root fret)
One entry per `ChordQuality`, each a `{ string, fretOffset }[]` of length 5,
strings 1..5 in ascending sweep order:

| Quality | A(1) | D(2) | G(3) | B(4) | hiE(5) | Tones (ascending) |
|---------|------|------|------|------|--------|-------------------|
| major   | +0   | +2   | +2   | +2   | +5     | R · 5 · R · 3 · R |
| minor   | +0   | +2   | +2   | +1   | +5     | R · 5 · R · b3 · R |
| dim     | +0   | +1   | +2   | +1   | +5     | R · b5 · R · b3 · R |

Worked example — C (rootFret = 3):
- major → A3 D5 G5 B5 e8 = C3,G3,C4,E4,C5 (48,55,60,64,72), strictly ascending.
- minor → A3 D5 G5 B4 e8 = C3,G3,C4,Eb4,C5 (48,55,60,63,72).
- dim   → A3 D4 G5 B4 e8 = C3,Gb3,C4,Eb4,C5 (48,54,60,63,72).

All three are strictly ascending in MIDI for every root → a clean low-to-high
sweep. Max absolute fret = rootFret(≤11) + 5 = 16, comfortably inside 24 frets.

### Builder
```ts
export function buildArpeggio(root: NoteName, quality: ChordQuality): ArpeggioNote[] {
  const rootFret = rootFretOnAString(root);
  return ARPEGGIO_TEMPLATES[quality].map((t, i) => {
    const fret = rootFret + t.fretOffset;
    return { string: t.string, fret, midi: STRING_OPEN_MIDI[t.string] + fret, stepIndex: i };
  });
}
```
Pure, deterministic, no DOM/audio. Tests assert: 5 notes; ascending midi; correct
interval set per quality {R,3,5} / {R,b3,5} / {R,b3,b5}; precomputed midi equals
`STRING_OPEN_MIDI[string]+fret`; stepIndex 0..4 in order.

**Rationale**: fret offsets encode the actual sweep FINGERING, which no existing
table provides. Pitch-class offsets alone (`TRIAD_OFFSETS`) cannot place notes on
specific strings/frets. Keeping the template self-contained is the smallest
honest model. See ADR-2 for why we do not reuse `TriadQuality`/`TRIAD_OFFSETS`.

## 4. Decision 2 — `dim` Propagation (minimal blast radius)

Change `ChordQuality = 'major' | 'minor'` → `'major' | 'minor' | 'dim'` in
`types/chord.ts`. A full audit of consumers (grep on `ChordQuality`/`.quality`)
shows **no exhaustive `switch`/`never` checks** on `ChordQuality` anywhere — the
union widening will not break compilation. Touch points that must explicitly
handle the new case:

1. **`types/chord.ts`** — the type itself (+ `STRING_OPEN_MIDI`).
2. **`data/chords.ts` `getShapes`** — `caged-shapes.json` has NO dim CAGED data.
   Today `getShapes` THROWS on a missing entry; `ProgressionBuilder.shapes` calls
   it eagerly. Make it tolerant: return `[]` when the (root,quality) entry is
   absent (covers `dim`) instead of throwing. `FullFretboard` already renders an
   empty board gracefully, and `ProgressionBuilder` guards `progression.length`.
   `getAllQualities()` stays `['major','minor']` (data availability, not type).
3. **`ProgressionBar.svelte`** — add a third quality button `°` (dim) to the
   inline radiogroup, mirroring the existing M/m buttons (aria-checked,
   `onQualityChange(index,'dim')`).
4. **`theory/arpeggioShape.ts`** — `ARPEGGIO_TEMPLATES.dim` (the only place dim
   actually has full shape data).

Non-breaking consumers (use `.quality` only for string interpolation / aria, no
branching): `FullFretboard.svelte` (aria/title), `ProgressionBuilder` default
`'major'`. Other tools (`CagedTool`, `DualFretboard`, `ChordBuilder`, the
harmonizer) drive quality from their own UI and never receive `dim` from this
change.

**CAGED view + dim**: a dim chord shows an empty CAGED board (no data). This is
acceptable for v1 and documented in the spec; the real practice surface for dim
is sweep mode, which has full data.

## 5. Decision 3 — 24-Fret Geometry (dedicated SweepFretboard)

Two options considered:

- **(A) Thread a `fretSpan` prop + a single-note render path into
  `FullFretboard.svelte`.** Rejected. `FullFretboard` is ~627 lines of CAGED
  overlap/diff/indicator logic that is irrelevant to sweep. Injecting a second
  view mode entangles two unrelated concerns in one giant component and risks
  regressing the working 14-fret CAGED view.
- **(B) Dedicated `SweepFretboard.svelte` reusing `layout.ts` primitives.**
  **CHOSEN.** Sweep rendering is fundamentally different: one neck of up to 24
  frets, the 5 arpeggio notes drawn dimmed, exactly one highlighted by
  `activeNoteIndex`. It reuses the pure geometry (`stringY`, `fretLineX`,
  `noteX`, `viewBoxW(24)`, `viewBoxH`, `FRET_MARKERS`, `L.*`) so there is no
  geometry duplication — only ~30 lines of SVG scaffolding (fret lines, strings,
  markers) are restated. `FullFretboard` is left untouched → zero CAGED
  regression risk (Screaming Architecture: each board screams its own concern).

`layout.ts` change (additive, safe): extend
`FRET_MARKERS = [3,5,7,9,12,15] → [3,5,7,9,12,15,17,19,21,24]`. `FullFretboard`
guards markers by `mf < minFret + displaySpan` (14), so the new high markers are
filtered out there and the 14-fret view is byte-identical.

`SweepFretboard.svelte` props (presentational, read-only):
```ts
interface Props {
  notes: ArpeggioNote[];     // currentArpeggio
  activeNoteIndex: number;   // which note is lit
  fretSpan?: number;         // default 24
}
```
Renders neck via `viewBox` from `viewBoxW(fretSpan)`/`viewBoxH()`; draws each
note at `noteX(note.fret, 0)`,`stringY(note.string)`; active note gets the accent
fill/diamond, the rest are dimmed. No business logic.

**Tradeoff**: at 24 frets the viewBox is ~1200px wide scaled to container width
(`w-full h-auto`), so notes read smaller than the 14-fret CAGED board. Acceptable
for v1; horizontal-scroll or a reduced `FRET_SP` is a future refinement (risk
R-4).

## 6. Decision 4 — Animation Timeline (note sub-stepping)

Today: one `$effect` runs `setInterval(PLAYBACK_MS[speed])`; each tick advances
`activeIndex`, stopping at the last chord. Sweep adds an inner note index.

### State shape (added to the container)
```ts
let mode = $state<PlaybackMode>('caged');     // 'caged' | 'sweep'
let activeNoteIndex = $state(0);              // 0..4 within current arpeggio
let loop = $state(false);
```
`activeNoteIndex` is meaningful only in sweep mode; it is reset to 0 whenever
`activeIndex`, `mode`, or `currentChord` changes.

### Speed mapping
The existing per-chord `PLAYBACK_MS[speed]` becomes the **per-note** step in
sweep mode (finer granularity, confirmed in proposal Q4). The interval duration
is `PLAYBACK_MS[speed]` in BOTH modes; only the tick body differs.

### Pure stepping function (`theory/transport.ts`, Vitest-tested)
Keep the `$effect` thin; extract the advance rule as a pure function:
```ts
export interface PlaybackState { activeIndex: number; activeNoteIndex: number; isPlaying: boolean; }
export function advancePlayback(
  s: PlaybackState,
  opts: { mode: PlaybackMode; progressionLength: number; arpeggioLength: number; loop: boolean },
): PlaybackState;
```
Rules:
- **caged**: `activeIndex++`; at end → loop ? wrap to 0 : `isPlaying=false`.
  `activeNoteIndex` stays 0.
- **sweep**: `activeNoteIndex++`; when it passes `arpeggioLength-1` → reset to 0
  and `activeIndex++`; at progression end → loop ? wrap to (0,0) : stop.

The `$effect` becomes:
```ts
$effect(() => {
  if (!isPlaying || progression.length === 0) return;
  const id = setInterval(() => {
    const next = advancePlayback(
      { activeIndex, activeNoteIndex, isPlaying },
      { mode, progressionLength: progression.length,
        arpeggioLength: currentArpeggio.length, loop },
    );
    activeIndex = next.activeIndex;
    activeNoteIndex = next.activeNoteIndex;
    isPlaying = next.isPlaying;
  }, PLAYBACK_MS[playbackSpeed]);
  return () => clearInterval(id);
});
```
Tests cover: caged advance + stop + loop-wrap; sweep inner advance, carry to next
chord, progression-end stop, and loop-wrap to (0,0); single-chord/single-note
edge cases.

### Audio seam (NOT implemented in v1)
The highlight reads `currentArpeggio[activeNoteIndex]`; that same `ArpeggioNote`
carries `midi`. Future audio adds one effect/callback keyed on `activeNoteIndex`:
`notePlayer.playSequence([midiToFreq(note.midi)])`. Zero theory rework — the
event list is already audio-shaped and midi is precomputed.

## 7. Decision 5 — Mode Toggle & Component Boundaries

- `ProgressionBuilder` remains the SOLE container: it owns `progression`,
  `activeIndex`, `activeNoteIndex`, `mode`, `loop`, `isPlaying`, `playbackSpeed`,
  `visibleShapes`, the timer, and all transport callbacks. Children are
  presentational and receive props + callbacks (callback-prop idiom, no
  `createEventDispatcher`, Svelte 5 runes).
- **Mode toggle (CAGED ↔ Sweep)**: a small 2-button segmented control rendered
  inline in the container, in the fretboard card header — it decides which board
  component MOUNTS, which is a container/layout responsibility. Keeping it inline
  (vs. a new `ViewModeToggle.svelte`) saves a file against the 400-line budget;
  extracting it later is trivial if it grows. (Tradeoff noted; either is fine.)
- **Loop toggle**: belongs to playback behavior → add `loop` + `onToggleLoop`
  props to `ProgressionTimeline.svelte` (the Playback card), styled like the
  existing speed buttons.
- **Board swap**:
```svelte
{#if mode === 'caged'}
  <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
{:else}
  <SweepFretboard notes={currentArpeggio} {activeNoteIndex} fretSpan={24} />
{/if}
```
- **Derived**: `currentArpeggio = $derived(buildArpeggio(currentChord.root, currentChord.quality))`.

## 8. Decision 6 — Loop (minimal)

`loop = $state(false)` (default OFF). The wrap-around lives ENTIRELY inside the
pure `advancePlayback` (§6): at progression end, `loop` wraps to the start and
keeps `isPlaying` true; otherwise it sets `isPlaying=false` (current behavior).
No new timer, no separate code path — one branch in the pure function, fully
unit-tested. UI: one toggle button in `ProgressionTimeline`.

## 9. PR Budget / Split (flag for tasks phase)

Estimated additions (incl. tests) exceed ~400 lines. Recommended 2-PR split
(final call belongs to the tasks phase):

- **PR1 — theory/data/types (no visible behavior change)**: `arpeggioShape.ts` +
  tests, `transport.ts` + tests, `ArpeggioNote`/`PlaybackMode` in
  `progression.ts`, `ChordQuality += 'dim'` + `STRING_OPEN_MIDI` in `chord.ts`,
  `getShapes` tolerance in `chords.ts`, `FRET_MARKERS` extension in `layout.ts`.
  Pure + data, fully TDD-tested, ships green with no UI wiring.
- **PR2 — UI wiring**: `SweepFretboard.svelte`, `ProgressionBuilder` (mode/loop
  state, note sub-stepping, board swap, mode toggle), `ProgressionBar` dim
  button, `ProgressionTimeline` loop toggle.

## 10. ADRs

### ADR-1 — Extend the existing transport instead of a new engine
**Decision**: reuse ProgressionBuilder's `$effect`+`setInterval` and branch the
tick by mode; do not build a separate sweep player. **Why**: the transport
(play/pause/speed/prev/next/select/loop semantics) is already correct;
duplicating it would double the surface and risk drift. **Rejected**: a separate
`SweepPlayer` component with its own timer (more code, two transports to keep in
sync).

### ADR-2 — Keep `ChordQuality` separate from `TriadQuality`; extend it with `dim`
**Decision**: add `'dim'` to `ChordQuality` ('major'|'minor'|'dim') and keep the
arpeggio templates self-contained. Do NOT unify with `theory/chords.ts`
`TriadQuality` ('maj'|'min'|'dim') / `TRIAD_OFFSETS` / `chordMidi`. **Why**: two
quality vocabularies already coexist intentionally (Progression Builder/CAGED use
`ChordQuality`; Chord Builder/Harmonizer use `TriadQuality`). Unifying them
('major'↔'maj') would touch `diatonics.ts`, `openVoicings.ts`, `ChordBuilder`,
`HarmonyMatrix`, the harmonizer, and more — far outside this change's scope and
budget, with real regression risk. The sweep voicing (string+fret offsets) is
fingering data that no table provides, so reuse would not even shrink the module.
**Rejected**: (a) reuse `TriadQuality` everywhere (massive blast radius); (b)
derive arpeggio notes from `TRIAD_OFFSETS` (gives pitch classes, not a sweep
fingering).

### ADR-3 — Dedicated `SweepFretboard` over extending `FullFretboard`
**Decision**: new presentational board reusing `layout.ts` primitives. **Why**:
isolation = zero regression on the 14-fret CAGED view; the two render models
share nothing but geometry, which is already pure and reusable. **Rejected**:
threading mode + single-note path into the 627-line `FullFretboard` (entangles
concerns, regression risk).

### ADR-4 — Pure `advancePlayback` over inline timer logic
**Decision**: extract the chord/note stepping (incl. loop wrap) into a pure,
tested function; the `$effect` only wires it to `setInterval` and state.
**Why**: stepping is the trickiest logic (carry note→chord, loop, edge cases) and
must be deterministic and unit-tested; `$effect`/timers are hard to test.
**Rejected**: inline branching in the tick (untestable, error-prone).

### ADR-5 — Precompute `midi` in `ArpeggioNote` now
**Decision**: store `midi` on every event even though v1 has no audio. **Why**:
makes the event list a drop-in for `midiToFreq → playSequence`, keeps the audio
seam free, and costs nothing (one addition per note). **Rejected**: compute midi
later in an audio layer (would re-derive tuning math and reintroduce theory in
the audio path).

## 11. Risks

| ID | Risk | Likelihood | Mitigation |
|----|------|-----------|------------|
| R-1 | Open-string root (e.g. A → rootFret 0) yields a low/open-string sweep shape | Med | Acceptable for v1 (highlight only); offsets keep it valid. Future: octave-up anchor. Documented. |
| R-2 | Per-note `PLAYBACK_MS` feels too fast in sweep mode | Med | Confirmed in proposal Q4; speed control still applies. Revisit granularity later. |
| R-3 | dim selected in CAGED view shows an empty board (no CAGED data) | Low | Intended; getShapes returns `[]`, board renders empty gracefully. Documented in spec. |
| R-4 | 24-fret neck cramped on small screens | Med | `w-full h-auto` scales; v1 accepts smaller notes. Future: horizontal scroll / reduced FRET_SP. |
| R-5 | Single PR exceeds 400-line budget | Med | 2-PR split proposed (§9); final call in tasks. |
| R-6 | Future hidden exhaustive switch on `ChordQuality` | Low | Audit found none; tasks/apply re-grep `ChordQuality` before merge. |

## 12. Out of Scope (unchanged from proposal)
Audio playback (seam only), descending sweeps, other root-string shapes,
metronome/tempo rework, unifying the two quality vocabularies.
</content>
</invoke>
