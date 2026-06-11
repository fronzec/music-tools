# Tone Generator Specification

## Purpose

A reference tone generator for ear training. Plays standard guitar string frequencies (E2, A2, D3, G3, B3, E4) using the Web Audio API. Provides volume and waveform controls.

## Requirements

### Requirement: String Buttons

The system MUST render 6 buttons, one per standard guitar string, each displaying the string name, note, frequency, and number.

#### Scenario: All 6 strings render

- GIVEN the Tone Generator view is active
- WHEN the component renders
- THEN 6 buttons are present with labels "Low E (E2) 82.41 Hz", "A (A2) 110.00 Hz", "D (D3) 146.83 Hz", "G (G3) 196.00 Hz", "B (B3) 246.94 Hz", "High E (E4) 329.63 Hz"

#### Scenario: String number ordering

- GIVEN the Tone Generator view is active
- WHEN the string buttons are inspected
- THEN they are ordered from lowest pitch (E2, string 6) to highest pitch (E4, string 1)

### Requirement: Tone Playback

The system MUST play the correct frequency when a string button is clicked, and MUST stop playback when clicked again.

#### Scenario: Play on click

- GIVEN no tone is currently playing
- WHEN the user clicks the E2 string button
- THEN an oscillator starts producing 82.41 Hz
- AND the button shows "Stop" text with a blue highlight

#### Scenario: Stop on second click

- GIVEN the E2 tone is playing
- WHEN the user clicks the E2 button again
- THEN the oscillator stops
- AND the button returns to "Play" text with default styling

#### Scenario: Switch strings

- GIVEN the E2 tone is playing
- WHEN the user clicks the A2 button
- THEN the E2 oscillator stops
- AND a new oscillator starts producing 110.00 Hz
- AND only the A2 button is highlighted

### Requirement: Volume Control

The system MUST provide a volume slider (range 0.0 to 1.0, default 0.3) that adjusts the GainNode in real time.

#### Scenario: Volume slider exists

- GIVEN the Tone Generator view is active
- WHEN the Sound card is inspected
- THEN a volume slider labeled "Volume" is present with default value 0.3

#### Scenario: Volume affects gain

- GIVEN a tone is playing at volume 0.3
- WHEN the user moves the volume slider to 0.8
- THEN the gain node value updates to 0.8 in real time

### Requirement: Wave Type Selector

The system MUST provide a waveform selector (sine, triangle, sawtooth, square) that changes the oscillator type. Default MUST be 'sine'.

#### Scenario: Wave type selector exists

- GIVEN the Tone Generator view is active
- WHEN the Sound card is inspected
- THEN 4 waveform option buttons are present: sine, triangle, sawtooth, square
- AND sine is selected by default

#### Scenario: Wave type changes oscillator

- GIVEN a tone is playing with wave type 'sine'
- WHEN the user selects 'square'
- THEN the oscillator type changes to 'square'
- AND the tone character audibly changes

### Requirement: Navigation

The system MUST include a back button that navigates to home.

#### Scenario: Back to home

- GIVEN the user is on the Tone Generator view
- WHEN the user clicks the "← Back to Home" button
- THEN `navigate('home')` is called

### Requirement: Resource Cleanup

The system MUST stop the oscillator and close the AudioContext when the component is destroyed.

#### Scenario: Cleanup on unmount

- GIVEN a tone is playing and AudioContext is active
- WHEN the component is unmounted
- THEN the oscillator is stopped
- AND the AudioContext is closed
