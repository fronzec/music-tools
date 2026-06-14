export type ScaleQuality = 'major' | 'minor';

/** The five pentatonic box positions, numbered 1–5. Box 1 is the root-position
 *  box (root on the low-E string); the others ascend the neck from there. */
export type BoxName = '1' | '2' | '3' | '4' | '5';

export const BOX_ORDER: BoxName[] = ['1', '2', '3', '4', '5'];

/** A single playable note inside a pentatonic box. */
export interface ScalePosition {
  /** String index 0–5, low-E to high-E (tablature order). */
  stringIndex: number;
  /** Absolute fret number. */
  fret: number;
  /** Interval label relative to the scale root (e.g. 'R', 'b3', '4', '5', 'b7'). */
  interval: string;
  isRoot: boolean;
}

/** One of the five box positions: a contiguous neck region with two scale
 *  notes on every string. */
export interface PentatonicBox {
  name: BoxName;
  positions: ScalePosition[];
  minFret: number;
  maxFret: number;
}
