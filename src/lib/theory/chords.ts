/**
 * Chord formula theory module for the Chord Builder tool.
 *
 * Exports the TriadQuality type, data tables (TRIAD_OFFSETS, TRIAD_FORMULA,
 * TRIAD_INTERVAL_JUMPS), and pure functions (chordTones, chordName, chordMidi).
 *
 * This module is intentionally separate from ChordQuality ('major' | 'minor')
 * used by the CAGED visualizer — the two coexist without collision. See ADR-1.
 */

import { semitoneToNoteName } from '$lib/theory/notes';
import { CHROMATIC } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The four triad qualities the Chord Builder exposes. Short-form values. */
export type TriadQuality = 'maj' | 'min' | 'dim' | 'aug';

/** A degree label as displayed in the formula (uses ♭/♯ accidentals). */
export type DegreeLabel = '1' | '3' | '♭3' | '5' | '♭5' | '♯5';

// ---------------------------------------------------------------------------
// Data tables
// ---------------------------------------------------------------------------

/**
 * Semitone offsets from the root for each triad quality.
 * Index 0 is always 0 (the root itself).
 */
export const TRIAD_OFFSETS: Record<TriadQuality, readonly [0, number, number]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
} as const;

/**
 * Canonical formula strings using Unicode ♭ and ♯ symbols.
 */
export const TRIAD_FORMULA: Record<TriadQuality, string> = {
  maj: '1 - 3 - 5',
  min: '1 - ♭3 - 5',
  dim: '1 - ♭3 - ♭5',
  aug: '1 - 3 - ♯5',
} as const;

/**
 * Semitone jump labels between adjacent chord tones (root→third, third→fifth).
 */
export const TRIAD_INTERVAL_JUMPS: Record<TriadQuality, readonly [string, string]> = {
  maj: ['+4', '+3'],
  min: ['+3', '+4'],
  dim: ['+3', '+3'],
  aug: ['+4', '+4'],
} as const;

/** Degree labels aligned with TRIAD_OFFSETS positions. */
export const TRIAD_DEGREES: Record<TriadQuality, readonly [DegreeLabel, DegreeLabel, DegreeLabel]> =
  {
    maj: ['1', '3', '5'],
    min: ['1', '♭3', '5'],
    dim: ['1', '♭3', '♭5'],
    aug: ['1', '3', '♯5'],
  } as const;

const QUALITY_WORDS: Record<TriadQuality, string> = {
  maj: 'major',
  min: 'minor',
  dim: 'diminished',
  aug: 'augmented',
} as const;

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Returns the note names for a chord given a root pitch class and offset array.
 * Pure: maps each offset through semitoneToNoteName (which wraps mod-12).
 *
 * @param rootPc - Root pitch class 0–11 (0 = C, 1 = C#, …, 11 = B)
 * @param offsets - Semitone offsets from the root (e.g. [0, 4, 7] for major)
 */
export function chordTones(rootPc: number, offsets: readonly number[]): NoteName[] {
  return offsets.map((o) => semitoneToNoteName(rootPc + o));
}

/**
 * Returns the human-readable chord name, e.g. "C major", "F# minor".
 *
 * @param rootName - Root note name (e.g. 'C', 'F#')
 * @param quality - Triad quality
 */
export function chordName(rootName: string, quality: TriadQuality): string {
  return `${rootName} ${QUALITY_WORDS[quality]}`;
}

/**
 * Returns MIDI note numbers for the chord tones.
 * Root MIDI = (octave + 1) * 12 + rootPc — so C4 = 60 with octave=4.
 *
 * @param rootPc - Root pitch class 0–11
 * @param offsets - Semitone offsets from the root
 * @param octave - Octave (default 4, giving C4 = 60)
 */
export function chordMidi(rootPc: number, offsets: readonly number[], octave = 4): number[] {
  const rootMidi = (octave + 1) * 12 + rootPc;
  return offsets.map((o) => rootMidi + o);
}

// ---------------------------------------------------------------------------
// Optional: convenience total function (additive, does not replace named exports)
// ---------------------------------------------------------------------------

export interface Triad {
  readonly root: NoteName;
  readonly quality: TriadQuality;
  readonly offsets: readonly number[];
  readonly degrees: readonly DegreeLabel[];
  readonly notes: readonly NoteName[];
  readonly name: string;
}

/**
 * Total, pure. Resolves a root + quality into the full triad model the UI needs.
 * Notes are derived by mapping each offset through semitoneToNoteName (which
 * wraps mod-12), so every (root × quality) pair is valid — never throws.
 */
export function getTriad(root: NoteName, quality: TriadQuality): Triad {
  const offsets = TRIAD_OFFSETS[quality];
  const degrees = TRIAD_DEGREES[quality];
  const rootPc = CHROMATIC.indexOf(root);
  const notes = chordTones(rootPc, offsets);
  return {
    root,
    quality,
    offsets,
    degrees,
    notes,
    name: chordName(root, quality),
  };
}
