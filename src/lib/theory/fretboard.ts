import { CAGED_ORDER, type CagedShape, type ChordShape } from '$lib/types/chord';

export interface NoteEntry {
  shape: CagedShape;
  isRoot: boolean;
  interval: string | null;
  absFret: number;
  stringIndex: number;
}

export interface DiffEntry {
  type: 'same' | 'different';
  interval1: string | null;
  interval2: string | null;
}

/**
 * Converts a relative fret number to an absolute fret number.
 *
 * Note: `NoteEntry` also has a field named `absFret` (a number). This exported
 * function is distinct — TypeScript resolves them by scope with no collision.
 *
 * @param baseFret - The shape's base fret (0 for open position, >0 for barre).
 * @param relativeFret - The fret value from the shape data (relative to baseFret when barre).
 * @param isBarre - Whether the shape is a barre position (baseFret > 0).
 */
export function absFret(baseFret: number, relativeFret: number, isBarre: boolean): number {
  return isBarre ? baseFret + relativeFret : relativeFret;
}

export function buildPositionMap(
  shapes: ChordShape[],
  visibleShapes: Set<CagedShape>,
): Map<string, NoteEntry[]> {
  const map = new Map<string, NoteEntry[]>();

  for (const shapeType of CAGED_ORDER) {
    const shape = shapes.find((s) => s.shape === shapeType);
    if (!shape || !visibleShapes.has(shapeType)) continue;

    const isBarre = shape.baseFret > 0;
    for (let i = 0; i < 6; i++) {
      const fret = shape.frets[i];
      if (fret === null) continue;
      const absoluteFret = absFret(shape.baseFret, fret, isBarre);
      const key = `${absoluteFret},${i}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        shape: shapeType,
        isRoot: shape.intervals[i] === 'R',
        interval: shape.intervals[i],
        absFret: absoluteFret,
        stringIndex: i,
      });
    }
  }

  for (const notes of map.values()) {
    notes.sort((a, b) => CAGED_ORDER.indexOf(a.shape) - CAGED_ORDER.indexOf(b.shape));
  }

  return map;
}
