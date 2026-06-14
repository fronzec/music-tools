import type { NoteName } from '$lib/types/chord';
import { STANDARD_TUNING } from '$lib/types/chord';
import type { BoxName, PentatonicBox, ScalePosition, ScaleQuality } from '$lib/types/scale';
import { BOX_ORDER } from '$lib/types/scale';
import { getNoteName, noteNameToSemitone, semitoneToNoteName } from './notes';

/** Pentatonic scale degrees as semitone distances from the root. */
export const PENTATONIC_INTERVALS: Record<ScaleQuality, number[]> = {
  minor: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 7, 9],
};

const INTERVAL_LABELS: Record<ScaleQuality, Record<number, string>> = {
  minor: { 0: 'R', 3: 'b3', 5: '4', 7: '5', 10: 'b7' },
  major: { 0: 'R', 2: '2', 4: '3', 7: '5', 9: '6' },
};

/** Interval label for a semitone distance from the root, or null if the note
 *  is not part of the pentatonic scale. */
export function getPentatonicIntervalName(semitone: number, quality: ScaleQuality): string | null {
  const normalized = ((semitone % 12) + 12) % 12;
  return INTERVAL_LABELS[quality][normalized] ?? null;
}

/**
 * Minor pentatonic box templates: for each box, per string (low-E → high-E),
 * the [low, high] fret offsets relative to the root's fret on the low-E string.
 * Derived from the canonical A-minor shapes. Correctness (every note belongs to
 * the scale, two notes per string) is enforced by the unit tests, which use
 * scale membership as an independent oracle.
 */
const MINOR_BOX_OFFSETS: Record<BoxName, [number, number][]> = {
  '1': [
    [0, 3],
    [0, 2],
    [0, 2],
    [0, 2],
    [0, 3],
    [0, 3],
  ],
  '2': [
    [3, 5],
    [2, 5],
    [2, 5],
    [2, 4],
    [3, 5],
    [3, 5],
  ],
  '3': [
    [5, 7],
    [5, 7],
    [5, 7],
    [4, 7],
    [5, 8],
    [5, 7],
  ],
  '4': [
    [7, 10],
    [7, 10],
    [7, 9],
    [7, 9],
    [8, 10],
    [7, 10],
  ],
  '5': [
    [-2, 0],
    [-2, 0],
    [-3, 0],
    [-3, 0],
    [-2, 0],
    [-2, 0],
  ],
};

export interface ScaleNote {
  interval: string;
  note: NoteName;
}

/** The five notes of the pentatonic scale, in ascending scale-degree order. */
export function getPentatonicNotes(root: NoteName, quality: ScaleQuality): ScaleNote[] {
  const rootSemitone = noteNameToSemitone(root);
  return PENTATONIC_INTERVALS[quality].map((semitone) => ({
    interval: getPentatonicIntervalName(semitone, quality) ?? '',
    note: semitoneToNoteName(rootSemitone + semitone),
  }));
}

const LOW_E_SEMITONE = STANDARD_TUNING[0];

/** Lowest fret (0–11) on the low-E string whose note equals the given root. */
function rootFretOnLowE(root: NoteName): number {
  return (((noteNameToSemitone(root) - LOW_E_SEMITONE) % 12) + 12) % 12;
}

/**
 * Computes the five pentatonic box positions for a root + quality.
 *
 * A major pentatonic shares its notes with its relative minor (root + 9), so we
 * anchor the box geometry to that relative-minor root and relabel each note's
 * interval for the requested root/quality.
 */
export function getPentatonicBoxes(root: NoteName, quality: ScaleQuality): PentatonicBox[] {
  const anchorRoot = quality === 'minor' ? root : semitoneToNoteName(noteNameToSemitone(root) + 9);
  const base = rootFretOnLowE(anchorRoot);
  const rootSemitone = noteNameToSemitone(root);

  const boxes = BOX_ORDER.map((name) => {
    const frets = MINOR_BOX_OFFSETS[name].map(([lo, hi]) => [base + lo, base + hi]);
    // Keep the box on the neck: if any note falls below the nut, raise the
    // whole box an octave so it stays playable.
    const shift = Math.min(...frets.flat()) < 0 ? 12 : 0;

    const positions: ScalePosition[] = [];
    frets.forEach(([lo, hi], stringIndex) => {
      for (const fret of [lo + shift, hi + shift]) {
        const noteSemitone = noteNameToSemitone(getNoteName(stringIndex, fret) as NoteName);
        const distance = (((noteSemitone - rootSemitone) % 12) + 12) % 12;
        const interval = getPentatonicIntervalName(distance, quality) ?? '';
        positions.push({ stringIndex, fret, interval, isRoot: interval === 'R' });
      }
    });

    const allFrets = positions.map((p) => p.fret);
    return {
      name,
      positions,
      minFret: Math.min(...allFrets),
      maxFret: Math.max(...allFrets),
    };
  });

  if (quality === 'major') {
    // Number major boxes from the major-root position. The major root is the
    // relative minor's b3 (minor Box 2), so rotate the box names down by one.
    const MAJOR_RENAME: Record<BoxName, BoxName> = {
      '1': '5',
      '2': '1',
      '3': '2',
      '4': '3',
      '5': '4',
    };
    return boxes
      .map((b) => ({ ...b, name: MAJOR_RENAME[b.name] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return boxes;
}
