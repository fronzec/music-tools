# Design: Chord Builder — graphical triad construction via a chromatic ruler — v1

## Context

This is a non-SvelteKit Svelte 5 + Vite SPA mounted manually in `src/main.ts`
(`mount(App, { target })`). Tools are stateful components rendered by a single
chokepoint router: `App.svelte` holds `let currentView: ViewName = $state(...)`
and a `navigate(view)` chokepoint; each tool gets `{ navigate }` and renders
inside a `<svelte:boundary>`. Tool identity is a 1:1 `ViewName ↔ /path` map
(`src/lib/routing.ts`), and the recently shipped routing/analytics change means
adding `'chord-builder'` to the union + `VIEW_NAMES` gives `/chord-builder` a
Vercel pageview for free.

The proposal already decided WHAT and WHETHER. This document designs HOW, against
the real code:
- `src/lib/theory/intervals.ts` — `midiToFreq`, the interval table (the source of
  the interval-jump short labels `M3`/`m3`/`P5`).
- `src/lib/theory/notes.ts` — `semitoneToNoteName(index)` (wraps mod-12, returns
  `NoteName`).
- `src/lib/types/chord.ts` — `NoteName`, `CHROMATIC`, `ChordQuality`
  (`'major' | 'minor'` — used by CAGED, MUST NOT change), `ViewName`.
- `src/lib/routing.ts` — `VIEW_NAMES` + the compile-time exhaustiveness guard.
- `src/lib/audio/playNote.ts` — `createNotePlayer()` → `{ playSequence(freqs), dispose() }`.
- `src/lib/components/RootSelector.svelte` — reused root picker.
- `src/lib/data/tools.ts` — `TOOL_CATEGORIES` registry, `ActiveTool` discriminated union.
- `src/App.svelte`, `src/app.css` (tokens + reduced-motion guard), `tailwind.config.js`.

Stack facts that constrain the design:
- Svelte 5 runes mode; flat `$state`/`$derived`, presentational/stateful split,
  pure theory isolated from components (mirrors `IntervalTrainer` + `intervals.ts`).
- `createNotePlayer().playSequence(freqs)` is an **ascending sequence** scheduler:
  it plays `freqs[i]` at `now + i * STEP` (STEP = 0.7s), one note per entry. It is
  the ONLY audio primitive; there is no separate "block/chord" call. The design
  works WITHIN this primitive — see ADR-4.
- Tokens are space-separated RGB triplets consumed as Tailwind utilities
  (`bg-accent`, `text-note-root`, `text-note-tone`, `border-hairline`, …). The
  `note-root` (blue) and `note-tone` (green) tokens already exist for exactly this
  "root vs chord-tone dot" purpose.
- `prefers-reduced-motion` is handled in `app.css` ONLY for two named keyframe
  classes (`.animate-led-pulse`, `.animate-rack-in`). A CSS `transition` on a
  marker is NOT covered by that block — the ruler MUST gate its own slide (ADR-3).
- jsdom test env; unit tests in `tests/unit/`, component tests in
  `tests/components/`. Vitest IS installed; strict TDD is active (834 tests green).
  The stale `openspec/config.yaml` flags are ignored.

## Goals / Non-Goals

Goals (v1 / MVP):
- A pure, fully unit-tested `src/lib/theory/chords.ts` exposing a `TriadQuality`
  type, a quality→offsets+degrees table, and a total `getTriad(root, quality)`
  returning notes, offsets, degrees, and the resolved chord name. No DOM, no audio.
- A presentational `ChromaticRuler.svelte`: 12 semitone cells from the root, chord
  tones lit at their exact offsets, interval-jump and formula annotations, markers
  that **slide** on quality change, with a self-contained `prefers-reduced-motion`
  gate.
- A thin stateful `ChordBuilder.svelte` wrapper: `$state` root + quality, `$derived`
  triad, `RootSelector` reuse, a 4-way quality toggle, name/formula display, and a
  Play button that arpeggiates then blocks via the existing note player, disposed
  on unmount.
- Routing/registry integration: `'chord-builder'` in the `ViewName` union AND
  `VIEW_NAMES` (guard kept green), an `App.svelte` route branch with
  `<svelte:boundary>`, and an `active` `tools.ts` entry in **Fretboard & Theory**.
- Suite stays green; no new svelte-check errors; semantic tokens only.

Non-Goals (locked, do NOT re-open):
- No fretboard mirror, no 7ths/extensions, no drag/recognition mode (all Phase 2).
- No change to `ChordQuality` (`'major' | 'minor'`) or any CAGED code path (ADR-1).
- No new audio primitive in `playNote.ts` (ADR-4 works within `playSequence`).
- No visual-skin / design-token changes; no new dependency.

## Decisions

### ADR-1 — `src/lib/theory/chords.ts`: a NEW, separate `TriadQuality` type + total `getTriad`, NOT an extension of the existing `ChordQuality`

**Problem.** `chord.ts` already exports `ChordQuality = 'major' | 'minor'`,
consumed by `ChordShape`, the CAGED visualizer, and `getIntervalName` in
`notes.ts`. The Chord Builder needs FOUR qualities (maj/min/dim/aug). Widening
`ChordQuality` to four members would force every existing `switch`/branch on it
(CAGED shape selection, `getIntervalName`) to handle `'diminished'`/`'augmented'`
or silently fall through — a non-additive break of a shipped, tested feature.

**Decision.** Introduce a **separate, self-contained** `TriadQuality` type and
data table inside the new pure module `src/lib/theory/chords.ts`. Do NOT touch
`ChordQuality`. The two type names coexist: `ChordQuality` stays the CAGED
two-state quality; `TriadQuality` is the Chord Builder's four-state quality. This
keeps the change additive and the CAGED path byte-for-byte unchanged.

```ts
import type { NoteName } from '$lib/types/chord';
import { semitoneToNoteName } from '$lib/theory/notes';

/** The four triad qualities the Chord Builder exposes. */
export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

/** A degree label as displayed in the formula (uses ♭/♯ accidentals). */
export type DegreeLabel = '1' | '3' | '♭3' | '5' | '♭5' | '♯5';

interface TriadSpec {
  /** Semitone offsets from the root, ascending; index 0 is always 0 (the root). */
  readonly offsets: readonly [0, number, number];
  /** Formula degree labels aligned 1:1 with offsets. */
  readonly degrees: readonly [DegreeLabel, DegreeLabel, DegreeLabel];
  /** Suffix appended to the root for the chord name (e.g. 'major' → 'C major'). */
  readonly nameSuffix: string;
}

/**
 * Canonical triad table. The whole theory of the tool lives here, as data.
 * Phase 2 (7ths/extensions) extends by widening offsets/degrees tuples — the
 * function signatures below do not assume length 3 beyond the labels.
 */
export const TRIADS: Readonly<Record<TriadQuality, TriadSpec>> = {
  major:      { offsets: [0, 4, 7], degrees: ['1', '3',  '5'],  nameSuffix: 'major' },
  minor:      { offsets: [0, 3, 7], degrees: ['1', '♭3', '5'],  nameSuffix: 'minor' },
  diminished: { offsets: [0, 3, 6], degrees: ['1', '♭3', '♭5'], nameSuffix: 'dim' },
  augmented:  { offsets: [0, 4, 8], degrees: ['1', '3',  '♯5'], nameSuffix: 'aug' },
} as const;

export interface Triad {
  readonly root: NoteName;
  readonly quality: TriadQuality;
  readonly offsets: readonly number[]; // e.g. [0, 4, 7]
  readonly degrees: readonly DegreeLabel[]; // e.g. ['1','3','5']
  readonly notes: readonly NoteName[]; // e.g. ['C','E','G']
  readonly name: string; // e.g. 'C major'
}

/**
 * Total, pure. Resolves a root + quality into the full triad model the UI needs.
 * Notes are derived by mapping each offset through semitoneToNoteName (which
 * wraps mod-12), so every (root × quality) pair is valid — never throws.
 */
export function getTriad(root: NoteName, quality: TriadQuality): Triad {
  const spec = TRIADS[quality];
  const rootPc = CHROMATIC.indexOf(root); // 0..11, root ∈ NoteName so always found
  const notes = spec.offsets.map((o) => semitoneToNoteName(rootPc + o));
  return {
    root,
    quality,
    offsets: spec.offsets,
    degrees: spec.degrees,
    notes,
    name: `${root} ${spec.nameSuffix}`,
  };
}
```

**Type-safety notes.**
- `TriadQuality` is the discriminant; `TRIADS` is `Record<TriadQuality, TriadSpec>`,
  so the compiler forces all four entries (a missing quality is a `tsc` error) —
  the same exhaustiveness discipline the routing guard uses.
- `offsets` typed as `readonly [0, number, number]` documents "root-relative,
  starts at 0" without over-constraining Phase 2.
- `DegreeLabel` is a closed union of the only labels the four triads use, so the
  formula text is type-checked, not stringly-typed.
- `getTriad` is **total**: `root: NoteName` guarantees `CHROMATIC.indexOf` ≥ 0,
  and `semitoneToNoteName` wraps mod-12, so there is no throwing path. This is why
  it is trivially unit-testable across all 12 roots × 4 qualities.
- Reuses `semitoneToNoteName` (single source of pitch→name truth) — the module
  owns triad THEORY, not note-naming.

**Rejected.**
- *Widening `ChordQuality` to four members* — breaks CAGED + `getIntervalName`'s
  binary major/minor branch; non-additive; the proposal's "do NOT silently break
  CAGED" constraint forbids it.
- *Deriving names from a separate name map keyed by quality elsewhere* — splits
  the triad model; keeping suffix in `TRIADS` keeps one table = one source of truth.
- *Returning interval-jump labels (`M3`,`m3`,`P5`) from the theory module* — the
  jumps are a presentation concern derived from adjacent offset deltas; computing
  them in the ruler (via `intervalBySemitones`) keeps `chords.ts` about the chord,
  not the gaps between its tones (see ADR-2).

> Note: `getTriad` references `CHROMATIC` — add `import { CHROMATIC } from '$lib/types/chord'`
> alongside the `NoteName` type import. (`CHROMATIC.indexOf` is the existing idiom;
> `notes.ts`'s `noteNameToSemitone` does the same and may be imported instead.)

### ADR-2 — Ruler component: DOM/CSS grid of 12 cells with absolutely-positioned markers, NOT SVG

**Decision.** Build `ChromaticRuler.svelte` as a **DOM/CSS** component: a relatively
positioned track containing 12 semitone cells (a flex/grid row), with chord-tone
**markers absolutely positioned** over the track and moved via CSS
`transform: translateX(...)` under a `transition`. NOT SVG.

**Why DOM/CSS over SVG — the token gotcha is the deciding factor.** The proposal's
hard constraint is "semantic tokens only, no hardcoded colours." Tokens are
delivered as Tailwind utilities backed by CSS variables (`bg-note-root`,
`text-note-tone`, `border-hairline`). In SVG, **CSS custom properties do not
resolve inside presentation attributes** — `fill="rgb(var(--note-tone-rgb))"`
renders nothing/black. The SVG-safe path requires `fill-note-tone` / `stroke-*`
Tailwind classes and constant vigilance against the `fill="..."` trap (a risk the
proposal explicitly lists). DOM/CSS **eliminates the gotcha entirely**: every
element is a `<div>`/`<span>` styled with the exact same token utilities the rest
of the app uses (`bg-note-root`, `bg-note-tone`, `border-accent/40`), so there is
nothing to get wrong and a reviewer checks tokens the same way as everywhere else.

The slide is also trivial in DOM: a marker is one absolutely-positioned element
whose `left`/`transform` is data-driven; a single `transition: transform 250ms` (or
`left`) animates the maj→min 3rd-drop with zero JS. In SVG you would animate `cx`
or a `transform` attribute and re-confront the token problem for the fill.

**Markup shape (illustrative — exact classes finalised in apply):**

```svelte
<script lang="ts">
  import { intervalBySemitones } from '$lib/theory/intervals';
  import type { NoteName } from '$lib/types/chord';
  import type { DegreeLabel } from '$lib/theory/chords';

  interface Props {
    rootName: NoteName;
    offsets: readonly number[];   // [0, 4, 7]
    degrees: readonly DegreeLabel[];
    notes: readonly NoteName[];
    /** Disable the slide; ChordBuilder passes the reduced-motion result. */
    reducedMotion?: boolean;
  }
  let { rootName, offsets, degrees, notes, reducedMotion = false }: Props = $props();

  // 12 fixed semitone slots (0..11) for the strip background/ticks.
  const SLOTS = Array.from({ length: 12 }, (_, i) => i);

  // Marker x-position: offset i of 12 → percentage across the track.
  // pct(o) = (o / 12) * 100  (one slot = 100/12 ≈ 8.333% wide; marker centered in its slot)
  // Adjacent interval jumps: e.g. [0,4,7] → +4 (M3), +3 (m3). Pure, from the table.
  const jumps = $derived(
    offsets.slice(1).map((o, i) => intervalBySemitones(o - offsets[i]).short),
  );
</script>

<div class="relative ...track...">
  {#each SLOTS as s (s)}
    <div class="...cell border-hairline...">{/* tick + semitone count */}</div>
  {/each}

  {#each offsets as offset, i (i)}
    <span
      class={[
        'absolute ...marker...',
        offset === 0 ? 'bg-note-root' : 'bg-note-tone',
        reducedMotion ? '' : 'transition-transform duration-300 ease-out',
      ].join(' ')}
      style="transform: translateX(calc({(offset / 12) * 100}% * ...));"
      aria-label="{notes[i]} ({degrees[i]})"
    >
      {degrees[i]}
    </span>
  {/each}
  <!-- jump annotations (+M3, +m3) rendered between adjacent markers -->
</div>
```

**offset → x-position mapping.** The track is full-width with 12 equal slots.
A marker for `offset o` sits at fractional position `o / 12` of the track width
(centred within slot `o` via a half-slot nudge), expressed as a `translateX`
percentage so it animates smoothly and scales responsively. The root marker uses
`bg-note-root` (blue), other tones `bg-note-tone` (green) — the existing tokens.
The `#each offsets as offset, i (i)` key is the **positional index** `i` (0/1/2 =
root/third/fifth), NOT the offset value — so when the third changes from 4→3 Svelte
updates the SAME marker element and the CSS transition animates it, instead of
removing one node and adding another (which would not animate). This keying choice
is the entire reason the slide works; it is load-bearing.

**Animation + reduced-motion.** The slide is a CSS `transition-transform` applied
conditionally. `app.css`'s `@media (prefers-reduced-motion)` block only neutralises
two specific keyframe classes, so it does NOT cover this transition. The ruler MUST
gate motion itself: the wrapper reads the media query once and passes
`reducedMotion` down; when true, the transition class is omitted so quality changes
are **instant** (the marker still moves to the new offset — accessible, just no
tween). Reading the query lives in `ChordBuilder` (ADR-3) so the ruler stays purely
presentational and prop-driven (easy to test both states).

**Rejected.**
- *SVG ruler* — reintroduces the CSS-var-in-presentation-attribute gotcha the
  proposal flags; forces `fill-*`/`stroke-*` discipline with no upside here. DOM is
  token-native and the slide is one CSS line.
- *Animating with a Svelte `transition:`/`animate:`* — heavier and harder to gate
  for reduced motion than a conditional CSS class; the move is a single property.
- *Keying markers by offset value* — would teardown/rebuild the marker on change,
  killing the slide (the lesson). Keying by index is required.

### ADR-3 — `ChordBuilder.svelte` wrapper: flat `$state` root/quality, `$derived` triad, player owned + disposed, reduced-motion read once

**Decision.** A thin stateful wrapper mirroring `IntervalTrainer`'s idioms:

```svelte
<script lang="ts">
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { midiToFreq } from '$lib/theory/intervals';
  import { getTriad, type TriadQuality } from '$lib/theory/chords';
  import { createNotePlayer } from '$lib/audio/playNote';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import ChromaticRuler from '$lib/components/ChromaticRuler.svelte';

  interface Props { navigate: (view: ViewName) => void; }
  let { navigate }: Props = $props();

  let root = $state<NoteName>('C');
  let quality = $state<TriadQuality>('major');
  const triad = $derived(getTriad(root, quality));

  const QUALITIES: readonly { id: TriadQuality; label: string }[] = [
    { id: 'major', label: 'maj' }, { id: 'minor', label: 'min' },
    { id: 'diminished', label: 'dim' }, { id: 'augmented', label: 'aug' },
  ];

  const player = createNotePlayer();

  // Read prefers-reduced-motion once on mount (jsdom-safe: matchMedia exists).
  let reducedMotion = $state(false);

  // Fixed reference octave so playback is audible regardless of root (mirrors
  // IntervalTrainer's EXPLORE_ROOT_MIDI = C4 = 60).
  const ROOT_MIDI = 60;

  function play() {
    const rootPc = CHROMATIC.indexOf(root);
    const midis = triad.offsets.map((o) => ROOT_MIDI + rootPc + o);
    const freqs = midis.map(midiToFreq);
    // Arpeggio: ascending, one per STEP (playSequence's native behavior).
    // Block: re-issue all three at the same scheduled tick AFTER the arpeggio.
    player.playSequence(freqs);          // arpeggio (N notes, N*STEP long)
    // schedule the block strike after the arpeggio completes (see ADR-4)
  }

  $effect(() => {
    reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    return () => player.dispose();
  });
</script>
```

The template: a `← Back to Home` button (`navigate('home')`), title + blurb, a
`RootSelector` card (`notes={CHROMATIC}`, `selected={root}`,
`onSelect={(n) => (root = n)}`, `label`, `buttonAriaLabel` — exact same wiring as
`PentatonicTool`), a 4-button quality toggle (`aria-pressed`, accent-token active
state, identical styling to `IntervalTrainer`'s mode toggle), the
`<ChromaticRuler … {reducedMotion} />`, the chord name + formula (`triad.name`,
`triad.degrees.join('-')`) and note names (`triad.notes.join(' ')`), and a
`▶ Play` button calling `play()`.

**Rationale.** Flat `$state` + `$derived(getTriad(...))` is the project's idiom
(`IntervalTrainer` Explore mode is structurally identical: root pc + selection →
derived model → play). The player is created once per mount and disposed in the
`$effect` teardown, matching `IntervalTrainer`/`ToneGenerator` (no module-level
singleton → no cross-test leak, SSR-safe). Reduced-motion is read once in the same
effect (not in the ruler) so the ruler stays a pure prop-driven presentational
component and both motion states are testable by passing the prop.

**Rejected.**
- *Storing the derived triad in `$state` and recomputing in handlers* — `$derived`
  is the correct rune; manual recompute risks staleness.
- *Reading reduced-motion inside the ruler* — couples the presentational component
  to `window`; harder to test, violates the presentational/stateful split.

> **Filename note:** the proposal/Affected-Areas name the wrapper
> `ChordBuilder.svelte` and the ruler `ChromaticRuler.svelte`. This design uses
> those names (the proposal is the source of truth). The dispatch brief's
> "ChordBuilderTool.svelte" is treated as a synonym for the wrapper; tasks will use
> `ChordBuilder.svelte` to match the proposal and `App.svelte`'s existing
> `*Tool`/non-`Tool` mixed naming (e.g. `ProgressionBuilder`, `IntervalTrainer`).

### ADR-4 — Audio: arpeggio-then-block WITHIN the existing `playSequence`, no new primitive

**Problem.** `createNotePlayer()` exposes ONLY `playSequence(freqs)`, which
schedules `freqs[i]` at `now + i * STEP` (STEP = 0.7s) — a pure ascending
sequence. There is no "play these simultaneously (a block chord)" call. The
proposal wants arpeggio (note-by-note) THEN block (all together).

**Decision.** Realise both phases through the existing primitive, in two `play`
shapes, WITHOUT modifying `playNote.ts`:

- **Arpeggio** = `playSequence([f0, f1, f2])` — exactly the native behavior:
  three notes 0.7s apart, ascending. This is the first phase.
- **Block** = the simplest faithful realisation within the current API is a second
  `playSequence` call scheduled to start after the arpeggio finishes. Because
  `playSequence` always staggers by `STEP`, a TRUE simultaneous block needs the
  player to schedule multiple notes at the SAME tick. Two options, decided here:

  **Decision (v1):** Add ONE small, additive method to the player —
  `playChord(freqs: number[])` — that schedules every freq at the same `now`
  (simultaneous strike), reusing the existing `scheduleNote` envelope. This is a
  ~6-line additive change to `playNote.ts` (new method on the returned object; the
  existing `playSequence`/`dispose` are untouched), and it is the ONLY honest way
  to produce a real block chord. `play()` then does:

  ```ts
  function play() {
    const rootPc = CHROMATIC.indexOf(root);
    const freqs = triad.offsets.map((o) => midiToFreq(ROOT_MIDI + rootPc + o));
    player.playSequence(freqs);                 // 1) arpeggio: 3 notes, 0.7s apart
    const blockDelayMs = freqs.length * 700 + 150; // after the arpeggio + small gap
    blockTimer = setTimeout(() => player.playChord(freqs), blockDelayMs); // 2) block
  }
  ```

  The `setTimeout` handle (`blockTimer`) is cleared in the effect teardown
  (mirroring `IntervalTrainer`'s `pendingNext` cancellation) so a pending block
  cannot fire after unmount → no use-after-dispose on the AudioContext.

**Why add `playChord` instead of faking a block.** Issuing three sequential notes
0.7s apart is NOT a block chord — the whole pedagogical point of the second phase
is hearing the tones SOUND TOGETHER. Faking it (e.g. tiny STEP) would be a lie in
the audio. `playChord` is a minimal, additive, separately-testable extension that
preserves `playNote.ts`'s envelope and factory/dispose contract.

```ts
// addition inside createNotePlayer(), returned alongside playSequence/dispose:
function playChord(freqs: number[]): void {
  if (!ctx) ctx = new AudioContext();
  const t = ctx.currentTime;
  freqs.forEach((freq) => scheduleNote(ctx!, freq, t)); // all at the same tick
}
```

**Cancellable / disposed.** `player.dispose()` runs in the `ChordBuilder` effect
teardown; the block `setTimeout` is cleared there too. No autoplay on mount (Play
is a user gesture only — AudioContext is suspended until a gesture anyway, matching
`IntervalTrainer`'s no-autoplay rule).

**Rejected.**
- *Three staggered notes as the "block"* — not simultaneous; defeats the lesson.
- *A brand-new audio module* — `playNote.ts` already owns the envelope + context
  lifecycle; an additive method reuses all of it.
- *Web Audio chord via a single oscillator* — impossible (one oscillator = one
  frequency); you need N oscillators at one tick, which is exactly `playChord`.

### ADR-5 — Routing/registry integration: union + `VIEW_NAMES` in sync, guarded route branch, active registry entry

**Decision.** Four surgical edits, each matching the existing pattern exactly:

1. **`src/lib/types/chord.ts`** — add `'chord-builder'` to the `ViewName` union.
2. **`src/lib/routing.ts`** — add `'chord-builder'` to the `VIEW_NAMES` array.
   This is REQUIRED: the compile-time exhaustiveness guard (`_UnionIsSubsetOfArray`)
   turns a forgotten entry into a `tsc` error. Adding to the union WITHOUT adding to
   `VIEW_NAMES` fails the build — caught before tests.
3. **`src/App.svelte`** — import `ChordBuilder` and add a branch mirroring the
   others:
   ```svelte
   {:else if currentView === 'chord-builder'}
     <svelte:boundary failed={errorFallback}>
       <ChordBuilder {navigate} />
     </svelte:boundary>
   ```
4. **`src/lib/data/tools.ts`** — add an `active` entry to the **Fretboard & Theory**
   category (`id: 'fretboard-theory'`):
   ```ts
   {
     status: 'active',
     view: 'chord-builder',
     title: 'Chord Builder',
     description: 'See how a root plus stacked thirds becomes a named chord',
     icon: '🎹',
   },
   ```
   (Placed alongside the existing CAGED/Scales/Note-Trainer/Tab-Player entries; the
   `ActiveTool` discriminated union requires `view`, which `tsc` enforces.)

`viewToPath('chord-builder') → '/chord-builder'` and `pathToView('/chord-builder')
→ 'chord-builder'` come for free from the existing pure routing functions — no
routing code change beyond the array entry. Deep-link + Vercel pageview are
automatic (per the archived routing/analytics design).

**Rejected.** Any slug/alias for the path — the project is strictly 1:1
`ViewName ↔ /view`; `'chord-builder'` is already URL-safe.

## Architecture / Data Flow

```
  src/lib/theory/chords.ts  (PURE, total, unit-tested first)
     TRIADS table  ──getTriad(root, quality)──▶  { offsets, degrees, notes, name }
                                                         │
                              ┌──────────────────────────┘
  ChordBuilder.svelte (STATEFUL wrapper)                 │
     root: $state<NoteName>      quality: $state<TriadQuality>
        │                              │
        └──────────────┬───────────────┘
                       ▼
            triad = $derived(getTriad(root, quality))
                       │
        ┌──────────────┼───────────────────────────┬───────────────┐
        ▼              ▼                            ▼               ▼
  RootSelector   quality toggle            ChromaticRuler     Play button
  (reused;       (4 buttons → set          (PRESENTATIONAL;   play():
   set root)      quality)                  props: rootName,   offsets→MIDI→freqs
                                            offsets, degrees,  player.playSequence (arpeggio)
                                            notes, reducedMotion) then setTimeout→
                                            offset→translateX,   player.playChord (block)
                                            CSS transition (gated)

  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)') (read once, $effect)
  player = createNotePlayer()  ──dispose() + clearTimeout in $effect teardown──

  App.svelte:  currentView==='chord-builder' ─▶ <svelte:boundary><ChordBuilder {navigate}/></…>
  routing.ts:  VIEW_NAMES += 'chord-builder' (tsc-exhaustive)  →  /chord-builder (free pageview)
  tools.ts:    active entry (Fretboard & Theory) → home card → navigate('chord-builder')
```

Data flow:
1. **Selection.** User picks a root (`RootSelector` → `root`) and/or a quality
   (toggle → `quality`). `triad = $derived(getTriad(root, quality))` recomputes
   purely.
2. **Render.** `ChromaticRuler` receives `triad.offsets/degrees/notes` + `rootName`;
   markers sit at `offset/12` of the track; the formula/name/notes render from the
   triad. Changing quality updates the same indexed marker nodes → CSS slide (unless
   `reducedMotion`).
3. **Play.** `play()` maps `triad.offsets` → MIDI (from `ROOT_MIDI + rootPc + o`) →
   freqs (`midiToFreq`); `playSequence` arpeggiates; a cleared-on-unmount timer fires
   `playChord` for the block.

## Integration Points

- **Reuses (unchanged):** `semitoneToNoteName`, `CHROMATIC`, `NoteName`
  (`notes.ts`/`chord.ts`); `midiToFreq`, `intervalBySemitones` (`intervals.ts`);
  `createNotePlayer` (`playNote.ts` — `playSequence`/`dispose` untouched);
  `RootSelector.svelte`; `viewToPath`/`pathToView` + the exhaustiveness guard
  (`routing.ts`); the `<svelte:boundary>` + `navigate` chokepoint (`App.svelte`);
  `ActiveTool` registry shape (`tools.ts`); design tokens + Tailwind utilities.
- **New pure module (the unit-tested surface):** `src/lib/theory/chords.ts`.
- **New components:** `src/lib/components/ChromaticRuler.svelte` (presentational),
  `src/lib/components/ChordBuilder.svelte` (stateful wrapper).
- **Additive edit to a shared module:** `playNote.ts` gains `playChord` (new method
  on the returned object; existing API preserved) — ADR-4.
- **Modified (each matching its existing pattern):** `chord.ts` (`ViewName` += 1),
  `routing.ts` (`VIEW_NAMES` += 1), `App.svelte` (one branch), `tools.ts` (one
  active entry).
- **Untouched:** `ChordQuality`, CAGED, every other tool, the visual skin, the rest
  of the suite's behavior.

## Testing Strategy (file placement, strict TDD order)

Strict TDD: write the failing test, then the minimal code, per layer, bottom-up.

**1. Unit (pure, the bulk of coverage) — `tests/unit/chords.test.ts` (FIRST):**
- `getTriad` for ALL FOUR qualities × the canonical roots: assert `offsets`
  (maj `[0,4,7]`, min `[0,3,7]`, dim `[0,3,6]`, aug `[0,4,8]`), `degrees`
  (`['1','3','5']`, `['1','♭3','5']`, `['1','♭3','♭5']`, `['1','3','♯5']`), and
  `name` suffix (`major`/`minor`/`dim`/`aug`).
- **Note correctness across all 12 roots:** loop `CHROMATIC`, assert `notes` for
  each quality (e.g. C major → `['C','E','G']`, A minor → `['A','C','E']`,
  B diminished → `['B','D','F']`, C augmented → `['C','E','G#']`). Verify the
  mod-12 wrap (e.g. A major 5th = E, B major 3rd = `D#`).
- Totality: every (root × quality) returns without throwing; `notes.length === 3`,
  `notes[0] === root`.
- `TRIADS` has exactly the four keys (cheap drift alarm complementing the
  `Record<TriadQuality, …>` compile guard).

**2. Component — `tests/components/ChromaticRuler.test.ts`** (jsdom):
- Renders 12 slot cells; renders exactly `offsets.length` markers with the right
  degree labels.
- Marker positions reflect offsets (assert the `style`/`transform` or a
  `data-offset` attribute = the offset) for each quality's offset set.
- Root marker carries the `note-root` token class, others `note-tone`.
- `reducedMotion={true}` omits the transition class; `false` includes it (assert by
  class presence — the slide gate, deterministic without timing the animation).

**3. Component — `tests/components/ChordBuilder.test.ts`** (jsdom):
- Default renders C major: name `C major`, formula `1-3-5`, notes `C E G`.
- Toggling quality to `min` updates name (`C minor`), formula (`1-♭3-5`), and the
  ruler markers (assert the third marker moved 4→3 via the ruler's `data-offset`).
- Toggling `dim`/`aug` updates accordingly.
- `RootSelector` interaction: selecting a new root updates name/notes.
- **Play calls the player:** inject/stub the note player and assert `playSequence`
  is called with the arpeggio freqs and `playChord` is scheduled — see audio stub
  note. No real audio asserted.

**Audio stubbing.** Other tools' suites do NOT exercise real Web Audio (jsdom has
no AudioContext). Match the existing pattern: stub the player at the boundary —
either inject a fake `NotePlayer` (preferred: add an optional `player?: NotePlayer`
prop to `ChordBuilder` defaulting to `createNotePlayer()`, mirroring
`IntervalTrainer`'s injectable `rng`, so the test passes a spy), or
`vi.mock('$lib/audio/playNote', () => ({ createNotePlayer: () => fakePlayer }))`.
The injectable-prop route is preferred — it is the project's established seam for
deterministic tests and avoids module mocking. Unit tests for `chords.ts` touch no
DOM/audio at all.

## Test / SSR Safety

- `chords.ts` touches no globals — pure string/number functions; node/SSR-safe by
  construction; the bulk of the coverage runs without DOM.
- `ChromaticRuler.svelte` is prop-driven and DOM-only; no `window`/audio access →
  trivially renderable in jsdom.
- `ChordBuilder.svelte` reads `window.matchMedia` guarded
  (`typeof window !== 'undefined' && window.matchMedia?.(…)`), so it degrades to
  `reducedMotion = false` if `matchMedia` is absent. It runs only mounted (client
  `mount`, no SSR pass), matching the documented browser-only touchpoints in the
  routing design.
- `playChord` lazily inits the AudioContext exactly like `playSequence`; never
  called at import; the block timer is cleared on unmount → no use-after-dispose.

## Review Workload / 400-line Budget

Estimated CHANGED lines (new + modified, incl. tests):

| Artifact | Est. lines |
|---|---|
| `src/lib/theory/chords.ts` (types + TRIADS + getTriad) | ~55 |
| `src/lib/components/ChromaticRuler.svelte` | ~70 |
| `src/lib/components/ChordBuilder.svelte` | ~95 |
| `src/lib/audio/playNote.ts` (`playChord` additive method) | ~8 |
| `src/lib/types/chord.ts` (`ViewName` += 1) | ~1 |
| `src/lib/routing.ts` (`VIEW_NAMES` += 1) | ~1 |
| `src/App.svelte` (import + one branch) | ~4 |
| `src/lib/data/tools.ts` (active entry) | ~7 |
| `tests/unit/chords.test.ts` | ~75 |
| `tests/components/ChromaticRuler.test.ts` | ~45 |
| `tests/components/ChordBuilder.test.ts` | ~65 |
| **Total** | **~426** |

This is just over the ~400-line budget, driven almost entirely by tests (~185 test
lines for a strict-TDD feature). **Recommendation: SINGLE PR.** Rationale: the
change is one cohesive, additive feature; production code is ~241 lines; the
overage is test coverage the strict-TDD gate requires. Splitting would either ship
untested theory in PR #1 (violating TDD) or create an artificial seam. If the
delivery strategy forbids exceptions, the only clean split is **PR #1 =
`chords.ts` + its unit tests** (the pure, independently valuable + fully tested
core, ~130 lines) then **PR #2 = ruler + wrapper + integration + component tests**
(~296 lines) — a natural theory-then-UI boundary that keeps each PR green and
TDD-honest. Default recommendation: single PR with a `size:exception` note
(production code well under budget; overage is tests).

TDD order across the work: (1) `chords.test.ts` → `chords.ts`; (2)
`ChromaticRuler.test.ts` → `ChromaticRuler.svelte`; (3) `playChord` test → method;
(4) `ChordBuilder.test.ts` → `ChordBuilder.svelte`; (5) routing/registry edits
(guard + branch + entry), confirm `tsc`/svelte-check + full suite green.

## Risks

- **`VIEW_NAMES` drift from `ViewName`** — STRUCTURALLY PREVENTED by the existing
  compile-time exhaustiveness guard; adding to the union without the array fails
  `tsc` before tests (the proposal's top risk, now a build error).
- **SVG token gotcha** — ELIMINATED by choosing DOM/CSS (ADR-2); there are no SVG
  presentation attributes to mis-token. (The DECISION: DOM/CSS, not SVG.)
- **Reduced-motion not covered by `app.css`** — HANDLED: the ruler gates its OWN
  CSS transition via the `reducedMotion` prop read once in the wrapper; the global
  `@media` block only covers two keyframe classes, so relying on it would have
  missed the slide. Tested by asserting the transition class toggles.
- **Marker slide not animating** — PREVENTED by keying markers on positional index
  (root/third/fifth), not offset value, so the same node animates 4→3 instead of
  being torn down/rebuilt. Load-bearing; called out in ADR-2 and tested.
- **Block chord faked as a stagger** — AVOIDED by the additive `playChord` (ADR-4);
  a real simultaneous strike is the lesson's second half. Small additive change,
  separately tested.
- **Use-after-dispose on the block timer** — PREVENTED by clearing the `setTimeout`
  in the effect teardown alongside `player.dispose()` (mirrors `IntervalTrainer`).
- **Hardcoded colours break rebrand** — AVOIDED by DOM + existing `note-root`/
  `note-tone`/`accent`/`hairline` token utilities only; reviewer checks tokens the
  same way as elsewhere.
- **Line budget ~426 (just over 400)** — production code ~241; overage is TDD
  tests. Mitigation: single PR + `size:exception`, OR the theory-then-UI 2-PR split
  documented above. Flagged for the Review Workload guard.
- **`ChordQuality` accidentally widened** — PREVENTED by ADR-1's separate
  `TriadQuality`; CAGED path untouched and its tests stay green.

## Rollback

The tool is additive. Revert by deleting `src/lib/theory/chords.ts`,
`ChromaticRuler.svelte`, `ChordBuilder.svelte` and their tests; reverting the
`playChord` method in `playNote.ts`; removing `'chord-builder'` from BOTH the
`ViewName` union AND `VIEW_NAMES` (kept in sync so `tsc` passes); dropping the
`App.svelte` branch + import; and removing the `tools.ts` active entry. No shared
module is mutated destructively (`playChord` is purely additive; `ChordQuality`,
CAGED, routing functions untouched), so reverting restores the prior tool set
exactly. The `/chord-builder` analytics path simply stops appearing.
