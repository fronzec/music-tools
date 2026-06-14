# Tasks: interval-explorer

**Change**: Interval Explorer — Explore mode in IntervalTrainer
**Strategy**: Single PR (documented cut line at Slice 1/2 boundary if hard 400-line cap is enforced)
**TDD mode**: STRICT — all tasks follow RED → GREEN. Tests are written before production code.

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Total estimated changed lines | ~410 |
| Slice 1 (intervals.ts + IntervalFretboard + tests) | ~280 |
| Slice 2 (IntervalTrainer toggle + integration tests) | ~130 |
| Chained PRs recommended | No — single PR |
| 400-line budget risk | Medium (slightly over; ~170 of 410 are test lines) |
| Decision needed before apply | No — single PR proceeds; cut line documented above if reviewer enforces hard cap |

---

## Dependency Graph

```
T1 (types + constant) → T2 (pure fn RED) → T3 (pure fn GREEN) → T4 (pure fn edge cases GREEN)
                                                                            ↓
                          T5 (IntervalFretboard test RED) → T6 (IntervalFretboard GREEN) → T7 (IntervalFretboard a11y)
                                                                            ↓
                                           T8 (IntervalTrainer toggle tests RED) → T9 (IntervalTrainer toggle GREEN)
                                                                            ↓
                                                           T10 (IntervalTrainer Explore Play test RED) → T11 (Play GREEN)
                                                                            ↓
                                                                      T12 (regression guard)
```

Tasks T1–T4 are Slice 1 pure-theory. Tasks T5–T7 are Slice 1 component. Tasks T8–T12 are Slice 2.
T5 can start once T3 is green (pure fn contract is stable). T8 can start once T6 is green.

---

## Slice 1 — Pure fn + IntervalFretboard (~280 lines)

### [x] T1 — Add `IntervalPosition` interface and `MAX_FRET` constant
**File**: `src/lib/theory/intervals.ts`
**Type**: Sequential (foundation for T2)
**Action**: Export `IntervalPosition` interface (`stringIndex`, `fret`, `pitchClass`, `role: 'root' | 'target'`) and `export const MAX_FRET = 14`. No function body yet.
**Acceptance**:
- TypeScript compiles without error.
- Existing test suite (`npx vitest run tests/unit/theory/intervals.test.ts`) stays green.
**Spec ref**: Req 1 — Fretboard Position Highlight Set; Design Decision 1.

---

### [x] T2 — Write failing tests for `intervalPositions` (RED)
**File**: `tests/unit/theory/intervals.test.ts` (extend)
**Type**: Sequential after T1
**Action**: Add a `describe('intervalPositions')` block with all test cases listed below. Import `intervalPositions` (will fail to compile until T3 exports it — that is the expected RED state).

Test cases to add:
1. `intervalPositions(0, 7)` returns an array (basic smoke).
2. `intervalPositions(0, 7)` — every returned position has `fret` in `[0, 14]` (no out-of-bounds).
3. `intervalPositions(0, 7)` — every returned position has `stringIndex` in `[0, 5]`.
4. `intervalPositions(0, 7)` — all `role: 'root'` positions have `pitchClass === 0`.
5. `intervalPositions(0, 7)` — all `role: 'target'` positions have `pitchClass === 7`.
6. `intervalPositions(0, 7)` — low E string (stringIndex 0, open pc 4): root C at fret 8 is present, fret 20 is NOT present (regression: fret > 14 excluded).
7. `intervalPositions(0, 12)` (Perfect Octave edge case) — `targetPc === rootPc`; zero marks with `role: 'target'`; all matching marks have `role: 'root'`.
8. `intervalPositions(0, 7)` is deterministic — calling twice with same args returns identical arrays (deep equal).
9. `intervalPositions(-1, 7)` — negative root normalizes: all `role: 'root'` positions have `pitchClass === 11`.

**Acceptance**: `npx vitest run tests/unit/theory/intervals.test.ts` fails with import/missing-export errors only — not logic failures.
**Spec ref**: Req 1 (scenarios S1.1–S1.5); Design Decision 4.

---

### [x] T3 — Implement `intervalPositions` (GREEN)
**File**: `src/lib/theory/intervals.ts`
**Type**: Sequential after T2
**Action**: Export the function. Implementation constraints (NON-NEGOTIABLE):
- Normalize `rootPc = ((rootPc % 12) + 12) % 12`.
- `targetPc = (rootPc + intervalSemitones) % 12`.
- Outer `for` loop: `stringIndex` from 0 to 5 inclusive (STANDARD_TUNING must be imported/referenced from its existing export in `types/chord.ts` or `notes.ts` — whichever already exports it; do NOT redefine it).
- Inner `for` loop: `fret` from 0 to `MAX_FRET` (14) inclusive.
- `pc = (STANDARD_TUNING[stringIndex] + fret) % 12`.
- `if (pc === rootPc)` → push `{ stringIndex, fret, pitchClass: pc, role: 'root' }`.
- `else if (pc === targetPc)` → push `{ stringIndex, fret, pitchClass: pc, role: 'target' }`.
- NO while-loops. NO recursion. NO unbound iteration.
**Acceptance**: All T2 tests pass. All prior `intervals.test.ts` tests remain green.
**Spec ref**: Design Decision 1 (algorithm exact).

---

### [x] T4 — Spot-check additional edge cases (GREEN — extend test file)
**File**: `tests/unit/theory/intervals.test.ts`
**Type**: Sequential after T3
**Action**: Add inside the existing `describe('intervalPositions')`:
1. Known-coordinate spot check — `intervalPositions(0, 7)`: assert that `{ stringIndex: 0, fret: 8, role: 'root' }` is in the result (low E, C at fret 8, pc = (4+8)%12 = 0 ✓).
2. Known-coordinate spot check — `intervalPositions(0, 7)`: assert that `{ stringIndex: 0, fret: 3, role: 'target' }` is in the result (low E, G at fret 3, pc = (4+3)%12 = 7 ✓).
3. Assert fret 15 is NOT present in any position from `intervalPositions(0, 7)` (regression guard, title it "no fret > 14").
4. `intervalPositions(0, 7)` result count matches known theory: 6 strings × each string has some occurrences of pc 0 and pc 7. Assert total count > 0 and ≤ 90 (6 strings × 15 frets max theoretical; typically ~12–18 for P5).

**Acceptance**: All tests green. Test labeled "no fret > 14" must exist as its own `it(...)` block.
**Spec ref**: Req 1 — S1.3 (bound guard); Design Decision 4 (regression test).

---

### [x] T5 — Write failing tests for `IntervalFretboard.svelte` (RED)
**File**: `tests/components/IntervalFretboard.test.ts` (new file)
**Type**: Sequential after T3 (needs the pure fn contract stable); parallel with T4
**Action**: Create the test file modeled on `tests/components/FullFretboard.test.ts` harness style. Add these test cases:
1. Renders without throwing given `{ rootPc: 0, intervalSemitones: 7 }`.
2. Renders a `role="img"` element.
3. `aria-label` on `role="img"` element is non-empty and contains "interval" (case-insensitive).
4. The number of `[data-role="root"]` elements equals the count of `role: 'root'` marks from `intervalPositions(0, 7)`.
5. The number of `[data-role="target"]` elements equals the count of `role: 'target'` marks from `intervalPositions(0, 7)`.
6. `[data-role="root"]` elements have a `fill` attribute of `#FACC15` (ROOT_COLOR).
7. `[data-role="target"]` elements have a `fill` attribute of `#2563EB`.
8. With `rootPc=0, intervalSemitones=12` (octave), there are zero `[data-role="target"]` elements.
9. Component re-renders correctly when `intervalSemitones` changes from 7 to 5 (P4) — use `rerender`; assert that `[data-role="target"]` count matches `intervalPositions(0, 5)` filtered for target.

Use existing `vi.mock('$lib/audio/playNote', ...)` pattern from `IntervalTrainer.test.ts` (hoist it at the top of the file). No AudioContext stub needed — component has no audio. Use `@testing-library/svelte`'s `render` / `rerender`.

**Acceptance**: `npx vitest run tests/components/IntervalFretboard.test.ts` fails because `IntervalFretboard.svelte` does not exist yet.
**Spec ref**: Req 1, Req 4; Design Decision 2, Decision 4.

---

### [x] T6 — Implement `IntervalFretboard.svelte` (GREEN)
**File**: `src/lib/components/IntervalFretboard.svelte` (new file)
**Type**: Sequential after T5
**Action**: Implement the presentational component. Hard requirements:
- Props (Svelte 5 runes): `let { rootPc, intervalSemitones, rootName, targetName, width } = $props()` — types match `IntervalPosition` domain; `rootName?`, `targetName?`, `width?` optional.
- `let marks = $derived(intervalPositions(rootPc, intervalSemitones))` — import from `$lib/theory/intervals`. ONE algorithm, ONE test surface.
- Geometry: import `noteX`, `stringY`, `viewBoxW`, `viewBoxH`, `fretLineX`, `FRET_MARKERS`, `L` from `$lib/theory/layout`. Use `rangeStart = 0`, `span = 14` (identical to FullFretboard).
- Render order: bg rect → fret lines → marker backgrounds → string lines → marker dots → nut line → marks → fret numbers. Mirror FullFretboard's render order.
- Each mark is a `<circle>` with:
  - Root: `r={L.ROOT_R}`, `fill="#FACC15"`, `data-role="root"`.
  - Target: `r={L.TONE_R}`, `fill="#2563EB"`, `data-role="target"`.
  - White note-name label (`<text fill="white">`).
- Neck chrome uses the same Tailwind `class:` light/dark token pattern as FullFretboard (`fill-white dark:fill-gray-900`, etc.).
- Accessibility: `<figure role="img" aria-label="{rootName ?? 'Root'} {targetName ?? 'Target'} interval — positions across the neck">` with `<title>` and `<desc>` children.
- NO onclick handlers, NO audio, NO internal $state (purely derived from props).
- Loops in the component template (if any) must be bounded `{#each}` over the marks array — no while/unbounded iteration.

**Acceptance**: All T5 tests pass. Run `npx vitest run tests/components/IntervalFretboard.test.ts`.
**Spec ref**: Req 1, Req 4; Design Decision 2 (full prop contract).

---

### [x] T7 — Verify `IntervalFretboard` accessibility and reactivity (GREEN)
**File**: `tests/components/IntervalFretboard.test.ts` (extend)
**Type**: Sequential after T6
**Action**: Add tests (they should be green immediately since T6 is complete):
1. When `rootName="C"` and `targetName="G"` are passed, `aria-label` contains "C" and "G".
2. With `width=500` prop, the SVG `width` attribute reflects it (if component uses it).
3. TypeScript types: confirm the component can be imported as `ComponentType` (smoke check — compiler-level).

**Acceptance**: All tests green. `npx vitest run tests/components/IntervalFretboard.test.ts` fully passes.
**Spec ref**: Req 4 — Fretboard Accessibility (S4.1, S4.2).

---

## Slice 2 — IntervalTrainer toggle + integration (~130 lines)

### [x] T8 — Write failing tests for the Practice↔Explore toggle (RED)
**File**: `tests/components/IntervalTrainer.test.ts` (extend — add new `describe` block)
**Type**: Sequential after T6 (needs IntervalFretboard available)
**Action**: Inside the existing `describe('IntervalTrainer')`, add `describe('mode toggle')` with:
1. Default mode is Practice — `role="img"` (IntervalFretboard) is NOT in the DOM on mount.
2. Default mode is Practice — exactly 4 answer buttons (aria-label `^Answer`) are present on mount.
3. "Practice" toggle button exists and has `aria-pressed="true"` on mount.
4. "Explore" toggle button exists and has `aria-pressed="false"` on mount.
5. Clicking "Explore" toggle shows `role="img"` (the fretboard).
6. Clicking "Explore" toggle shows a button with `aria-label="Play interval"`.
7. Clicking "Explore" toggle hides the 4 answer buttons (none with `^Answer` aria-label).
8. Clicking "Explore" then "Practice" restores exactly 4 answer buttons.
9. Clicking "Explore" then "Practice" re-establishes `aria-pressed="true"` on the Practice button.
10. (Accessibility) Toggle buttons have `role="button"` (implicit) and the active button has `aria-pressed="true"`.

Do NOT add Explore Play tests yet (that is T10). This describe block tests navigation only.

**Acceptance**: `npx vitest run tests/components/IntervalTrainer.test.ts` — existing tests pass; new toggle tests fail because the toggle does not exist yet.
**Spec ref**: interval-trainer delta Req 1 — Practice/Explore Mode Toggle (S5.1–S5.3, S5.5); Design Decision 3.

---

### [x] T9 — Implement the Practice↔Explore toggle in `IntervalTrainer.svelte` (GREEN)
**File**: `src/lib/components/IntervalTrainer.svelte` (modify)
**Type**: Sequential after T8
**Action**: Minimal, additive changes only. Do NOT touch existing quiz logic.
1. Add state runes:
   ```ts
   let mode = $state<'practice' | 'explore'>('practice');
   let exploreRootPc = $state(0);
   let exploreSemitones = $state(7);
   ```
2. Add derived values:
   ```ts
   let exploreInterval = $derived(intervalBySemitones(exploreSemitones));
   let exploreRootName = $derived(semitoneToNoteName(exploreRootPc));
   let exploreTargetName = $derived(semitoneToNoteName((exploreRootPc + exploreSemitones) % 12));
   ```
3. Add a 2-button segmented control at the top of the template (above existing quiz markup):
   ```svelte
   <button aria-pressed={mode === 'practice'} onclick={() => (mode = 'practice')}>Practice</button>
   <button aria-pressed={mode === 'explore'} onclick={() => (mode = 'explore')}>Explore</button>
   ```
4. Wrap the existing quiz block in `{#if mode === 'practice'}...{/if}`.
5. Add `{:else}` branch with:
   - Root selector: `<select>` iterating CHROMATIC (12 entries), `bind:value={exploreRootPc}` (or controlled via `onchange`), `aria-label="Root note"`.
   - Interval selector: `<select>` iterating INTERVALS (12 entries), `bind:value={exploreSemitones}`, `aria-label="Interval"`.
   - Play button: `<button aria-label="Play interval" onclick={playExplore}>▶ Play</button>`.
   - Caption paragraph.
   - `<IntervalFretboard rootPc={exploreRootPc} intervalSemitones={exploreSemitones} rootName={exploreRootName} targetName={exploreTargetName} />`.
6. Add `playExplore` function (does NOT call player yet; wire in T11):
   ```ts
   function playExplore() { /* placeholder */ }
   ```
7. Import `IntervalFretboard` from `$lib/components/IntervalFretboard.svelte`.
8. Keep the mount `$effect` that calls `next()` UNCHANGED — quiz pre-loads harmlessly.

**Acceptance**: T8 tests all pass. Existing `describe('IntervalTrainer')` tests remain green. Run full file: `npx vitest run tests/components/IntervalTrainer.test.ts`.
**Spec ref**: interval-trainer delta Req 1, Req 2; Design Decision 3.

---

### [x] T10 — Write failing tests for Explore mode audio (RED)
**File**: `tests/components/IntervalTrainer.test.ts` (extend `describe('mode toggle')`)
**Type**: Sequential after T9
**Action**: Add inside `describe('mode toggle')`:
1. Clicking "Explore" then "Play interval" calls `mockPlaySequence` exactly once (after mount's single call).
2. The `mockPlaySequence` call from Explore Play receives an array of exactly 2 numbers (frequencies).
3. With default `exploreRootPc=0, exploreSemitones=7`: the two frequencies match `midiToFreq(60)` and `midiToFreq(67)` (C4 and G4 from `EXPLORE_ROOT_MIDI=60`). Use `toBeCloseTo` or `toBe`.
4. Switching back to Practice after Explore does NOT call `mockPlaySequence` again (no phantom autoplay).

**Acceptance**: New tests fail because `playExplore` is still a placeholder.
**Spec ref**: Req 2 — Explore Mode Audio Playback (S2.1–S2.2); Design Decision 3 (playExplore fn).

---

### [x] T11 — Implement `playExplore` audio (GREEN)
**File**: `src/lib/components/IntervalTrainer.svelte` (modify — fill in playExplore)
**Type**: Sequential after T10
**Action**: Replace the placeholder with:
```ts
const EXPLORE_ROOT_MIDI = 60; // C4 fixed reference
function playExplore() {
  const low = EXPLORE_ROOT_MIDI + exploreRootPc;
  player.playSequence([midiToFreq(low), midiToFreq(low + exploreSemitones)]);
}
```
Import `midiToFreq` (already in scope from existing `intervals.ts` import in IntervalTrainer).
**Acceptance**: All T10 tests pass. All prior tests remain green. Run: `npx vitest run tests/components/IntervalTrainer.test.ts`.
**Spec ref**: Req 2 — S2.1, S2.2; Design Decision 3 (`EXPLORE_ROOT_MIDI = 60`).

---

### [x] T12 — Final regression sweep + "no fret > 14" guard verification
**File**: No new files
**Type**: Sequential after T11 (final gate before PR)
**Action**:
1. Run the full test suite: `npx vitest run`. All tests must be green — zero failures, zero skips in affected files.
2. Confirm the test named "no fret > 14" exists in `tests/unit/theory/intervals.test.ts` and is passing.
3. Confirm `src/lib/components/IntervalFretboard.svelte` contains zero `while` keyword occurrences.
4. Confirm `src/lib/theory/intervals.ts` `intervalPositions` function contains zero `while` keyword occurrences.
5. Confirm all new Svelte component code uses Svelte 5 runes (`$state`, `$derived`, `$props`) and NOT `createEventDispatcher`, `on:` event syntax, or `<slot>`.
6. Confirm `data-role="root"` and `data-role="target"` attributes are present in the rendered SVG (via test assertions already passing from T5).

**Acceptance**: Green suite, zero while-loops in new code, Svelte 5 patterns only.
**Spec ref**: All — cross-cutting regression guard; Design Decision 1 (no while), Decision 2 (Svelte 5 patterns).

---

## Parallel Opportunities

| Parallel window | Tasks |
|-----------------|-------|
| After T3 green | T4 and T5 can run in parallel (T4 extends the unit test; T5 creates the component test) |
| After T6 green | T7 and T8 can run in parallel (T7 finishes component a11y; T8 writes trainer toggle tests) |

All other tasks are strictly sequential within their chain.

---

## Files Touched

| File | Action | Slice |
|------|--------|-------|
| `src/lib/theory/intervals.ts` | Extend (add interface + constant + function) | 1 |
| `src/lib/components/IntervalFretboard.svelte` | Create (new presentational component) | 1 |
| `tests/unit/theory/intervals.test.ts` | Extend (add `intervalPositions` describe block) | 1 |
| `tests/components/IntervalFretboard.test.ts` | Create (new test file) | 1 |
| `src/lib/components/IntervalTrainer.svelte` | Modify (add mode rune, toggle UI, explore branch) | 2 |
| `tests/components/IntervalTrainer.test.ts` | Extend (add `describe('mode toggle')`) | 2 |

---

## Constraints Carried Forward to Apply

- STANDARD_TUNING source: resolve the existing export location (`types/chord.ts` or `notes.ts`) before writing `intervalPositions`. Do NOT redefine the constant.
- Root/interval selectors: use `<select>` elements (compact for 12 items each, matches existing form vocabulary). Button grid for 12 chromatic roots would be too wide.
- `aria-pressed` (string coercion): in Svelte 5, `aria-pressed={mode === 'practice'}` passes a boolean. HTML spec requires `"true"`/`"false"` strings. Use `aria-pressed={mode === 'practice' ? 'true' : 'false'}` to avoid type coercion issues that break `getByRole` queries.
- `mockPlaySequence` reset: the existing `beforeEach` in `IntervalTrainer.test.ts` resets mocks — new toggle tests that need clean call counts should use `mockPlaySequence.mockClear()` within the test or rely on `beforeEach` reset.
- Component mock for IntervalFretboard in IntervalTrainer tests: do NOT mock it — render real (pure, no audio, deterministic; gives integration coverage per design Decision 4).
