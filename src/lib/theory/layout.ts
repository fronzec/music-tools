import type { CagedShape } from '$lib/types/chord';

export const L = {
  TOP_PAD: 28,
  BOTTOM_PAD: 16,
  LEFT_PAD: 12,
  RIGHT_PAD: 16,
  NUT_W: 6,
  FRET_SP: 50,
  STRING_SP: 26,
  ROOT_R: 11,
  TONE_R: 8,
  OTHER_R: 5,
  BARRE_H: 5,
  FRET_NUM_OFFSET: 14,
  LABEL_FS: 10,
  MARKER_R: 3,
} as const;

/** Layout constants for the FullFretboard multi-shape overlay. */
export const FL = {
  /** Fixed number of fret columns — always 14 for consistent width. */
  MIN_FRET_SPAN: 14,
  /** Fixed number of fret columns — always 14 for consistent width. */
  MAX_FRET_SPAN: 14,
  /** Extra fret column for right padding. */
  FRET_PAD: 1,
  /** Vertical offset for fret numbers below the bottom string. */
  FRET_NUM_Y_OFFSET: 14,
  /** Font size for fret numbers. */
  FRET_NUM_FS: 9,
  /** Radius for root note diamond (same visual weight as ROOT_R). */
  ROOT_DIAMOND_R: 11,
  /** Opacity for non-root note circles. */
  NOTE_OPACITY: 0.75,
  /** Opacity for barre indicator rectangles. */
  BARRE_OPACITY: 0.35,
  /** CSS transition duration for animated shape changes. */
  ANIM_DURATION: '0.3s',
  /** CSS transition timing function for animated shape changes. */
  ANIM_EASING: 'ease-out',
  /** Center-to-center horizontal spacing between per-shape O/× indicators. */
  INDICATOR_SP: 14,
  /** Font size for O/× indicator text. */
  INDICATOR_FS: 9,
} as const;

/** Per-shape colors for the CAGED full-neck overlay. */
export const SHAPE_COLORS: Record<CagedShape, string> = {
  C: '#2563EB', // blue-600
  A: '#F97316', // orange-500
  G: '#16A34A', // green-600
  E: '#EF4444', // red-500
  D: '#9333EA', // purple-600
};

/**
 * Returns the Y coordinate for string i (0 = low E at bottom, 5 = high E at top).
 * Follows tablature convention: 1st string (high E) at top, 6th string (low E) at bottom.
 */
export function stringY(i: number): number {
  return L.TOP_PAD + (5 - i) * L.STRING_SP;
}

/**
 * Returns the X coordinate for fret line f, relative to the visible range start.
 * f=0 is the leftmost fret line (nut or base fret indicator).
 */
export function fretLineX(f: number): number {
  return L.LEFT_PAD + L.NUT_W + f * L.FRET_SP;
}

/**
 * Returns the X coordinate for a note center on absolute fret `absFret`,
 * given the visible range starts at `rangeStart`.
 */
export function noteX(absFret: number, rangeStart: number): number {
  return fretLineX(absFret - rangeStart) - L.FRET_SP / 2;
}

/**
 * Calculates the viewBox width based on the number of frets to display.
 * fretSpan = number of fret columns visible (e.g., 5 frets → 5 columns).
 */
export function viewBoxW(fretSpan: number): number {
  return L.LEFT_PAD + L.NUT_W + fretSpan * L.FRET_SP + L.RIGHT_PAD;
}

/**
 * Calculates the viewBox height (always 6 strings).
 */
export function viewBoxH(): number {
  return L.TOP_PAD + 5 * L.STRING_SP + L.BOTTOM_PAD;
}

/**
 * Returns the X coordinate for an indicator group at a given baseFret.
 * baseFret=0 → near nut; baseFret>0 → left of barre fret line.
 */
export function indicatorX(baseFret: number, minFret: number): number {
  if (baseFret === 0) return L.LEFT_PAD + L.NUT_W + 6;
  return fretLineX(baseFret - minFret) - L.FRET_SP / 2 - 8;
}

/**
 * Standard fret marker positions on a guitar.
 */
export const FRET_MARKERS: number[] = [3, 5, 7, 9, 12, 15];
