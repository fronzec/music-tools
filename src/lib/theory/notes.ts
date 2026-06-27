import type { NoteName, ChordQuality, LabelMode } from '$lib/types/chord';
import { CHROMATIC, STANDARD_TUNING } from '$lib/types/chord';

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

  if (quality === 'major') {
    if (normalized === 4) return '3';
    if (normalized === 7) return '5';
  } else if (quality === 'minor') {
    if (normalized === 3) return 'b3';
    if (normalized === 7) return '5';
  } else if (quality === 'dim') {
    if (normalized === 3) return 'b3';
    if (normalized === 6) return 'b5';
  }

  // Non-chord tone
  return '';
}

/**
 * Returns the note name for a given string and absolute fret position.
 *
 * @param stringIndex - String index 0–5 (low E to high E, tablature order).
 * @param absoluteFret - Absolute fret number (not relative to baseFret).
 */
export function getNoteName(stringIndex: number, absoluteFret: number): string {
  const openSemitone = STANDARD_TUNING[stringIndex];
  const frettedSemitone = openSemitone + absoluteFret;
  return semitoneToNoteName(frettedSemitone);
}

/**
 * Returns the display label for a note given the active label mode.
 *
 * Unlike the component-local versions, `labelMode` is an explicit parameter
 * rather than a closed-over prop — making this function pure and importable.
 *
 * @param stringIndex - String index 0–5.
 * @param absoluteFret - Absolute fret number.
 * @param interval - Interval label ('R', '3', 'b3', '5') or null for muted strings.
 * @param labelMode - Display mode: 'intervals', 'notes', or 'both'.
 */
export function getLabel(
  stringIndex: number,
  absoluteFret: number,
  interval: string | null,
  labelMode: LabelMode,
): string | null {
  if (interval === null) return null;
  const noteName = getNoteName(stringIndex, absoluteFret);

  switch (labelMode) {
    case 'intervals':
      return interval;
    case 'notes':
      return noteName;
    case 'both':
      return `${noteName} (${interval})`;
    default:
      return interval;
  }
}
