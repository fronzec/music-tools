# Tasks: Chord Fretboard Mirror

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~334 |
| Production lines only | ~149 |
| Test lines | ~185 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | n/a (single PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low — production code ~149 lines (well under budget); tests ~185 lines. No exception needed.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature: pure theory helper + presentational component + ChordBuilder wiring | PR 1 | ~334 lines total; production well under 400 |

---

## Locked Design Decisions (encode before implementation)

> These are non-negotiable — any deviation is a defect.

1. **`ChordFretboardPosition` uses `degreeIndex` (NOT `offset`).** The design (ADR-1) is authoritative. The spec's interface block lists `offset` — that is superseded by the design. The field MUST be `degreeIndex: number` (index into the `offsets` array). The component resolves labels as `degrees[mark.degreeIndex]`.
2. **Role colors match the RULER, not IntervalFretboard.** Root → `fill-note-root`; tone → `fill-note-tone`. Do NOT use `fill-accent` (IntervalFretboard's root color) on any chord-tone dot.
3. **Degree label text uses `fill="white"` (literal keyword, not a token attribute).** This is explicitly accepted in the design for `<text>` contrast — the no-hardcoded-colors rule applies to role-significant colors (root, tone, accent), not to the structural white text color. If `fill-white` Tailwind class exists in the project token set, prefer that instead.
4. **No `$state` added to `ChordBuilder.svelte`.** The component already owns `root`/`quality`. `ChordFretboard` is a pure consumer of the existing `rootPc` and `triad` derived values. Zero new state.
5. **No `<svelte:boundary>` wrapping `ChordFretboard`.** The mirror is a plain child — no new ErrorBoundary requirement, no new svelte-check error expected.
6. **Strict TDD order (bottom-up per layer):** unit test → unit impl → component test → component impl → wrapper delta → verification. Do not write any UI before its theory unit tests are green.

---

## Implementation Order Summary

```
1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1
```

Strict TDD order per layer:
1. Pure theory (`chordFretboard.ts`) — unit tests first
2. Presentational component (`ChordFretboard.svelte`) — component tests first
3. Wrapper delta (`ChordBuilder.svelte`) — extend existing test first
4. Full verification — build + svelte-check + full suite

---

## Phase 1: Pure Theory Module — `src/lib/theory/chordFretboard.ts` (TDD — tests first)

Spec: Section 1 — `ChordFretboardPosition` interface, `chordPositions` pure function
Design: ADR-1 — `degreeIndex` field, `targetPcs.indexOf(pc)` first-match discipline

### Design reconciliation note

The spec's `ChordFretboardPosition` interface lists an `offset` field. The design (ADR-1, authoritative) replaces it with `degreeIndex: number` (index into the `offsets` array). Implementation MUST use `degreeIndex`. The component resolves the degree label as `degrees[mark.degreeIndex]`, not `offsets.indexOf(mark.offset)`.

- [x] 1.1 Write **failing** `tests/unit/theory/chordFretboard.test.ts`
  - Import `ChordFretboardPosition` (type) and `chordPositions` from `$lib/theory/chordFretboard`
  - **Shape / smoke:** `chordPositions(0, [0,4,7])` returns a non-empty array; every element has `stringIndex` ∈ [0,5], `fret` ∈ [0,14], `pitchClass` ∈ [0,11], `degreeIndex` ∈ [0,2], `role` ∈ `{'root','tone'}`
  - **C major — count and pitch class set:** result length > 3; every `pitchClass` ∈ `{0,4,7}`; all 6 string indices represented
  - **C major — root/tone role split:** every position with `pitchClass === 0` has `role === 'root'` and `degreeIndex === 0`; every position with `pitchClass !== 0` has `role === 'tone'` and `degreeIndex > 0`
  - **C major — specific cells (string 0, low E open=4):** fret 0 → `{ stringIndex:0, fret:0, pitchClass:4, degreeIndex:1, role:'tone' }`; fret 3 → `pitchClass:7, degreeIndex:2, role:'tone'`; fret 8 → `pitchClass:0, degreeIndex:0, role:'root'`
  - **C major — pitch class repeats across strings:** positions with `pitchClass === 4` exist on MORE THAN ONE distinct `stringIndex`; `role:'root'` count > 1 (root appears multiple times on the neck)
  - **G major (rootPc=7):** all `pitchClass` ∈ `{7,11,2}`; `pitchClass===7` positions have `role:'root'`; others have `role:'tone'`
  - **C minor (`[0,3,7]`):** all `pitchClass` ∈ `{0,3,7}`; root at pitchClass 0
  - **C diminished (`[0,3,6]`):** all `pitchClass` ∈ `{0,3,6}`; root at pitchClass 0
  - **C augmented (`[0,4,8]`):** all `pitchClass` ∈ `{0,4,8}`; root at pitchClass 0
  - **All 12 roots × all 4 qualities (loop):** `chordPositions(root, TRIAD_OFFSETS[q])` is non-empty; no `fret > 14`; no `stringIndex > 5`; for every position: `(STANDARD_TUNING[p.stringIndex] + p.fret) % 12 === (root + offsets[p.degreeIndex]) % 12`
  - **Edge — open string (B string):** `chordPositions(11, [0,4,7])` contains `{ stringIndex:1, fret:0, pitchClass:11, degreeIndex:0, role:'root' }`
  - **Edge — negative root normalization:** `chordPositions(-1, [0,4,7])` equals `chordPositions(11, [0,4,7])` (deep equal)
  - **Edge — rootPc=12 wraps to 0:** `chordPositions(12, [0,4,7])` equals `chordPositions(0, [0,4,7])`
  - **Edge — duplicate offset tie discipline:** `chordPositions(0, [0,12])` — every matching cell has `degreeIndex:0` and `role:'root'`; no `role:'tone'` result (offset 0 wins the tie over offset 12, which is the same pitch class mod 12)
  - **Determinism:** calling `chordPositions(0, [0,4,7])` twice returns arrays that are deeply equal
  - All assertions must FAIL (red) before any production file is created

- [x] 1.2 Implement `src/lib/theory/chordFretboard.ts`
  - Export interface `ChordFretboardPosition`:
    ```ts
    export interface ChordFretboardPosition {
      stringIndex: number;  // 0..5, tablature order (low E = 0, high E = 5)
      fret:        number;  // 0..14 inclusive
      pitchClass:  number;  // 0..11
      role:        'root' | 'tone';
      degreeIndex: number;  // index into the offsets array that matched this cell
    }
    ```
  - Export `chordPositions(rootPc: number, offsets: readonly number[]): ChordFretboardPosition[]`
    - Import `STANDARD_TUNING` from `$lib/theory/tuning` (or `$lib/types/chord`)
    - Import `MAX_FRET` from `$lib/theory/intervals`
    - Normalize: `const normalizedRoot = ((rootPc % 12) + 12) % 12`
    - Precompute target pitch classes: `const targetPcs = offsets.map(o => (((normalizedRoot + o) % 12) + 12) % 12)`
    - Bounded double `for` loop: `stringIndex` 0..5, `fret` 0..MAX_FRET
    - Per cell: `pc = (STANDARD_TUNING[stringIndex] + fret) % 12`
    - First-match: `degreeIndex = targetPcs.indexOf(pc)` — if `!== -1`, push position
    - `role: degreeIndex === 0 ? 'root' : 'tone'`
    - No `while` loops; no DOM; no audio; no side effects
  - All Phase 1 unit tests must pass (green); run `npm test` — existing 910 tests stay green

  Commit: `feat(theory): add chordFretboard.ts pure helper with chordPositions`

---

## Phase 2: Presentational Component — `src/lib/components/ChordFretboard.svelte` (TDD — tests first)

Spec: Section 2 — Props API, full neck rendering, role-based token classes, data-role, degree labels, accessibility, reactivity, Svelte 5 runes
Design: ADR-2 — scaffold mirror of IntervalFretboard, ruler color scheme, degreeIndex label alignment

- [x] 2.1 Write **failing** `tests/components/ChordFretboard.test.ts`
  - Mirror the `IntervalFretboard.test.ts` pattern: lazy dynamic import, `render`, `rerender`, `screen.getByRole('img')`, `container.querySelectorAll('[data-role=...]')`
  - **Renders without throwing:** mount with `{ rootPc: 0, offsets: [0,4,7], degrees: ['1','3','5'] }`
  - **role="img" present:** `screen.getByRole('img')` resolves; `aria-label` is a non-empty string
  - **aria-label contains rootName:** mount with `rootName='C'`; aria-label contains `'C'`
  - **data-role="root" count:** `container.querySelectorAll('[data-role="root"]').length` equals `chordPositions(0,[0,4,7]).filter(p=>p.role==='root').length`
  - **data-role="tone" count:** `container.querySelectorAll('[data-role="tone"]').length` equals matching tone count from `chordPositions`
  - **Total dot count:** `container.querySelectorAll('[data-role]').length` equals `chordPositions(0,[0,4,7]).length`
  - **Token class — root dots:** every `[data-role="root"]` element has class `fill-note-root`; none has class `fill-accent`
  - **Token class — tone dots:** every `[data-role="tone"]` element has class `fill-note-tone`
  - **No hardcoded colors on chord-tone elements:** `container.querySelector('[data-role]')` outerHTML does not contain `#`, `rgb(`, `hsl(`; no `fill="` attribute containing a color value on chord-tone circles (literal `fill="white"` on `<text>` is exempt if using attribute form)
  - **Degree labels — C major:** rendered text nodes include `'1'`, `'3'`, `'5'` (each appearing multiple times across neck positions)
  - **Degree labels — correct alignment (minor):** mount with `offsets=[0,3,7]`, `degrees=['1','♭3','5']`; a position with `pitchClass===3` has associated text `'♭3'`
  - **Degree labels — augmented:** mount with `offsets=[0,4,8]`, `degrees=['1','3','♯5']`; text `'♯5'` is present
  - **Reactivity — rootPc change:** `rerender` with `rootPc=7`, `offsets=[0,4,7]`, `degrees=['1','3','5']`; `[data-role="root"]` count equals `chordPositions(7,[0,4,7]).filter(p=>p.role==='root').length`
  - **Reactivity — offsets change (quality change):** `rerender` with `offsets=[0,3,7]`, `degrees=['1','♭3','5']`; `[data-role="tone"]` count equals `chordPositions(0,[0,3,7]).filter(p=>p.role==='tone').length`
  - **width prop:** mount with `width=600`; SVG `viewBox` attribute is present on the `role="img"` element
  - All assertions must FAIL (red) before `ChordFretboard.svelte` exists

- [x] 2.2 Implement `src/lib/components/ChordFretboard.svelte`
  - Props via `$props()`:
    ```ts
    interface Props {
      rootPc:    number;
      offsets:   readonly number[];
      degrees?:  readonly string[];   // aligned to offsets by index
      rootName?: string;
      chordName?: string;
      width?:    number;
    }
    ```
  - `let marks = $derived(chordPositions(rootPc, offsets))` — the only derived-state surface
  - Scaffold: copy `IntervalFretboard.svelte`'s neck structure verbatim:
    - Same `viewBox="-24 0 {vbW + 24} {vbH + 18}"`, `role="img"`, `aria-label`, `<title>`/`<desc>`
    - Same `L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW`, `viewBoxH`, `FRET_MARKERS` imports from `$lib/theory/layout`
    - Neck background (`fill-surface-raised`), fret lines (`stroke-hairline`), marker-fret background dots, string lines, `FRET_MARKERS` position dots, nut line (`stroke-muted`), fret numbers below bottom string
  - Marker loop (the only semantically new block):
    ```svelte
    {#each marks as mark (`${mark.stringIndex}-${mark.fret}`)}
      {@const cx = noteX(mark.fret, rangeStart)}
      {@const cy = stringY(mark.stringIndex)}
      {@const label = degrees?.[mark.degreeIndex] ?? ''}
      {#if mark.role === 'root'}
        <circle {cx} {cy} r={L.ROOT_R} class="fill-note-root" data-role="root" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size={L.LABEL_FS}
              fill="white" font-weight="bold" style="pointer-events:none">{label}</text>
      {:else}
        <circle {cx} {cy} r={L.TONE_R} class="fill-note-tone" data-role="tone" />
        <text x={cx} y={cy + 3} text-anchor="middle" font-size={L.LABEL_FS - 1}
              fill="white" font-weight="bold" style="pointer-events:none">{label}</text>
      {/if}
    {/each}
    ```
  - `ariaLabel = $derived(`${chordName ?? rootName ?? 'Chord'} — positions across the neck`)` 
  - Color rule (HARD): root → `fill-note-root`; tone → `fill-note-tone`; NO `fill-accent`; NO inline `fill="rgb(...)"` or `fill="#..."` on chord-tone circles
  - `fill="white"` on `<text>` is acceptable per design (or use `fill-white` class if the token exists)
  - Svelte 5 runes only: `$props()`, `$derived`, `$derived.by`; no `$state`; no `on:*` directives; no `createEventDispatcher`; no `<slot>`
  - All Phase 2 component tests must pass (green); run `npm test` — full suite stays green

  Commit: `feat(components): add ChordFretboard presentational component`

---

## Phase 3: Wrapper Delta — Extend `tests/components/ChordBuilder.test.ts` (TDD — extend test first)

Spec: Section 3 — ChordFretboard rendered below ruler/info card; no new $state; reactivity via existing derived state
Design: ADR-3 — `<ChordFretboard rootPc={rootPc} offsets={triad.offsets} degrees={triad.degrees} rootName={root} chordName={triad.name} />`; placed below info card in a `<section class="mb-6">`

- [x] 3.1 Extend **existing** `tests/components/ChordBuilder.test.ts` with failing assertions
  - Do NOT modify any existing test — add new assertions only
  - **Mirror present on mount:** after mounting `ChordBuilder`, a `role="img"` SVG element is present (the fretboard); `[data-role="root"]` count matches `chordPositions(0, [0,4,7]).filter(p=>p.role==='root').length` for the default C major state
  - **Mirror updates on quality change:** toggle quality to `'min'`; `[data-role="tone"]` count equals `chordPositions(0,[0,3,7]).filter(p=>p.role==='tone').length`; degree label `'♭3'` is present in the DOM
  - **No new $state:** count of `$state` declarations in `ChordBuilder.svelte` source equals the pre-change count (verify via source string match after implementation, or assert via existing behavior stability)
  - All new assertions must FAIL (red) before the wiring edit

- [x] 3.2 Wire `<ChordFretboard>` into `src/lib/components/ChordBuilder.svelte`
  - Add import at the top of the `<script>` block:
    ```ts
    import ChordFretboard from '$lib/components/ChordFretboard.svelte';
    ```
  - Add ONE new `<section>` below the chord-info card (after name/formula/notes section, before Play):
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
  - ZERO new `$state` declarations; ZERO new `$derived` except those already in the component; NO `<svelte:boundary>`
  - `rootPc` and `triad` are already present as `$derived` values; bind directly
  - All Phase 3 tests must pass (green); existing ChordBuilder tests must remain green

  Commit: `feat(components): wire ChordFretboard into ChordBuilder below info card`

---

## Phase 4: Full Verification

Spec: Section 4 — token-only colors; no out-of-scope items; existing suite stays green; build passes
Design: Review Workload Forecast — Chained PRs: No; Budget risk: Low; Decision needed: No

- [x] 4.1 Run `npm test` — all tests must pass
  - Baseline 910 tests + all new tests (Phase 1 unit + Phase 2 component + Phase 3 wrapper additions)
  - Zero regressions; no existing test file modified
  - Confirm new test file structure:
    - `tests/unit/theory/chordFretboard.test.ts`
    - `tests/components/ChordFretboard.test.ts`
    - `tests/components/ChordBuilder.test.ts` (extended, not replaced)

- [x] 4.2 Run `npm run build` (tsc) — zero errors
  - Confirms `ChordFretboardPosition` interface with `degreeIndex` is type-correct
  - Confirms `ChordFretboard.svelte` prop types are valid (all required props wired by `ChordBuilder`)
  - Confirms no stray Svelte 4 syntax (`on:click`, `createEventDispatcher`, `<slot>`)

- [x] 4.3 Run `npx svelte-check --tsconfig ./tsconfig.json` — zero new errors
  - No new ErrorBoundary error (component renders as plain child, no `<svelte:boundary>`)
  - `$props()` destructuring type-safe
  - No `on:*` directive syntax errors

- [x] 4.4 Source audit — confirm out-of-scope items are absent:
  - No 7th/9th chord offset tables imported or defined in `chordFretboard.ts`
  - No drag/interaction logic in `ChordFretboard.svelte`
  - No enharmonic spelling logic on the neck
  - No new `<svelte:boundary>` wrapping `ChordFretboard` in `ChordBuilder.svelte`
  - No hardcoded hex/rgb/hsl `fill` attribute on chord-tone `<circle>` elements

---

## Parallelism Notes

All phases are **sequential** — each layer's test must be green before the next layer is written:

- Phase 1 must be fully green before Phase 2 starts (component imports the theory helper)
- Phase 2 must be fully green before Phase 3 starts (wrapper imports the component)
- Phase 3 test must fail before Phase 3 impl (standard TDD discipline)
- Phase 4 runs last as a gate — do not ship without it

No parallel work units; this is a 6-person-hour change with clean bottom-up dependency.

---

## Spec Requirements Coverage

| Requirement (Spec Section) | Tasks |
|---|---|
| **Section 1 — chordFretboard.ts** | |
| `ChordFretboardPosition` interface (shape with `degreeIndex`) | 1.1, 1.2 |
| `chordPositions` pure function — normalizes root | 1.1, 1.2 |
| Iterates all 6 strings × frets 0..14 | 1.1, 1.2 |
| `role: 'root'` when `degreeIndex === 0`, else `'tone'` | 1.1, 1.2 |
| First-matching-offset wins (tie discipline) | 1.1, 1.2 |
| All 4 qualities produce non-empty results | 1.1, 1.2 |
| Bounds: no fret > 14, no stringIndex > 5 | 1.1, 1.2 |
| Offset carried correctly via degreeIndex (pitch-class alignment) | 1.1, 1.2 |
| Negative / out-of-range rootPc normalizes | 1.1, 1.2 |
| Unit tests written and passing before any UI | 1.1, 1.2 |
| **Section 2 — ChordFretboard.svelte** | |
| Props API (rootPc, offsets, degrees, rootName, width) | 2.1, 2.2 |
| Full neck frets 0–14, layout.ts helpers | 2.1, 2.2 |
| One `<circle>` per `ChordFretboardPosition` | 2.1, 2.2 |
| Root dots `fill-note-root` (NOT `fill-accent`) | 2.1, 2.2 |
| Tone dots `fill-note-tone` | 2.1, 2.2 |
| No hardcoded hex/rgb/hsl on chord-tone circles | 2.1, 2.2 |
| `L.ROOT_R` for root, `L.TONE_R` for tone dot radius | 2.1, 2.2 |
| `data-role` attribute on every dot | 2.1, 2.2 |
| Degree label per dot via `degrees[mark.degreeIndex]` | 2.1, 2.2 |
| `text-anchor="middle"` on all labels | 2.1, 2.2 |
| `role="img"` + non-empty `aria-label` + `<title>` | 2.1, 2.2 |
| Reactivity on rootPc change | 2.1, 2.2 |
| Reactivity on offsets/quality change | 2.1, 2.2 |
| Svelte 5 runes only (no $state, no on:*, no slot) | 2.1, 2.2 |
| **Section 3 — ChordBuilder.svelte delta** | |
| `<ChordFretboard>` rendered below ruler/info card | 3.1, 3.2 |
| rootPc, offsets, degrees, rootName, chordName wired | 3.1, 3.2 |
| Zero new `$state` introduced | 3.1, 3.2 |
| Fretboard updates when root changes | 3.1, 3.2 |
| Fretboard updates when quality changes | 3.1, 3.2 |
| No new `<svelte:boundary>` | 3.2 |
| **Section 4 — Quality and Constraint Invariants** | |
| Token-only SVG colors (class-based fills throughout) | 2.2, 4.4 |
| No 7th chords / extensions | 4.4 |
| No drag mode / voicing selection | 4.4 |
| No enharmonic spelling | 4.4 |
| Existing suite stays green (910+ tests) | 4.1 |
| `svelte-check` reports no new errors | 4.3 |
| `tsc` build passes | 4.2 |
| Additive only — rollback by 4 deletions + 1 removal | (architecture; no task needed) |
