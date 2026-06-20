# Tasks: Diatonic Harmonizer Open-Position Chord Shapes

> Spec: `openspec/changes/diatonic-chord-shapes/specs/diatonic-chord-shapes/spec.md`
> Design: `openspec/changes/diatonic-chord-shapes/design.md`
> Strict TDD runner: `npx vitest run`
> Chain strategy: stacked-to-main (see Review Workload Forecast)

---

## Review Workload Forecast

| Metric | Value |
|---|---|
| Chained PRs recommended | **Yes** |
| 400-line budget risk | **High** |
| Estimated changed lines | ~900–1 100 (84 voicings × ~6 lines + component + tests + wiring) |
| Decision needed before apply | **Yes — chain strategy must be confirmed** |
| Recommended strategy | `stacked-to-main` (each PR is independently shippable; no tracker branch needed) |

The orchestrator MUST confirm chain strategy (`stacked-to-main` or `feature-branch-chain`) before
launching `sdd-apply`. The tasks below are pre-sliced for `stacked-to-main` as the recommended path.

---

## PR Dependency Diagram

```
PR1 (infra vertical slice)
  └── PR2 (natural keys: G, D, A, E, F)
        └── PR3 (flat-spelled keys: A#, D#, G#, Bb→use A#, Eb→use D#, Ab→use G#)
              └── PR4 (sharp keys: C#, F#, B  +  remaining: D#, G# if not in PR3)
```

Each PR merges to `main` in order. Every PR boundary leaves the full test suite green.

---

## PR 1 — Infrastructure + C major vertical slice

**Scope:** `shapeLayout.ts` + its tests, `openVoicings.ts` (types + `voicingRole` + `getOpenVoicing` + C major 7 voicings), correctness test (authored-keys-only gate), `ChordShapeDiagram.svelte` + component tests, `DiatonicHarmonizer.svelte` wiring.

**Completion gate:** `npx vitest run` fully green with C major rendering real shapes in the browser; all existing tests still pass; 7 `ChordShapeDiagram` instances mount on initial render.

---

### TASK 1.1 — Write failing tests for `shapeLayout.ts` (RED)

- **File:** `tests/unit/theory/shapeLayout.test.ts` (NEW)
- **Satisfies:** Spec §Shape Geometry Module — scenarios: slNoteX maps absolute fret to window-relative X, open strings are handled
- **Tests to write (RED phase — module does not exist yet):**
  - Import `{ SL, slStringY, slFretLineX, slNoteX, slViewBoxW, slViewBoxH }` from `$lib/theory/shapeLayout` — this import FAILS until the module exists, confirming RED.
  - `SL constants match design spec values`: `SL.STRING_SP === 22`, `SL.FRET_SP === 28`, `SL.TOP_PAD === 20`, `SL.BOTTOM_PAD === 12`, `SL.LEFT_GUTTER === 22`, `SL.NAME_COL_W === 26`, `SL.NUT_W === 5`, `SL.WINDOW_FRETS === 5`, `SL.DOT_R === 8`.
  - `slStringY(0)` returns the largest Y value (low E at bottom); `slStringY(5)` returns the smallest Y value (high e at top); the 6 values are strictly monotonically decreasing.
  - `slFretLineX(f+1) > slFretLineX(f)` for f = 0..4 (monotonically increasing X).
  - `slNoteX(5, 5)` returns the center of window column 0 (i.e., `slFretLineX(0) + SL.FRET_SP / 2`).
  - `slNoteX(9, 5)` returns the center of window column 4 (i.e., `slFretLineX(4) + SL.FRET_SP / 2`).
  - **Sentinel test (design-review finding #4):** `slNoteX(0, baseFret)` for `baseFret = 1` AND `baseFret = 5` BOTH return a value that is strictly LESS THAN `slFretLineX(0)` (i.e., falls in the left gutter, NOT inside the fret grid). Document this sentinel contract in the test: "open strings (absFret === 0) render in the gutter via a fixed X, not via the fret window; `slNoteX(0, b)` returns `SL.LEFT_GUTTER / 2` regardless of baseFret."
  - `slViewBoxW()` equals `SL.LEFT_GUTTER + SL.NUT_W + SL.WINDOW_FRETS * SL.FRET_SP + SL.NAME_COL_W`.
  - `slViewBoxH()` equals `SL.TOP_PAD + 5 * SL.STRING_SP + SL.BOTTOM_PAD`.
- **Done criteria:** all assertions compile and fail (import error or assertion error); `npx vitest run tests/unit/theory/shapeLayout.test.ts` exits non-zero.

---

### TASK 1.2 — Implement `shapeLayout.ts` (GREEN)

- **File:** `src/lib/theory/shapeLayout.ts` (NEW)
- **Satisfies:** Spec §Shape Geometry Module
- **Implementation contract:**
  - Export `SL` constant object with values from design ADR-3 (verbatim from the spec).
  - `slStringY(i)`: `SL.TOP_PAD + (5 - i) * SL.STRING_SP` (low E at bottom = largest Y).
  - `slFretLineX(f)`: `SL.LEFT_GUTTER + SL.NUT_W + f * SL.FRET_SP`.
  - `slNoteX(absFret, baseFret)`: if `absFret === 0` return the open-string sentinel `SL.LEFT_GUTTER / 2`; else return `slFretLineX(absFret - baseFret) + SL.FRET_SP / 2`.
  - `slViewBoxW()`: `SL.LEFT_GUTTER + SL.NUT_W + SL.WINDOW_FRETS * SL.FRET_SP + SL.NAME_COL_W`.
  - `slViewBoxH()`: `SL.TOP_PAD + 5 * SL.STRING_SP + SL.BOTTOM_PAD`.
  - Module MUST NOT import from `$lib/theory/layout` or any other theory module.
  - Add a JSDoc comment on `slNoteX` explaining the open-string sentinel decision: "Open strings (`absFret === 0`) are not placed in the fret window — they render as O badges in the left gutter. `slNoteX(0, b)` returns `SL.LEFT_GUTTER / 2` regardless of `baseFret`. Fretted notes use `slFretLineX(absFret - baseFret) + FRET_SP / 2`."
- **Done criteria:** `npx vitest run tests/unit/theory/shapeLayout.test.ts` exits zero; all assertions pass; no imports from `layout.ts`.

---

### TASK 1.3 — Write failing tests for `voicingRole` and `openVoicings.ts` skeleton (RED)

- **File:** `tests/unit/theory/openVoicings.test.ts` (NEW)
- **Satisfies:** Spec §Voicing Data Contract (scenarios: lookup, missing entry throws, sharp-key baseFret), Spec §Voicing Correctness Invariants (all 84 pass scenario), design ADR-2 (voicingRole table test)
- **Tests to write (RED phase):**

  **Block A — `voicingRole` unit table (design-review finding #1 reinforcement):**
  - `voicingRole(0, 0)` → `'root'`
  - `voicingRole(3, 0)` → `'third'` (minor third)
  - `voicingRole(4, 0)` → `'third'` (major third)
  - `voicingRole(6, 0)` → `'fifth'` (diminished fifth)
  - `voicingRole(7, 0)` → `'fifth'` (perfect fifth)
  - `voicingRole(1, 0)` → `null` (not a triad tone)
  - `voicingRole(11, 0)` → `null`
  - With non-zero rootPc: `voicingRole(4, 4)` → `'root'`; `voicingRole(7, 4)` → `'third'` (3 semis above E = G#? No — G = 7, rootPc = 4 (E), semis = 3 → `'third'`)

  **Block B — `getOpenVoicing` happy path (C major only in PR1):**
  - `getOpenVoicing('C', 1)` returns an object with `rootPc === 0`, `baseFret === 1`, `roman === 'I'`, `quality === 'maj'`.
  - `getOpenVoicing('C', 1).frets` has length 6.
  - All 7 degrees 1–7 return successfully for key `'C'` without throwing.

  **Block C — throw path:**
  - `getOpenVoicing('G#', 1)` throws (G# not yet authored in PR1); assert the thrown error message contains `'G#'`.
  - `expect(() => getOpenVoicing('C', 8 as any)).toThrow()` (degree out of range, undefined index).

  **Block D — correctness invariants (authored-keys-only gate, design-review finding #1):**
  ```
  import { CHROMATIC } from '$lib/types/chord';
  import { STANDARD_TUNING } from '$lib/types/chord';
  import { diatonicTriads } from '$lib/theory/diatonics';

  // The correctness loop skips keys not yet authored:
  const AUTHORED_KEYS = ['C']; // PR1 starts with C only; expand each batch PR

  for (const key of AUTHORED_KEYS) {
    for (let degree = 1; degree <= 7; degree++) {
      const triad = diatonicTriads(key as NoteName)[degree - 1];
      const v = getOpenVoicing(key as NoteName, degree as Degree);

      // Design-review finding #1 — EXACT assertion (NoteNames → PCs, then compare):
      const triadPcSet = new Set(triad.notes.map(n => CHROMATIC.indexOf(n)));

      // Invariant 1 — Subset: every played string's PC must be in triadPcSet
      v.frets.forEach((f, i) => {
        if (f === null) return;
        const pc = (STANDARD_TUNING[i] + f) % 12;
        expect(triadPcSet.has(pc),
          `${key} degree ${degree} string ${i}: pc ${pc} not in triad PC set`
        ).toBe(true);
      });

      // Invariant 2 — Root present
      const playedPcs = v.frets
        .map((f, i) => f !== null ? (STANDARD_TUNING[i] + f) % 12 : null)
        .filter((pc): pc is number => pc !== null);
      expect(playedPcs, `${key} degree ${degree}: rootPc ${triad.rootPc} not in played PCs`)
        .toContain(triad.rootPc);

      // Invariant 3 — Min 3 strings played
      expect(playedPcs.length, `${key} degree ${degree}: fewer than 3 strings played`)
        .toBeGreaterThanOrEqual(3);

      // Invariant 4 — Finger coverage: every fretted string has a non-null finger
      v.frets.forEach((f, i) => {
        if (f !== null && f > 0) {
          expect(v.fingers[i], `${key} degree ${degree} string ${i}: fretted but no finger`)
            .not.toBeNull();
        }
      });

      // Invariant 5 — Metadata agreement
      expect(v.quality).toBe(triad.quality);
      expect(v.rootPc).toBe(triad.rootPc);
      expect(v.roman).toBe(triad.roman);
      expect(v.name).toBe(triad.name);

      // Invariant 6 — Role totality (voicingRole is non-null for every played string)
      playedPcs.forEach(pc => {
        expect(voicingRole(pc, v.rootPc),
          `${key} degree ${degree}: pc ${pc} has null role`
        ).not.toBeNull();
      });

      // Invariant 7 — baseFret sanity
      expect(v.baseFret).toBeGreaterThanOrEqual(1);
      if (v.barre) {
        expect(v.barre.fromString).toBeLessThanOrEqual(v.barre.toString);
        expect(v.barre.fret).toBeGreaterThanOrEqual(v.baseFret);
      }
    }
  }
  ```

  **Block E — sharp-key baseFret constraint (design-review finding #3):**
  ```
  // Written RED in PR1 (sharps not yet authored) — this block will stay RED until PR4.
  // In PR1, wrap in a conditional skip so the suite stays green:
  const SHARP_KEYS = ['C#', 'F#', 'G#', 'D#', 'A#'] as const;
  describe.skip('sharp-key baseFret > 1 (activate in PR4 when sharps are authored)', () => {
    for (const key of SHARP_KEYS) {
      for (let degree = 1; degree <= 7; degree++) {
        it(`${key} degree ${degree} has baseFret > 1`, () => {
          const v = getOpenVoicing(key as NoteName, degree as Degree);
          expect(v.baseFret, `${key} deg ${degree}: expected baseFret > 1`).toBeGreaterThan(1);
        });
      }
    }
  });
  ```
  Remove the `.skip` in PR4 after sharps are authored.

- **Done criteria:** all non-skipped assertions fail (import error); `npx vitest run tests/unit/theory/openVoicings.test.ts` exits non-zero.

---

### TASK 1.4 — Implement `openVoicings.ts` skeleton + C major voicings (GREEN)

- **File:** `src/lib/theory/openVoicings.ts` (NEW)
- **Satisfies:** Spec §Voicing Data Contract, Spec §Voicing Correctness Invariants (C major subset), design ADR-1 and ADR-2
- **Implementation contract:**
  - Export all types: `StringFret`, `Finger`, `BarreSpec`, `OpenVoicing`, `OpenVoicingMap`, `VoicingRole`.
  - Export `voicingRole(pc, rootPc)` — exact implementation from design ADR-2.
  - Export `OPEN_VOICINGS: OpenVoicingMap` — initially containing only key `'C'` with exactly 7 voicings in degree order (I through vii°).
  - C major voicings (all with `baseFret: 1`):
    - I (C major): `frets: [null,3,2,0,1,0]`, `fingers: [null,3,2,null,1,null]`, rootPc 0
    - ii (Dm): `frets: [null,null,0,2,3,1]`, `fingers: [null,null,null,2,3,1]`, rootPc 2
    - iii (Em): `frets: [0,2,2,0,0,0]`, `fingers: [null,2,3,null,null,null]`, rootPc 4
    - IV (F major): `frets: [1,1,2,3,3,1]`, `fingers: [1,1,2,4,3,1]`, `barre: {fret:1,fromString:0,toString:5}`, rootPc 5
    - V (G major): `frets: [3,2,0,0,0,3]`, `fingers: [2,1,null,null,null,3]`, rootPc 7
    - vi (Am): `frets: [null,0,2,2,1,0]`, `fingers: [null,null,2,3,1,null]`, rootPc 9
    - vii° (B°): `frets: [null,2,0,1,null,null]`, `fingers: [null,2,null,1,null,null]`, rootPc 11
  - **Note:** these are starter voicings to be validated by the correctness test. The apply agent MUST run the correctness test after entering each key's 7 voicings and correct any that fail.
  - Export `getOpenVoicing(keyRoot: NoteName, degree: Degree): OpenVoicing` — implementation per design ADR-1 throw contract.
- **Done criteria:** `npx vitest run tests/unit/theory/openVoicings.test.ts` exits zero for Blocks A, B, C, D (AUTHORED_KEYS = ['C']), E is `.skip`; all C major correctness assertions pass.

---

### TASK 1.5 — Write failing component tests for `ChordShapeDiagram.svelte` (RED)

- **File:** `tests/components/ChordShapeDiagram.test.ts` (NEW)
- **Satisfies:** Spec §Compact Shape Diagram Rendering (all scenarios), design ADR-4 (data-* hooks)
- **Tests to write (RED phase — component does not exist yet):**

  Use the same harness as `ChordFretboard.test.ts`: `vi.mock('$lib/audio/playNote', ...)`, lazy `importComponent`, `@testing-library/svelte` `render`.

  Drive tests with `getOpenVoicing('C', 1)` (rootPc=0, baseFret=1, open position) and a barre voicing object constructed inline for the barre tests.

  - `renders without throwing` — `render(ChordShapeDiagram, { voicing, rootPc: 0 })` resolves.
  - `renders role="img"` — `screen.getByRole('img')` exists.
  - `aria-label is non-empty and contains the chord name` — `aria-label` contains `'C major'` when `chordName='C major'` is passed.
  - `[data-role] count equals played-string count` — count of elements with `[data-role]` equals count of strings where `frets[i] !== null`.
  - `data-base-fret present and equals voicing.baseFret` — `container.querySelector('[data-base-fret]')?.getAttribute('data-base-fret')` equals `String(voicing.baseFret)`.
  - `data-open count equals open-string count` — `[data-open]` count matches strings where `frets[i] === 0`.
  - `data-muted count equals muted-string count` — `[data-muted]` count matches strings where `frets[i] === null`.
  - **Open-string data-role and name-column (design-review finding #2):** For a voicing known to have open strings, assert that each `[data-open]` element ALSO has `data-role` set to the correct role (root/third/fifth), and that the name-column group (`[data-name-col]`) contains text with a `fill-note-{role}` class for that open string. Write the assertion for C major degree I (G string open: pc = (2+0)%12 = 2, semis from rootPc 0 = 2 → null — so check a string that IS a chord tone; use string index 3 (open G): (7+0)%12=7, voicingRole(7,0)='fifth', class='fill-note-tone').
    ```ts
    // For C major I (frets: [null,3,2,0,1,0]):
    // String 3 (D string, frets[3]=0): pc = (7+0)%12 = 7, role = 'fifth'
    // String 5 (high e, frets[5]=0): pc = (4+0)%12 = 4, role = 'third' (semis=4)
    const nameColGroup = container.querySelector('[data-name-col]');
    expect(nameColGroup).not.toBeNull();
    const noteWithFifthClass = nameColGroup!.querySelector('.fill-note-tone');
    expect(noteWithFifthClass, 'open G string note name should have fill-note-tone class').not.toBeNull();
    ```
  - `thick nut when baseFret === 1` — `[data-base-fret="1"]` element has SVG `stroke-width` attribute >= 3 OR its class matches a token that implies thick nut (implementation flexibility here — assert the structural marker exists, not the exact pixel value).
  - `no barre element for open-position voicing` — `container.querySelector('[data-barre]')` is `null` for C major I.
  - `barre element present for barre voicing` — inline-constructed voicing with `barre: { fret: 2, fromString: 1, toString: 5 }` renders `[data-barre]` in the container.
  - `fret label "5fr" present when baseFret === 5` — inline voicing with `baseFret: 5` renders a text element containing `'5fr'` and `[data-base-fret="5"]`.
  - **Token-only colors (verbatim from ChordFretboard test):**
    ```ts
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(html).not.toContain('rgb(');
    expect(html).not.toContain('hsl(');
    expect(html).not.toContain('fill="white"');
    ```
  - `note-name column contains expected letters for C major I` — `[data-name-col]` text includes `'C'` (the root on string 2, frets[2]=2: (2+2)%12=4? No — wait: STANDARD_TUNING[2]=2 (D), frets[2]=2, pc=(2+2)%12=4 (E). Actually C on string 1: STANDARD_TUNING[1]=9 (A), frets[1]=3, pc=(9+3)%12=0 (C). So the name column for string 1 should show 'C').
    ```ts
    const nameCol = container.querySelector('[data-name-col]');
    expect(nameCol!.textContent).toContain('C');
    ```
  - **Tailwind purge-safety assertion (design-review finding #5):** grep the component's HTML for any dynamic class interpolation artifact — the test cannot catch the source, but assert that ALL expected role classes appear as complete literal tokens:
    ```ts
    const html = container.innerHTML;
    // At least one element carries each full token string as a class (no partial fragments)
    expect(html).toMatch(/fill-note-root/);
    expect(html).toMatch(/fill-note-third|fill-note-tone/); // third or fifth present depending on voicing
    // Negative: no class attribute contains an interpolation fragment like 'fill-note-' alone
    // (testing: no class="fill-note-" without a role suffix)
    expect(html).not.toMatch(/class="[^"]*fill-note-[^a-z][^"]*"/);
    ```

- **Done criteria:** all tests fail (component missing); `npx vitest run tests/components/ChordShapeDiagram.test.ts` exits non-zero.

---

### TASK 1.6 — Implement `ChordShapeDiagram.svelte` (GREEN)

- **File:** `src/lib/components/ChordShapeDiagram.svelte` (NEW)
- **Satisfies:** Spec §Compact Shape Diagram Rendering (all scenarios), design ADR-4
- **Implementation contract:**
  - Props via `interface Props` + `$props()`: `voicing: OpenVoicing`, `rootPc: number`, `chordName?: string`.
  - No `$state`. `perString` computed as `$derived` list per design ADR-4.
  - SVG structure follows design ADR-4 (z-order: title/desc → nut/baseFret indicator → string+fret lines → gutter badges → barre rect → finger dots → note-name column).
  - **Tailwind purge safety (design-review finding #5):** The role→class map MUST use a static const object, NEVER template-literal interpolation:
    ```ts
    const ROLE_CLASS: Record<VoicingRole, string> = {
      root: 'fill-note-root',
      third: 'fill-note-third',
      fifth: 'fill-note-tone',
    } as const;
    // Usage: class={ROLE_CLASS[role]} — never class="fill-note-{role}"
    ```
  - Open strings (f === 0): derive `pc = STANDARD_TUNING[i]`, `role = voicingRole(pc, rootPc)`, render O badge in gutter with `data-open`, `data-string={i}`, `data-role={role}`. Note-name column cell for open strings gets `class={ROLE_CLASS[role]}` and `data-role={role}`.
  - Muted strings (f === null): render × in gutter with `data-muted`, `data-string={i}`. No name-column cell.
  - Fretted strings (f > 0): finger dot with `class={ROLE_CLASS[role]}`, `data-role={role}`, `data-string={i}`; finger number text with `class="fill-ink"`.
  - Barre (when `voicing.barre` present): rounded rect at `slNoteX(barre.fret, baseFret)` spanning from `slStringY(barre.fromString)` to `slStringY(barre.toString)`, `class="fill-note-root" opacity="0.75"`, `data-barre` attribute.
  - Nut: when `baseFret === 1`, render thick line (stroke-width = `SL.NUT_W`, likely 5) at `slFretLineX(0)` with `data-base-fret="1"`. When `baseFret > 1`, render thin line + `{baseFret}fr` text in left gutter, `data-base-fret={baseFret}`.
  - All color via Tailwind token classes only. No `fill="#..."`, `fill="rgb(..."`, `fill="hsl(..."`, or `fill="white"`.
- **Done criteria:** `npx vitest run tests/components/ChordShapeDiagram.test.ts` exits zero; all assertions pass.

---

### TASK 1.7 — Wire `ChordShapeDiagram` into `DiatonicHarmonizer.svelte` (additive edit)

- **File:** `src/lib/components/DiatonicHarmonizer.svelte` (EDIT — only file modified in this PR)
- **Satisfies:** Spec §DiatonicHarmonizer Wiring (all scenarios)
- **Implementation contract:**
  - Add two imports at the top of the script block:
    ```ts
    import { getOpenVoicing } from '$lib/theory/openVoicings';
    import ChordShapeDiagram from '$lib/components/ChordShapeDiagram.svelte';
    ```
  - Inside the `{#each triads as t (t.degree)}` card, after `data-construction-stack` slot, add:
    ```svelte
    {@const voicing = getOpenVoicing(root, t.degree)}
    <ChordShapeDiagram {voicing} rootPc={t.rootPc} chordName={t.name} />
    ```
  - No new `$state` introduced. `root` (existing `$state`) already drives reactivity.
  - Do NOT touch `layout.ts`, `ChordFretboard.svelte`, or `ChordBuilder.svelte`.
- **Wiring tests to add to `DiatonicHarmonizer.test.ts`** (additive — existing tests must stay green):
  - `renders exactly 7 ChordShapeDiagram instances on mount` — `container.querySelectorAll('[role="img"]').length === 7` (ChordShapeDiagram renders role="img" SVGs; existing DiatonicHarmonizer has no role="img" elements yet).
  - `key change updates all 7 diagrams` — after `fireEvent.click(gBtn)` for key G, assert `container.querySelectorAll('[data-base-fret]').length === 7` (all diagrams re-rendered with G voicings).
  - `existing assertions still pass` — the full `DiatonicHarmonizer.test.ts` suite (all existing describes) must remain green; this is checked by running `npx vitest run tests/components/DiatonicHarmonizer.test.ts`.
- **Done criteria:** `npx vitest run` (full suite) exits zero; 7 ChordShapeDiagram instances render for C major; key change to G re-renders all 7.

---

### TASK 1.8 — Full regression run and PR1 green gate

- **Command:** `npx vitest run`
- **Satisfies:** Spec §DiatonicHarmonizer Wiring scenario "ChordFretboard and ChordBuilder tests still pass", design ADR-7
- **Done criteria:**
  - `tests/unit/theory/layout.test.ts` — zero new failures
  - `tests/components/ChordFretboard.test.ts` — zero new failures
  - `tests/components/ChordBuilder.test.ts` — zero new failures
  - `tests/components/DiatonicHarmonizer.test.ts` — all existing tests pass + 2 new wiring tests pass
  - `tests/unit/theory/shapeLayout.test.ts` — all green
  - `tests/unit/theory/openVoicings.test.ts` — all green (sharp-key block skipped)
  - `tests/components/ChordShapeDiagram.test.ts` — all green
  - Total suite: exits zero.
- **PR1 commit sequence (work-unit commits):**
  1. `test(shape-diagram): add failing shapeLayout unit tests`
  2. `feat(shape-diagram): implement shapeLayout pure geometry module`
  3. `test(shape-diagram): add failing openVoicings and correctness tests`
  4. `feat(shape-diagram): implement openVoicings types, voicingRole, getOpenVoicing, C major voicings`
  5. `test(shape-diagram): add failing ChordShapeDiagram component tests`
  6. `feat(shape-diagram): implement ChordShapeDiagram SVG component`
  7. `feat(diatonic-harmonizer): wire ChordShapeDiagram into DiatonicHarmonizer`
  8. `test(diatonic-harmonizer): extend wiring tests for 7-diagram mount and key reactivity`

---

## PR 2 — Voicing data batch: natural keys G, D, A, E, F

**Dependencies:** PR1 merged to main.
**Scope:** Add 35 voicings (5 keys × 7 degrees each) to `OPEN_VOICINGS` in `openVoicings.ts`; extend `AUTHORED_KEYS` in the correctness test to `['C','G','D','A','E','F']`; ensure all correctness assertions pass for the new keys; unskip no skipped blocks.

---

### TASK 2.1 — Author G major voicings (7 voicings) and run correctness test (RED→GREEN)

- **File:** `src/lib/theory/openVoicings.ts` (EDIT — data only)
- **Satisfies:** Spec §Voicing Correctness Invariants (all 84 pass), Spec §Voicing Data Contract (84 entries)
- **Procedure:**
  1. Add `'G': [ ...7 OpenVoicing objects... ]` to `OPEN_VOICINGS`.
  2. Update `AUTHORED_KEYS` in the correctness test to include `'G'`.
  3. Run `npx vitest run tests/unit/theory/openVoicings.test.ts` — must exit zero.
- **Done criteria:** all 7 G major voicings pass subset, root-present, ≥3-strings, finger-coverage, metadata, role-totality, and baseFret invariants.

### TASK 2.2 — Author D major voicings + run correctness test

- Same procedure as 2.1 for key `'D'`. After authoring, add `'D'` to `AUTHORED_KEYS`, run test.

### TASK 2.3 — Author A major voicings + run correctness test

- Key `'A'`. Add to `AUTHORED_KEYS`, run test.

### TASK 2.4 — Author E major voicings + run correctness test

- Key `'E'`. Add to `AUTHORED_KEYS`, run test.

### TASK 2.5 — Author F major voicings + run correctness test

- Key `'F'`. Note: F major IV = Bb major — needs barre shape (`baseFret > 1`); vii° = E° partial shape. Add to `AUTHORED_KEYS`, run test.

### TASK 2.6 — PR2 regression run

- **Command:** `npx vitest run` — full suite green.
- **PR2 commit sequence:**
  1. `feat(voicings): add G major open-position voicings (7 shapes)`
  2. `feat(voicings): add D major open-position voicings (7 shapes)`
  3. `feat(voicings): add A major open-position voicings (7 shapes)`
  4. `feat(voicings): add E major open-position voicings (7 shapes)`
  5. `feat(voicings): add F major open-position voicings (7 shapes)`
  - Each commit also extends `AUTHORED_KEYS` in the test; the correctness test stays green at every commit boundary.

---

## PR 3 — Voicing data batch: flat-spelled keys B♭(A#), E♭(D#), A♭(G#) + B

**Dependencies:** PR2 merged to main.
**Scope:** Add 28 voicings (4 keys × 7 degrees) — these are movable barre shapes with `baseFret > 1`. The correctness test is extended for each key as it is authored.

**Important:** The project spells these keys as `A#`, `D#`, `G#` (not Bb/Eb/Ab) per `NoteName` type in `chord.ts`. Author under the correct `NoteName` spellings.

---

### TASK 3.1 — Author A# (Bb) barre voicings + correctness test (RED→GREEN)

- **File:** `src/lib/theory/openVoicings.ts` (EDIT — data only)
- All 7 A# voicings must have `baseFret > 1`. Run correctness test; must pass.

### TASK 3.2 — Author D# (Eb) barre voicings + correctness test

### TASK 3.3 — Author G# (Ab) barre voicings + correctness test

### TASK 3.4 — Author B major voicings + correctness test

- B major in open position uses a partial barre or barre at fret 2; `baseFret` may be 1 or 2 depending on the shape chosen. Correctness test decides.

### TASK 3.5 — PR3 regression run

- **Command:** `npx vitest run` — full suite green.
- **PR3 commit sequence:** one commit per key, same pattern as PR2.

---

## PR 4 — Voicing data batch: sharp keys C#, F#, D#(if not PR3), G#(if not PR3) + activate sharp-key spec test

**Dependencies:** PR3 merged to main.
**Scope:** Add remaining voicings for `C#`, `F#` (and any remaining sharp keys not covered in PR3). All 84 voicings authored. Remove `.skip` from the sharp-key block in `openVoicings.test.ts` (design-review finding #3 fully activated). Final correctness run asserts all 84 voicings.

---

### TASK 4.1 — Author C# barre voicings + correctness test (RED→GREEN)

- All 7 C# voicings must have `baseFret > 1`. Run test after each degree-7 batch.

### TASK 4.2 — Author F# barre voicings + correctness test

### TASK 4.3 — Remove `.skip` from sharp-key block in `openVoicings.test.ts`

- **File:** `tests/unit/theory/openVoicings.test.ts` (EDIT)
- **Satisfies:** Spec §Voicing Data Contract scenario "Sharp-key voicing uses baseFret > 1", design-review finding #3
- Change `describe.skip('sharp-key baseFret > 1 ...')` → `describe('sharp-key baseFret > 1 ...')`.
- Run `npx vitest run tests/unit/theory/openVoicings.test.ts` — all 35 sharp-key degree assertions must pass (5 keys × 7 degrees).

### TASK 4.4 — Final 84-voicing correctness run

- Update `AUTHORED_KEYS` to include all 12 keys: `['C','G','D','A','E','F','A#','D#','G#','B','C#','F#']`.
- Run `npx vitest run tests/unit/theory/openVoicings.test.ts` — 84 voicings × all invariants = all green.
- Confirm `OPEN_VOICINGS` has exactly 12 top-level keys, each with exactly 7 voicings.

### TASK 4.5 — PR4 full regression run

- **Command:** `npx vitest run` — entire suite green; no skipped blocks in sharp-key section.
- **PR4 commit sequence:**
  1. `feat(voicings): add C# barre voicings (7 shapes, baseFret > 1)`
  2. `feat(voicings): add F# barre voicings (7 shapes, baseFret > 1)`
  3. `test(voicings): activate sharp-key baseFret > 1 assertion block (all 5 sharp keys)`
  4. `test(voicings): extend authored-keys to all 12; final 84-voicing correctness gate`

---

## Cross-cutting constraints (apply to ALL tasks)

### Tailwind purge safety (design-review finding #5)
The `ROLE_CLASS` map in `ChordShapeDiagram.svelte` MUST be defined as a static const object with FULL, LITERAL class strings:
```ts
const ROLE_CLASS: Record<VoicingRole, string> = {
  root: 'fill-note-root',    // literal — never 'fill-note-' + role
  third: 'fill-note-third',  // literal
  fifth: 'fill-note-tone',   // literal
} as const;
```
Dynamic class construction (`\`fill-note-${role}\``) is PROHIBITED. Tailwind's content scanner only detects full class strings; interpolated fragments are purged in production builds. This is enforced by the token-only component test.

### Correctness test PC derivation (design-review finding #1)
The correctness test converts `triad.notes` (which are `NoteName[]`, NOT pitch classes) to pitch classes BEFORE comparison. The exact required pattern:
```ts
const triadPcSet = new Set(triad.notes.map(n => CHROMATIC.indexOf(n)));
```
Do NOT compare `triad.notes` directly against computed PCs — `triad.notes` are strings like `'C'`, `'E'`, `'G'`; the comparison must happen in the pitch-class domain.

### Open-string name-column role (design-review finding #2)
Open strings (frets[i] === 0) are chord tones and MUST have:
1. A `data-role` attribute on the gutter O badge.
2. A corresponding colored note-letter in the name column with `class={ROLE_CLASS[role]}` and `data-role={role}`.

### shapeLayout open-string sentinel (design-review finding #4)
`slNoteX(0, baseFret)` returns a gutter sentinel (e.g., `SL.LEFT_GUTTER / 2`) for ANY `baseFret`. The component MUST NOT call `slNoteX` for open strings; open strings are rendered as O badges at a fixed gutter X. This behavior is pinned by the `shapeLayout.test.ts` sentinel assertion so component and module stay in sync.

### No modifications to existing files (except DiatonicHarmonizer.svelte)
`layout.ts`, `ChordFretboard.svelte`, `ChordBuilder.svelte`, `chords.ts`, `diatonics.ts`, `tuning.ts` MUST remain byte-for-byte identical. Only `DiatonicHarmonizer.svelte` is edited (additive wiring only). Confirmed by zero new failures in their existing test files.

---

## Task order summary (sequential within PR, parallel opportunities noted)

| Task | PR | Parallel with | Sequential after |
|---|---|---|---|
| 1.1 Write shapeLayout tests | PR1 | — | — |
| 1.2 Implement shapeLayout | PR1 | — | 1.1 |
| 1.3 Write openVoicings tests | PR1 | — | 1.2 |
| 1.4 Implement openVoicings (C major) | PR1 | — | 1.3 |
| 1.5 Write ChordShapeDiagram tests | PR1 | — | 1.4 |
| 1.6 Implement ChordShapeDiagram | PR1 | — | 1.5 |
| 1.7 Wire into DiatonicHarmonizer | PR1 | — | 1.6 |
| 1.8 Full regression run | PR1 | — | 1.7 |
| 2.1–2.5 Natural key voicings | PR2 | each key parallel once types exist | PR1 merged |
| 2.6 PR2 regression | PR2 | — | 2.1–2.5 |
| 3.1–3.4 Flat/sharp-spelled key voicings | PR3 | each key parallel | PR2 merged |
| 3.5 PR3 regression | PR3 | — | 3.1–3.4 |
| 4.1–4.2 Sharp key voicings | PR4 | parallel | PR3 merged |
| 4.3 Activate sharp-key test block | PR4 | — | 4.1–4.2 |
| 4.4 Final 84-voicing run | PR4 | — | 4.3 |
| 4.5 PR4 regression | PR4 | — | 4.4 |

Tasks within each PR are strictly sequential (TDD order). Tasks 2.1–2.5 and 3.1–3.4 CAN be authored in parallel by multiple agents (they touch only different keys in the same data object) but the correctness test run must be sequential (one key at a time to get clear failure messages).
