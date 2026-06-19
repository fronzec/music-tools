# Tasks: Diatonic Harmonizer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~319 |
| Production lines only | ~159 |
| Test lines | ~160 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | n/a (single PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low — production code ~159 lines (well under budget); tests ~160 lines. No exception needed.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature: pure theory module + presentational component + 4-point registration | PR 1 | ~319 lines total; comfortably under 400 |

---

## Locked Design Decisions (encode before implementation)

> These are non-negotiable — any deviation is a defect.

1. **Quality derived from semitone gaps, NEVER hardcoded.** For each triad at degree index `i`, stack scale notes at indices `i`, `i+2`, `i+4` (mod 7) with octave carry so `s0 < s1 < s2` as absolute semitones. Measure `g1 = s1 - s0` and `g2 = s2 - s1`: `4+3 → 'maj'`, `3+4 → 'min'`, `3+3 → 'dim'`, anything else → throw. The `maj,min,min,maj,maj,min,dim` pattern must EMERGE; it is never declared.
2. **Roman labels derived from quality + degree, not hardcoded.** Build the uppercase numeral from `['I','II','III','IV','V','VI','VII'][degree-1]`, then: `'maj'` → uppercase; `'min'` → lowercase; `'dim'` → lowercase + `'°'` (U+00B0 DEGREE SIGN, not the letter `o`).
3. **`diatonics.ts` does NOT import `TRIAD_OFFSETS` for its own note computation.** Notes are built via `chordTones(s0 % 12, TRIAD_OFFSETS[quality])` — the component sources `TRIAD_OFFSETS`/`TRIAD_DEGREES` from `chords.ts` at the call site. Theory stays pure; render props stay in the component.
4. **Exactly ONE `$state` in `DiatonicHarmonizer.svelte` — the root.** All 7 triads are `$derived`. No triad data in `$state`. No hardcoded chord names, qualities, or notes.
5. **Registration order is: ViewName union → VIEW_NAMES → App.svelte → tools.ts.** This keeps `tsc` green at every intermediate step because the exhaustiveness guard in `routing.ts` fails `tsc` if the union and the array drift.
6. **No `<svelte:boundary>` inside `DiatonicHarmonizer.svelte`.** The component renders `<ChordFretboard>` as a plain child. `App.svelte` already wraps the tool in its own `<svelte:boundary>`.
7. **Strict TDD bottom-up order:** unit tests (theory) → theory impl → registration edits (tsc-green at each step) → component tests → component impl → full verification gate.
8. **`°` is U+00B0 DEGREE SIGN.** Enforced by the `charCodeAt` unit test.

---

## Implementation Order Summary

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1
```

Strict TDD bottom-up per layer:
1. Pure theory module (`diatonics.ts`) — unit tests first
2. App-shell registration (4 files, tsc-verified after each edit)
3. Presentational component (`DiatonicHarmonizer.svelte`) — component tests first
4. Full verification gate — suite + build + svelte-check + source audit

---

## Phase 1: Pure Theory Module — `src/lib/theory/diatonics.ts` (TDD — tests first)

Spec: Section 1 — `MAJOR_SCALE_INTERVALS`, `DiatonicTriad` interface, `diatonicTriads` function
Design: ADR-1 — gap-based quality classifier, octave-carry third stacking, derived Roman labels, `chordTones`/`chordName` reuse

- [x] 1.1 Write **failing** `tests/unit/theory/diatonics.test.ts`
  - Import `MAJOR_SCALE_INTERVALS`, `DiatonicTriad` (type), `diatonicTriads` from `$lib/theory/diatonics`
  - Import `CHROMATIC` from `$lib/types/chord`
  - **Constant smoke:** `MAJOR_SCALE_INTERVALS` deep-equals `[0,2,4,5,7,9,11]`; has length 7
  - **Return shape:** `diatonicTriads('C')` returns exactly 7 items; degrees are `[1,2,3,4,5,6,7]` in that order; each item has keys `degree`, `roman`, `quality`, `rootPc`, `rootName`, `notes`, `name`
  - **C major — all 7 triads (full assertions):**
    - degree 1: `rootName='C'`, `rootPc=0`, `notes=['C','E','G']`, `quality='maj'`, `roman='I'`
    - degree 2: `rootName='D'`, `rootPc=2`, `notes=['D','F','A']`, `quality='min'`, `roman='ii'`
    - degree 3: `rootName='E'`, `rootPc=4`, `notes=['E','G','B']`, `quality='min'`, `roman='iii'`
    - degree 4: `rootName='F'`, `rootPc=5`, `notes=['F','A','C']`, `quality='maj'`, `roman='IV'`
    - degree 5: `rootName='G'`, `rootPc=7`, `notes=['G','B','D']`, `quality='maj'`, `roman='V'`
    - degree 6: `rootName='A'`, `rootPc=9`, `notes=['A','C','E']`, `quality='min'`, `roman='vi'`
    - degree 7: `rootName='B'`, `rootPc=11`, `notes=['B','D','F']`, `quality='dim'`, `roman='vii°'`
  - **Quality pattern — all 12 roots:** `CHROMATIC.forEach(root => expect(diatonicTriads(root).map(t => t.quality)).toEqual(['maj','min','min','maj','maj','min','dim']))`
  - **Roman labels — C major:** `diatonicTriads('C').map(t => t.roman)` deep-equals `['I','ii','iii','IV','V','vi','vii°']`
  - **Roman labels — G major:** same assertion for `'G'`
  - **Degree sign check:** `diatonicTriads('C')[6].roman.charCodeAt(3) === 176` (U+00B0)
  - **`name` reuses `chordName`:** degree 2 name is `'D minor'`; degree 7 name is `'B diminished'`
  - **rootPc range — all 12 roots:** every `rootPc` value for every root is in 0..11
  - **G major rootPc set:** `new Set(diatonicTriads('G').map(t => t.rootPc))` deep-equals `new Set([7,9,11,0,2,4,6])`
  - **Determinism:** `diatonicTriads('C')` deep-equals a second call to `diatonicTriads('C')`
  - **No throw for any valid root:** all 12 `CHROMATIC` roots iterate without throwing
  - All assertions must FAIL (red) before any production file is created

- [x] 1.2 Implement `src/lib/theory/diatonics.ts`
  - Exports:
    - `export const MAJOR_SCALE_INTERVALS = [0,2,4,5,7,9,11] as const`
    - `export type Degree = 1|2|3|4|5|6|7`
    - `export interface DiatonicTriad { readonly degree: Degree; readonly roman: string; readonly quality: TriadQuality; readonly rootPc: number; readonly rootName: NoteName; readonly notes: readonly NoteName[]; readonly name: string; }`
    - `export function diatonicTriads(root: NoteName): DiatonicTriad[]`
  - Imports: `CHROMATIC`, `NoteName` from `$lib/types/chord`; `chordTones`, `chordName`, `TRIAD_OFFSETS`, `TriadQuality` from `$lib/theory/chords`
  - Algorithm: for each `i` in 0..6, compute `s0`, `s1`, `s2` as ascending absolute semitones using scale indices `i`, `i+2`, `i+4` with `+12` octave carry; measure `g1 = s1-s0`, `g2 = s2-s1`; classify quality; derive Roman label from `['I','II','III','IV','V','VI','VII'][i]` cased by quality; build `notes = chordTones(s0 % 12, TRIAD_OFFSETS[quality])`; build `name = chordName(rootName, quality)`
  - Throw `new Error(...)` on any gap combination that is not `4+3`, `3+4`, or `3+3` (defensive; unreachable for valid major scales)
  - No DOM, no audio, no side effects; pure and total for all `NoteName` values
  - All Phase 1 unit tests must pass (green); run `npm test -- --run` — all pre-existing tests stay green

  Commit: `feat(theory): add diatonics.ts pure module with diatonicTriads`

---

## Phase 2: App-Shell Registration (4 files, tsc-safe order)

Spec: Section 3 — ViewName union, VIEW_NAMES array, App.svelte branch, tools.ts entry
Design: ADR-3 — add in union → array → router → registry order; exhaustiveness guard must stay green

### Design note

The `VIEW_NAMES` exhaustiveness guard in `routing.ts` fails `tsc` if the `ViewName` union and the array drift. Editing the union (2.1) and the array (2.2) back-to-back as one commit keeps `tsc` green continuously. Edits 2.3 and 2.4 are purely additive and do not affect the guard.

- [x] 2.1 Add `'diatonic-harmonizer'` to the `ViewName` union in `src/lib/types/chord.ts`
  - Append `| 'diatonic-harmonizer'` to the `ViewName` union type
  - After this edit alone, `tsc --noEmit` will FAIL (guard fires until VIEW_NAMES is also updated)
  - Do NOT commit yet — proceed immediately to 2.2

- [x] 2.2 Add `'diatonic-harmonizer'` to `VIEW_NAMES` in `src/lib/routing.ts`
  - Append `'diatonic-harmonizer'` to the `VIEW_NAMES` array
  - `viewToPath` and `pathToView` will route `/diatonic-harmonizer` automatically — no per-tool code needed
  - After this edit, `tsc --noEmit` MUST pass (exhaustiveness guard re-satisfied)
  - Commit both 2.1 + 2.2 together: `feat(routing): register diatonic-harmonizer view name and route`

- [x] 2.3 Add `DiatonicHarmonizer` route branch in `src/App.svelte`
  - Add import: `import DiatonicHarmonizer from '$lib/components/DiatonicHarmonizer.svelte'`
  - Add `{:else if currentView === 'diatonic-harmonizer'}` branch wrapped in `<svelte:boundary failed={errorFallback}>`, passing `{navigate}` — identical shape to the `chord-builder` branch
  - Component does not exist yet; `tsc`/svelte-check will report an error until Phase 3 is complete — that is expected at this step
  - Do NOT commit yet — continue to 2.4 or hold until component exists (see note below)

  > **Note:** Tasks 2.3 and 2.4 can be committed immediately after Phase 3 (component exists) OR committed now with `tsc` errors as work-in-progress. The cleanest approach is to commit 2.3 + 2.4 together once `DiatonicHarmonizer.svelte` exists (after Phase 3). Marking them here in order so the apply agent makes a deliberate choice.

- [x] 2.4 Add `active` registry entry in `src/lib/data/tools.ts`
  - Add entry in the `'fretboard-theory'` category alongside Chord Builder:
    ```ts
    {
      status: 'active',
      view: 'diatonic-harmonizer',
      title: 'Diatonic Harmonizer',
      description: "See a major key's 7 diatonic triads and the chords that belong to it",
      icon: '🔑',
    }
    ```
  - `status` MUST be `'active'`; `view` MUST be `'diatonic-harmonizer'`
  - NOTE: icon `'🔑'` was used in implementation (tasks originally listed `'🎼'` but that was already claimed by Scales Explorer)
  - Commit together with 2.3 (after component exists): `feat(routing): wire DiatonicHarmonizer into app shell and tools registry`

---

## Phase 3: Presentational Component — `src/lib/components/DiatonicHarmonizer.svelte` (TDD — tests first)

Spec: Section 2 — state ownership, RootSelector integration, 7 chord cards, ChordFretboard per card, no audio, tokens only, Svelte 5 runes
Design: ADR-2 — ChordBuilder mirror structure, ONE `$state` root, `$derived` triads, responsive card grid, TRIAD_OFFSETS/TRIAD_DEGREES at call site

- [x] 3.1 Write **failing** `tests/components/DiatonicHarmonizer.test.ts`
  - Mirror `ChordBuilder.test.ts` pattern: lazy dynamic import, stub `navigate` as `vi.fn()`, `render`, `screen`, `fireEvent`
  - **Renders without throwing:** mount with `{ navigate: vi.fn() }` for default C major; no error thrown
  - **7 fretboard diagrams:** `screen.getAllByRole('img').length === 7`
  - **C major chord names present:** `screen.getByText('C')` (maj, degree I); `screen.getByText('Dm')` or equivalent chord name for degree ii; `screen.getByText('B°')` or equivalent for degree vii°
  - **C major Roman labels present:** `screen.getByText('I')`, `screen.getByText('ii')`, `screen.getByText('vii°')` all found
  - **Exactly 7 cards:** a query for the card container (e.g. `article` elements or a data attribute) returns 7 results
  - **Reactivity — root change:** click the `G` button in `RootSelector`; first card heading now reflects G major's degree-I chord name (e.g. `'G'`); C major cards are no longer the only visible content
  - **Back button:** click the back/home button; `navigate` was called with `'home'`
  - **No audio element:** `document.querySelector('audio')` is null
  - **No hardcoded colors:** component source (loaded as text or via container outerHTML) contains no `#rrggbb`, `rgb(`, or `hsl(` values
  - All assertions must FAIL (red) before `DiatonicHarmonizer.svelte` exists

- [x] 3.2 Implement `src/lib/components/DiatonicHarmonizer.svelte`
  - `<script lang="ts">` imports:
    ```ts
    import type { ViewName, NoteName } from '$lib/types/chord';
    import { CHROMATIC } from '$lib/types/chord';
    import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';
    import { diatonicTriads } from '$lib/theory/diatonics';
    import RootSelector from '$lib/components/RootSelector.svelte';
    import ChordFretboard from '$lib/components/ChordFretboard.svelte';
    interface Props { navigate: (view: ViewName) => void; }
    let { navigate }: Props = $props();
    let root = $state<NoteName>('C');
    const triads = $derived(diatonicTriads(root));
    ```
  - Chord name helper (inline or `$derived.by`): `rootName + (quality === 'min' ? 'm' : quality === 'dim' ? '°' : '')`
  - Layout: back button → header → `<RootSelector notes={CHROMATIC} selected={root} onSelect={(n) => root = n} />` → responsive card grid
  - Card grid class: `grid gap-4 sm:grid-cols-2 xl:grid-cols-3` inside `mx-auto max-w-6xl px-4 py-6`
  - Card markup per triad (key `t.degree`):
    ```svelte
    <article class="rounded-lg border border-hairline bg-surface-raised p-4">
      <header class="mb-2 flex items-baseline justify-between">
        <span class="font-display text-lg font-bold text-ink">{chordNameFor(t)}</span>
        <span class="font-technical text-sm text-muted">{t.roman}</span>
      </header>
      <div class="mb-1 font-technical text-xs text-muted">{t.quality}</div>
      <div class="mb-3 font-technical text-sm text-muted">{t.notes.join(' – ')}</div>
      <ChordFretboard
        rootPc={t.rootPc}
        offsets={TRIAD_OFFSETS[t.quality]}
        degrees={TRIAD_DEGREES[t.quality]}
        rootName={t.rootName}
        chordName={chordNameFor(t)}
      />
    </article>
    ```
  - Exactly ONE `$state` declaration; all other values are `$derived` or `$derived.by`
  - No `<audio>`, no `AudioContext`, no audio controls
  - No `on:*` event directive syntax; use `onclick={...}` or prop callbacks only
  - No `createEventDispatcher`; no `<slot>`; Svelte 5 runes throughout
  - All color references via Tailwind token classes only; no `#rrggbb`, `rgb(...)`, or `hsl(...)`
  - All Phase 3 component tests must pass (green); full suite stays green

  Commit: `feat(components): add DiatonicHarmonizer presentational component`

  > After this commit, complete tasks 2.3 + 2.4 if deferred (import + App.svelte branch + tools.ts entry), and commit them.

---

## Phase 4: Registration Finalization + Full Verification Gate

Spec: Section 4 — existing suite stays green; tsc clean; svelte-check no new errors; out-of-scope items absent
Design: Review Workload Forecast — Chained PRs: No; Budget: Low; Decision needed: No

- [x] 4.1 Confirm `src/App.svelte` and `src/lib/data/tools.ts` edits are committed (tasks 2.3 + 2.4)
  - `tsc --noEmit` MUST exit cleanly (exhaustiveness guard satisfied; component import resolves)
  - `svelte-check` MUST report no new errors (boundary wrapping, prop types, rune syntax)

- [x] 4.2 Run `npm test -- --run` — all tests must pass
  - All pre-existing tests green; zero regressions; no existing test file modified
  - New test files present and green:
    - `tests/unit/theory/diatonics.test.ts`
    - `tests/components/DiatonicHarmonizer.test.ts`

- [x] 4.3 Run `npm run build` — zero errors
  - Confirms `ViewName` union and `VIEW_NAMES` array are in sync (exhaustiveness guard)
  - Confirms `DiatonicHarmonizer.svelte` prop types are valid
  - Confirms no stray Svelte 4 syntax (`on:click`, `createEventDispatcher`, `<slot>`)
  - Confirms `diatonics.ts` compiles without type errors (interface shapes, `TriadQuality` subtype)

- [x] 4.4 Run `npx svelte-check --tsconfig ./tsconfig.json` — zero new errors
  - No new `<svelte:boundary>` error (harmonizer renders `ChordFretboard` as plain child)
  - `$props()` destructuring type-safe in `DiatonicHarmonizer.svelte`
  - No `on:*` directive syntax errors

- [x] 4.5 Source audit — confirm out-of-scope items are absent:
  - No minor-key toggle, mode selector, or non-major scale UI in `DiatonicHarmonizer.svelte`
  - No 7th-chord interval tables or 4-note chord types in `diatonics.ts`
  - No `<audio>` element and no `AudioContext` in any new file
  - No hardcoded `#rrggbb`, `rgb(...)`, or `hsl(...)` in `DiatonicHarmonizer.svelte`
  - No `°` rendered as letter `o` or digit `0` — `charCodeAt` test already catches this, confirm here too
  - No new `<svelte:boundary>` inside `DiatonicHarmonizer.svelte`

---

## Parallelism Notes

All phases are **sequential** — each layer's tests must be green before the next layer starts:

- Phase 1 must be fully green before Phase 3 starts (`DiatonicHarmonizer` imports `diatonicTriads`)
- Phase 2 (registration) edits 2.1+2.2 must happen immediately back-to-back to keep `tsc` green
- Phase 2 edits 2.3+2.4 (App.svelte + tools.ts) may be committed after Phase 3 is complete so the import resolves
- Phase 3 test must fail before Phase 3 impl (standard TDD discipline)
- Phase 4 runs last as an unblocking gate — do not mark the change done without it

No parallel work units. This is a clean bottom-up single-PR change.

---

## Spec Requirements Coverage

| Requirement (Spec Section) | Tasks |
|---|---|
| **Section 1 — diatonics.ts** | |
| `MAJOR_SCALE_INTERVALS` constant exported and correct | 1.1, 1.2 |
| `DiatonicTriad` interface shape | 1.1, 1.2 |
| `diatonicTriads` signature, 7 items, degree order | 1.1, 1.2 |
| Scale-degree third stacking with octave carry | 1.1, 1.2 |
| C major — all 7 triad note tuples | 1.1, 1.2 |
| Quality derived from semitone gaps (never hardcoded) | 1.1, 1.2 |
| Quality pattern holds for all 12 major roots | 1.1, 1.2 |
| Roman labels — casing and U+00B0 DEGREE SIGN | 1.1, 1.2 |
| `rootPc` in range 0..11 for all roots | 1.1, 1.2 |
| G major rootPc set | 1.1, 1.2 |
| Unit tests written before UI exists | 1.1 (before Phase 3) |
| **Section 2 — DiatonicHarmonizer.svelte** | |
| Exactly one `$state` (root, default `'C'`) | 3.1, 3.2 |
| `RootSelector` covering all 12 roots | 3.1, 3.2 |
| `$derived` triads from `diatonicTriads(root)` | 3.1, 3.2 |
| Exactly 7 chord cards in degree order | 3.1, 3.2 |
| Card content: chord name, roman, quality, notes | 3.1, 3.2 |
| `<ChordFretboard>` per card with correct props | 3.1, 3.2 |
| `TRIAD_OFFSETS`/`TRIAD_DEGREES` keyed by quality at call site | 3.2 |
| No audio element or AudioContext | 3.1, 3.2 |
| Token-only colors (no hardcoded hex/rgb/hsl) | 3.1, 3.2 |
| Svelte 5 runes only | 3.2 |
| Reactivity: root change re-derives all 7 cards | 3.1, 3.2 |
| **Section 3 — App-Shell Registration** | |
| `'diatonic-harmonizer'` in `ViewName` union | 2.1 |
| `'diatonic-harmonizer'` in `VIEW_NAMES` array | 2.2 |
| `tsc` fails if union and array diverge | 2.1+2.2 (sequential) |
| Route branch in App.svelte with `<svelte:boundary>` | 2.3 |
| `active` entry in tools.ts with correct status and view | 2.4 |
| **Section 4 — Quality and Constraint Invariants** | |
| No minor key / mode UI | 4.5 |
| No 7th chord data | 4.5 |
| No audio anywhere | 3.1, 4.5 |
| Token-only colors | 3.2, 4.5 |
| Existing suite stays green | 4.2 |
| `tsc --noEmit` passes | 4.1, 4.3 |
| `svelte-check` no new errors | 4.4 |
| Additive only — rollback is 3 deletions + 4 removals | (architecture; no task needed) |
