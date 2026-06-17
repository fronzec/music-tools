/**
 * Chord fretboard theory module for the Chord Builder mirror.
 *
 * Exports ChordFretboardPosition and chordPositions — a pure, full-neck position
 * calculator modeled on intervalPositions() from intervals.ts.
 *
 * Pure: no DOM, no audio, no side effects. Bounded double for-loop.
 */

import { STANDARD_TUNING } from '$lib/theory/tuning';
import { MAX_FRET } from '$lib/theory/intervals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChordFretboardPosition {
  stringIndex: number; // 0..5, tablature order (low E = 0, high E = 5)
  fret: number;        // 0..MAX_FRET inclusive
  pitchClass: number;  // 0..11
  role: 'root' | 'tone';
  /** Index into the offsets array that this cell matched (0 = root).
   *  The component maps this to degrees[degreeIndex]. */
  degreeIndex: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns every fret position on a 6-string standard-tuned neck
 * (frets 0..MAX_FRET) whose pitch class matches a chord offset.
 *
 * Pure: no DOM, no audio. Bounded double for-loop — no while-loops.
 * Mirrors intervalPositions(): normalize root mod-12, then for each
 * (string, fret) cell compute pc = (openNote + fret) % 12 and match it
 * against (normalizedRoot + offsets[k]) % 12. The FIRST matching offset
 * index wins (k ascending), so offset 0 (the root) always wins ties and
 * is emitted exactly once per cell. role = 'root' iff degreeIndex === 0.
 */
export function chordPositions(
  rootPc: number,
  offsets: readonly number[],
): ChordFretboardPosition[] {
  const normalizedRoot = ((rootPc % 12) + 12) % 12;

  // Precompute target pitch class per offset index (parallel to offsets).
  const targetPcs = offsets.map((o) => (((normalizedRoot + o) % 12) + 12) % 12);

  const positions: ChordFretboardPosition[] = [];

  for (let stringIndex = 0; stringIndex <= 5; stringIndex++) {
    const openNote = STANDARD_TUNING[stringIndex];
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const pc = (openNote + fret) % 12;
      // First matching offset index wins (ascending) — root wins any tie.
      const degreeIndex = targetPcs.indexOf(pc);
      if (degreeIndex !== -1) {
        positions.push({
          stringIndex,
          fret,
          pitchClass: pc,
          role: degreeIndex === 0 ? 'root' : 'tone',
          degreeIndex,
        });
      }
    }
  }

  return positions;
}
