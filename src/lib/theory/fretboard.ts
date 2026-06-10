import { CAGED_ORDER, type CagedShape, type ChordShape } from '$lib/types/chord';
import { SHAPE_COLORS } from './layout';

export interface NoteEntry {
  shape: CagedShape;
  color: string;
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
      const absFret = isBarre ? shape.baseFret + fret : fret;
      const key = `${absFret},${i}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        shape: shapeType,
        color: SHAPE_COLORS[shapeType],
        isRoot: shape.intervals[i] === 'R',
        interval: shape.intervals[i],
        absFret,
        stringIndex: i,
      });
    }
  }

  for (const notes of map.values()) {
    notes.sort((a, b) => CAGED_ORDER.indexOf(a.shape) - CAGED_ORDER.indexOf(b.shape));
  }

  return map;
}
