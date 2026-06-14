/**
 * Interval theory module for the Interval Ear Trainer.
 *
 * Provides the canonical 12-entry interval table, MIDI frequency conversion,
 * and a pure question-generation function with injectable RNG for deterministic tests.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Rng = () => number;

export type IntervalName =
  | 'Minor 2nd'
  | 'Major 2nd'
  | 'Minor 3rd'
  | 'Major 3rd'
  | 'Perfect 4th'
  | 'Tritone'
  | 'Perfect 5th'
  | 'Minor 6th'
  | 'Major 6th'
  | 'Minor 7th'
  | 'Major 7th'
  | 'Perfect Octave';

export interface Interval {
  semitones: number; // 1..12
  name: IntervalName;
  short: string; // m2, M2, m3, M3, P4, TT, P5, m6, M6, m7, M7, P8
}

export interface Question {
  rootMidi: number;
  interval: Interval;
  lowMidi: number;
  highMidi: number;
  choices: IntervalName[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Lowest comfortable root note (A3). */
export const ROOT_MIN = 57;

/** Number of possible root notes (57..69 inclusive = A3..A4). */
export const ROOT_SPAN = 13;

// ---------------------------------------------------------------------------
// Interval table — index i has semitones i+1, ordered m2..P8.
// ---------------------------------------------------------------------------

export const INTERVALS: readonly Interval[] = [
  { semitones: 1, name: 'Minor 2nd', short: 'm2' },
  { semitones: 2, name: 'Major 2nd', short: 'M2' },
  { semitones: 3, name: 'Minor 3rd', short: 'm3' },
  { semitones: 4, name: 'Major 3rd', short: 'M3' },
  { semitones: 5, name: 'Perfect 4th', short: 'P4' },
  { semitones: 6, name: 'Tritone', short: 'TT' },
  { semitones: 7, name: 'Perfect 5th', short: 'P5' },
  { semitones: 8, name: 'Minor 6th', short: 'm6' },
  { semitones: 9, name: 'Major 6th', short: 'M6' },
  { semitones: 10, name: 'Minor 7th', short: 'm7' },
  { semitones: 11, name: 'Major 7th', short: 'M7' },
  { semitones: 12, name: 'Perfect Octave', short: 'P8' },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Converts a MIDI note number to frequency in Hz using equal temperament.
 * Formula: 440 * 2^((midi - 69) / 12). A4 = MIDI 69 = 440 Hz.
 */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Returns the Interval entry for a given semitone distance (1..12).
 * Throws RangeError for values outside that range.
 */
export function intervalBySemitones(n: number): Interval {
  if (n < 1 || n > 12) {
    throw new RangeError(`semitones must be between 1 and 12, got ${n}`);
  }
  return INTERVALS[n - 1];
}

/**
 * Maps rng() in [0, 1] to a safe array index in [0, n - 1].
 * Clamps the n === 1.0 edge so it never returns n (out of bounds).
 */
function pickIndex(n: number, rng: Rng): number {
  return Math.min(n - 1, Math.floor(rng() * n));
}

/**
 * Generates a quiz question with injectable RNG for deterministic tests.
 *
 * Algorithm (per ADR-4):
 * 1. Pick the correct interval: INTERVALS[pickIndex(12)]
 * 2. Pick the root MIDI: ROOT_MIN + pickIndex(ROOT_SPAN)
 * 3. Pick 3 distinct distractors by sampling the other 11 intervals WITHOUT
 *    replacement — always terminates in exactly 3 steps, even when rng is a
 *    deterministic stub that returns a constant value.
 * 4. Fisher-Yates shuffle all 4 choices using rng
 */
export function generateQuestion(rng: Rng = Math.random): Question {
  // Step 1: pick interval
  const interval = INTERVALS[pickIndex(12, rng)];

  // Step 2: pick root
  const rootMidi = ROOT_MIN + pickIndex(ROOT_SPAN, rng);

  // Step 3: sample 3 distractors without replacement from the other 11.
  const pool = INTERVALS.filter((c) => c.semitones !== interval.semitones);
  const choices: Interval[] = [interval];
  for (let k = 0; k < 3; k++) {
    const idx = pickIndex(pool.length, rng);
    choices.push(pool[idx]);
    pool.splice(idx, 1);
  }

  // Step 4: Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return {
    rootMidi,
    interval,
    lowMidi: rootMidi,
    highMidi: rootMidi + interval.semitones,
    choices: choices.map((c) => c.name),
  };
}
