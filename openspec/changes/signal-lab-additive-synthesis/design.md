# Design — Signal Lab Additive Synthesis

Status: complete
Phase: design (architecture authority)
Depends on: proposal (`sdd/signal-lab-additive-synthesis/proposal`)
Target: `src/lib/components/SignalLab.svelte`, `tests/components/SignalLab.test.ts`

## Executive summary

Add an additive-synthesis SOURCE mode to Signal Lab using a single `PeriodicWave`
(`createPeriodicWave(real, imag)` + `oscillator.setPeriodicWave()`) on the EXISTING
oscillator. A mode toggle (`Waveform` | `Additive`) selects the source; a per-harmonic
amplitude slider bank (N = 8) drives a derived coefficient array that is normalized to
respect `MAX_GAIN` and applied live by rebuilding the `PeriodicWave`. The entire
downstream graph (effect chain, both analysers, master gain, both scope columns) is
reused unchanged. The single source-of-truth conflict with the live `oscillator.type`
`$effect` is resolved by gating BOTH source effects on `sourceMode`.

---

## Decision 1 — Web Audio approach: single PeriodicWave (CONFIRM leading approach)

**Decision**: Use `AudioContext.createPeriodicWave(real, imag)` and
`oscillator.setPeriodicWave(wave)` on the existing single `OscillatorNode`. Reject the
N-summed-`OscillatorNode` alternative for the first slice.

**Rationale**:
- The downstream graph (`oscillator → [effects] → analyser → masterGain → destination`,
  plus the clean tap `oscillator.connect(cleanAnalyserNode)` at line 96) stays IDENTICAL.
  Only the source-configuration call changes from `oscillator.type = …` to
  `oscillator.setPeriodicWave(…)`. No new graph nodes, no rebuildChain change, no new
  start/stop teardown entries.
- The pedagogical goal (a periodic tone IS a sum of sines) is already satisfied visually:
  the spectrum analyser shows the partials as discrete bins regardless of whether the sum
  is computed by the browser's IFFT (PeriodicWave) or by N real oscillators. The learner
  sees the same build-up either way.
- N oscillators would add 8 nodes + 8 gains to `start()` / `stop()` and force the test
  mock's index arrays to absorb a variable, mode-dependent node count — large blast radius
  on the existing, carefully ordered `oscillators`/`gains` index arrays.

**Rejected**: N summed `OscillatorNode`s. Honest mental model but inflates node count,
teardown, and (critically) breaks the deterministic index-array mock contract. Out of
scope per proposal.

### Coefficient → Fourier-coefficient mapping (LOAD-BEARING)

`createPeriodicWave(real, imag)` takes two `Float32Array`s of length `N + 1`. For a tone
built from pure SINE partials (no cosine/phase component, which is out of scope):

- `imag[k]` carries the amplitude of the k-th sine partial (`sin(k·ωt)`).
- `real[k]` = 0 for all k (no cosine components).
- Index `0` is the DC term for BOTH arrays and is unused for audio → `real[0] = 0`,
  `imag[0] = 0`. (`imag[0]` is ignored by the API anyway; we set it to 0 explicitly.)
- Index `k` for `k ∈ [1..N]` maps to harmonic k. Harmonic 1 = fundamental at `frequency`.

So a UI amplitude bank `amps: number[]` of length N (amps[0] = fundamental … amps[N-1] =
Nth harmonic) maps as:

```
imag = Float32Array(N + 1)   // imag[0] = 0 (DC, unused)
real = Float32Array(N + 1)   // all zeros (no cosine)
for k in 1..N:  imag[k] = normalizedAmps[k - 1]
```

**Disable normalization**: call `createPeriodicWave(real, imag, { disableNormalization: true })`.
We normalize amplitudes OURSELVES (Decision 5) so the displayed slider values map
predictably to spectral magnitude and to the `MAX_GAIN` ceiling. Letting the browser
auto-normalize would make the slider-to-loudness relationship opaque and defeat the
teaching goal (sawtooth's 1/n rolloff would be rescaled invisibly).

---

## Decision 2 — Source-of-truth conflict resolution (LOAD-BEARING)

**The conflict**: `SignalLab.svelte` line 235-238 runs

```js
$effect(() => {
  const t = waveType;
  if (oscillator) oscillator.type = t;
});
```

Setting `oscillator.type` to a built-in name (`'sine'`, etc.) ALWAYS overrides any prior
`setPeriodicWave`. Because this `$effect` re-runs whenever `waveType` changes — and runs
once on mount/first-play — it would silently stomp the additive PeriodicWave.

**Decision — single source of truth per mode, gated by `sourceMode`**:

Introduce `let sourceMode = $state<'waveform' | 'additive'>('waveform')`.

1. GATE the existing waveform effect so it only writes `oscillator.type` in waveform mode:

   ```js
   $effect(() => {
     const t = waveType;
     if (oscillator && sourceMode === 'waveform') oscillator.type = t;
   });
   ```

2. ADD a sibling additive effect that only writes the PeriodicWave in additive mode, and
   reads the harmonic amps so it re-runs when any slider moves:

   ```js
   $effect(() => {
     const m = sourceMode;
     const amps = harmonicAmps;            // read → dependency on the bank
     if (oscillator && audioCtx && m === 'additive') {
       oscillator.setPeriodicWave(buildPeriodicWave(audioCtx, amps));
     }
   });
   ```

3. On mode SWITCH, exactly one of the two effects re-applies the correct source:
   - `→ waveform`: the gated `waveType` effect re-runs (it reads `sourceMode`) and writes
     `oscillator.type`, cleanly overwriting any prior PeriodicWave.
   - `→ additive`: the additive effect re-runs and writes the PeriodicWave.

   Because each effect reads `sourceMode`, switching modes invalidates BOTH; the inactive
   one is a no-op (guard fails), the active one applies. No manual switch handler needed —
   the rune graph guarantees exactly one writer wins, deterministically, last-write per the
   mode guard.

**Invariant**: at most one of `{oscillator.type, oscillator.setPeriodicWave}` is the
authoritative source at any time, selected by `sourceMode`. Neither effect writes when its
mode is inactive. This is the entire correctness crux of the feature.

**`start()` change**: line 176 currently does `oscillator.type = waveType` unconditionally.
Replace with a mode-aware initial source application so first-play in additive mode does not
start as a raw waveform for one frame:

```js
if (sourceMode === 'additive') {
  oscillator.setPeriodicWave(buildPeriodicWave(audioCtx, harmonicAmps));
} else {
  oscillator.type = waveType;
}
oscillator.frequency.value = frequency;   // unchanged
```

The `$effect`s still cover live changes after start; this only fixes the initial frame.

---

## Decision 3 — Mode toggle vs 5th waveform (CONFIRM separate toggle)

**Decision**: A separate SOURCE-MODE toggle (`Waveform` | `Additive`), NOT a 5th entry in
the existing waveform radiogroup. Confirms the proposal recommendation.

**Rationale**:
- Conceptually distinct: the 4 waveforms are PRESET source types; additive is a
  CONFIGURABLE source with its own UI surface (the slider bank). Cramming it into the
  radiogroup conflates "pick a shape" with "open a builder".
- The slider bank must show/hide as a unit. A mode toggle gives a clean container with a
  natural `disabled`/`opacity-50` pattern — consistent with every existing effect card
  (distortion, filter, tremolo, delay all use a 2-button radiogroup + dependent controls).
- Keeps the existing `WAVE_TYPES` radiogroup and its tests untouched (no regression to the
  "renders all four waveform options" / "defaults to sawtooth" tests).

**UI placement**: a new "Source" card (or an addition to the existing Controls card)
containing a 2-button radiogroup `role="radiogroup" aria-label="Source"` with buttons
`Waveform` and `Additive`, mirroring the effect-card toggle markup. The existing Waveform
radiogroup is shown when `sourceMode === 'waveform'`; the harmonic slider bank is shown
(or enabled) when `sourceMode === 'additive'`. Reuse the existing `opacity-50` +
`disabled` convention rather than fully unmounting, to match the codebase pattern and keep
slider DOM stable for tests.

---

## Decision 4 — Live updates: rebuild-and-reapply (NOT setTargetAtTime)

**Decision**: Coefficients are a `Float32Array`, not a scalar `AudioParam`, so the existing
`param.setTargetAtTime(value, now, tc)` pattern does NOT apply. On any harmonic-slider
change, REGENERATE the `PeriodicWave` and call `setPeriodicWave` — do NOT recreate the
oscillator.

**Mechanism**: `harmonicAmps` is reactive `$state` (a plain `number[]` of length N, bound
per-slider). The additive `$effect` (Decision 2.2) reads `harmonicAmps`, so any slider move
re-runs it, which calls `buildPeriodicWave(audioCtx, harmonicAmps)` →
`oscillator.setPeriodicWave(wave)`. `setPeriodicWave` swaps the wavetable on the live
oscillator instantly and seamlessly; no node recreation, no clicks, no graph rewire.

**No debounce in the first slice**: `setPeriodicWave` + `createPeriodicWave` for N = 8 is
cheap and the rune effect already batches synchronous state writes within a tick. Keep it
simple; debouncing is out of scope. (Documented as a deferred optimization in risks.)

**State shape note**: use a `number[]` for `harmonicAmps` (so individual `bind:value` slider
binding works and mutating one index triggers reactivity via reassignment or fine-grained
rune proxy). Convert to the `Float32Array` coefficient arrays only inside
`buildPeriodicWave`. Do NOT store the bank as a `Float32Array` in `$state` — element
assignment on a typed array is not reliably tracked and binding a range input to a typed-array
index is awkward.

---

## Decision 5 — Normalization (respect MAX_GAIN = 0.4)

**Problem**: With `disableNormalization: true`, the peak time-domain amplitude of the summed
partials can far exceed 1.0 (worst case ≈ Σ|amps|), which after the master gain could exceed
the `MAX_GAIN = 0.4` hearing-safety ceiling and clip.

**Decision — normalize coefficients by the sum of magnitudes (L1)**:

```
sum = Σ |amps[i]|           for i in 0..N-1
norm[i] = sum > 0 ? amps[i] / sum : 0
```

Then map `norm` into `imag[1..N]`. This guarantees the worst-case instantaneous peak of the
reconstructed waveform is bounded by 1.0 (since the time-domain signal is
`Σ norm[k]·sin(kωt)` and `|Σ norm[k]·sin(·)| ≤ Σ|norm[k]| = 1`). The audible level then
remains governed solely by `masterGain` (≤ `MAX_GAIN = 0.4`), exactly as for the built-in
waveforms — so additive mode is no louder than any existing source.

**Why L1 (sum of magnitudes) and not L2 / RMS**: L1 is the only bound that guarantees the
PEAK never exceeds 1.0 for arbitrary harmonic combinations (RMS-normalizing can still let
peaks overshoot, risking clipping at the WaveShaper or destination). Hearing safety and
clip-free output are the priority; relative timbre is preserved because L1 scales all
partials by the same factor.

**Edge case**: all sliders at 0 → `sum === 0` → emit all-zero coefficients (silent but valid
PeriodicWave). No divide-by-zero.

**Teaching fidelity preserved**: because every partial is scaled by the SAME factor `1/sum`,
the RELATIVE harmonic ratios (e.g. sawtooth's 1/n) are untouched — the spectrum shows the
correct shape, just overall-scaled to a safe level.

---

## Decision 6 — Presets and harmonic count N

**Decision — N = 8** harmonics for the first slice.

**Rationale**: 8 sliders is enough to clearly show the 1/n sawtooth rolloff and the
odd-only square pattern (harmonics 1,3,5,7 present) while staying visually legible and
keeping the slider-bank markup + tests compact (helps the 400-line budget). 16 doubles the
DOM/markup and pushes the PR over budget with marginal pedagogical gain.

**Coefficient generators** (return a length-8 `number[]` of RAW amplitudes; normalization
in Decision 5 runs afterward). Indexing: `g[k-1]` is harmonic k.

```
sine    (k)  → 1 if k === 1 else 0                      // pure fundamental
sawtooth(k)  → 1 / k                                     // all harmonics, 1/n
square  (k)  → k odd ? 1 / k : 0                         // odd harmonics, 1/n
triangle(k)  → k odd ? 1 / (k * k) : 0                   // odd harmonics, 1/n² (alternating
                                                         //   sign omitted — phase out of scope)
```

For triangle the true Fourier series alternates sign per odd harmonic; since per-harmonic
PHASE is out of scope and the spectrum view shows only magnitude, the unsigned `1/k²`
magnitude is the correct teaching approximation (the scope shape differs slightly from an
ideal triangle but the spectral rolloff is the lesson).

**Presets shipped (first slice)**: at minimum `sawtooth` (the headline: 1/n, all harmonics)
plus `sine` (degenerate single-partial sanity check) and `square` (odd-only). `triangle`
included if budget allows; it is the cheapest possible add (one generator entry + one preset
button) and reuses all the same wiring. Tasks phase decides final inclusion against budget.

**Preset application**: a preset button sets `harmonicAmps = generator-produced array`
(reassignment → reactivity → additive `$effect` rebuilds the wave). Presets are only
meaningful in additive mode; render them inside the additive UI block.

---

## Decision 7 — Test strategy (strict TDD, extend the index-array mock)

The existing mock (`tests/components/SignalLab.test.ts`) hands out distinct mock nodes from
creation-ordered index arrays (`oscillators`, `gains`, `analysers`). Additive mode adds NO
new nodes, so those arrays are UNCHANGED and every existing test still holds. Two surgical
extensions are required:

1. **`createPeriodicWave` on the context mock**. Add to `mockCtx`:

   ```js
   createPeriodicWave: vi.fn((real: Float32Array, imag: Float32Array) => ({
     _periodicWave: true, real, imag,
   })),
   ```

   Returns a tagged object so tests can assert on the coefficient arrays passed in
   (e.g. `imag[1]` is the largest for a sawtooth preset). Keeps the "return a recognizable
   handle" convention used by `createWaveShaper`/`createBiquadFilter`/`createDelay`.

2. **`setPeriodicWave` spy on the oscillator mock**. Extend `makeOscillator()` /
   `OscillatorMock`:

   ```js
   setPeriodicWave: vi.fn(),
   ```

   Tone oscillator and LFO both get it (harmless on the LFO; keeps `makeOscillator`
   uniform and the index arrays intact).

**Critical mock ordering note**: `createPeriodicWave` MUST NOT be added to any of the
index arrays — it returns inline tagged objects and is orthogonal to the oscillator/gain/
analyser creation counts. The existing assertions like `createOscillator … toHaveBeenCalledTimes(2)`
and `createAnalyser … toHaveBeenCalledTimes(2)` stay valid because no node creation count
changes.

**New tests to write (red first under strict TDD)** — these define the WHAT for tasks/apply:

- Source mode defaults to `waveform`; the Source radiogroup renders with `Waveform` checked.
- In `waveform` mode, selecting `square` still sets `mockOscillator.type === 'square'`
  (existing test must keep passing — guard does not break it).
- Switching to `additive` mode while playing calls `mockOscillator.setPeriodicWave` with the
  context's periodic-wave handle, and does NOT subsequently set `mockOscillator.type`.
- In `additive` mode, moving a harmonic slider calls `createPeriodicWave` again and
  `setPeriodicWave` again (rebuild-and-reapply), without recreating the oscillator
  (`createOscillator` call count unchanged after the slider move).
- A `sawtooth` preset produces coefficients where `imag` is monotonically non-increasing
  over `1..N` (1/n rolloff) and `imag[0] === 0` (DC unused) and `real` is all zeros.
- Normalization: `Σ|imag[1..N]| ≈ 1` (within float tolerance) for any non-empty preset, and
  all-zero sliders yield all-zero `imag` (no NaN from divide-by-zero).
- Playing in `additive` mode from the start applies a PeriodicWave on play (not
  `oscillator.type`).
- Regression: in `waveform` mode, `setPeriodicWave` is NEVER called.

**Pure-function extraction for unit testability**: extract the coefficient math as module-
scope pure helpers so they can be unit-tested directly without the DOM/audio mock and so the
component effect stays thin:

- `buildPeriodicWave(ctx, amps)` → calls `ctx.createPeriodicWave(real, imag, {disableNormalization:true})`.
- `normalizeAmps(amps): number[]` (L1 normalization, Decision 5).
- `harmonicGenerators` / `presetAmps(name): number[]` (Decision 6).

Keep these in `SignalLab.svelte`'s `<script module>` or inline module scope; if a separate
`.ts` is cleaner for testing, that is a tasks-phase call (small file like
`src/lib/audio/additive.ts` is acceptable and improves the test surface).

---

## Decision 8 — 400-line budget (single PR, with documented cut line)

**Decision**: Target a SINGLE PR. The change is additive and self-contained, but it sits
near the 400-line `ask-on-risk` budget. Estimate below.

**Estimate** (changed lines, approximate):
- `sourceMode` state + gated/added source `$effect`s + `start()` mode branch: ~20
- Pure helpers (`buildPeriodicWave`, `normalizeAmps`, generators/presets): ~35
- Source-mode toggle card markup: ~35
- Harmonic slider bank (N=8, `{#each}` loop, one slider template): ~45
- Preset buttons: ~20
- Test mock extensions (`createPeriodicWave`, `setPeriodicWave`) + ~8 new tests: ~140

Total ≈ **295 lines** — comfortably under 400 IF the slider bank uses an `{#each}` loop
(one template rendered 8×) rather than 8 hand-written slider blocks, and presets are a small
`{#each}` over a preset list. Both are required to stay under budget.

**Cut line if it must split** (recommended fallback, NOT the default): ship the source mode
+ single default preset (sawtooth) + live rebuild + mode-guard fix + full mocks/tests as
PR #1 (the load-bearing correctness work, ≈ 230 lines). Defer additional presets (square /
triangle / sine buttons) to PR #2 (≈ 30 lines, trivial, no new mechanism). The mode-guard
fix and PeriodicWave plumbing MUST be in PR #1 because everything else depends on them.

**Recommendation**: single PR with the `{#each}`-loop discipline. Flag to orchestrator only
if the slider-bank markup balloons past the estimate during apply.

---

## Component & data flow summary

```
sourceMode ('waveform' | 'additive')   ── $state
waveType  ('sine'|…|'square')          ── $state  (existing)
harmonicAmps: number[8]                 ── $state  (new)

UI:
  Source toggle ──▶ sourceMode
  Waveform radiogroup (shown when waveform mode) ──▶ waveType   (existing)
  Harmonic sliders ×8 (shown when additive mode) ──▶ harmonicAmps[i]
  Preset buttons (additive mode) ──▶ harmonicAmps = presetAmps(name)

Reactive source application (exactly one writer wins, gated by sourceMode):
  $effect waveType  : sourceMode==='waveform' → oscillator.type = waveType
  $effect additive  : sourceMode==='additive' → oscillator.setPeriodicWave(
                          buildPeriodicWave(audioCtx, harmonicAmps))

buildPeriodicWave(ctx, amps):
  norm = normalizeAmps(amps)          // L1, ≤1 peak, MAX_GAIN-safe
  imag[0]=0; imag[k]=norm[k-1]; real=zeros
  return ctx.createPeriodicWave(real, imag, {disableNormalization:true})

Downstream graph: UNCHANGED
  oscillator → [effect chain via rebuildChain] → analyser → masterGain → destination
  oscillator → cleanAnalyser (passive tap)
```

Effects (distortion/filter/tremolo/delay) remain fully available in additive mode — building
a sawtooth additively then low-ppassing it is a deliberate teaching payoff and requires zero
extra work since the source change is upstream of the unchanged chain.

---

## ADR-style decision log

| # | Decision | Chosen | Rejected | Why |
|---|----------|--------|----------|-----|
| 1 | Audio approach | single PeriodicWave on existing oscillator | N summed OscillatorNodes | reuses whole downstream graph; preserves index-array mock; spectrum already shows the sum |
| 2 | Source conflict | gate both `waveType` and additive `$effect`s on `sourceMode` | manual switch handler / delete waveType effect | rune graph guarantees one writer; least invasive; no regression |
| 3 | Mode UI | separate `Waveform`/`Additive` toggle | 5th radiogroup entry | distinct concept; clean container for slider bank; no test regression |
| 4 | Live update | rebuild PeriodicWave + setPeriodicWave on amp change | setTargetAtTime / recreate oscillator | coeffs are an array not a scalar param; setPeriodicWave is a seamless live swap |
| 5 | Normalization | L1 (sum of magnitudes), disableNormalization | browser auto-normalize / L2-RMS | only L1 bounds peak ≤1 → MAX_GAIN-safe; predictable slider→spectrum mapping |
| 6 | N / presets | N=8; sawtooth/sine/square (triangle if budget) | N=16; auto-normalized presets | legible, budget-friendly, shows 1/n and odd-only clearly |
| 7 | Tests | extend mock with createPeriodicWave + setPeriodicWave; extract pure helpers | rewrite mock / no helpers | keeps index-array contract; pure helpers unit-testable; strict-TDD friendly |
| 8 | Budget | single PR (~295 lines) with {#each} discipline | always-split | self-contained; under 400 if loops used; documented cut line ready |
