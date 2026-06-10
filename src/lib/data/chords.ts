import type { NoteName, ChordQuality } from '$lib/types/chord';
import type { ChordShape } from '$lib/types/chord';
import { CAGED_ORDER } from '$lib/types/chord';
import shapesData from './caged-shapes.json';

/**
 * Chord data store keyed by root note, then quality (major/minor).
 * Each entry is an array of 5 ChordShape objects, unsorted.
 */
const SHAPES = shapesData as Record<NoteName, Record<ChordQuality, ChordShape[]>>;

/**
 * Returns exactly 5 shapes for the given root and quality, in CAGED order (C, A, G, E, D).
 *
 * @throws {Error} If the root or quality is not found in the dataset.
 */
export function getShapes(root: NoteName, quality: ChordQuality): ChordShape[] {
  const entry = SHAPES[root]?.[quality];
  if (!entry) {
    throw new Error(`No shapes found for ${root} ${quality}`);
  }
  // Sort into CAGED order
  return [...entry].sort(
    (a, b) => CAGED_ORDER.indexOf(a.shape) - CAGED_ORDER.indexOf(b.shape),
  );
}

/**
 * Returns all 12 root names for which shapes exist.
 */
export function getAllRoots(): NoteName[] {
  return Object.keys(SHAPES) as NoteName[];
}

/**
 * Returns all chord qualities for which shapes exist.
 */
export function getAllQualities(): ChordQuality[] {
  return ['major', 'minor'];
}

/**
 * Validates the shape dataset integrity.
 *
 * Checks: correct count (120), valid structure per shape (6 frets/intervals,
 * baseFret ≥ 0, rootString in range), null consistency, and known open chords.
 *
 * Returns `true` if all validations pass.
 */
export function validate(): boolean {
  const roots = getAllRoots();

  // Must have exactly 12 roots
  if (roots.length !== 12) return false;

  let total = 0;

  for (const root of roots) {
    for (const quality of getAllQualities()) {
      const shapes = getShapes(root, quality);

      // Must have exactly 5 shapes per root+quality
      if (shapes.length !== 5) return false;

      // Must be in CAGED order
      const expectedOrder = ['C', 'A', 'G', 'E', 'D'];
      const actualOrder = shapes.map((s) => s.shape);
      if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) return false;

      for (const shape of shapes) {
        // Must have exactly 6 frets and 6 intervals
        if (shape.frets.length !== 6) return false;
        if (shape.intervals.length !== 6) return false;

        // baseFret ≥ 0 (at least 1 for open or positive for barre)
        if (shape.baseFret < 0) return false;

        // rootString in range 0–5
        if (shape.rootString < 0 || shape.rootString > 5) return false;

        // root and quality must match the lookup key
        if (shape.root !== root) return false;
        if (shape.quality !== quality) return false;

        // Null consistency: frets[i] is null iff intervals[i] is null
        for (let i = 0; i < 6; i++) {
          if ((shape.frets[i] === null) !== (shape.intervals[i] === null)) return false;
        }

        // Non-null frets must be ≥ 0
        for (const f of shape.frets) {
          if (f !== null && f < 0) return false;
        }
      }

      total += shapes.length;
    }
  }

  // Must have exactly 120 shapes total
  if (total !== 120) return false;

  return true;
}
