# Audio Playback Specification

## Purpose

`playNote.ts` module: converts MIDI to frequency and schedules a single note with an anti-click amplitude envelope via the Web Audio API. Used by Interval Trainer to play two-note sequences.

## Requirements

### Requirement: Note Scheduling

The system MUST export a `playNote(audioCtx, frequency, startTime, duration)` function that creates an OscillatorNode and a GainNode, applies an anti-click envelope (attack + release ramps), connects them to `audioCtx.destination`, and starts the oscillator at `startTime`.

#### Scenario: Note schedules without throwing (AudioContext stubbed)

- GIVEN `AudioContext` is stubbed in Vitest via `vi.stubGlobal`
- WHEN `playNote` is called with a valid frequency, startTime, and duration
- THEN no exception is thrown
- AND `audioCtx.createOscillator` is called once
- AND `audioCtx.createGain` is called once

#### Scenario: Envelope prevents click

- GIVEN the gain node's envelope is inspected
- WHEN a note is scheduled
- THEN gain ramps from 0 to peak at `startTime + attack` (not an immediate step)
- AND gain ramps back to 0 before `startTime + duration` (release ramp applied)

#### Scenario: Oscillator connects to gain which connects to destination

- GIVEN `playNote` is called
- WHEN the node graph is inspected
- THEN oscillator output → gain input → `audioCtx.destination`

### Requirement: Module Isolation

The `playNote` module MUST NOT import from or depend on `ToneGenerator.svelte`. It MUST be independently importable in a Node/Vitest environment with a stubbed `AudioContext`.

#### Scenario: Isolated import

- GIVEN `playNote.ts` is imported in a Vitest test file
- WHEN the test file is executed with `vi.stubGlobal('AudioContext', MockAudioContext)`
- THEN the import succeeds with no side effects (no AudioContext constructed at module load time)
