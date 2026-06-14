# Tasks — Signal Lab Additive Synthesis

Status: applied
Phase: apply-done
Depends on: spec (obs #235), design (obs #236)
Delivery: single PR targeting ~295 lines; documented PR1/PR2 cut line ready if apply balloons

---

## Delivery strategy

Planned as a **single PR** (~295 lines estimated, under the 400-line budget).
The PR1/PR2 cut line is documented below for the orchestrator to use if `sdd-apply`
reports the diff exceeding 380 lines during implementation.

- **PR1 (load-bearing, ~230 lines)**: mock extensions + pure-helper extraction + source mode
  state + gated effects + `start()` branch + source-mode toggle UI + sawtooth preset +
  harmonic slider bank + all tests.
- **PR2 (additive, ~30 lines)**: remaining preset buttons (sine, square; triangle if budget).
  Zero new mechanism — only new generator entries and button markup.

All tasks below are ordered RED → GREEN (strict TDD). Each failing-test task must be
committed before its implementation task.

---

## PR1 — Load-bearing correctness slice

### T-01 · Extend `OscillatorMock` type with `setPeriodicWave` [TEST SETUP]

**Spec req**: Test Mock Coverage — `setPeriodicWave` call is assertable.
**File**: `tests/components/SignalLab.test.ts`
**Action**:
- Add `setPeriodicWave: ReturnType<typeof vi.fn>` to the `OscillatorMock` type definition.
- Extend `makeOscillator()` to return `setPeriodicWave: vi.fn()` on every oscillator.
- This is NOT a new test scenario — it is a mock-infrastructure change that unlocks T-02 through T-09.
- Verify existing tests still pass: `npx vitest run`.

**Acceptance**: `npx vitest run` green; `mockOscillator.setPeriodicWave` is accessible in
test scope; `makeOscillator()` returns the spy; existing call-count assertions
(`createOscillator … toHaveBeenCalledTimes(2)`) still pass.

**Parallel**: No — must land before any test that asserts on `setPeriodicWave`.

---

### T-02 · Extend `mockCtx` with `createPeriodicWave` [TEST SETUP]

**Spec req**: Test Mock Coverage — `createPeriodicWave` is callable in test environment.
**File**: `tests/components/SignalLab.test.ts`
**Action**:
- Add `createPeriodicWave: ReturnType<typeof vi.fn>` to the `mockCtx` type.
- In `beforeEach`, wire `createPeriodicWave: vi.fn((real, imag) => ({ _periodicWave: true, real, imag }))` on `mockCtx`.
- The factory returns a tagged object (convention matches `createWaveShaper`/`createBiquadFilter`). Do NOT add it to any index array — it is orthogonal to node creation counts.
- Verify existing tests still pass.

**Acceptance**: `npx vitest run` green; tests can write
`expect(mockCtx.createPeriodicWave).toHaveBeenCalled()` and inspect `.mock.calls[0]` for
`real`/`imag` arrays; `createOscillator` and `createAnalyser` `toHaveBeenCalledTimes` assertions unchanged.

**Parallel**: Can run in parallel with T-01 (different parts of the mock).
**Depends on**: — (independent of T-01 at the mock-type level; apply sequentially to avoid conflicts in the same file).

---

### T-03 · RED — Pure helper unit tests (`normalizeAmps`, `buildPeriodicWave`, `presetAmps`) [RED]

**Spec reqs**: Audio Safety — Normalization scenarios; Preset Waveforms scenarios; Test Mock Coverage.
**File**: `tests/components/SignalLab.test.ts` (new `describe('additive helpers')` block)
  OR `tests/lib/audio/additive.test.ts` if helpers are extracted to a separate module.
**Action — write failing tests for**:
1. `normalizeAmps([1,0,0,0,0,0,0,0])` → output sums to ≈ 1.0 (within 1e-6).
2. `normalizeAmps([1,1/2,1/3,1/4,1/5,1/6,1/7,1/8])` (sawtooth raw) → `Σ|out| ≈ 1`.
3. `normalizeAmps([0,0,0,0,0,0,0,0])` → all zeros, no NaN.
4. `presetAmps('sawtooth')` → length 8; `amps[k-1] === 1/k` for k=1..8; `amps[0]` is largest.
5. `presetAmps('sine')` → `amps[0] === 1`, all others 0.
6. `presetAmps('square')` → odd-indexed harmonics have `1/k`; even-indexed have 0.
7. `buildPeriodicWave(mockCtx, [1,0,0,0,0,0,0,0])` → calls `mockCtx.createPeriodicWave` with
   `real` all-zeros Float32Array, `imag[0]=0`, `imag[1] ≈ 1` (after normalization),
   `{ disableNormalization: true }`.
8. DC term: `imag[0]` is always 0 regardless of input.

**Acceptance**: All 8 test cases fail with `ReferenceError` or import error (functions don't exist yet). `npx vitest run` exits non-zero.

**Parallel**: Can be written in parallel with T-01/T-02, but run in sequence to avoid file conflicts.
**Depends on**: T-02 (needs `createPeriodicWave` mock for test 7).

---

### T-04 · GREEN — Extract pure helpers to `src/lib/audio/additive.ts` [IMPL]

**Spec reqs**: Audio Safety — Normalization; Preset Waveforms; Test Mock Coverage (helper extraction).
**Files**: `src/lib/audio/additive.ts` (new file), `src/lib/components/SignalLab.svelte` (import)
**Action**:
- Create `src/lib/audio/additive.ts` exporting:
  - `normalizeAmps(amps: number[]): number[]` — L1 normalization; sum=0 → all zeros.
  - `buildPeriodicWave(ctx: AudioContext, amps: number[]): PeriodicWave` — builds `real` (zeros) and `imag` (normalized) `Float32Array`s of length N+1, sets `imag[0]=real[0]=0`, calls `ctx.createPeriodicWave(real, imag, { disableNormalization: true })`.
  - `presetAmps(name: 'sine' | 'sawtooth' | 'square'): number[]` — returns raw (unnormalized) length-8 coefficients per design Decision 6.
    - sine: `[1, 0, 0, 0, 0, 0, 0, 0]`
    - sawtooth: `[1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7, 1/8]`
    - square: `[1, 0, 1/3, 0, 1/5, 0, 1/7, 0]`
  - Export `N = 8` constant.
  - Export `DEFAULT_HARMONIC_AMPS: number[]` = `[1, 0, 0, 0, 0, 0, 0, 0]` (pure sine default per spec).

**Acceptance**: T-03 tests turn green. `npx vitest run` exits zero. No changes to existing tests.

**Depends on**: T-03 (must make those tests pass).

---

### T-05 · RED — Source mode state: default is Waveform [RED]

**Spec reqs**: Mode Coexistence — "Default mode is Waveform"; Waveform Effect Guard.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. Render `SignalLab`; assert a Source radiogroup with `aria-label="Source"` is present.
2. The `Waveform` button in that radiogroup has `aria-checked="true"` (or is the checked input) on initial render.
3. In waveform mode, clicking the `square` waveform button still sets `mockOscillator.type === 'square'` (regression guard — existing behavior preserved).
4. In waveform mode, `mockOscillator.setPeriodicWave` is NEVER called (guard does not leak).

**Acceptance**: Tests fail because the Source radiogroup does not exist yet. `npx vitest run` exits non-zero for these tests; all pre-existing tests still pass.

**Depends on**: T-01, T-02 (mock extensions in place).

---

### T-06 · GREEN — Add `sourceMode` state + gated waveform `$effect` + Source toggle UI [IMPL]

**Spec reqs**: Mode Coexistence; Waveform Effect Guard; Accessibility (Source radiogroup label).
**File**: `src/lib/components/SignalLab.svelte`
**Action**:
1. Add `import { N, DEFAULT_HARMONIC_AMPS, buildPeriodicWave, presetAmps, normalizeAmps } from '$lib/audio/additive.js'`.
2. Add `let sourceMode = $state<'waveform' | 'additive'>('waveform')`.
3. Add `let harmonicAmps = $state<number[]>([...DEFAULT_HARMONIC_AMPS])`.
4. Gate the existing waveform `$effect` (~line 235): add `&& sourceMode === 'waveform'` guard.
5. Add the additive `$effect`: reads `sourceMode` + `harmonicAmps`; if `oscillator && audioCtx && sourceMode === 'additive'` → call `oscillator.setPeriodicWave(buildPeriodicWave(audioCtx, harmonicAmps))`.
6. Gate `start()` initial source application (~line 176): replace unconditional `oscillator.type = waveType` with the `sourceMode`-branched version per design Decision 2.
7. Add Source-mode toggle card markup: `role="radiogroup"` `aria-label="Source"` with two buttons (`Waveform`, `Additive`), mirroring existing effect-card radiogroup markup style. Wire to `sourceMode`.

**Acceptance**: T-05 tests turn green. Existing tests pass. `npx vitest run` exits zero.

**Depends on**: T-04 (helpers imported), T-05 (tests must be red first).

---

### T-07 · RED — Switch to Additive mode: calls `setPeriodicWave`, not `oscillator.type` [RED]

**Spec reqs**: Mode Coexistence — "Switch to Additive mode"; Waveform Effect Guard; Live Harmonic Update (slider move re-calls without oscillator recreation).
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. Play tone in waveform mode; click `Additive` source button → assert `mockOscillator.setPeriodicWave` was called with the `mockCtx.createPeriodicWave` return value.
2. After switching to Additive, assert `mockOscillator.type` was NOT written after the switch (setPeriodicWave owns the source now).
3. Move a harmonic slider (e.g. harmonic-2 slider from 0 to 0.5) → assert `mockCtx.createPeriodicWave` was called again and `mockOscillator.setPeriodicWave` was called again; assert `mockCtx.createOscillator` call count unchanged (no oscillator recreation).
4. Switch back to Waveform mode → assert `mockOscillator.type` is written and `setPeriodicWave` is not called again after the switch.

**Acceptance**: New tests fail; `npx vitest run` exits non-zero for these; all prior tests pass.

**Depends on**: T-06 (source mode exists but slider bank UI not wired yet; test can fake slider by directly triggering state or clicking a partially-rendered slider).

---

### T-08 · RED — Play-in-additive applies PeriodicWave on first play [RED]

**Spec reqs**: Mode Coexistence — "Switch to Additive mode"; Live Harmonic Update.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. Switch to Additive mode BEFORE playing; click play → assert `mockOscillator.setPeriodicWave` was called; assert `mockOscillator.type` was NOT set during start.

**Acceptance**: Test fails; `npx vitest run` exits non-zero for this test.

**Depends on**: T-07 tests written (same describe block).

---

### T-09 · RED — Harmonic slider bank renders and updates coefficients [RED]

**Spec reqs**: Harmonic Slider Bank; Mode Coexistence — slider bank absent in Waveform mode; Accessibility — harmonic sliders have `aria-label`; Live Harmonic Update — all-zero sliders no crash.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. In Waveform mode: assert harmonic sliders are absent OR all disabled (not interactable).
2. Switch to Additive mode: assert 8 sliders are present.
3. Slider 1 has `value="1"` (default); sliders 2..8 have `value="0"`.
4. Each slider has `aria-label="Harmonic k amplitude"` for k=1..8.
5. Set all sliders to 0 → no error thrown; `mockOscillator.setPeriodicWave` called with all-zero `imag`; no NaN in the array.

**Acceptance**: Tests fail; `npx vitest run` exits non-zero for these.

**Depends on**: T-07 (mode switching works at the implementation level).

---

### T-10 · GREEN — Add harmonic slider bank UI + wire sliders to `harmonicAmps` [IMPL]

**Spec reqs**: Harmonic Slider Bank; Accessibility; Live Harmonic Update.
**File**: `src/lib/components/SignalLab.svelte`
**Action**:
1. Add the harmonic slider bank block inside the Additive UI section (shown when `sourceMode === 'additive'`, disabled when `'waveform'`).
2. Use `{#each harmonicAmps as amp, i}` loop (one template rendered 8×, mandatory for budget compliance).
3. Each slider: `type="range"` `min="0"` `max="1"` `step="0.01"` `bind:value={harmonicAmps[i]}` `aria-label="Harmonic {i+1} amplitude"`.
4. On slider interaction, `harmonicAmps` reactivity triggers the additive `$effect` automatically (no extra handler needed).
5. Apply `disabled` / `opacity-50` convention on the bank container when `sourceMode === 'waveform'`.

**Acceptance**: T-07, T-08, T-09 tests turn green. `npx vitest run` exits zero. All prior tests pass.

**Depends on**: T-09 (tests red), T-06 (state + effects in place).

---

### T-11 · RED — Sawtooth preset sets coefficients and updates waveform [RED]

**Spec reqs**: Preset Waveforms — Sawtooth preset loads 1/n stack; Audio Safety — normalization invariants.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. In Additive mode (playing), click `Sawtooth preset` button → assert `harmonicAmps` updates to the sawtooth array.
2. Assert `mockCtx.createPeriodicWave` was called with `imag` satisfying: `imag[0] === 0`, `imag[1] >= imag[2] >= … >= imag[8]` (monotonically non-increasing, 1/n rolloff), `real` all zeros.
3. Assert `Σ|imag[1..8]| ≈ 1` (L1 normalization applied, within 1e-5).
4. Assert button has `aria-label="Sawtooth preset"`.

**Acceptance**: Tests fail. Prior tests green.

**Depends on**: T-10 (slider bank exists so preset button can live next to it).

---

### T-12 · GREEN — Add sawtooth preset button [IMPL]

**Spec reqs**: Preset Waveforms — Sawtooth preset; Accessibility — preset buttons have labels.
**File**: `src/lib/components/SignalLab.svelte`
**Action**:
1. Add preset buttons section inside the additive UI block (rendered when `sourceMode === 'additive'`).
2. Use `{#each presets as p}` loop where `presets = ['sine', 'sawtooth', 'square']` (PR1 includes sawtooth only wired; sine and square buttons added in PR2 — OR all three added here if budget permits; see T-15/T-16).
3. For PR1: add at minimum the `Sawtooth preset` button. `onclick={() => harmonicAmps = presetAmps('sawtooth')}`. `aria-label="Sawtooth preset"`.
4. The `{#each}` loop structure should already be in place so PR2 only adds entries to the `presets` array / wires more `onclick` calls.

**Note**: If the `{#each}` over all three preset names is trivially cheap (~5 lines), include all three buttons now and mark T-15/T-16 as collapsed into this task. Decision is the implementer's based on live line count.

**Acceptance**: T-11 tests turn green. `npx vitest run` exits zero.

**Depends on**: T-11 (tests red), T-10 (slider bank exists).

---

### T-13 · RED — Waveform radiogroup is disabled in Additive mode [RED]

**Spec reqs**: Mode Coexistence — waveform radiogroup inactive in Additive mode; Accessibility — inactive controls marked disabled.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. Switch to Additive mode; assert each of the four waveform radio buttons has `disabled` attribute or `aria-disabled="true"`.
2. Switch back to Waveform mode; assert the waveform radiogroup is fully interactive again.

**Acceptance**: Tests fail. Prior tests green.

**Depends on**: T-06 (source mode toggle exists).

---

### T-14 · GREEN — Apply `disabled` to waveform radiogroup in Additive mode [IMPL]

**Spec reqs**: Mode Coexistence; Accessibility.
**File**: `src/lib/components/SignalLab.svelte`
**Action**:
- Add `disabled={sourceMode === 'additive'}` (or `opacity-50` wrapper with `pointer-events-none`) to the existing waveform radiogroup and its buttons, consistent with the effect-card `disabled` convention in the codebase.

**Acceptance**: T-13 tests turn green. `npx vitest run` exits zero. All prior tests green.

**Depends on**: T-13 (tests red), T-06 (state exists).

---

## PR1 completion gate

Before committing PR1:
- `npx vitest run` exits zero.
- All tasks T-01 through T-14 checked off.
- Diff line count verified ≤ 400.
- If diff > 380 lines: defer T-15 (sine/square presets) to PR2 unconditionally.

---

## PR2 — Remaining presets slice

*Skip if T-12 already shipped sine and square buttons inside the `{#each}` loop.*

### T-15 · RED — Sine and Square preset tests [RED]

**Spec reqs**: Preset Waveforms — Sine preset loads fundamental only; Square preset loads odd harmonics.
**File**: `tests/components/SignalLab.test.ts`
**Action — write failing tests**:
1. Click `Sine preset` → slider 1 value = 1.0; sliders 2..8 = 0.0; `imag[1] ≈ 1`; `Σ|imag| ≈ 1`; `aria-label="Sine preset"`.
2. Click `Square preset` → odd-harmonic sliders have values; even-harmonic sliders have 0; `imag[1] > 0`, `imag[2] = 0`, `imag[3] > 0`, `imag[4] = 0`; `Σ|imag| ≈ 1`; `aria-label="Square preset"`.
3. Preset updates slider UI positions immediately (visual reflection of `harmonicAmps` binding).

**Acceptance**: Tests fail. All PR1 tests green.

**Depends on**: PR1 merged.

---

### T-16 · GREEN — Add Sine and Square preset buttons [IMPL]

**Spec reqs**: Preset Waveforms — Sine; Square; Preset updates sliders visually.
**File**: `src/lib/components/SignalLab.svelte`
**Action**:
- Add `Sine preset` button: `onclick={() => harmonicAmps = presetAmps('sine')}` `aria-label="Sine preset"`.
- Add `Square preset` button: `onclick={() => harmonicAmps = presetAmps('square')}` `aria-label="Square preset"`.
- If using `{#each presets}`, add `'sine'` and `'square'` to the presets array.

**Acceptance**: T-15 tests turn green. `npx vitest run` exits zero.

**Depends on**: T-15 (tests red).

---

## Task ordering summary

```
T-01 (mock: setPeriodicWave on oscillator)
T-02 (mock: createPeriodicWave on ctx)      ← parallel with T-01 (same file — apply sequentially)
  └── T-03 (RED: pure helper tests)
        └── T-04 (GREEN: additive.ts helpers)
              └── T-05 (RED: source mode default + waveform guard regression)
                    └── T-06 (GREEN: sourceMode state + gated effects + toggle UI)
                          ├── T-07 (RED: additive mode calls setPeriodicWave, not type)
                          │     └── T-08 (RED: play-in-additive applies wave on first play)
                          │           └── T-09 (RED: slider bank renders + a11y + all-zero)
                          │                 └── T-10 (GREEN: slider bank UI + wire)
                          │                       └── T-11 (RED: sawtooth preset coefficients)
                          │                             └── T-12 (GREEN: sawtooth preset button)
                          └── T-13 (RED: waveform radiogroup disabled in additive mode)
                                └── T-14 (GREEN: apply disabled to waveform radiogroup)

── PR1 gate ──

T-15 (RED: sine + square preset tests)      ← only if not already in PR1
  └── T-16 (GREEN: sine + square preset buttons)
```

All steps are **sequential** (strict TDD: each RED must precede its GREEN; each GREEN unblocks the next RED). No true parallel paths exist because all work touches the same two files (`tests/…/SignalLab.test.ts` and `src/…/SignalLab.svelte`) plus the new `src/lib/audio/additive.ts`.

---

## Spec → Task traceability

| Spec Requirement | Tasks |
|---|---|
| Mode Coexistence | T-05, T-06, T-07, T-13, T-14 |
| Harmonic Slider Bank | T-09, T-10 |
| Live Harmonic Update | T-07, T-08, T-09, T-10 |
| Preset Waveforms (Sawtooth) | T-03, T-04, T-11, T-12 |
| Preset Waveforms (Sine/Square) | T-03, T-04, T-15, T-16 |
| Scope Integration | Satisfied by design (no new tasks — additive source is upstream of unchanged graph) |
| Audio Safety — Normalization | T-03, T-04 |
| Waveform Effect Guard | T-05, T-06, T-07 |
| Effect Chain Availability | Satisfied by design (no new tasks — effect graph unchanged) |
| Accessibility | T-05, T-06, T-09, T-10, T-11, T-12, T-13, T-14, T-15, T-16 |
| Test Mock Coverage | T-01, T-02 |

---

## Review Workload Forecast

| Metric | Value |
|---|---|
| Estimated changed lines (total) | ~295 (PR1: ~265, PR2: ~30) |
| Chained PRs recommended | No (single PR is the plan; PR1/PR2 split is a contingency) |
| 400-line budget risk | Low (estimated 295; would need to overshoot by 35% to trigger) |
| Decision needed before apply | No — proceed with single-PR plan; orchestrator re-evaluates if apply reports > 380 lines |

Constraint that keeps the estimate valid: slider bank MUST use `{#each}` (one template × 8 renders, not 8 hand-written blocks) and presets MUST be in a small loop or compact list. Implementer must verify live line count after T-10 and T-12 before proceeding.
