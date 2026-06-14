# Signal Lab Specification

## Purpose

An interactive audio tool for learning sound design fundamentals through real-time synthesis and effect application. Consists of a signal source (oscillator with configurable waveform or additive harmonic synthesis) fed through a chain of audio effects (distortion, low-pass filter, tremolo, delay), with live oscilloscope and spectrum visualization of both the clean and processed signals.

---

## Requirements

### Requirement: Oscillator Source Configuration

Signal Lab MUST support two independent source modes: a built-in waveform selector, and an additive synthesis mode with per-harmonic control. Exactly one mode is active at a time; switching modes preserves the internal state of the inactive mode.

#### Scenario: Waveform mode is default

- GIVEN Signal Lab loads for the first time
- WHEN the component renders
- THEN waveform mode is active
- AND a radiogroup offers four built-in waveforms: sine, triangle, sawtooth, square
- AND waveform mode is marked as selected in the source mode toggle

#### Scenario: Built-in waveforms behave identically to pre-change behavior

- GIVEN Signal Lab is in waveform mode
- WHEN the user selects any of the four waveforms (sine, triangle, sawtooth, square)
- THEN the oscillator produces that waveform exactly as before additive synthesis was added
- AND the oscilloscope and spectrum reflect the waveform's harmonics

#### Scenario: Switch to additive mode

- GIVEN Signal Lab is in waveform mode with a tone playing
- WHEN the user activates additive mode
- THEN the harmonic slider bank becomes visible and interactive
- AND the waveform radiogroup becomes inactive (disabled)
- AND the tone continues without interruption
- AND the additive mode produces a periodic wave from the current harmonic slider state

#### Scenario: Switch back to waveform mode

- GIVEN Signal Lab is in additive mode
- WHEN the user activates waveform mode
- THEN the waveform radiogroup is active again
- AND the oscillator produces the selected built-in waveform
- AND harmonic slider positions are preserved for the next additive session

---

### Requirement: Additive Synthesis Mode

When in additive mode, Signal Lab MUST render a bank of N per-harmonic amplitude sliders (N is a fixed integer, nominally 8). Each slider controls the amplitude of harmonic k (k = 1 … N) relative to the fundamental. The sum of all slider amplitudes is normalized to prevent clipping.

#### Scenario: Slider bank renders with correct defaults

- GIVEN additive mode is activated
- WHEN the harmonic slider bank is inspected
- THEN N amplitude sliders are present (N = 8)
- AND slider 1 (fundamental) has value 1.0
- AND sliders 2 … N have value 0.0 (i.e., the default is a pure sine)

#### Scenario: Slider bank is absent or inactive in waveform mode

- GIVEN Signal Lab is in waveform mode
- WHEN the component is inspected
- THEN the harmonic slider bank is not interactable (hidden or disabled with `disabled` or `aria-disabled="true"`)

#### Scenario: Live harmonic update while playing

- GIVEN additive mode is active and a tone is playing
- WHEN the user changes the amplitude of any harmonic slider
- THEN the periodic wave is rebuilt and applied to the oscillator
- AND the updated waveform is audible on the NEXT audio-processing block (no clicks or restarts)
- AND the oscilloscope and spectrum update to reflect the new harmonic content

#### Scenario: All harmonics zero produces silence

- GIVEN additive mode is active and a tone is playing
- WHEN the user sets all harmonic sliders to 0.0
- THEN the oscillator continues running but produces no audible output
- AND the system does not throw an error

#### Scenario: Slider changes while stopped do not crash

- GIVEN additive mode is active and no tone is playing
- WHEN the user changes any harmonic slider
- THEN the new coefficient is stored
- AND no error is thrown

---

### Requirement: Additive Synthesis Presets

Signal Lab MUST provide preset buttons that populate the harmonic slider bank with standard waveform patterns. At minimum, three presets are available: **Sine**, **Sawtooth**, and **Square**.

#### Scenario: Sine preset loads fundamental only

- GIVEN additive mode is active
- WHEN the user clicks the Sine preset button
- THEN slider 1 is set to 1.0
- AND sliders 2..N are set to 0.0
- AND the playing waveform updates to a pure sine

#### Scenario: Sawtooth preset loads 1/n harmonic stack

- GIVEN additive mode is active
- WHEN the user clicks the Sawtooth preset button
- THEN slider k is set to 1/k for each k in 1..N
- AND the playing waveform updates to the sawtooth approximation
- AND the oscilloscope shows the characteristic sawtooth ramp shape
- AND the spectrum displays a monotonic decrease in harmonic amplitude

#### Scenario: Square preset loads odd harmonics only

- GIVEN additive mode is active
- WHEN the user clicks the Square preset button
- THEN slider k is set to 1/k for odd k, and 0.0 for even k
- AND the playing waveform updates to the square approximation
- AND the spectrum shows no even-harmonic bars

#### Scenario: Preset updates slider UI immediately

- GIVEN additive mode is active with custom slider positions
- WHEN the user clicks any preset button
- THEN the harmonic slider UI positions reflect the preset coefficients immediately

---

### Requirement: Audio Safety — Harmonic Normalization

The summed harmonic coefficients MUST be normalized before being applied to the oscillator so that the resulting waveform, after the master gain node, never exceeds the existing MAX_GAIN ceiling (0.4). Normalization MUST use L1 (sum of absolute values) to guarantee that the peak instantaneous amplitude is bounded.

#### Scenario: Summed coefficients do not clip

- GIVEN additive mode is active with all N sliders set to 1.0 (maximum sum)
- WHEN the periodic wave is applied to the oscillator
- THEN the peak output level at the master gain node does not exceed MAX_GAIN (0.4)

#### Scenario: Single slider at full amplitude remains safe

- GIVEN only harmonic 1 is set to 1.0 and all others are 0.0
- WHEN the periodic wave is applied
- THEN the output level does not exceed MAX_GAIN (0.4)

#### Scenario: DC term is zero

- GIVEN any harmonic slider configuration
- WHEN the periodic wave coefficients are computed
- THEN the DC component (Fourier index 0) is 0.0 for both real and imaginary arrays

---

### Requirement: Waveform Effect Guard

When additive mode is active, the reactive effect that normally writes `oscillator.type` from the waveform selector MUST be gated and MUST NOT execute. The oscillator's source configuration MUST be owned exclusively by the active mode at any time. Conversely, when waveform mode is active, the additive synthesis effect MUST NOT execute, ensuring that `setPeriodicWave` is never called.

#### Scenario: Waveform mode state change does not affect additive output

- GIVEN additive mode is active and a periodic wave is applied
- WHEN internal waveform state changes (e.g., reactive rune updates from a stale binding)
- THEN `oscillator.type` is NOT written
- AND the periodic wave remains applied
- AND the spectrum does not change unexpectedly

#### Scenario: Additive mode state change does not trigger waveform oscillator.type

- GIVEN waveform mode is active
- WHEN the user switches to additive and back
- THEN `setPeriodicWave` is NEVER called while in waveform mode

---

### Requirement: Effect Chain Availability in All Source Modes

All existing effects (distortion, low-pass filter, tremolo, delay) MUST remain fully available regardless of whether the source is a built-in waveform or additive synthesis. The downstream effect graph MUST process either source identically without modification or regression.

#### Scenario: Effects chain applies to additive source

- GIVEN additive mode is active with a sawtooth preset loaded and a tone playing
- WHEN the user enables the low-pass filter effect and moves its cutoff frequency slider
- THEN the high-frequency harmonics are attenuated visibly in the spectrum view
- AND the oscilloscope waveform visibly smooths

#### Scenario: Effects state is preserved across mode switches

- GIVEN the low-pass filter is enabled in waveform mode with a specific cutoff frequency
- WHEN the user switches to additive mode and back
- THEN the low-pass filter remains enabled with the same cutoff frequency setting

---

### Requirement: Scope Integration

The oscilloscope (clean scope) and spectrum analyzer (processed scope) MUST display the additively synthesized waveform with the same fidelity as they display built-in waveforms. No changes to the scope rendering logic are permitted; additive synthesis feeds the same analyser nodes downstream.

#### Scenario: Scopes update when harmonic slider changes

- GIVEN additive mode is active and a tone is playing
- WHEN the user raises harmonic 2 from 0.0 to 0.5
- THEN the oscilloscope waveform visibly changes shape
- AND the spectrum display shows a bar at the second harmonic frequency with magnitude proportional to 0.5

#### Scenario: Scopes are unchanged in waveform mode

- GIVEN Signal Lab is in waveform mode
- WHEN the component is inspected
- THEN both scope columns render identically to their pre-change behavior with no regressions

---

### Requirement: Accessibility

Every harmonic amplitude slider in the additive bank MUST have an `aria-label` that identifies its harmonic number (e.g., "Harmonic 1 amplitude"). The source mode toggle control MUST have an `aria-label` consistent with the Signal Lab radiogroup pattern. Preset buttons MUST have descriptive `aria-label` values. Inactive controls MUST carry a `disabled` attribute or `aria-disabled="true"` attribute.

#### Scenario: Harmonic sliders have proper ARIA labels

- GIVEN additive mode is active
- WHEN the harmonic slider bank is inspected by an accessibility tool or screen reader
- THEN each slider has `aria-label="Harmonic k amplitude"` where k is its index (1..8)

#### Scenario: Source mode radiogroup is labeled

- GIVEN Signal Lab loads
- WHEN the source mode toggle is inspected
- THEN the radiogroup has `aria-label="Source"` or similar descriptive label
- AND buttons are labeled "Waveform" and "Additive"

#### Scenario: Inactive waveform radiogroup is marked disabled

- GIVEN additive mode is active
- WHEN the waveform radiogroup is inspected
- THEN each waveform button has `disabled` attribute or `aria-disabled="true"` attribute

#### Scenario: Preset buttons have descriptive labels

- GIVEN additive mode is active
- WHEN the preset buttons are inspected
- THEN each button has an `aria-label` matching its preset name (e.g., "Sawtooth preset", "Sine preset", "Square preset")

---

### Requirement: Test Mock Coverage

The Vitest Web Audio mock MUST be extended to support `AudioContext.createPeriodicWave(real, imag, options)` and `OscillatorNode.setPeriodicWave(wave)`. The mocked implementations MUST record all calls so tests can assert the correct coefficients were passed and the proper source-of-truth guards are enforced.

#### Scenario: createPeriodicWave is callable in test environment

- GIVEN the extended Web Audio mock is loaded in a Vitest test
- WHEN `audioContext.createPeriodicWave(realArray, imagArray, { disableNormalization: true })` is called
- THEN it returns a mock PeriodicWave object without throwing
- AND the mock can be inspected to verify the coefficient arrays passed

#### Scenario: setPeriodicWave call is assertable

- GIVEN the extended Web Audio mock is loaded and an oscillator node exists
- WHEN `oscillator.setPeriodicWave(wave)` is called
- THEN the mock records the call
- AND a test can assert via `expect(mockOscillator.setPeriodicWave).toHaveBeenCalled()` and inspect the wave argument

---

### Requirement: Source Mode Conflict Resolution — Single Source of Truth

The oscillator source (what drives the tone: built-in waveform vs. additive periodic wave) MUST be governed by a single source-of-truth reactive variable (`sourceMode`). Both the waveform `$effect` (that writes `oscillator.type`) and the additive `$effect` (that writes `oscillator.setPeriodicWave`) MUST read this variable and execute ONLY when their respective mode is active. This ensures that:

- In waveform mode, `setPeriodicWave` is NEVER called.
- In additive mode, `oscillator.type` is NEVER written (after mode switch).
- Switching modes causes exactly one effect to re-apply the correct source.

#### Scenario: Reactive effects are mode-aware and gated

- GIVEN Signal Lab has two reactively-dependent effects: one for waveform source, one for additive source
- WHEN the source mode changes
- THEN the inactive effect is a no-op (its guard prevents execution)
- AND the active effect re-runs and re-applies the correct source to the oscillator
- AND no manual switch handler is needed (the rune graph guarantees deterministic behavior)

---

## Out of Scope

The following features are explicitly excluded from this specification and MUST NOT be implemented:

- Per-harmonic **phase** control (only amplitudes are supported).
- Arbitrary harmonic count, user-configurable N, or log/linear amplitude scaling toggles.
- Draggable spectrum canvas editor.
- Saving, loading, or sharing custom timbres.
- Inharmonic or stretched partials (non-integer multiples of the fundamental).
- Automatic partial build-up animation (e.g., "add partials one by one" playback).
- Changes to the existing effect chain, delay sub-graph, or scope rendering.
- Changes to the existing waveform radiogroup behavior in waveform mode.
