# Proposal: Additive Synthesis Mode for Signal Lab

## Status

- Change: `signal-lab-additive-synthesis`
- Phase: proposal
- Artifact store: hybrid (this file + engram `sdd/signal-lab-additive-synthesis/proposal`)

## Problem

Signal Lab today teaches harmonics *destructively and indirectly*: the user picks
one of four built-in waveforms (sine, triangle, sawtooth, square) and then watches
effects **add** harmonics (distortion), **remove** them (low-pass), or **carve** them
(delay comb filtering). The spectrum view shows harmonics appearing and disappearing,
but the learner is never shown *what a harmonic actually is* or *that a complex
waveform is literally a sum of pure sines*. The built-in sawtooth and square are
black boxes — they arrive pre-built, so the foundational Fourier idea ("every
periodic tone is a stack of sine partials") is asserted, never demonstrated.

This leaves a conceptual gap. A learner can see that distortion "adds harmonics"
without understanding that those harmonics are themselves sine waves at integer
multiples of the fundamental, each with its own amplitude. The existing effects
chapter has no foundation underneath it.

## Why it matters (educational value)

Additive synthesis makes Fourier synthesis **tangible and constructive**. The user
builds a waveform from scratch by summing individual sine partials (harmonics 1..N)
via per-harmonic amplitude sliders, and watches the oscilloscope waveform and the
spectrum assemble in real time from pure sines. The intended "aha" moments:

- A **sawtooth** is just harmonics at amplitude `1/n` (all integers).
- A **square** is just the **odd** harmonics at `1/n`.
- Adding one partial at a time shows the waveform visibly sharpening toward its
  target shape — the spectrum bar and the scope ripple move together.

This retroactively explains the entire existing effects chapter: *why* distortion
adds harmonics, *why* a low-pass removes the high ones, *why* the spectrum looks the
way it does. It turns Signal Lab from a tour of effects into a coherent lesson that
starts at the atom (a sine partial) and builds up.

## Proposed approach (high level)

Add an **additive synthesis mode** to the existing Signal Lab. In this mode the
single source oscillator is driven by a user-built harmonic spectrum instead of a
built-in waveform.

Leading technical direction (design phase decides the final call): use the Web Audio
primitive `AudioContext.createPeriodicWave(real, imag)` and apply it to the *existing*
single `OscillatorNode` via `oscillator.setPeriodicWave(wave)`. The per-harmonic
amplitude sliders feed the Fourier coefficient arrays; the oscillator synthesizes
exactly that summed waveform. This reuses the entire current graph downstream
(effect chain, both analysers, master gain, the two SignalScope columns) with no
structural change — only the *source* changes from `oscillator.type = waveType` to
`oscillator.setPeriodicWave(...)`.

The alternative — summing N separate `OscillatorNode`s into a gain bus — is the
"honest" mental model but multiplies node count, complicates start/stop and live
updates, and inflates the test surface. Design should evaluate both but the periodic
wave is the leading choice for a tight first slice.

UI follows existing Signal Lab conventions exactly: a mode radiogroup (Waveform vs
Additive), per-harmonic amplitude sliders with `aria-label`s, `opacity-50` /
`disabled` on the inactive set, and a short explanatory caption like the effect
cards. Preset buttons (Sawtooth / Square / Sine) that set the slider bank to the
classic `1/n` patterns are the highest-value teaching affordance and a strong
first-slice candidate.

## Scope

### In scope (first slice)

- An additive synthesis **mode** in Signal Lab, coexisting with the existing
  waveform selector (does not delete the four built-in waveforms).
- A bank of per-harmonic amplitude sliders for harmonics `1..N` (N small and fixed,
  e.g. 8 — design picks the exact count balancing teaching value vs. UI density and
  line budget).
- Real-time synthesis: moving a harmonic slider updates the live tone, the
  oscilloscope, and the spectrum while playing.
- At least one **preset** that snaps the harmonic bank to a recognizable shape
  (sawtooth `1/n` is the strongest single demonstrator; square odd-`1/n` and pure
  sine are stretch presets if they fit the budget).
- Reuse of the existing downstream graph and both scopes unchanged.
- Strict-TDD coverage: failing Vitest tests first, against the existing Web Audio
  mock pattern (extend mocks for `createPeriodicWave` / `setPeriodicWave`).

### Out of scope (first slice)

- Per-harmonic **phase** control (only amplitudes in the first slice).
- Arbitrary harmonic count, log/linear scaling toggles, or a draggable spectrum
  canvas editor.
- Saving / loading / sharing custom timbres.
- Inharmonic or stretched partials (non-integer multiples).
- Animating the build-up automatically (e.g. an "add partials one by one" playback).
- Changing or refactoring the existing effect chain, delay sub-graph, or scopes.

## Non-goals

- This is **not** a general-purpose synthesizer. It is a focused teaching device for
  the Fourier/additive concept.
- It must **not** regress or restyle the existing oscillator + effects experience.
  Additive mode is additive (pun intended) — the current tool keeps working
  identically when the mode is set to Waveform.
- No new routes, no new top-level tool — this lives inside `SignalLab.svelte`.

## Open questions for design

1. **Mode vs. fifth waveform** (central decision). Is additive a distinct mode
   toggle (Waveform | Additive) that swaps the source-control UI, or does it appear
   as a fifth entry in the existing waveform radiogroup that reveals the slider
   bank? A separate mode toggle keeps the existing radiogroup semantics clean and is
   the recommended default, but design owns this.
2. **`setPeriodicWave` vs. N oscillators** — confirm the periodic-wave approach
   against the educational goal. The periodic wave hides the "sum of oscillators"
   mechanism behind one node; is that acceptable given the spectrum view already
   makes the sum visible? (Recommended: yes, accept it.)
3. **Harmonic count N** — what value best balances teaching clarity, UI density,
   mobile layout, and the ~400-line budget? (Leaning 8.)
4. **DC / normalization** — `createPeriodicWave` expects the DC term at index 0;
   amplitudes should be normalized or clamped so summed output never exceeds the
   `MAX_GAIN` safety ceiling. Design specifies the normalization rule.
5. **Live-update mechanism** — additive uses a Float32Array coefficient set, not a
   scalar `AudioParam`. The existing per-parameter `$effect` + `setTargetAtTime`
   pattern does not apply; design specifies how a slider change rebuilds and
   re-applies the periodic wave (rebuild `PeriodicWave` and call `setPeriodicWave`
   on each change vs. debounced).
6. **Effects interaction** — when additive mode is active, do effects stay available
   (recommended: yes, this is the powerful payoff — build a sawtooth additively,
   then low-pass it and watch the partials you added disappear), and does the
   waveform `$effect` that writes `oscillator.type` need guarding so it does not
   stomp the periodic wave?
7. **Preset set** — which presets ship in the first slice (sawtooth only vs.
   sawtooth + square + sine)?

## Risks

- **Scope creep past 400 lines.** A full slider bank (N sliders), presets, the mode
  toggle, and the live-update wiring plus tests can exceed the budget. Mitigation:
  keep N modest, ship one preset, lean on the existing UI patterns rather than new
  components. Flag for the tasks phase to split if the forecast exceeds 400.
- **Source-control coupling.** The `$effect` writing `oscillator.type` and the new
  periodic-wave application both target the same node; a missed guard can produce a
  mode where the wrong source wins. Mitigation: design specifies a single
  source-of-truth for what drives the oscillator per mode.
- **Test mock extension.** The Web Audio mock must learn `createPeriodicWave` and
  `setPeriodicWave`; under strict TDD this is real test-infra work, not free.
- **Audio safety.** Summed harmonics can clip or spike loudness; normalization must
  respect the existing `MAX_GAIN` ceiling. Mitigation: normalize coefficients in the
  synthesis step (open question 4).
- **Conceptual honesty vs. simplicity.** `setPeriodicWave` is one node, not a visible
  sum of oscillators, so the implementation does not mirror the mental model exactly.
  The spectrum view mitigates this by showing the partials, but design should
  acknowledge the tradeoff in the explanatory copy.

## Success criteria

- A learner can, while a tone plays, raise harmonic sliders one at a time and watch
  the oscilloscope shape and spectrum build up from sines in real time.
- Pressing the sawtooth preset visibly produces the `1/n` harmonic stack and the
  characteristic ramp waveform.
- The existing waveform + effects experience is byte-for-byte unchanged when not in
  additive mode.
- New behavior is covered by tests that follow the existing mocked-Web-Audio,
  test-first pattern; the suite stays green.
