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

/**
 * Returns the Y coordinate for string i (0 = high E at top, 5 = low E at bottom).
 */
export function stringY(i: number): number {
  return L.TOP_PAD + i * L.STRING_SP;
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
 * Standard fret marker positions on a guitar.
 */
export const FRET_MARKERS: number[] = [3, 5, 7, 9, 12, 15];
