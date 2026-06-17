# Design: Chord Fretboard Mirror — full-neck triad mirror under the Chord Builder ruler — v1

## Context

This is a non-SvelteKit Svelte 5 + Vite SPA mounted manually in `src/main.ts`. Tools
are stateful components rendered by a single chokepoint router (`App.svelte` +
`navigate(view)`); each tool already exists. This change is **Phase 2 of Chord
Builder** and is **purely additive**: it does not touch routing, the tool registry,
audio, or any existing state owner. It adds one pure theory helper, one
presentational component, and one render line inside the already-shipped
`ChordBuilder.svelte`.

The proposal already decided WHAT and WHETHER (a full-neck mirror that lights every
chord-tone position, degree-labeled, role-colored to MATCH THE RULER, reacting live
to the existing root + quality selection). This document designs HOW, against the
real code, by **mirroring the existing Interval Trainer Explore-mode fretboard**:

- `src/lib/theory/intervals.ts` — `intervalPositions(rootPc, intervalSemitones)` is
  the EXACT model for the new `chordPositions`: a bounded double `for` loop over
  `STANDARD_TUNING` × frets `0..MAX_FRET`, normalizing root mod-12, pushing one
  position per matching cell with a `role`. `MAX_FRET = 14` and `STANDARD_TUNING`
  are reused from here (`STANDARD_TUNING` is re-exported from `$lib/types/chord`).
- `src/lib/components/IntervalFretboard.svelte` — the EXACT scaffold to mirror:
  props (`rootPc`, …, optional `rootName`, `width`), `let marks = $derived(...)`,
  full-neck SVG (`viewBox="-24 0 {vbW + 24} {vbH + 18}"`, `role="img"`, `aria-label`,
  `<title>`/`<desc>`), fret lines, marker backgrounds, string lines, `FRET_MARKERS`
  dots, nut line, the `{#each marks as mark (...)}` marker loop with `data-role`
  circles + centered `<text>`, and fret numbers below the bottom string.
- `src/lib/theory/layout.ts` — `L` (radii `ROOT_R`/`TONE_R`, `LABEL_FS`, `MARKER_R`,
  `FRET_SP`), `FL.MAX_FRET_SPAN` (14), `FL.FRET_NUM_*`, `stringY`, `fretLineX`,
  `noteX`, `viewBoxW`/`viewBoxH`, `FRET_MARKERS`. All reused verbatim.
- `src/lib/theory/tuning.ts` — re-exports `STANDARD_TUNING` (low-E .. high-E open
  pitch classes, tablature order 0..5).
- `src/lib/theory/notes.ts` — `getNoteName(stringIndex, absFret)` for the optional
  note display; degree labels come from `chords.ts`, not from here.
- `src/lib/theory/chords.ts` — `TRIAD_OFFSETS` (`maj [0,4,7]`, `min [0,3,7]`,
  `dim [0,3,6]`, `aug [0,4,8]`) and `TRIAD_DEGREES` (`['1','3','5']`,
  `['1','♭3','5']`, `['1','♭3','♭5']`, `['1','3','♯5']` — Unicode ♭/♯). These are the
  offsets + degree labels the mirror consumes; `getTriad(root, quality)` already
  surfaces both as `triad.offsets` and `triad.degrees`.
- `src/lib/components/ChordBuilder.svelte` — the wrapper that owns `root`/`quality`
  `$state`, `triad = $derived(getTriad(root, quality))`, and `rootPc = $derived(...)`.
  This is where the mirror is wired with **no new state**.

Stack facts that constrain the design:

- Svelte 5 runes mode; flat `$state`/`$derived`; presentational/stateful split; pure
  theory isolated from components (the project's canonical pattern, mirrored here).
- **SVG token gotcha (HARD):** CSS custom properties do NOT resolve inside SVG
  presentation attributes. `fill="rgb(var(--note-tone-rgb))"` renders nothing. The
  ONLY safe path is Tailwind `fill-*`/`stroke-*` CLASSES (`fill-note-root`,
  `fill-note-tone`, `fill-surface-raised`, `stroke-hairline`, …), exactly as
  `IntervalFretboard.svelte` does. Never use `fill="rgb(var(--x))"`.
- Both `fill-note-root` (blue, `--note-root-rgb: 59 130 246`) and `fill-note-tone`
  (green, `--note-tone-rgb: 34 197 94`) tokens already exist (`app.css` +
  `tailwind.config.js`) and are already used by `Fretboard.svelte` and the
  `ChromaticRuler` (the ruler this mirror must match). These are the SAME role
  colors the ruler uses for root vs other chord tone.
- jsdom test env; unit tests under `tests/unit/`, component tests under
  `tests/components/`. Vitest IS installed and green (910 tests). The stale
  `strict_tdd: false` / `installed: false` in `openspec/config.yaml` is WRONG for
  this change and MUST be ignored — `chordPositions` is unit-tested before any UI.
- svelte-check: ChordBuilder already renders this component as a plain child; adding
  it does NOT introduce a new `<svelte:boundary>`, so NO new ErrorBoundary
  svelte-check error is expected.

## Goals / Non-Goals

Goals (v1):

- A pure, fully unit-tested `src/lib/theory/chordFretboard.ts` exporting
  `ChordFretboardPosition` and `chordPositions(rootPc, offsets)`, modeled exactly on
  `intervalPositions`: one position per (string × fret 0..MAX_FRET) cell whose pitch
  class matches a chord offset, carrying `stringIndex`, `fret`, `pitchClass`, the
  matched `degreeIndex`, and a `role` (`'root'` for offset 0, else `'tone'`). Pure,
  total, no DOM, no audio.
- A presentational `src/lib/components/ChordFretboard.svelte` mirroring
  `IntervalFretboard.svelte`: full neck (frets 0–14), reusing the `layout.ts`
  helpers, `marks = $derived(chordPositions(rootPc, offsets))`, role-colored dots
  (root `fill-note-root`, tone `fill-note-tone` — matching the RULER, NOT
  IntervalFretboard's `fill-accent`), each dot labeled with its degree from
  `TRIAD_DEGREES` via `degreeIndex`, `data-role` on every marker, `role="img"` +
  `aria-label`. Tokens-only (class-based fills).
- Wiring `<ChordFretboard rootPc={rootPc} offsets={triad.offsets} … />` into
  `ChordBuilder.svelte` below the info card, driven by the existing
  `rootPc`/`triad` derived state. No new state owner; ruler/audio behavior unchanged.
- Suite stays green; no new svelte-check errors; semantic tokens only.

Non-Goals (locked, do NOT re-open):

- No 7ths / extensions (maj7, 7, dim7, m7♭5, 9, …) — triads only.
- No exploratory drag mode, no chord recognition.
- No enharmonic spelling decisions on the neck.
- No ruler jump-label refinements.
- No chord voicings / single fingerable shapes — the mirror shows ALL chord-tone
  positions across the neck (consistent with Interval Trainer Explore mode).
- No change to `chordPositions`'s sibling `intervalPositions` or to any shared module.

## Decisions

### ADR-1 — `src/lib/theory/chordFretboard.ts`: a NEW pure helper modeled on `intervalPositions`, carrying `degreeIndex` (not raw offset) for label alignment

**Problem.** The component must (a) light every neck position of three chord tones
and (b) print the RIGHT degree label (`1`/`♭3`/`5`/`♯5`) on each dot. The label is
keyed to WHICH offset a cell matched. `intervalPositions` only distinguishes two
roles (`root`/`target`) for ONE target offset; the chord case has up to three
non-root… actually two non-root tones, and each must resolve a distinct degree
label. So the position must carry enough to look up its label.

**Decision.** Add a self-contained pure module exporting:

```ts
import { STANDARD_TUNING } from '$lib/theory/tuning';
import { MAX_FRET } from '$lib/theory/intervals';

export interface ChordFretboardPosition {
  stringIndex: number;  // 0..5, tablature order (low E .. high E)
  fret: number;         // 0..MAX_FRET inclusive
  pitchClass: number;   // 0..11
  role: 'root' | 'tone';
  /** Index into the offsets array that this cell matched (0 = root).
   *  The component maps this to TRIAD_DEGREES[quality][degreeIndex]. */
  degreeIndex: number;
}

/**
 * Returns every fret position on a 6-string standard-tuned neck
 * (frets 0..MAX_FRET) whose pitch class matches a chord offset.
 *
 * Pure: no DOM, no audio. Bounded double for-loop — no while-loops.
 * Mirrors intervalPositions(): normalize root mod-12, then for each
 * (string, fret) cell compute pc = (openNote + fret) % 12 and match it
 * against (normalizedRoot + offsets[k]) % 12. The FIRST matching offset
 * index wins (k ascending), so offset 0 (the root) always wins ties and
 * is emitted exactly once per cell. role = 'root' iff the matched offset
 * is 0 (degreeIndex 0), else 'tone'.
 */
export function chordPositions(
  rootPc: number,
  offsets: readonly number[],
): ChordFretboardPosition[] {
  const normalizedRoot = ((rootPc % 12) + 12) % 12;

  // Precompute target pitch class per offset index (parallel to offsets).
  const targetPcs = offsets.map((o) => (((normalizedRoot + o) % 12) + 12) % 12);

  const positions: ChordFretboardPosition[] = [];

  for (let stringIndex = 0; stringIndex <= 5; stringIndex++) {
    const openNote = STANDARD_TUNING[stringIndex];
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const pc = (openNote + fret) % 12;
      // First matching offset index wins (ascending) — see tie note below.
      const degreeIndex = targetPcs.indexOf(pc);
      if (degreeIndex !== -1) {
        positions.push({
          stringIndex,
          fret,
          pitchClass: pc,
          role: degreeIndex === 0 ? 'root' : 'tone',
          degreeIndex,
        });
      }
    }
  }

  return positions;
}
```

**Why `degreeIndex` and not raw `offset`.** The component already receives `offsets`
and `degrees` from `triad`; aligning by INDEX (`degrees[degreeIndex]`) is the same
positional contract `getTriad` guarantees (`offsets[i]` ↔ `degrees[i]`). Carrying
the index keeps the helper independent of the label vocabulary (the ♭3/♯5 strings
live in `chords.ts`, not here) and lets a future Phase-2 caller pass 7th/extension
offsets+degrees with no helper change. It also matches the proposal's risk
mitigation: "carry the matched offset/degree on each position and resolve the label
by it, not by render order."

**Tie / duplicate-pitch-class edge case.** Two offsets could in principle map to the
SAME pitch class (e.g. offset 0 and offset 12 → octave; or a malformed input).
**For the four triads this NEVER happens** — `[0,4,7]`, `[0,3,7]`, `[0,3,6]`,
`[0,4,8]` are all distinct mod-12. The resolution is nonetheless explicit and total:
`targetPcs.indexOf(pc)` returns the FIRST (lowest) matching offset index, so:

- offset 0 (the root) always wins any tie with a higher offset — a cell is emitted
  at most ONCE, never duplicated, and a root cell is always labeled `1`/`role:'root'`
  (the same tie discipline `intervalPositions` gets from its `if (root) … else if
  (target)` ordering).
- For non-root ties (not reachable with triads), the lower degree index wins
  deterministically. This keeps the function total and its output count exactly one
  position per matching cell.

**Purity / totality.** No globals, no DOM, no audio. `offsets` is read-only; `rootPc`
is normalized so negatives/overflow are safe (mirrors `intervalPositions(-1, 7)`
normalizing to pc 11). Every (rootPc × offsets) returns an array; never throws.
Deterministic — identical args yield identical arrays. This is the entire
unit-tested surface.

**Rejected.**

- *Reusing `intervalPositions` twice (root+third, root+fifth) and merging* — would
  emit the root cells twice, require dedupe, and lose the single-pass clarity; the
  helper is cheap enough to walk the neck once against all offsets.
- *Carrying the raw `offset` instead of `degreeIndex`* — forces the component to
  reverse-map offset→label (an `offsets.indexOf(offset)`), duplicating the alignment
  the index already encodes. Index is the direct, positional contract.
- *Storing the degree LABEL string on the position* — couples the pure neck helper
  to the ♭/♯ label vocabulary owned by `chords.ts`; the component owns presentation.

### ADR-2 — `src/lib/components/ChordFretboard.svelte`: mirror IntervalFretboard's scaffold EXACTLY, but role-color to the RULER (`fill-note-root` / `fill-note-tone`) and label by degree

**Decision.** Copy `IntervalFretboard.svelte`'s structure verbatim — same imports
from `layout.ts`, same `viewBox`, `role="img"`, `<title>`/`<desc>`, neck background,
fret lines, marker-fret backgrounds, string lines, `FRET_MARKERS` dots, nut line,
and fret-number row — and change only three things: the props, the derived marks
source, and the marker loop (colors + labels).

```svelte
<script lang="ts">
  import { chordPositions } from '$lib/theory/chordFretboard';
  import { TRIAD_DEGREES, type TriadQuality } from '$lib/theory/chords';
  import {
    L, FL, stringY, fretLineX, noteX, viewBoxW, viewBoxH, FRET_MARKERS,
  } from '$lib/theory/layout';

  interface Props {
    rootPc: number;                 // 0..11
    offsets: readonly number[];     // e.g. [0, 4, 7]
    degrees?: readonly string[];    // e.g. ['1','3','5'] — aligned to offsets
    rootName?: string;              // display label for aria; e.g. 'C'
    chordName?: string;             // e.g. 'C major' for aria/title
    width?: number;                 // optional width override
  }

  let { rootPc, offsets, degrees, rootName, chordName, width }: Props = $props();

  // Pure derived position list — one algorithm, one test surface.
  let marks = $derived(chordPositions(rootPc, offsets));

  // Geometry constants (always full neck from nut, frets 0..14) — identical to IntervalFretboard.
  const rangeStart = 0;
  const span = FL.MAX_FRET_SPAN; // 14

  let vbW = $derived(width ?? viewBoxW(span));
  let vbH = $derived(viewBoxH());

  let fretNumbers = $derived.by(() => {
    const nums: number[] = [];
    for (let n = 1; n <= span; n++) nums.push(n);
    return nums;
  });

  let ariaLabel = $derived(
    `${chordName ?? rootName ?? 'Chord'} — positions across the neck`,
  );
</script>
```

**Marker loop** (the only semantically new render block) — root vs tone branch,
colored to match the ruler, labeled by `degreeIndex`:

```svelte
{#each marks as mark (`${mark.stringIndex}-${mark.fret}`)}
  {@const cx = noteX(mark.fret, rangeStart)}
  {@const cy = stringY(mark.stringIndex)}
  {@const label = degrees?.[mark.degreeIndex] ?? ''}
  {#if mark.role === 'root'}
    <circle {cx} {cy} r={L.ROOT_R} class="fill-note-root" data-role="root" />
    <text
      x={cx} y={cy + 4} text-anchor="middle" font-size={L.LABEL_FS}
      fill="white" font-weight="bold" style="pointer-events:none"
    >{label}</text>
  {:else}
    <circle {cx} {cy} r={L.TONE_R} class="fill-note-tone" data-role="tone" />
    <text
      x={cx} y={cy + 3} text-anchor="middle" font-size={L.LABEL_FS - 1}
      fill="white" font-weight="bold" style="pointer-events:none"
    >{label}</text>
  {/if}
{/each}
```

**Color decision — match the RULER, NOT IntervalFretboard (load-bearing).**
IntervalFretboard uses `fill-accent` (yellow) for root and `fill-note-root` (blue)
for the single target. The mirror INTENTIONALLY DIVERGES: root = `fill-note-root`
(blue), other tones = `fill-note-tone` (green) — the SAME role colors the
`ChromaticRuler` already uses for root vs chord tone in this very tool. The mirror's
job is to be the neck reflection of the ruler, so its colors must read identically.
This divergence is deliberate and documented here so a reviewer does NOT "fix" it
back toward IntervalFretboard's `fill-accent`. (Both tokens exist and are already
SVG-class-used by `Fretboard.svelte`.)

**Degree labels via `TRIAD_DEGREES`.** The component prints `degrees[degreeIndex]`.
The wrapper passes `degrees={triad.degrees}` (the `['1','♭3','5']`-style array from
`getTriad`, sourced from `TRIAD_DEGREES`). If `degrees` is omitted the dot shows no
label (graceful, still colored + `data-role`). Because alignment is by INDEX, the
maj→min third (offset 4→3) prints `3` vs `♭3` correctly regardless of render order —
the proposal's "labels misaligned to wrong tone" risk is structurally avoided. The
component imports `TRIAD_DEGREES`/`TriadQuality` only for typing/fallback; the actual
labels flow as a prop from the already-resolved `triad`.

**Marker key.** Key by `` `${stringIndex}-${fret}` `` exactly like IntervalFretboard
— a neck cell is unique by (string, fret), and on quality change the lit set changes
wholesale (the mirror does NOT animate a single marker the way the ruler does), so a
positional cell key is correct and cheap.

**SVG token requirement (restate).** Every fill/stroke is a Tailwind CLASS
(`fill-surface-raised`, `stroke-hairline`, `fill-hairline`, `stroke-muted`,
`fill-muted`, `fill-note-root`, `fill-note-tone`). NO `fill="rgb(var(--x))"`. The
only literal `fill` is `fill="white"` on the label `<text>` (a real keyword, not a
token), identical to IntervalFretboard.

**Rejected.**

- *Reusing IntervalFretboard with a `colorRole` prop* — would fork its tested
  contract (its tests assert `fill-accent` on root) and entangle two tools' visuals;
  a sibling component is cleaner and independently testable.
- *Computing degree labels inside the component from offsets* — duplicates the
  `chords.ts` table; passing `triad.degrees` keeps one source of truth.
- *`fill-accent` for the root (IntervalFretboard parity)* — breaks ruler parity, the
  whole point of the mirror; explicitly rejected per proposal risk note.

### ADR-3 — Wiring into `ChordBuilder.svelte`: one additive `<ChordFretboard>` below the info card, bound to existing derived state, no new state owner

**Decision.** Import `ChordFretboard` and render it in a new `<section>` placed
**after the chord-info card and before (or after) the Play section** — concretely,
directly below the existing info `<section>` (lines ~159–173), so the reading order
is: ruler (abstract) → name/formula/notes (the chord identity) → fretboard mirror
(where it lives on the neck) → Play. It binds ONLY to state that already exists:

```svelte
<!-- import alongside ChromaticRuler -->
import ChordFretboard from '$lib/components/ChordFretboard.svelte';
```

```svelte
<!-- Fretboard mirror — full neck, all chord-tone positions (additive) -->
<section class="mb-6">
  <ChordFretboard
    rootPc={rootPc}
    offsets={triad.offsets}
    degrees={triad.degrees}
    rootName={root}
    chordName={triad.name}
  />
</section>
```

`rootPc` is the existing `$derived(CHROMATIC.indexOf(root))`; `triad` is the existing
`$derived(getTriad(root, quality))`, already exposing `offsets`, `degrees`, and
`name`. **No new `$state`, no new derived, no handler.** Changing root or quality
re-derives `triad` → the `offsets`/`degrees` props change → `ChordFretboard`'s
`marks = $derived(chordPositions(...))` recomputes → the neck re-lights. The ruler,
the quality toggle, the Play button, the audio player, and reduced-motion logic are
all **untouched** — this is a single new render element bound to read-only derived
state.

**Placement rationale.** Below the info card keeps the pedagogical flow
abstract→concrete (ruler shows the formula, mirror shows it on the instrument), and
keeps Play last as the "now hear it" capstone. Either "below info card" or "below
Play" satisfies the proposal ("below the ruler / info card"); this design fixes it
below the info card and above Play for the cleanest learning arc. Tasks may finalize
exact spacing classes (`mb-6` matches the surrounding sections).

**Rejected.**

- *Adding a new `$state` for the mirror or duplicating `getTriad`* — the wrapper
  already owns the single source of truth; the mirror is a pure consumer.
- *Wrapping the mirror in its own `<svelte:boundary>`* — unnecessary (it is pure +
  presentational, can't throw on valid props) and would add a NEW svelte-check
  ErrorBoundary requirement; rendering as a plain child does not. Keep it plain.

## Architecture / Data Flow

```
  src/lib/theory/chordFretboard.ts  (PURE, total, unit-tested FIRST)
     chordPositions(rootPc, offsets)
       → walks STANDARD_TUNING[0..5] × frets 0..MAX_FRET(14)
       → per cell: pc = (openNote + fret) % 12
       → degreeIndex = targetPcs.indexOf(pc)   (first/lowest wins ties → root wins)
       → push { stringIndex, fret, pitchClass, role: idx===0?'root':'tone', degreeIndex }
                                   │
                                   ▼
  ChordBuilder.svelte  (STATEFUL wrapper — UNCHANGED owner)
     root: $state<NoteName>      quality: $state<TriadQuality>
        │                              │
        └──────────────┬───────────────┘
                       ▼
        rootPc = $derived(CHROMATIC.indexOf(root))
        triad  = $derived(getTriad(root, quality))   // offsets, degrees, name, notes
                       │
   ┌─────────────┬─────┴───────────┬────────────────────────┬─────────────┐
   ▼             ▼                 ▼                        ▼             ▼
 RootSelector  quality toggle   ChromaticRuler          ChordFretboard  Play
 (set root)    (set quality)    (existing, unchanged)   (NEW; props:    (unchanged)
                                                          rootPc,
                                                          triad.offsets,
                                                          triad.degrees,
                                                          root, triad.name)
                                                            │
                                                            ▼
                                          marks = $derived(chordPositions(rootPc, offsets))
                                            → full-neck SVG (layout.ts helpers)
                                            → root dots fill-note-root + degree label
                                            → tone dots fill-note-tone + degree label
                                            → data-role per dot, role="img", aria-label
```

Data flow:

1. **Selection.** User picks a root or quality (existing handlers). `rootPc` and
   `triad` re-derive purely — no change to that machinery.
2. **Mirror render.** `ChordFretboard` receives `rootPc` + `triad.offsets/degrees`;
   `marks = chordPositions(rootPc, offsets)` recomputes; the neck re-lights, each dot
   colored by role and labeled `degrees[degreeIndex]`.
3. **No audio/no animation coupling.** The mirror neither plays nor animates a single
   marker; it is a static reflection that swaps its lit set on derived-state change.

## Integration Points

- **Reuses (unchanged):** `MAX_FRET`, `STANDARD_TUNING` (`intervals.ts` /
  `tuning.ts`); `L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`,
  `FRET_MARKERS` (`layout.ts`); `TRIAD_OFFSETS`/`TRIAD_DEGREES`/`getTriad` (`chords.ts`);
  `fill-note-root`/`fill-note-tone`/`fill-surface-raised`/`stroke-hairline`/
  `fill-hairline`/`stroke-muted`/`fill-muted` tokens; the IntervalFretboard scaffold
  as the structural template.
- **New pure module (the unit-tested surface):** `src/lib/theory/chordFretboard.ts`.
- **New component:** `src/lib/components/ChordFretboard.svelte` (presentational).
- **Modified (one additive element + one import):** `src/lib/components/ChordBuilder.svelte`.
- **Untouched:** `intervals.ts`, `IntervalFretboard.svelte`, routing, the tool
  registry, `playNote.ts`, the ruler, the quality toggle, reduced-motion logic, every
  other tool, the visual skin.

## Testing Strategy (file placement, strict TDD order)

Strict TDD: write the failing test, then the minimal code, per layer, bottom-up.

**1. Unit (pure, the bulk of coverage) — `tests/unit/theory/chordFretboard.test.ts` (FIRST):**
(placed beside `intervals.test.ts` under `tests/unit/theory/`)

- **Smoke / shape:** returns an array; every position has `stringIndex` ∈ [0,5],
  `fret` ∈ [0,14], `pitchClass` ∈ [0,11], `role` ∈ {`'root'`,`'tone'`},
  `degreeIndex` ∈ [0, offsets.length-1].
- **Role correctness:** every `role:'root'` has `degreeIndex === 0` and
  `pitchClass === normalizedRoot`; every `role:'tone'` has `degreeIndex > 0`.
- **All four qualities × representative roots:** for `chordPositions(0, [0,4,7])`
  (C maj) assert root pcs are 0, tone pcs ∈ {4,7}; repeat for `min [0,3,7]` (tones
  {3,7}), `dim [0,3,6]` (tones {3,6}), `aug [0,4,8]` (tones {4,8}). Loop a few roots
  (e.g. 0, 5, 11) to confirm mod-12 wrap (e.g. root 11 → root pc 11).
- **Degree-index → pitch-class mapping:** for each matched cell,
  `pitchClass === (rootPc + offsets[degreeIndex]) % 12` (the alignment contract the
  component relies on).
- **Pitch class repeats across the neck:** the same chord pc appears on multiple
  (string, fret) cells (count of `role:'root'` > 1 for a full neck), proving "all
  positions," not one.
- **Bounds / determinism:** no `fret > 14`; identical args → identical arrays
  (`toEqual`); negative root normalizes (`chordPositions(-1, [0,4,7])` roots have
  `pitchClass === 11`).
- **Tie discipline (octave/dup edge):** `chordPositions(0, [0,12])` — every matching
  cell is emitted ONCE with `role:'root'`/`degreeIndex 0` (offset 0 wins the tie),
  zero `role:'tone'`. Documents the resolution even though triads never hit it.
- **Count sanity:** total marks > 0 and a reasonable upper bound (≤ ~3 pcs × ~6
  cells/pc ≈ well under 90) for a triad over the 0–14 neck.

**2. Component — `tests/components/ChordFretboard.test.ts`** (jsdom, mirror the
`IntervalFretboard.test.ts` pattern — lazy import, `screen.getByRole('img')`,
`container.querySelectorAll('[data-role=…]')`):

- Renders without throwing for `{ rootPc: 0, offsets: [0,4,7], degrees: ['1','3','5'] }`.
- Renders a `role="img"` element with a non-empty `aria-label`.
- `[data-role="root"]` count === `chordPositions(0,[0,4,7]).filter(p=>p.role==='root').length`.
- `[data-role="tone"]` count === the matching `tone` count from `chordPositions`.
- `[data-role="root"]` elements carry `fill-note-root`; `[data-role="tone"]` elements
  carry `fill-note-tone` (the ruler-parity color assertion — and explicitly NOT
  `fill-accent`).
- Degree labels: assert the rendered text for a known root cell is `1`, and a known
  tone cell shows the right degree (e.g. min third dot text is `♭3`).
- **Reactivity:** `rerender` from `offsets: [0,4,7]` (maj) to `[0,3,7]` (min) and
  assert the tone count / a third-degree label updates (the live-reaction contract).
- `width` prop reflected on the SVG (viewBox present), mirroring the IntervalFretboard
  width smoke test.

**3. Wrapper regression — extend `tests/components/ChordBuilder.test.ts`** (light):

- After mounting `ChordBuilder`, a `ChordFretboard` `role="img"` is present and its
  `[data-role="root"]`/`[data-role="tone"]` counts match `chordPositions(rootPc,
  triad.offsets)` for the default C major.
- Toggling quality to `min` updates the mirror's tone count (proves the wiring re-derives).
- Existing ruler/name/formula/Play assertions stay green (no behavior change).

No new audio is touched; the mirror has no audio. Unit tests for `chordFretboard.ts`
touch no DOM. Component tests use the existing `vi.mock('$lib/audio/playNote', …)`
harness already present in the suite (ChordFretboard imports no audio, but the mock
is harmless and matches house style).

## Test / SSR Safety

- `chordFretboard.ts` touches no globals — pure number/array functions; node/SSR-safe
  by construction; the bulk of coverage runs without DOM.
- `ChordFretboard.svelte` is prop-driven and DOM/SVG-only; no `window`/audio access →
  trivially renderable in jsdom (same as `IntervalFretboard.svelte`).
- No new `<svelte:boundary>` is introduced (the mirror renders as a plain child), so
  no new svelte-check ErrorBoundary error is expected.

## Review Workload / 400-line Budget

Estimated CHANGED lines (new + modified, incl. tests):

| Artifact | Est. lines |
|---|---|
| `src/lib/theory/chordFretboard.ts` (interface + `chordPositions`) | ~45 |
| `src/lib/components/ChordFretboard.svelte` (scaffold mirror + marker loop) | ~95 |
| `src/lib/components/ChordBuilder.svelte` (import + one `<section>`) | ~9 |
| `tests/unit/theory/chordFretboard.test.ts` | ~90 |
| `tests/components/ChordFretboard.test.ts` | ~75 |
| `tests/components/ChordBuilder.test.ts` (added mirror assertions) | ~20 |
| **Total** | **~334** |

Comfortably under the ~400-line budget; production code is ~149 lines, the rest is
TDD coverage. **Recommendation: SINGLE PR.** The change is one cohesive, additive
feature (pure helper + presentational component + one wiring line); there is no
clean seam that would keep each split green without shipping untested theory.

**Review Workload Forecast:** Chained PRs recommended: No. 400-line budget risk: Low.
Estimated changed lines: ~334. Decision needed before apply: No.

TDD order across the work: (1) `chordFretboard.test.ts` → `chordFretboard.ts`;
(2) `ChordFretboard.test.ts` → `ChordFretboard.svelte`; (3) extend
`ChordBuilder.test.ts` → wire the `<ChordFretboard>` element; (4) confirm
`tsc`/svelte-check + full suite green.

## Risks

- **SVG token gotcha (CSS vars don't resolve in presentation attributes)** —
  AVOIDED: every fill/stroke is a Tailwind CLASS (`fill-note-root`, `fill-note-tone`,
  `fill-surface-raised`, `stroke-hairline`, …), never `fill="rgb(var(--x))"`. Tests
  assert the class is present, mirroring the IntervalFretboard tests.
- **Color drift from the ruler** — PREVENTED by locking root = `fill-note-root`,
  tone = `fill-note-tone` (the ruler's role colors) and asserting both classes in the
  component test; the deliberate divergence from IntervalFretboard's `fill-accent` is
  documented in ADR-2 so it is not "corrected."
- **Degree labels misaligned to the wrong tone** — STRUCTURALLY PREVENTED: each
  position carries `degreeIndex` and the component prints `degrees[degreeIndex]`, so
  alignment is positional/index-based, not render-order based; the maj→min 4→3 third
  prints `3`→`♭3` correctly. Tested via a known-cell label assertion.
- **Duplicate pitch classes / tie** — HANDLED by `targetPcs.indexOf(pc)` (first/lowest
  offset index wins), so the root always wins ties, each cell is emitted exactly once,
  and the function stays total. Not reachable with the four triads (all distinct
  mod-12); tested via the `[0,12]` octave edge.
- **New svelte-check error from a boundary** — AVOIDED: the mirror is a plain child,
  not wrapped in `<svelte:boundary>`, so no new ErrorBoundary requirement is added.
- **Accidental change to existing behavior** — AVOIDED: wiring is one additive
  `<section>` bound to existing derived state; ruler, audio, toggle, reduced-motion
  untouched; `intervals.ts`/`IntervalFretboard.svelte` not modified.
- **Stale `config.yaml` TDD flags** — IGNORED per the proposal; vitest is installed
  and green (910 tests); `chordPositions` is unit-tested before any UI.

## Rollback

Fully additive. Revert by deleting `src/lib/theory/chordFretboard.ts`,
`src/lib/components/ChordFretboard.svelte`, and their tests; removing the
`ChordFretboard` import and the single `<ChordFretboard>` `<section>` from
`ChordBuilder.svelte`; and dropping the added assertions in `ChordBuilder.test.ts`.
No shared module is mutated (`intervals.ts`, `layout.ts`, `chords.ts`,
`IntervalFretboard.svelte`, routing, registry, audio all untouched), so reverting
restores the Phase 1 Chord Builder exactly.
