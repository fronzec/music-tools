# Signal Lab — Additive Synthesis Specification

## Purpose

Formal requirements for the additive synthesis mode added to Signal Lab. This is
a new capability — no prior Signal Lab spec exists; this is a full spec, not a
delta. Requirements cover the harmonic slider bank, preset waveforms, live audio
update, scope integration, audio safety, waveform-mode coexistence, and
accessibility.

---

## Requirements

### Requirement: Mode Coexistence

Signal Lab MUST support two source modes that coexist without regression: the
existing **Waveform mode** (sine / triangle / sawtooth / square radiogroup) and
the new **Additive mode** (per-harmonic slider bank). Activating one mode MUST
NOT alter the state or behavior of the other mode's controls. When in Waveform
mode the four built-in waveforms MUST behave exactly as before this change.

#### Scenario: Default mode is Waveform

- GIVEN Signal Lab loads for the first time
- WHEN the component renders
- THEN Waveform mode is active
- AND the four waveform radiogroup buttons are enabled
- AND the harmonic slider bank is hidden or disabled

#### Scenario: Switch to Additive mode

- GIVEN Signal Lab is in Waveform mode with a tone playing
- WHEN the user activates Additive mode
- THEN the harmonic slider bank becomes visible and interactive
- AND the waveform radiogroup becomes inactive (disabled or visually muted)
- AND the tone continues without interruption

#### Scenario: Switch back to Waveform mode

- GIVEN Signal Lab is in Additive mode
- WHEN the user activates Waveform mode
- THEN the waveform radiogroup is active again
- AND the oscillator produces the previously selected built-in waveform
- AND harmonic slider positions are preserved for the next Additive session

---

### Requirement: Harmonic Slider Bank

Signal Lab MUST render a bank of N per-harmonic amplitude sliders (N is a fixed
integer decided by design, leaning 8). Each slider controls the amplitude of
harmonic `k` (k = 1 … N) relative to the fundamental. Slider range MUST be
0.0 to 1.0. All sliders MUST default to 0.0 except harmonic 1, which MUST
default to 1.0 (pure sine on entry to Additive mode).

#### Scenario: Slider bank renders with correct defaults

- GIVEN Additive mode is activated
- WHEN the harmonic slider bank is inspected
- THEN N amplitude sliders are present
- AND slider 1 (fundamental) has value 1.0
- AND sliders 2 … N have value 0.0

#### Scenario: Slider bank is absent in Waveform mode

- GIVEN Signal Lab is in Waveform mode
- WHEN the component is inspected
- THEN the harmonic slider bank is not interactable (hidden or `disabled`)

---

### Requirement: Live Harmonic Update

When a harmonic slider value changes while a tone is playing, the synthesized
waveform MUST update in real time without stopping or restarting the oscillator.
The updated waveform MUST be audible on the NEXT audio-processing block after
the change.

#### Scenario: Moving a slider updates the tone immediately

- GIVEN Additive mode is active and a tone is playing
- WHEN the user changes the amplitude of harmonic k
- THEN the periodic wave is rebuilt with the new coefficient set
- AND the oscillator produces the updated waveform without a click or restart

#### Scenario: Setting all harmonics to zero produces silence (not a crash)

- GIVEN Additive mode is active and a tone is playing
- WHEN the user sets all harmonic sliders to 0.0
- THEN the oscillator continues running but produces no audible output
- AND the system does not throw an error

#### Scenario: Moving a slider while stopped does not crash

- GIVEN Additive mode is active and no tone is playing
- WHEN the user changes a harmonic slider
- THEN the new coefficient is stored
- AND no error is thrown

---

### Requirement: Preset Waveforms

Signal Lab MUST provide at least three preset buttons in Additive mode: **Sine**,
**Sawtooth**, and **Square**. Activating a preset MUST set the harmonic slider
bank to the corresponding coefficient pattern and MUST immediately update the
synthesized waveform if a tone is playing.

| Preset    | Coefficient rule                                | Harmonics used   |
|-----------|------------------------------------------------|------------------|
| Sine      | harmonic 1 = 1.0, harmonics 2..N = 0.0        | Fundamental only |
| Sawtooth  | harmonic k = 1/k (all k = 1..N)               | All              |
| Square    | harmonic k = 1/k if k is odd, 0.0 if k is even | Odd only         |

#### Scenario: Sine preset loads fundamental only

- GIVEN Additive mode is active
- WHEN the user clicks the Sine preset
- THEN slider 1 is set to 1.0
- AND sliders 2..N are set to 0.0
- AND the playing waveform updates to a pure sine

#### Scenario: Sawtooth preset loads 1/n stack

- GIVEN Additive mode is active
- WHEN the user clicks the Sawtooth preset
- THEN slider k is set to 1/k for each k in 1..N
- AND the playing waveform updates to the sawtooth approximation

#### Scenario: Square preset loads odd harmonics only

- GIVEN Additive mode is active
- WHEN the user clicks the Square preset
- THEN slider k is set to 1/k for odd k, 0.0 for even k
- AND the playing waveform updates to the square approximation

#### Scenario: Preset updates sliders visually

- GIVEN Additive mode is active with custom slider positions
- WHEN the user clicks any preset
- THEN the slider UI positions reflect the preset coefficients immediately

---

### Requirement: Scope Integration

The oscilloscope (clean scope) and spectrum (processed scope) MUST reflect the
additively synthesized waveform exactly as they reflect built-in waveforms. No
change to the scope rendering logic is permitted; this requirement is satisfied
by routing additive synthesis through the existing analyser nodes.

#### Scenario: Scopes update when harmonic slider changes

- GIVEN Additive mode is active and a tone is playing
- WHEN the user raises harmonic 2 from 0.0 to 0.5
- THEN the oscilloscope waveform visibly changes shape
- AND the spectrum display shows a bar at the second harmonic frequency

#### Scenario: Scopes are unchanged in Waveform mode

- GIVEN Signal Lab is in Waveform mode
- WHEN the component is inspected
- THEN both scope columns render identically to their pre-change behavior

---

### Requirement: Audio Safety — Normalization

The summed harmonic coefficients MUST be normalized before being passed to the
periodic wave so that the resulting oscillator output, after the master gain
node, never exceeds the existing `MAX_GAIN` ceiling (0.4). The DC coefficient
(index 0 of the imaginary array passed to `createPeriodicWave`) MUST always be
0.0. Normalization MUST be applied at synthesis time, not only at preset load
time — manual slider adjustment MUST also normalize.

#### Scenario: Summed coefficients do not clip

- GIVEN Additive mode is active with all N sliders set to 1.0 (maximum sum)
- WHEN the periodic wave is applied to the oscillator
- THEN the peak output level at the master gain node does not exceed MAX_GAIN (0.4)

#### Scenario: DC term is zero

- GIVEN any harmonic slider configuration
- WHEN the periodic wave coefficients are computed
- THEN the DC component (index 0) is 0.0

#### Scenario: Single slider at full amplitude does not exceed ceiling

- GIVEN only harmonic 1 is set to 1.0, all others are 0.0
- WHEN the periodic wave is applied
- THEN the output level does not exceed MAX_GAIN (0.4)

---

### Requirement: Waveform Effect Guard

When Additive mode is active, any reactive update that normally writes
`oscillator.type` from the waveform selector MUST NOT overwrite the periodic
wave on the oscillator. The oscillator's source configuration MUST be owned
exclusively by the active mode.

#### Scenario: Waveform mode state change does not affect Additive mode output

- GIVEN Additive mode is active and a periodic wave is applied
- WHEN internal waveform state changes (e.g. reactive rune updates)
- THEN `oscillator.type` is NOT written
- AND the periodic wave remains applied

---

### Requirement: Effect Chain Availability in Additive Mode

All existing effects (distortion, low-pass filter, tremolo, delay) MUST remain
available when Signal Lab is in Additive mode. The downstream effect graph MUST
process the additive source without modification.

#### Scenario: Low-pass filter applies to additive waveform

- GIVEN Additive mode is active with a sawtooth preset loaded and a tone playing
- WHEN the user enables the low-pass filter effect
- THEN the high-frequency harmonics are attenuated in the spectrum view
- AND the oscilloscope shows a smoother waveform

#### Scenario: Effects state is preserved when switching modes

- GIVEN the low-pass filter is enabled in Waveform mode
- WHEN the user switches to Additive mode and back
- THEN the low-pass filter remains enabled with the same settings

---

### Requirement: Accessibility

Every harmonic amplitude slider in the additive bank MUST have an `aria-label`
that identifies its harmonic number (e.g. "Harmonic 1 amplitude"). The mode
toggle control MUST have an `aria-label` consistent with the existing Signal Lab
radiogroup pattern. Preset buttons MUST have descriptive `aria-label` values.
Inactive controls MUST carry `disabled` or `aria-disabled="true"`.

#### Scenario: Harmonic sliders have aria-labels

- GIVEN Additive mode is active
- WHEN the harmonic slider bank is inspected
- THEN each slider has `aria-label="Harmonic k amplitude"` where k is its index

#### Scenario: Inactive waveform radiogroup is marked disabled

- GIVEN Additive mode is active
- WHEN the waveform radiogroup is inspected
- THEN each waveform button has `disabled` attribute or `aria-disabled="true"`

#### Scenario: Preset buttons have descriptive labels

- GIVEN Additive mode is active
- WHEN the preset buttons are inspected
- THEN each button has an `aria-label` matching its preset name (e.g. "Sawtooth preset")

---

### Requirement: Test Mock Coverage

The Vitest Web Audio mock MUST be extended to support
`AudioContext.createPeriodicWave(real, imag)` and
`OscillatorNode.setPeriodicWave(wave)`. The mocked implementations MUST record
calls so tests can assert the correct coefficients were passed.

#### Scenario: createPeriodicWave is callable in test environment

- GIVEN the extended Web Audio mock is loaded
- WHEN `audioContext.createPeriodicWave(realArray, imagArray)` is called
- THEN it returns a mock PeriodicWave object without throwing

#### Scenario: setPeriodicWave call is assertable

- GIVEN the extended Web Audio mock is loaded and an oscillator node exists
- WHEN `oscillator.setPeriodicWave(wave)` is called
- THEN the mock records the call
- AND a test can assert it was called with the expected PeriodicWave

---

## Out of Scope

The following are explicitly excluded from this spec and MUST NOT be implemented
in this change: per-harmonic phase control; arbitrary or user-configurable N;
log/linear amplitude scaling toggles; draggable spectrum canvas editor; save /
load / share timbre; inharmonic or stretched partials; automatic partial build-up
animation; changes to the existing effect chain, delay sub-graph, or scope
rendering.
