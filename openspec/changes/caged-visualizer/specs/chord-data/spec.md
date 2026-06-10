# Chord Data Specification

## Purpose

Define the static data model, types, and lookup utilities for 120 pre-computed CAGED chord shapes.

## Requirements

### Requirement: CAGED Shape Dataset

The system MUST provide a static dataset containing exactly 120 chord shapes: 12 roots × 2 qualities (major, minor) × 5 CAGED shapes (C, A, G, E, D).

#### Scenario: All shapes are present

- GIVEN the chord data module is loaded
- WHEN querying for all shapes
- THEN exactly 120 unique shapes are returned

#### Scenario: Lookup by root, quality, and shape

- GIVEN the chord data module is loaded
- WHEN querying for root "C", quality "major", shape "C"
- THEN a single shape with the expected fret positions is returned

#### Scenario: Lookup by root and quality returns all 5 shapes

- GIVEN the chord data module is loaded
- WHEN querying for root "G", quality "minor"
- THEN exactly 5 shapes are returned, one for each CAGED shape name

### Requirement: TypeScript Data Model

The system MUST define TypeScript types for chord shapes and voicings that enforce data integrity.

#### Scenario: Type validation catches invalid data

- GIVEN a shape is defined with an invalid interval string
- WHEN TypeScript compilation runs
- THEN a type error is emitted

#### Scenario: Fret array is exactly 6 elements

- GIVEN a `ChordShape` is instantiated
- WHEN its `frets` property is accessed
- THEN the array has exactly 6 elements
- AND each element is either a non-negative integer or `null`

### Requirement: Shape Data Fields

Each chord shape MUST contain: fret positions per string (6 values, `null` for muted), intervals per string, base fret, root string, and shape name.

#### Scenario: Muted string is represented as null

- GIVEN a shape where the 6th string is not played
- WHEN the shape data is read
- THEN the 6th string's fret value is `null`
- AND its interval value is `null`

#### Scenario: Barre chord includes base fret

- GIVEN an A-shape barre chord at the 5th fret
- WHEN the shape data is read
- THEN `baseFret` equals 5

### Requirement: Music Theory Utilities

The system MUST provide pure utility functions for semitone-to-note-name conversion, note-name-to-semitone-index, and interval calculation.

#### Scenario: Semitone to note name

- GIVEN the utility function is called with semitone index 0
- WHEN the result is read
- THEN the note name is "C"

#### Scenario: Note name to semitone

- GIVEN the utility function is called with "A#"
- WHEN the result is read
- THEN the semitone index is 10

#### Scenario: Interval calculation

- GIVEN a root note and a target note
- WHEN the interval is calculated
- THEN the correct interval in semitones is returned

### Requirement: Standard Tuning Constant

The system MUST define standard guitar tuning (EADGBE) as a constant array of semitone offsets.

#### Scenario: Tuning constant is correct

- GIVEN the tuning constant is accessed
- WHEN its values are compared to standard EADGBE
- THEN the offsets match [4, 11, 7, 2, 9, 4] (low E to high E)

### Requirement: No Runtime Computation of Shapes

The system MUST NOT compute CAGED shapes at runtime; all shapes SHALL be pre-computed in the static data file.

#### Scenario: Data is static

- GIVEN the application is running
- WHEN the chord data is loaded
- THEN no algorithmic chord generation is executed
- AND the data is imported as a static module
