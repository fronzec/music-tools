/**
 * Tab theory module for the Tab Player.
 *
 * Provides the core data types, open-string MIDI anchors, and fretToMidi
 * conversion for standard-tuned 6-string guitar.
 *
 * String numbering follows tablature convention:
 *   0 = low E (E2, MIDI 40) … 5 = high E (E4, MIDI 64)
 *
 * IMPORTANT: OPEN_MIDI is distinct from STANDARD_TUNING in chord.ts.
 * STANDARD_TUNING holds pitch classes [4,9,2,7,11,4]; OPEN_MIDI holds
 * absolute MIDI note numbers [40,45,50,55,59,64].
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single fret position on the neck. string 0 = low E, 5 = high E. */
export interface TabNote {
  readonly string: number; // 0..5
  readonly fret: number; // 0..MAX_FRET (typically 14)
}

/** One playback step — an array of simultaneous positions (single note or chord). */
export type TabStep = readonly TabNote[];

/** A curated guitar tab with metadata and an ordered list of steps. */
export interface Tab {
  readonly title: string;
  readonly steps: readonly TabStep[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Open-string MIDI note numbers for standard tuning.
 * Index 0 = low E (MIDI 40, E2) … Index 5 = high E (MIDI 64, E4).
 *
 * These are absolute MIDI values, NOT pitch classes.
 */
export const OPEN_MIDI: readonly [40, 45, 50, 55, 59, 64] = [40, 45, 50, 55, 59, 64] as const;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Maps a guitar fret position to a MIDI note number.
 *
 * fretToMidi(stringIndex, fret) = OPEN_MIDI[stringIndex] + fret
 *
 * Pure, bounded: no loops, no side effects.
 *
 * @param stringIndex - String index 0..5 (0 = low E, 5 = high E)
 * @param fret - Fret number 0..N (0 = open string)
 * @returns MIDI note number
 */
export function fretToMidi(stringIndex: number, fret: number): number {
  return OPEN_MIDI[stringIndex] + fret;
}
