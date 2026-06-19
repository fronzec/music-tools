# Design: Diatonic Harmonizer — the 7 triads of a major key — v1

## Context

This is a non-SvelteKit Svelte 5 + Vite SPA mounted manually in `src/main.ts`. Tools
are stateful components rendered by a single chokepoint router (`App.svelte` +
`navigate(view)`), each registered in four standard places. This change adds a NEW
top-level tool. It is purely additive: it touches no existing tool's behavior and
mutates no shared theory module — it only CONSUMES the already-shipped triad and
fretboard primitives.

The proposal already decided WHAT and WHETHER (a standalone key-palette tool that
picks a major key, stacks diatonic thirds on each of the 7 scale degrees, and renders
each resulting triad as a card with name, Roman degree, quality, notes, and a
full-neck fretboard). This document designs HOW, against the real code:

- `src/lib/theory/chords.ts` — `TriadQuality` (`'maj'|'min'|'dim'|'aug'`),
  `TRIAD_OFFSETS` (`maj [0,4,7]`, `min [0,3,7]`, `dim [0,3,6]`, `aug [0,4,8]`),
  `TRIAD_DEGREES` (`['1','3','5']`, …), `chordTones(rootPc, offsets)`,
  `chordName(rootName, quality)` (`"C major"` style), and the `Triad` model from
  `getTriad`. These are the offsets, degree labels, note builder, and naming the new
  module reuses. **Note:** only `maj`/`min`/`dim` ever occur in a major scale —
  `aug` is in the `TriadQuality` union but never produced here.
- `src/lib/theory/notes.ts` — `semitoneToNoteName(index)` (wraps mod-12, returns a
  `NoteName`) and `noteNameToSemitone(name)` (`CHROMATIC.indexOf`). The diatonic
  module needs neither directly — it goes through `chordTones`/`getTriad`/`CHROMATIC`
  — but they are the spelling source of truth the whole app shares.
- `src/lib/components/ChordFretboard.svelte` — the REUSED, already-tested
  presentational fretboard. **Exact prop interface:** `{ rootPc: number; offsets:
  readonly number[]; degrees?: readonly string[]; rootName?: string; chordName?:
  string; width?: number }`. It derives `marks = chordPositions(rootPc, offsets)` and
  labels each dot `degrees[degreeIndex]`. The harmonizer passes
  `TRIAD_OFFSETS[quality]` and `TRIAD_DEGREES[quality]` per card.
- `src/lib/components/RootSelector.svelte` — the REUSED selector. **Exact prop
  interface:** `{ notes: NoteName[]; selected: NoteName; onSelect: (n: NoteName) =>
  void; label?: string; size?: 'sm'|'md'; buttonAriaLabel?: (note: NoteName) =>
  string }`. The harmonizer wires it to `CHROMATIC` to pick the major-key root,
  exactly as `ChordBuilder` does.
- `src/lib/components/ChordBuilder.svelte` — the structural template for the new
  wrapper: back button, header, `RootSelector` section, derived state, and reused
  child components. The harmonizer mirrors its layout conventions (`mx-auto`,
  `max-w-*`, `px-4 py-6`, `mb-6` sections, token classes) but is WIDER (7 cards) and
  has NO audio, NO quality toggle, NO ruler.
- `src/lib/types/chord.ts` — `NoteName`, `CHROMATIC` (the 12 roots in order),
  `ViewName` union (gains `'diatonic-harmonizer'`).
- `src/lib/routing.ts` — `VIEW_NAMES` array + a compile-time exhaustiveness guard
  (`_viewNamesExhaustive`) that FAILS `tsc` if the union and the array drift. Adding
  the new view to the union WITHOUT adding it to `VIEW_NAMES` breaks the build — this
  is the proposal's headline risk, mechanically enforced.
- `src/App.svelte` — the chokepoint router: one `{:else if currentView === '…'}`
  branch per tool, each wrapped in `<svelte:boundary failed={errorFallback}>`.
- `src/lib/data/tools.ts` — the home registry. An `active` tool is a discriminated
  union member requiring `status: 'active'`, `view: ViewName`, `title`,
  `description`, `icon`. New entry goes in the `'fretboard-theory'` category.

Stack facts that constrain the design:

- Svelte 5 runes mode; flat `$state`/`$derived`; presentational/stateful split; pure
  theory isolated from components (the project's canonical pattern).
- **SVG token discipline is already handled inside the reused `ChordFretboard`** —
  the harmonizer adds no new SVG, so the "CSS vars don't resolve in SVG attributes"
  gotcha does not re-surface here. Card chrome uses Tailwind token classes
  (`bg-surface-raised`, `border-hairline`, `text-ink`, `text-muted`).
- jsdom test env; unit tests under `tests/unit/`, component tests under
  `tests/components/`. Vitest is installed and green. **Strict TDD is ACTIVE** — test
  runner `npm test -- --run`. `diatonics.ts` is unit-tested BEFORE any UI exists.
- svelte-check: the new tool renders as a child wrapped in `<svelte:boundary>` in
  `App.svelte` (same as every tool), and the harmonizer renders `ChordFretboard` as a
  plain child (no new boundary). No new ErrorBoundary svelte-check error is expected.

## Goals / Non-Goals

Goals (v1):

- A pure, fully unit-tested `src/lib/theory/diatonics.ts` exporting
  `MAJOR_SCALE_INTERVALS`, a `DiatonicTriad` type, and
  `diatonicTriads(root: NoteName): DiatonicTriad[]`. For a well-formed major scale it
  returns 7 triads in degree order whose qualities are DERIVED from scale geometry
  (the fixed `maj, min, min, maj, maj, min, dim` pattern), each carrying its degree,
  Roman label, quality, root pitch class, root name, notes, and human name. Pure,
  total for valid roots, no DOM, no audio.
- A presentational `src/lib/components/DiatonicHarmonizer.svelte` owning ONE `$state`
  (the major-key root), hosting `RootSelector`, deriving the 7 triads via
  `diatonicTriads(root)`, and rendering them as a responsive grid of cards — each card
  showing name, Roman degree, quality, notes, and a `<ChordFretboard>` built from
  `TRIAD_OFFSETS[quality]`/`TRIAD_DEGREES[quality]`.
- Routing/registry integration across the four standard files, with the
  `VIEW_NAMES` exhaustiveness guard satisfied.
- Suite stays green; no new svelte-check errors; semantic tokens only.

Non-Goals (locked, do NOT re-open):

- No minor keys / modes (different quality pattern; deferred — module designed to
  extend, UI not committed).
- No audio / playback anywhere.
- No 7ths / extensions — diatonic TRIADS only.
- No progression building / function labels (tonic/subdominant/dominant) / cadences.
- No enharmonic key-signature spelling — uses the project-wide `semitoneToNoteName`
  spelling, same as every other tool.
- No change to `chords.ts`, `notes.ts`, `ChordFretboard.svelte`, or
  `RootSelector.svelte` — consumed, not modified.

## Decisions

### ADR-1 — `src/lib/theory/diatonics.ts`: a NEW pure module that DERIVES quality from scale geometry, returns a self-describing `DiatonicTriad`, and leaves render-prop sourcing to the component

**Problem.** The module must turn a major-key root into 7 triads such that quality is
a CONSEQUENCE of which scale notes land, not a per-key lookup. It must build each
triad by stacking diatonic thirds inside the scale (not by chromatic offsets), measure
the resulting intervals, classify quality, and label the Roman numeral — all so the
fixed `maj,min,min,maj,maj,min,dim` pattern EMERGES and can be asserted, never
hardcoded per key.

**Decision.** Add a self-contained pure module exporting:

```ts
import { CHROMATIC } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';
import { chordTones, chordName, type TriadQuality } from '$lib/theory/chords';

/** Semitone offsets of the major scale from its root (Ionian). */
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DiatonicTriad {
  /** Scale degree, 1..7 (I..vii°). */
  readonly degree: Degree;
  /** Roman-numeral label, e.g. 'I', 'ii', 'vii°' — derived from quality + degree. */
  readonly roman: string;
  /** 'maj' | 'min' | 'dim' — derived from the two stacked-third gaps. */
  readonly quality: TriadQuality;
  /** Root pitch class of THIS triad, 0..11. */
  readonly rootPc: number;
  /** Root note name of this triad (project-wide spelling). */
  readonly rootName: NoteName;
  /** The three triad note names, root → third → fifth. */
  readonly notes: readonly NoteName[];
  /** Human-readable name, e.g. 'D minor' — reuses chordName(). */
  readonly name: string;
}

export function diatonicTriads(root: NoteName): DiatonicTriad[];
```

**How quality is derived (the load-bearing algorithm).** For each degree index
`i` (0..6), take the three SCALE notes at indices `i`, `i+2`, `i+4` (mod 7), each with
an explicit octave carry so pitches ascend. Concretely, with
`rootPc = CHROMATIC.indexOf(root)` and `scalePc(k) = (rootPc +
MAJOR_SCALE_INTERVALS[k % 7]) % 12`, build three ABSOLUTE semitone values by adding
`+12` whenever the wrapped scale index passes 7 (the octave carry), so the triad is
`[s0, s1, s2]` strictly ascending. Then measure the two gaps `g1 = s1 - s0` and
`g2 = s2 - s1` and classify:

- `g1 === 4 && g2 === 3` → `'maj'`
- `g1 === 3 && g2 === 4` → `'min'`
- `g1 === 3 && g2 === 3` → `'dim'`
- anything else → **throw** (defensive; unreachable for a real major scale).

The triad's own `rootPc` is `s0 % 12`; `notes = chordTones(s0 % 12,
TRIAD_OFFSETS[quality])` — but see the note below on why we DON'T import
`TRIAD_OFFSETS` for notes. **`name = chordName(rootName, quality)`** — reusing the
exact `"<Root> <quality-word>"` formatter so naming stays single-sourced.

**Why measure gaps and throw on the impossible.** Classifying by the two semitone
gaps (4+3 / 3+4 / 3+3) makes the pattern an OBSERVED RESULT, satisfying the "derived,
never hardcoded" success criterion and the "off-by-one mislabels iii/vii°" risk. The
`throw` on an unexpected gap is defensive honesty: it cannot fire for any of the 12
major scales (proven by the all-12-roots test), but it documents that this module
classifies real geometry rather than silently returning a wrong label. `aug` (4+4) is
representable in `TriadQuality` but is NEVER produced by a major scale, so it is not a
branch — an aug gap would (correctly) hit the throw.

**Roman label — DERIVED from quality + degree, not hardcoded.** Build the base numeral
from the degree (`['I','II','III','IV','V','VI','VII'][degree-1]`), then:
`maj` → uppercase as-is; `min` → lowercase; `dim` → lowercase + `'°'`. This yields
`I, ii, iii, IV, V, vi, vii°` as an EMERGENT consequence of the derived qualities, not
an asserted constant. It keeps the module honest (the casing pattern falls out of the
classifier) and is unit-tested.

**Reconciling with `ChordFretboard`'s needs — the component pulls offsets/degrees,
NOT this module.** `ChordFretboard` wants `rootPc`, `offsets`, `degrees`.
`DiatonicTriad` provides `rootPc` and (via `quality`) the KEY into `TRIAD_OFFSETS` /
`TRIAD_DEGREES`. The module deliberately does NOT return `offsets`/`degrees`: those
are RENDER props, and `diatonics.ts` is about THEORY. The component does
`offsets={TRIAD_OFFSETS[t.quality]}` / `degrees={TRIAD_DEGREES[t.quality]}` at the
call site. For the same reason `notes` is computed via `chordTones` (the note
vocabulary) but the fretboard offset/degree tables stay a component-side lookup — one
source of truth (`chords.ts`), zero duplication, and `diatonics.ts` never grows a
rendering concern.

**Purity / totality.** No globals, no DOM, no audio. Deterministic — identical root
→ identical array. Total for every `NoteName` (all 12 map to a real major scale, so
the throw never fires); throws ONLY on a structurally impossible gap, which is the
defensive contract, not an expected runtime path. This is the entire unit-tested
surface.

**Rejected.**

- *Hardcoding the 7 Roman strings (`['I','ii','iii','IV','V','vi','vii°']`)* — the
  pattern is fixed, but hardcoding ASSERTS it instead of letting it EMERGE from the
  classifier. Deriving from quality+degree means the module stays honest: if the
  geometry ever changed, the labels would follow, and the tests prove the emergent
  result equals the known pattern.
- *Hardcoding quality per degree (`['maj','min','min',…]`)* — same objection, and it
  is the exact off-by-one risk the proposal calls out. Measuring gaps is the
  mitigation.
- *Returning `offsets`/`degrees`/render props from the module* — couples pure theory
  to the fretboard's prop contract and duplicates the `chords.ts` tables; the
  component owns presentation sourcing.
- *Computing notes inside the module by hand instead of `chordTones`* — would
  reimplement mod-12 spelling and risk drifting from the app-wide spelling; reusing
  `chordTones` keeps one spelling source.
- *Returning `name` built ad-hoc instead of `chordName()`* — would fork the naming
  convention; reusing `chordName` keeps `"D minor"` identical to Chord Builder.

### ADR-2 — `src/lib/components/DiatonicHarmonizer.svelte`: a stateful wrapper mirroring ChordBuilder, ONE `$state` root + `$derived` triads, rendering a responsive 7-card grid reusing `RootSelector` + `ChordFretboard`

**Decision.** Mirror `ChordBuilder.svelte`'s structure (back button, header,
`RootSelector` section, derived state) but with NO audio, NO quality toggle, NO ruler.
The wrapper owns exactly one piece of state and derives the rest:

```svelte
<script lang="ts">
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';
  import { diatonicTriads } from '$lib/theory/diatonics';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import ChordFretboard from '$lib/components/ChordFretboard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }
  let { navigate }: Props = $props();

  let root = $state<NoteName>('C');
  const triads = $derived(diatonicTriads(root)); // flat $derived, 7 items
</script>
```

**Card render** — one card per derived triad, embedding the reused fretboard with
component-side offset/degree lookup:

```svelte
{#each triads as t (t.degree)}
  <article class="rounded-lg border border-hairline bg-surface-raised p-4">
    <header class="mb-2 flex items-baseline justify-between">
      <span class="font-display text-lg font-bold text-ink">{t.name}</span>
      <span class="font-technical text-sm text-muted">{t.roman}</span>
    </header>
    <div class="mb-1 font-technical text-xs text-muted">{t.quality}</div>
    <div class="mb-3 font-technical text-sm text-muted">
      {#each t.notes as note, i (i)}
        <span class="ml-1 font-semibold text-ink">{note}</span>
        {#if i < t.notes.length - 1}<span class="text-muted"> –</span>{/if}
      {/each}
    </div>
    <ChordFretboard
      rootPc={t.rootPc}
      offsets={TRIAD_OFFSETS[t.quality]}
      degrees={TRIAD_DEGREES[t.quality]}
      rootName={t.rootName}
      chordName={t.name}
    />
  </article>
{/each}
```

**Layout (the main visual risk — kept simple, polish deferred to apply).** Seven
full-neck fretboards are wide. Decision: a responsive CSS grid that is single-column
on small screens and widens on larger ones, e.g. `grid gap-4 sm:grid-cols-2
xl:grid-cols-3` (or a 1→2 step if 3 columns crowd the necks), inside a generous page
container (`mx-auto max-w-6xl px-4 py-6`) — WIDER than ChordBuilder's `max-w-2xl`
because the content is a grid, not a single column. Cards keep degree order I→vii°
because `diatonicTriads` returns them ordered and the key is `t.degree`. Exact
breakpoint counts and spacing are an apply-time refinement; the design fixes the
SHAPE (responsive grid, degree-ordered, token-styled cards) and leaves pixel polish to
tasks.

**No new state owner beyond `root`.** Changing the root re-derives `triads` → each
card's `rootPc`/`quality` props change → each `ChordFretboard` re-derives its marks →
all 7 necks re-light. No effects, no handlers beyond `RootSelector`'s `onSelect` and
the back button — the canonical flat-runes presentational/stateful split.

**Tokens only.** Card chrome and text use semantic token classes; the only SVG is
inside the reused `ChordFretboard`, which already enforces class-based fills. No
hardcoded colors are introduced here.

**Rejected.**

- *A mode inside Chord Builder* — rejected at proposal level (different question:
  root-relative single chord vs key-relative fixed palette); folding it in would
  overload Chord Builder's single responsibility. Standalone tool per Screaming
  Architecture.
- *Storing the 7 triads in `$state` and mutating on select* — they are a pure
  function of `root`; `$derived` is the correct rune (the "use `$derived` not
  `$effect` for derived values" best practice).
- *Passing `offsets`/`degrees` down from the theory module* — see ADR-1; the
  component sources them from `TRIAD_OFFSETS`/`TRIAD_DEGREES` to keep theory pure.
- *A bespoke per-card fretboard* — `ChordFretboard` already renders exactly this
  given `rootPc` + offsets + degrees; reuse wholesale.

### ADR-3 — Routing/registry integration across the four standard files, exhaustiveness guard satisfied

**Decision.** Register the tool in the four canonical places, in this order so `tsc`
never sees a half-wired state:

1. `src/lib/types/chord.ts` — add `'diatonic-harmonizer'` to the `ViewName` union.
2. `src/lib/routing.ts` — add `'diatonic-harmonizer'` to `VIEW_NAMES`. **REQUIRED**:
   without this, `_viewNamesExhaustive`'s `_UnionIsSubsetOfArray` becomes non-`never`
   and FAILS `tsc`. Adding it satisfies the guard; `viewToPath`/`pathToView` then
   route `/diatonic-harmonizer` automatically (no per-tool code there).
3. `src/App.svelte` — import `DiatonicHarmonizer` and add an
   `{:else if currentView === 'diatonic-harmonizer'}` branch wrapped in
   `<svelte:boundary failed={errorFallback}>`, identical in shape to the
   `chord-builder` branch, passing `{navigate}`.
4. `src/lib/data/tools.ts` — add an `active` entry in the `'fretboard-theory'`
   category, alongside Chord Builder:

   ```ts
   {
     status: 'active',
     view: 'diatonic-harmonizer',
     title: 'Diatonic Harmonizer',
     description: "See a major key's 7 diatonic triads and the chords that belong to it",
     icon: '🔑', // implementation used 🔑 (🎼 was already claimed by Scales Explorer)
   }
   ```

**Why this order.** The union edit (1) makes the new view nameable; the `VIEW_NAMES`
edit (2) immediately re-greens the exhaustiveness guard; the router branch (3) and
registry entry (4) make it reachable and discoverable. The `/diatonic-harmonizer`
Vercel Analytics pageview is automatic — no extra work. This is the same 4-place
registration every active tool already follows.

**Rejected.**

- *Skipping `VIEW_NAMES` and relying on a runtime default* — the guard would fail
  `tsc`; this is the proposal's headline risk and is mechanically prevented.
- *A bespoke route path* — `viewToPath` derives `/diatonic-harmonizer` from the view
  name; no custom path mapping needed or wanted.

## Architecture / Data Flow

```
  src/lib/theory/diatonics.ts  (PURE, total for valid roots, unit-tested FIRST)
     diatonicTriads(root: NoteName) -> DiatonicTriad[7]
       for degree i in 0..6:
         build 3 scale notes at indices i, i+2, i+4 (mod 7) with octave carry
           s0,s1,s2 = ascending absolute semitones
         g1 = s1-s0 ; g2 = s2-s1
         quality = 4+3->maj | 3+4->min | 3+3->dim | else throw
         roman   = numeral(degree) cased by quality (+ '°' for dim)
         notes   = chordTones(s0 % 12, TRIAD_OFFSETS[quality])
         name    = chordName(rootName, quality)
                                   |
                                   v
  DiatonicHarmonizer.svelte  (STATEFUL wrapper)
     root: $state<NoteName> = 'C'
        |
        v
     triads = $derived(diatonicTriads(root))   // 7 DiatonicTriad, degree-ordered
        |
   +----+--------------------------------+
   v                                     v
 RootSelector (set root)        {#each triads as t (t.degree)}  -> 7 cards
 notes=CHROMATIC                  card: name, roman, quality, notes
                                        <ChordFretboard
                                          rootPc={t.rootPc}
                                          offsets={TRIAD_OFFSETS[t.quality]}
                                          degrees={TRIAD_DEGREES[t.quality]}
                                          rootName={t.rootName}
                                          chordName={t.name} />
                                            |
                                            v
                                  marks = $derived(chordPositions(rootPc, offsets))
                                    -> full-neck SVG (already tested)
```

Data flow:

1. **Selection.** User picks a major-key root via `RootSelector` → `root` `$state`
   updates → `triads` re-derives purely (7 fresh `DiatonicTriad`).
2. **Card render.** Each card reads its triad's `name`/`roman`/`quality`/`notes` and
   passes `rootPc` + `TRIAD_OFFSETS[quality]` + `TRIAD_DEGREES[quality]` into the
   reused `ChordFretboard`, which re-derives its own marks and re-lights that neck.
3. **No audio, no animation, no shared mutation.** The tool is read-only and visual;
   it consumes `chords.ts`/`ChordFretboard`/`RootSelector` without changing them.

## Integration Points

- **Reuses (unchanged):** `TRIAD_OFFSETS`, `TRIAD_DEGREES`, `TriadQuality`,
  `chordTones`, `chordName` (`chords.ts`); `CHROMATIC`, `NoteName`, `ViewName`
  (`types/chord.ts`); `semitoneToNoteName` (transitively via `chordTones`);
  `RootSelector.svelte`; `ChordFretboard.svelte` (and its tested
  `chordPositions`/`layout.ts` internals); `viewToPath`/`pathToView` (`routing.ts`).
- **New pure module (the unit-tested surface):** `src/lib/theory/diatonics.ts`.
- **New component:** `src/lib/components/DiatonicHarmonizer.svelte` (presentational).
- **Modified (registration only, additive):** `src/lib/types/chord.ts` (union),
  `src/lib/routing.ts` (`VIEW_NAMES`), `src/App.svelte` (one boundary branch + import),
  `src/lib/data/tools.ts` (one `active` entry).
- **Untouched:** `chords.ts`, `notes.ts`, `ChordFretboard.svelte`,
  `RootSelector.svelte`, every other tool, audio, the visual skin.

## Testing Strategy (file placement, strict TDD order)

Strict TDD: write the failing test, then the minimal code, bottom-up. Theory FIRST,
before any UI exists.

**1. Unit (pure, the bulk of coverage) — `tests/unit/theory/diatonics.test.ts`
(FIRST):** (placed beside the other theory unit tests)

- **Shape / smoke:** `diatonicTriads('C')` returns exactly 7 items, degrees `1..7`
  ascending; each item has the `DiatonicTriad` keys with correct types
  (`rootPc` ∈ [0,11], `notes.length === 3`).
- **C-major exact answers:** roots `C D E F G A B`; notes `C E G`, `D F A`, `E G B`,
  `F A C`, `G B D`, `A C E`, `B D F` — the known diatonic triads, proving the
  octave-carry third-stacking wraps the scale correctly.
- **Fixed quality pattern across ALL 12 roots:** for every `NoteName` in `CHROMATIC`,
  `triads.map(t => t.quality)` deep-equals `['maj','min','min','maj','maj','min',
  'dim']`. This is the headline success criterion — derived, asserted for all keys.
- **Roman labels:** `triads.map(t => t.roman)` deep-equals
  `['I','ii','iii','IV','V','vi','vii°']` for representative roots (e.g. C, G, F#),
  proving casing + `°` derive from quality.
- **`name` reuses `chordName`:** e.g. C-major degree 2 `name === 'D minor'`, degree 7
  `name === 'B diminished'` — single-sourced naming.
- **Determinism:** `diatonicTriads('C')` deep-equals a second call (`toEqual`).
- **Defensive throw is unreachable in practice:** assert no `NoteName` throws (all 12
  iterate cleanly); the throw branch is documented, not a runtime path.

**2. Component — `tests/components/DiatonicHarmonizer.test.ts`** (jsdom, mirror the
`ChordBuilder.test.ts` pattern — lazy import after stubs, `render`, `screen`,
`fireEvent`, `vi.fn()` navigate):

- Renders without throwing; shows 7 `ChordFretboard` `role="img"` diagrams for the
  default C major (`screen.getAllByRole('img').length === 7`).
- Shows the 7 chord names and Roman labels for C major in degree order (e.g. text
  `Dm`/`D minor`, `vii°` present).
- **Reactivity:** selecting a different root via the `RootSelector` button updates the
  rendered names/labels (e.g. pick `G` → first card name reflects `G major`),
  proving the `$derived` re-runs and re-renders the grid.
- Back button calls `navigate('home')`.

No audio is touched anywhere (the tool has none, so no AudioContext stub is needed —
unlike `ChordBuilder.test.ts`). The unit tests touch no DOM.

## Review Workload / 400-line Budget

Estimated CHANGED lines (new + modified, incl. tests):

| Artifact | Est. lines |
|---|---|
| `src/lib/theory/diatonics.ts` (consts + type + `diatonicTriads`) | ~70 |
| `src/lib/components/DiatonicHarmonizer.svelte` (wrapper + card grid) | ~75 |
| `src/lib/types/chord.ts` (union member) | ~1 |
| `src/lib/routing.ts` (`VIEW_NAMES` member) | ~1 |
| `src/App.svelte` (import + boundary branch) | ~5 |
| `src/lib/data/tools.ts` (one `active` entry) | ~7 |
| `tests/unit/theory/diatonics.test.ts` | ~90 |
| `tests/components/DiatonicHarmonizer.test.ts` | ~70 |
| **Total** | **~319** |

Comfortably under the ~400-line budget; production code is ~159 lines, the rest is
TDD coverage. **Recommendation: SINGLE PR.** The change is one cohesive, additive
feature (pure module + presentational component + standard 4-place registration);
there is no clean seam that would keep each split green without shipping untested
theory.

**Review Workload Forecast:** Chained PRs recommended: No. 400-line budget risk: Low.
Estimated changed lines: ~319. Decision needed before apply: No.

TDD order across the work: (1) `diatonics.test.ts` → `diatonics.ts`;
(2) registration (union → `VIEW_NAMES` → `App.svelte` → `tools.ts`) to keep `tsc`
green; (3) `DiatonicHarmonizer.test.ts` → `DiatonicHarmonizer.svelte`; (4) confirm
`tsc`/svelte-check + full suite green.

## Risks

- **Forgetting `VIEW_NAMES` after the union edit** — AVOIDED by the compile-time
  exhaustiveness guard in `routing.ts` (fails `tsc`); registration order adds it
  immediately after the union.
- **Quality classification off-by-one (iii / vii°)** — PREVENTED by measuring the two
  semitone gaps (4+3 / 3+4 / 3+3) on the octave-carried stacked thirds, never
  hardcoding per index; the full `maj,min,min,maj,maj,min,dim` pattern is asserted for
  ALL 12 roots.
- **Roman casing / symbol wrong (`vii°` vs `VII`)** — PREVENTED by deriving casing and
  the `°` suffix from the (already-derived) quality; unit-tested as a full array.
- **Octave carry stacks thirds wrong** — PREVENTED by building from scale indices
  `i, i+2, i+4` mod 7 with explicit `+12` carry into ascending absolute semitones;
  tested against known C-major answers (`C E G` … `B D F`).
- **7 full-neck fretboards look cluttered** — MITIGATED by reusing the compact
  `ChordFretboard` in a responsive grid (1→2→3 columns); the SHAPE is decided here,
  pixel polish deferred to apply.
- **Enharmonic spelling "wrong" to a strict eye** — OUT of scope for v1; uses the
  app-wide `semitoneToNoteName` spelling via `chordTones`, documented deferral.
- **Scope creep (minor keys / modes / 7ths / audio / progressions)** — all explicitly
  out; the quality classifier generalizes, so the module extends later without
  committing UI now.
- **New svelte-check error from a boundary** — AVOIDED: `App.svelte` wraps the tool in
  `<svelte:boundary>` like every tool, and the harmonizer renders `ChordFretboard` as
  a plain child (no new boundary).

## Rollback

Fully additive. Revert by deleting `src/lib/theory/diatonics.ts`,
`src/lib/components/DiatonicHarmonizer.svelte`, and their tests; removing
`'diatonic-harmonizer'` from the `ViewName` union AND from `VIEW_NAMES` (kept in sync
so `tsc` passes); dropping the `App.svelte` boundary branch + import; and removing the
`tools.ts` registry entry. No shared module is mutated (`chords.ts`, `notes.ts`,
`ChordFretboard.svelte`, `RootSelector.svelte`, routing plumbing all consumed only),
so reverting restores the prior tool set exactly. The `/diatonic-harmonizer` analytics
path simply stops appearing.
