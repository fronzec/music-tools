# Interval Data Specification

## Purpose

Chromatic interval-name table and associated type. Provides the canonical 12-entry mapping from semitone count to interval name used by the ear-training quiz.

## Requirements

### Requirement: IntervalName Type

The system MUST define an `IntervalName` type representing one of the 12 canonical interval names.

#### Scenario: Type covers all 12 intervals

- GIVEN the `IntervalName` type is defined
- WHEN it is inspected
- THEN it includes exactly the names: "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Perfect Octave"

### Requirement: Interval Table

The system MUST export an array of 12 interval entries, each with a canonical name and semitone count. Semitone values MUST be consecutive integers from 1 to 12. Each name MUST be unique.

#### Scenario: Table maps semitones correctly

| Semitones | Expected name     |
|-----------|-------------------|
| 1         | Minor 2nd         |
| 2         | Major 2nd         |
| 3         | Minor 3rd         |
| 4         | Major 3rd         |
| 5         | Perfect 4th       |
| 6         | Tritone           |
| 7         | Perfect 5th       |
| 8         | Minor 6th         |
| 9         | Major 6th         |
| 10        | Minor 7th         |
| 11        | Major 7th         |
| 12        | Perfect Octave    |

- GIVEN the interval table is imported
- WHEN each entry is accessed by index
- THEN `entry.semitones` matches the expected value from the table above
- AND `entry.name` matches the expected name from the table above

#### Scenario: Table has no duplicate names

- GIVEN the interval table is imported
- WHEN all entry names are collected into a Set
- THEN the Set size equals 12

#### Scenario: Table has no duplicate semitone values

- GIVEN the interval table is imported
- WHEN all semitone values are collected into a Set
- THEN the Set size equals 12

### Requirement: noteToFreq Helper

The system MUST export a `noteToFreq(midi: number): number` function that converts a MIDI note number to frequency in Hz using equal temperament with A4 = 440 Hz.

The formula MUST be: `440 * 2^((midi - 69) / 12)`.

#### Scenario: A4 = 440 Hz

- GIVEN `noteToFreq` is called with MIDI value 69
- WHEN the result is evaluated
- THEN it equals exactly 440

#### Scenario: A3 = 220 Hz

- GIVEN `noteToFreq` is called with MIDI value 57
- WHEN the result is evaluated
- THEN it equals exactly 220

#### Scenario: A5 = 880 Hz

- GIVEN `noteToFreq` is called with MIDI value 81
- WHEN the result is evaluated
- THEN it equals exactly 880

#### Scenario: C4 ≈ 261.63 Hz

- GIVEN `noteToFreq` is called with MIDI value 60
- WHEN the result is evaluated
- THEN it is within 0.01 Hz of 261.63
