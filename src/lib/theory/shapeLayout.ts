/**
 * Compact shape-diagram geometry module for ChordShapeDiagram.
 *
 * Provides pure coordinate functions for a fixed 5-fret window chord diagram.
 * Intentionally independent of layout.ts, which is dimensioned for a 14-fret
 * full neck and shared by 5 other components. Keeping this module separate
 * avoids coupling a hot shared module to a new feature and keeps rollback clean:
 * delete this file and nothing else moves.
 *
 * Coordinate convention (same as layout.ts / tablature):
 *   - String 0 = low E at BOTTOM (largest Y)
 *   - String 5 = high e at TOP (smallest Y)
 *
 * Open-string sentinel (design-review finding #4):
 *   slNoteX(0, baseFret) returns SL.LEFT_GUTTER / 2 for ANY baseFret.
 *   Open strings are NOT placed in the fret window — they render as O badges
 *   in the left gutter. The component must NOT call slNoteX for open strings;
 *   it places open-string O badges at the fixed gutter X directly.
 */

// ---------------------------------------------------------------------------
// Constants (design ADR-3 values)
// ---------------------------------------------------------------------------

export const SL = {
  STRING_SP: 22,     // tighter than L.STRING_SP=26 — compact card diagram
  FRET_SP: 28,       // far tighter than L.FRET_SP=50 (14-fret neck) — ~5-fret window
  TOP_PAD: 20,
  BOTTOM_PAD: 12,
  LEFT_GUTTER: 22,   // column for O/× markers + Nfr label, left of the nut
  NAME_COL_W: 26,    // right column for the note-name letters
  NUT_W: 5,          // thick nut stroke-width when baseFret === 1
  WINDOW_FRETS: 5,   // visible fret columns
  DOT_R: 8,          // finger dot radius
  LABEL_FS: 10,
} as const;

// ---------------------------------------------------------------------------
// Pure geometry functions
// ---------------------------------------------------------------------------

/**
 * Y coordinate for string `i` (0 = low E at bottom, 5 = high e at top).
 * Low E has the largest Y value; high e has the smallest.
 */
export function slStringY(i: number): number {
  return SL.TOP_PAD + (5 - i) * SL.STRING_SP;
}

/**
 * X coordinate of fret LINE `f` within the compact window.
 * f = 0 is the nut / window-start line.
 */
export function slFretLineX(f: number): number {
  return SL.LEFT_GUTTER + SL.NUT_W + f * SL.FRET_SP;
}

/**
 * X coordinate of a NOTE CENTER on absolute fret `absFret`, given the window
 * starts at `baseFret`.
 *
 * Open strings (`absFret === 0`) are not placed in the fret window — they
 * render as O badges in the left gutter. `slNoteX(0, b)` returns
 * `SL.LEFT_GUTTER / 2` regardless of `baseFret`. Fretted notes use
 * `slFretLineX(absFret - baseFret) + FRET_SP / 2`.
 *
 * Design-review finding #4: the component must NOT call slNoteX for open strings.
 */
export function slNoteX(absFret: number, baseFret: number): number {
  if (absFret === 0) return SL.LEFT_GUTTER / 2;
  const relCol = absFret - baseFret;
  return slFretLineX(relCol) + SL.FRET_SP / 2;
}

/**
 * Total viewBox width:
 * LEFT_GUTTER (for O/× gutter) + NUT_W + WINDOW_FRETS * FRET_SP + NAME_COL_W
 */
export function slViewBoxW(): number {
  return SL.LEFT_GUTTER + SL.NUT_W + SL.WINDOW_FRETS * SL.FRET_SP + SL.NAME_COL_W;
}

/**
 * Total viewBox height:
 * TOP_PAD + 5 string gaps (6 strings = 5 spaces) + BOTTOM_PAD
 */
export function slViewBoxH(): number {
  return SL.TOP_PAD + 5 * SL.STRING_SP + SL.BOTTOM_PAD;
}
