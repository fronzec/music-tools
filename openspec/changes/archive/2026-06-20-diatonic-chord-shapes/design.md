# Design: Diatonic Harmonizer Open-Position Chord Shapes

> Primary record: engram `sdd/diatonic-chord-shapes/design`. This file mirrors it for the hybrid trail.
> Phase: design (the technical HOW). Reads proposal + exploration + real code. Does NOT define tasks.

## Architecture overview

Three new, layered, side-effect-free units plus one additive wiring edit. The layering mirrors
the project's existing screaming-architecture split between **theory** (pure data + geometry) and
**components** (presentational SVG):

```
src/lib/theory/openVoicings.ts   (pure data + lookup)   ─┐
src/lib/theory/shapeLayout.ts    (pure geometry)        ─┤→ ChordShapeDiagram.svelte (presentational)
src/lib/theory/chords.ts (existing role math source)    ─┘            │
                                                                       ▼
                                            DiatonicHarmonizer.svelte (wiring, no new state)
```

Data flow per chord card:
`root: NoteName + degree: Degree` → `getOpenVoicing()` → `OpenVoicing` →
`ChordShapeDiagram` derives per-string role via `STANDARD_TUNING` + absolute frets →
`shapeLayout` pure fns place every element → SVG with token-only colors and `data-*` test hooks.

The correctness test sits across the data layer and the existing `diatonicTriads()` source of truth,
so authoring errors cannot ship.

## Confirmed real signatures (verified against source — nothing invented)

- `src/lib/types/chord.ts`: `type NoteName` (12 sharp-spelled names), `CHROMATIC: NoteName[]`,
  `STANDARD_TUNING: number[] = [4,9,2,7,11,4]` (low E idx 0 → high e idx 5, pitch classes).
- `src/lib/theory/chords.ts`: `type TriadQuality = 'maj'|'min'|'dim'|'aug'`,
  `TRIAD_OFFSETS: Record<TriadQuality, readonly [0, number, number]>`.
- `src/lib/theory/diatonics.ts`: `type Degree = 1|2|3|4|5|6|7`,
  `interface DiatonicTriad { degree, roman, quality, rootPc, rootName, notes, name }`,
  `diatonicTriads(root: NoteName): DiatonicTriad[]` (exactly 7, degree order).
- `src/lib/theory/tuning.ts` re-exports `STANDARD_TUNING` from `$lib/types/chord` — single source of truth.
- `src/lib/theory/layout.ts`: `L` constants (`STRING_SP=26`, `FRET_SP=50`, `NUT_W=6`, `TOP_PAD=28`,
  `ROOT_R=11`, `TONE_R=8`, `BARRE_H=5`, `LABEL_FS=10`), pure fns `stringY`, `fretLineX`, `noteX`,
  `viewBoxW`, `viewBoxH`. Built for a 14-fret neck and shared by 5 components — **do NOT touch.**
- `src/lib/components/Fretboard.svelte` (CAGED prior art): proves the `baseFret`/barre/`Nfr`-label
  pattern. `isBarre = baseFret > 0`; barre label `{baseFret}fr` via `<text class="fill-muted">`;
  thick nut vs thin top line driven by `isBarre`. We mirror the *convention*, not the code.
- Tailwind tokens confirmed in `tailwind.config.js` lines 26-28: `note-root`, `note-third`,
  `note-tone` → `fill-note-root` / `fill-note-third` / `fill-note-tone` all valid.

## ADR-1 — Voicing data model: absolute frets keyed by NoteName → Degree

**Decision.** `openVoicings.ts` stores 84 hand-authored voicings as a
`Record<NoteName, readonly OpenVoicing[]>` where the inner array is exactly 7 entries in
degree order (index 0 = degree 1 = I … index 6 = degree 7 = vii°). Frets are **absolute**
(0 = open, >0 = real fret number, `null` = muted), low E → high e, parallel to `STANDARD_TUNING`.

```ts
// src/lib/theory/openVoicings.ts
import type { NoteName } from '$lib/types/chord';
import type { TriadQuality } from '$lib/theory/chords';
import type { Degree } from '$lib/theory/diatonics';

/** A single string's fret: null = muted (×), 0 = open (O), >0 = absolute fretted note. */
export type StringFret = number | null;

/** Fretting-hand finger; null where no finger is needed (open/muted). */
export type Finger = 1 | 2 | 3 | 4 | null;

/** A barre spanning a contiguous string range at one absolute fret. */
export interface BarreSpec {
  fret: number;        // absolute fret of the barre
  fromString: number;  // 0..5 inclusive, low side
  toString: number;    // 0..5 inclusive, high side (>= fromString)
}

export interface OpenVoicing {
  roman: string;                                 // e.g. 'I', 'ii', 'vii°' — mirrors DiatonicTriad.roman
  name: string;                                  // e.g. 'C major' — mirrors DiatonicTriad.name
  quality: TriadQuality;                         // 'maj' | 'min' | 'dim'
  rootPc: number;                                // 0..11 — the triad root pitch class
  frets: readonly [StringFret, StringFret, StringFret, StringFret, StringFret, StringFret];
  fingers: readonly [Finger, Finger, Finger, Finger, Finger, Finger];
  barre?: BarreSpec;                             // present only for barre/movable shapes
  baseFret: number;                              // 1 = open position (thick nut); >1 = window start (Nfr label)
}

export type OpenVoicingMap = Record<NoteName, readonly OpenVoicing[]>;

export const OPEN_VOICINGS: OpenVoicingMap;      // 12 keys × 7 voicings = 84 entries

/** Throws a descriptive Error if the key/degree pair has no authored voicing. */
export function getOpenVoicing(keyRoot: NoteName, degree: Degree): OpenVoicing;
```

`getOpenVoicing` implementation contract: look up `OPEN_VOICINGS[keyRoot]`; if missing throw
`No voicings authored for key "${keyRoot}"`; index `[degree - 1]`; if undefined throw
`No voicing for ${keyRoot} degree ${degree}`. Total elsewhere (no silent `undefined`).

**Why absolute frets.** Role derivation collapses to one line —
`pc = (STANDARD_TUNING[i] + frets[i]) % 12` — with zero baseFret arithmetic. This is the same
invariant `chordFretboard.ts` and `diatonicTriads()` already rely on, so the correctness test can
compare played PCs against `diatonicTriads(root)[degree-1].notes` directly. (The CAGED `ChordShape`
uses *relative* frets + `absFret()`; we deliberately diverge because we own the data and absolute
frets remove a whole class of off-by-baseFret bugs.)

**Why mirror `roman`/`name`/`quality`/`rootPc` into the voicing.** The component stays purely
presentational and needs no second theory call; the correctness test asserts these fields agree
with `diatonicTriads()`, catching copy-paste drift in the data.

**Rejected.** (a) Relative-fret + baseFret like CAGED — reintroduces `absFret()` math the
correctness test would have to mirror. (b) Algorithmic transpose of natural keys for sharps
(Option B from exploration) — vii° and many open shapes have no clean movable equivalent; silent
failure mode. (c) Storing role/degree-index per string in the data — redundant; role is a pure
function of tuning+fret+rootPc and is better derived once, tested once.

## ADR-2 — Role-derivation helper: shared pure function in `chords.ts`-adjacent theory, not the component

**Decision.** The semitone→role mapping lives as a small **exported pure function in
`openVoicings.ts`** (co-located with the data it serves), NOT inline in the Svelte component and
NOT in shared `chords.ts`:

```ts
// src/lib/theory/openVoicings.ts
export type VoicingRole = 'root' | 'third' | 'fifth';

/** Pure: classifies a played pitch class against the triad root.
 *  semis = (pc - rootPc + 12) % 12 → 0=root; 3|4=third; 6|7=fifth (dim 5th = 6).
 *  Returns null for any pc that is not a triad tone (correctness test forbids these). */
export function voicingRole(pc: number, rootPc: number): VoicingRole | null {
  const semis = (((pc - rootPc) % 12) + 12) % 12;
  if (semis === 0) return 'root';
  if (semis === 3 || semis === 4) return 'third';
  if (semis === 6 || semis === 7) return 'fifth';
  return null;
}
```

**Why here and not in `chords.ts`.** `chords.ts` is shared by ChordBuilder/CAGED and must stay
untouched per the regression guard. `voicingRole` is specific to this feature's three-role coloring
(root/third/fifth), distinct from `chordFretboard.ts`'s binary `root|tone`. Co-locating with
`openVoicings` keeps the new capability self-contained and independently testable, and lets the same
function back both the component render and the correctness test (single source of truth for role).

**Why not inline in the component.** Pure logic in a `.svelte` file is hard to unit-test in
isolation; extracting it makes RED→GREEN trivial and keeps the component presentational.

Token mapping (component-local, trivial): `root→fill-note-root`, `third→fill-note-third`,
`fifth→fill-note-tone`. Matches the existing legend chips in `DiatonicHarmonizer.svelte`
(R = note-root, 3 = note-third, 5 = note-tone).

## ADR-3 — `shapeLayout.ts` is a separate geometry module, independent of `layout.ts`

**Decision.** New module `src/lib/theory/shapeLayout.ts` with its own constants and pure functions:

```ts
// src/lib/theory/shapeLayout.ts
export const SL = {
  STRING_SP: 22,     // tighter than L.STRING_SP=26 — compact card diagram
  FRET_SP: 28,       // far tighter than L.FRET_SP=50 (14-fret neck) — ~5-fret window
  TOP_PAD: 20,
  BOTTOM_PAD: 12,
  LEFT_GUTTER: 22,   // column for O/× markers + Nfr label, left of the nut
  NAME_COL_W: 26,    // right column for the note-name letters
  NUT_W: 5,          // thick nut when baseFret === 1
  WINDOW_FRETS: 5,   // visible fret columns
  DOT_R: 8,          // finger dot radius
  LABEL_FS: 10,
} as const;

/** Y of string i; 0 = low E at bottom, 5 = high e at top (tablature convention, same as layout.ts). */
export function slStringY(i: number): number;
/** X of fret LINE f within the window (f = 0 is the nut / window start). */
export function slFretLineX(f: number): number;
/** X of a note CENTER on absolute fret `absFret`, given the window starts at `baseFret`.
 *  Open notes (absFret === 0) sit in the gutter; fretted notes sit mid-cell at (absFret - baseFret). */
export function slNoteX(absFret: number, baseFret: number): number;
/** Total viewBox width: LEFT_GUTTER + nut + WINDOW_FRETS*FRET_SP + NAME_COL_W. */
export function slViewBoxW(): number;
/** Total viewBox height: TOP_PAD + 5*STRING_SP + BOTTOM_PAD. */
export function slViewBoxH(): number;
```

**baseFret window shift.** `slNoteX(absFret, baseFret)` maps an absolute fret into the visible
window by computing the relative column `absFret - baseFret` (0-based within the window) and centering
the dot at `slFretLineX(rel) + FRET_SP/2`. For `baseFret === 1` (open position) absolute fret 1 lands
in window column 0. For `baseFret === 5` (a barre shape) absolute fret 5 lands in column 0, fret 9 in
column 4. Open strings (`absFret === 0`) are NOT placed by `slNoteX`; they render as O badges in the
left gutter. The window is fixed at `WINDOW_FRETS = 5` columns regardless of voicing, so all 84
diagrams share one footprint and the card grid stays uniform.

**Why separate from `layout.ts`.** (1) `layout.ts` is dimensioned for a 14-fret full neck
(`FRET_SP=50`, `viewBoxW(14)`); reusing it would force a wrong-scale diagram or risky parameterization
of a module 5 other components depend on — exactly the regression surface the proposal forbids.
(2) `noteX(absFret, rangeStart)` in `layout.ts` assumes a left nut at `LEFT_PAD + NUT_W`; our diagram
needs a left **gutter** for O/× before the nut and a **right name column**, a different coordinate
frame. (3) Isolation keeps the rollback story clean: delete the file, nothing else moves. The cost —
a second small geometry module — is intentional and cheap; the alternative couples a hot shared module
to a new feature.

**Rejected.** Extending `layout.ts` with diagram-mode flags — violates the untouched-`layout.ts`
constraint and the open/closed principle for a widely-shared module.

## ADR-4 — `ChordShapeDiagram.svelte`: presentational, role-derived at render, token-only

**Props (typed via `interface Props` + `$props()`, matching house style):**

```ts
interface Props {
  voicing: OpenVoicing;   // the authored shape
  rootPc: number;         // triad root pitch class (from DiatonicTriad.rootPc) for role math
  chordName?: string;     // e.g. 'C major' for aria/title; falls back to voicing.name
}
```

No `$state` (purely derived). All geometry from `shapeLayout`; all role colors from `voicingRole`.

**SVG structure (top → bottom of z-order):**
1. `<svg role="img" aria-label viewBox="0 0 {slViewBoxW()} {slViewBoxH()}">` with `<title>`/`<desc>`.
2. **Nut vs baseFret indicator** — `isOpen = voicing.baseFret === 1`. If open: thick nut line
   (`SL.NUT_W` width, `stroke-muted`). If `baseFret > 1`: thin top line + `{baseFret}fr` label in the
   left gutter beside the top of the window (`<text class="fill-muted">`), mirroring `Fretboard.svelte`.
   Carries `data-base-fret={voicing.baseFret}`.
3. **String lines** (6, horizontal) and **fret lines** (`WINDOW_FRETS + 1`, vertical).
4. **O / × gutter badges** — per string i: `frets[i] === 0` → `O` (`data-open` on its `<g>`/text);
   `frets[i] === null` → `×` (`data-muted`). Positioned in `SL.LEFT_GUTTER`. Token/`currentColor`
   text only — never `fill="white"` (the existing ChordFretboard test forbids it; we adopt the same rule).
5. **Barre rect** — when `voicing.barre` present: a rounded rect spanning
   `slStringY(barre.fromString)`..`slStringY(barre.toString)` at `slNoteX(barre.fret, baseFret)`,
   `class="fill-note-root" opacity="0.75"` (same treatment as `Fretboard.svelte`). Carries `data-barre`.
6. **Finger dots** — per played fretted string (`frets[i] != null && frets[i] > 0`):
   `pc = (STANDARD_TUNING[i] + frets[i]) % 12`; `role = voicingRole(pc, rootPc)`;
   circle `class="fill-{role→token}"`, `data-role={role}`, `data-string={i}`; finger number text
   (`fingers[i]`) centered, `class="fill-ink"`.
7. **Note-name column** (right) — per played string: the note letter
   `CHROMATIC[pc]`, colored by the same role token, vertically aligned to `slStringY(i)`,
   `data-name-col` on the group.

**Role + note-name per string (single derivation, used by dots and name column):**
```ts
// inside component, derived list
const perString = $derived(
  voicing.frets.map((f, i) => {
    if (f === null) return { i, kind: 'muted' as const };
    if (f === 0)    return { i, kind: 'open'  as const, /* role of open string */ };
    const pc = (STANDARD_TUNING[i] + f) % 12;
    return { i, kind: 'fretted' as const, fret: f, pc, role: voicingRole(pc, rootPc) };
  }),
);
```
Open strings (f === 0) also have a pitch class `STANDARD_TUNING[i]` and therefore a role + name; they
get an O badge in the gutter AND a colored note letter in the name column (no dot on the neck).

**`data-*` test hooks (the component's contract surface):**
`data-role` (root|third|fifth on each played dot/name), `data-string` (0..5), `data-open`,
`data-muted`, `data-barre`, `data-base-fret`. These let the component test assert counts and roles
without snapshotting SVG paths — same philosophy as the existing `ChordFretboard` test.

**Token-only color rule.** Every colored element uses a `fill-note-*` / `fill-ink` / `stroke-muted`
class. No `#rrggbb`, `rgb(`, `hsl(`, or `fill="white"` anywhere in the SVG — enforced by a test that
greps `container.innerHTML` (copying the existing ChordFretboard test assertion verbatim).

## ADR-5 — Wiring into `DiatonicHarmonizer.svelte` (additive, no new state)

Inside the existing `{#each triads as t (t.degree)}` card, in the slot the fretboard vacated
(after `data-construction-stack`), add:

```svelte
{@const voicing = getOpenVoicing(root, t.degree)}
<ChordShapeDiagram {voicing} rootPc={t.rootPc} chordName={t.name} />
```

Plus two imports (`getOpenVoicing`, `ChordShapeDiagram`). `root` is the existing single `$state`;
`t.rootPc`/`t.degree`/`t.name` already come from `diatonicTriads()`. The `lg:grid-cols-2` card grid
is unchanged — decision 4 honored (no forced 7-in-a-row). This is the ONLY edit to an existing file.

## Test strategy (Strict TDD — runner `npx vitest run`, RED→GREEN per module)

Order follows the dependency graph so each module is green before its consumer is written.

**1. `shapeLayout` pure-function tests** — `tests/unit/theory/shapeLayout.test.ts` (first; no deps).
Mirror `tests/unit/theory/layout.test.ts`: assert `SL` constants, `slStringY(0)`/`slStringY(5)`
ordering (low E bottom), `slFretLineX` monotonic, `slNoteX(5,5)` == column 0 center, `slNoteX(9,5)`
== column 4 center, `slViewBoxW`/`slViewBoxH` arithmetic. RED: import fails. GREEN: implement `SL` + fns.

**2. The 84-voicing correctness test (THE GATE)** — `tests/unit/theory/openVoicings.test.ts`.
For every `key ∈ CHROMATIC` and every `degree ∈ 1..7`:
- `const triad = diatonicTriads(key)[degree - 1]; const v = getOpenVoicing(key, degree);`
- **Subset:** every played PC `(STANDARD_TUNING[i] + frets[i]) % 12` (frets[i] != null) is in
  `triad.notes` mapped to PCs (`triad.notes` are NoteNames → `CHROMATIC.indexOf`). No out-of-chord tones.
- **Root present:** at least one played PC === `triad.rootPc`.
- **Min strings:** `≥ 3` strings played (frets[i] != null).
- **Metadata agreement:** `v.quality === triad.quality`, `v.rootPc === triad.rootPc`,
  `v.roman === triad.roman`, `v.name === triad.name`.
- **Role totality:** `voicingRole(pc, v.rootPc)` is non-null for every played string.
- **baseFret sanity:** `v.baseFret >= 1`; if `baseFret === 1` no barre required; if a `barre` exists,
  `fromString <= toString` and `barre.fret >= baseFret`.
Plus: `getOpenVoicing` throws on an unauthored degree (use a temporary spy/edge or assert all 84
exist so the throw path is documented). This test is RED until the data exists and stays the ship gate.

**3. `voicingRole` unit test** — small table test (0→root, 3/4→third, 6/7→fifth, others→null).
Can live in the same `openVoicings.test.ts` file. Written RED before the helper.

**4. Component render tests** — `tests/components/ChordShapeDiagram.test.ts`.
Reuse the exact harness from `ChordFretboard.test.ts` (`vi.mock('$lib/audio/playNote', …)`, lazy
`importComponent`, `@testing-library/svelte` `render`). Drive it with C major degree 1
(`getOpenVoicing('C', 1)`) and a sharp-key barre voicing:
- `role="img"` exists with non-empty `aria-label` containing the chord name.
- `[data-role]` count equals played-string count; per-role counts match `voicingRole` over the voicing.
- `data-base-fret` present and equals `voicing.baseFret`.
- O/× hooks: `[data-open]`/`[data-muted]` counts match the voicing's 0/null strings.
- A barre voicing renders `[data-barre]`; an open voicing does not.
- Token-only assertion: no `#`, `rgb(`, `hsl(`, `fill="white"` in `container.innerHTML` (verbatim
  from the ChordFretboard test).
- Note-name column contains the expected letters for C major degree 1.

**5. Regression run** — `npx vitest run` whole suite green, especially the untouched
`tests/components/ChordFretboard.test.ts`, `ChordBuilder.test.ts`, `tests/unit/theory/layout.test.ts`,
`DiatonicHarmonizer.test.ts`.

## Authoring plan for the 84 voicings (sequence)

Author **one key at a time, run the correctness test after each key**, never batch-enter blind:
1. **Natural keys first** — C, G, D, A, E, F (mostly open shapes, lowest authoring risk; well-known
   method-book voicings; vii° as a partial 3-4 string diminished shape).
2. **Flat-spelled-as-sharp keys** — A#, D#, G# (these are the project's sharp spellings of Bb, Eb, Ab;
   barre/movable shapes via `baseFret`).
3. **Sharp keys** — C#, F#, B (barre shapes; `baseFret > 1`, with `barre` specs and `Nfr` labels).
General rule per voicing (decision 3): lowest practical open/barre position, most common pedagogical
shape, prefer 6 strings but allow muted; vii° (decision 2) may be a partial 4-string shape, may be
non-root-position, as long as the root PC is present and all played notes are chord tones.

## ADR-6 — Size exceeds the 400-line budget → chained PRs (flagged for the tasks phase)

84 voicings (~6 lines each ≈ 500+ data lines) + the component + `shapeLayout` + two test files will
**far exceed the 400-line review budget**. This is a tasks/apply-gate decision, not a design decision,
but the design MANDATES the split shape so tasks can plan it:

- **PR1 — infrastructure + first key (vertical slice):** `shapeLayout.ts` + its test (GREEN),
  `openVoicings.ts` types + `voicingRole` + `getOpenVoicing` + **C major only** (7 voicings),
  the correctness test (passing for the authored subset), `ChordShapeDiagram.svelte` + its component
  test, and the `DiatonicHarmonizer` wiring. This proves the whole pipeline end-to-end at small size.
- **PR2..N — voicing data batches:** add remaining keys in the authoring-sequence order, a few keys
  per PR, each PR re-running and extending the correctness test until all 84 are green. Pure additive
  data; trivial review per PR.

The tasks phase MUST load the chained-PR skill and produce this PR boundary plan. The correctness test
in PR1 must be written so it asserts over *authored* keys (or skips unauthored ones explicitly) so the
suite is green at every PR boundary — never red between PRs.

## ADR-7 — Regression safety for untouched modules

Guarantees, by construction:
- **`layout.ts` untouched** — the new diagram has its own `shapeLayout.ts`; zero imports from or edits
  to `layout.ts`. The 5 components depending on it are unaffected.
- **`ChordFretboard.svelte` untouched** — still imported only by ChordBuilder; we add a *new* component,
  never edit it.
- **`ChordBuilder.svelte` untouched** — no shared mutable surface; `chords.ts` is read-only-imported,
  not modified (`voicingRole` lives in the new module, not in `chords.ts`).
- **`STANDARD_TUNING` read-only** — imported from `$lib/types/chord` (single source), never mutated.
- **Verification:** the full `npx vitest run` suite (including the untouched modules' existing tests)
  must stay green after the wiring edit. The only modified file is `DiatonicHarmonizer.svelte`, whose
  existing test (`DiatonicHarmonizer.test.ts`) must still pass; the additive diagram must not break its
  current `data-chord-name` / `data-construction-stack` / `data-legend` assertions.

## Open questions / assumptions requiring validation

- Exact `SL` constant values (`STRING_SP=22`, `FRET_SP=28`, gutter/name-col widths) are a starting
  point tuned for the `lg:grid-cols-2` card; the apply phase may nudge them for visual fit. The pure
  geometry contract (function signatures, window-shift semantics) is fixed; only literals may move.
- Whether open strings render a note letter in the name column (assumed YES — they are chord tones and
  carry a role). Confirmed consistent with the legend; tasks/apply may simplify if visually noisy.
- The temporary `getOpenVoicing` throw-path test during PR1 (when only C major exists) — assert it
  throws for an unauthored key, then relax as keys are added.
