import type { NoteName, ChordQuality } from '$lib/types/chord';
import { CHROMATIC } from '$lib/types/chord';

/**
 * Converts a semitone index (0-11) to its note name.
 * Index 0 = C, index 1 = C#, ..., index 11 = B.
 */
export function semitoneToNoteName(index: number): NoteName {
  const wrapped = ((index % 12) + 12) % 12;
  return CHROMATIC[wrapped];
}

/**
 * Converts a note name to its semitone index (0-11).
 * C = 0, C# = 1, ..., B = 11.
 */
export function noteNameToSemitone(name: NoteName): number {
  return CHROMATIC.indexOf(name);
}

/**
 * Returns the interval name for a given semitone distance and chord quality.
 *
 * Intervals for major: 0→R, 4→3, 7→5
 * Intervals for minor: 0→R, 3→b3, 7→5
 */
export function getIntervalName(semitone: number, quality: ChordQuality): string {
  const normalized = ((semitone % 12) + 12) % 12;

  if (normalized === 0) return 'R';
  if (normalized === 7) return '5';

  if (quality === 'major') {
    if (normalized === 4) return '3';
  } else {
    if (normalized === 3) return 'b3';
  }

  // Non-chord tone
  return '';
}
