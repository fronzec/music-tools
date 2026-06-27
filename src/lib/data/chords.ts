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
 * Returns an empty array when no data exists for the given (root, quality) pair —
 * for example, `'dim'` quality has no CAGED JSON data; callers render an empty board gracefully.
 */
export function getShapes(root: NoteName, quality: ChordQuality): ChordShape[] {
  const entry = SHAPES[root]?.[quality];
  if (!entry) {
    return [];
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

