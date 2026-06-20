import { describe, it, expect } from 'vitest';
import { SL, slStringY, slFretLineX, slNoteX, slViewBoxW, slViewBoxH } from '$lib/theory/shapeLayout';

// ---------------------------------------------------------------------------
// SL constants (design ADR-3 values — pinned so any change is explicit)
// ---------------------------------------------------------------------------

describe('SL constants match design spec values', () => {
  it('STRING_SP is 22', () => expect(SL.STRING_SP).toBe(22));
  it('FRET_SP is 28', () => expect(SL.FRET_SP).toBe(28));
  it('TOP_PAD is 20', () => expect(SL.TOP_PAD).toBe(20));
  it('BOTTOM_PAD is 12', () => expect(SL.BOTTOM_PAD).toBe(12));
  it('LEFT_GUTTER is 22', () => expect(SL.LEFT_GUTTER).toBe(22));
  it('NAME_COL_W is 26', () => expect(SL.NAME_COL_W).toBe(26));
  it('NUT_W is 5', () => expect(SL.NUT_W).toBe(5));
  it('WINDOW_FRETS is 5', () => expect(SL.WINDOW_FRETS).toBe(5));
  it('DOT_R is 8', () => expect(SL.DOT_R).toBe(8));
});

// ---------------------------------------------------------------------------
// slStringY — low E at bottom (largest Y), high e at top (smallest Y)
// Tablature convention, same as layout.ts: slStringY(0) > slStringY(5)
// ---------------------------------------------------------------------------

describe('slStringY', () => {
  it('slStringY(0) returns the largest Y value (low E at bottom)', () => {
    expect(slStringY(0)).toBeGreaterThan(slStringY(5));
  });

  it('slStringY(5) returns the smallest Y value (high e at top)', () => {
    expect(slStringY(5)).toBeLessThan(slStringY(0));
  });

  it('the 6 string Y values are strictly monotonically decreasing (0..5)', () => {
    const ys = [0, 1, 2, 3, 4, 5].map(slStringY);
    for (let i = 0; i < ys.length - 1; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i + 1]);
    }
  });

  it('slStringY(0) === SL.TOP_PAD + 5 * SL.STRING_SP', () => {
    expect(slStringY(0)).toBe(SL.TOP_PAD + 5 * SL.STRING_SP);
  });

  it('slStringY(5) === SL.TOP_PAD', () => {
    expect(slStringY(5)).toBe(SL.TOP_PAD);
  });
});

// ---------------------------------------------------------------------------
// slFretLineX — monotonically increasing X within the window
// ---------------------------------------------------------------------------

describe('slFretLineX', () => {
  it('slFretLineX(f+1) > slFretLineX(f) for f = 0..4 (monotonically increasing X)', () => {
    for (let f = 0; f < 5; f++) {
      expect(slFretLineX(f + 1)).toBeGreaterThan(slFretLineX(f));
    }
  });

  it('slFretLineX(0) === SL.LEFT_GUTTER + SL.NUT_W', () => {
    expect(slFretLineX(0)).toBe(SL.LEFT_GUTTER + SL.NUT_W);
  });

  it('slFretLineX(1) === SL.LEFT_GUTTER + SL.NUT_W + SL.FRET_SP', () => {
    expect(slFretLineX(1)).toBe(SL.LEFT_GUTTER + SL.NUT_W + SL.FRET_SP);
  });
});

// ---------------------------------------------------------------------------
// slNoteX — window-relative center X per note
// ---------------------------------------------------------------------------

describe('slNoteX', () => {
  it('slNoteX(5, 5) returns center of window column 0', () => {
    // baseFret=5, absFret=5 → relative col 0 → center at slFretLineX(0) + FRET_SP/2
    expect(slNoteX(5, 5)).toBe(slFretLineX(0) + SL.FRET_SP / 2);
  });

  it('slNoteX(9, 5) returns center of window column 4', () => {
    // baseFret=5, absFret=9 → relative col 4 → center at slFretLineX(4) + FRET_SP/2
    expect(slNoteX(9, 5)).toBe(slFretLineX(4) + SL.FRET_SP / 2);
  });

  it('slNoteX(1, 1) returns center of window column 0 (open position)', () => {
    expect(slNoteX(1, 1)).toBe(slFretLineX(0) + SL.FRET_SP / 2);
  });

  // -------------------------------------------------------------------
  // Sentinel test (design-review finding #4):
  // Open strings (absFret === 0) render in the LEFT GUTTER via a FIXED X,
  // NOT inside the fret grid. slNoteX(0, baseFret) returns SL.LEFT_GUTTER / 2
  // regardless of baseFret. This is a module-level contract: the COMPONENT
  // must NOT call slNoteX for open strings at all — open strings get an O badge
  // at a fixed gutter X. This test pins that contract so module and component
  // stay in sync if the sentinel value ever changes.
  // -------------------------------------------------------------------

  it('sentinel: slNoteX(0, 1) returns SL.LEFT_GUTTER / 2 (gutter, not grid)', () => {
    const x = slNoteX(0, 1);
    expect(x).toBe(SL.LEFT_GUTTER / 2);
    // Must be strictly less than the first fret line (inside the gutter)
    expect(x).toBeLessThan(slFretLineX(0));
  });

  it('sentinel: slNoteX(0, 5) returns SL.LEFT_GUTTER / 2 regardless of baseFret', () => {
    expect(slNoteX(0, 5)).toBe(SL.LEFT_GUTTER / 2);
    expect(slNoteX(0, 5)).toBeLessThan(slFretLineX(0));
  });

  it('sentinel: open-string sentinel is baseFret-independent (slNoteX(0,1) === slNoteX(0,5))', () => {
    expect(slNoteX(0, 1)).toBe(slNoteX(0, 5));
  });
});

// ---------------------------------------------------------------------------
// slViewBoxW and slViewBoxH
// ---------------------------------------------------------------------------

describe('slViewBoxW', () => {
  it('equals SL.LEFT_GUTTER + SL.NUT_W + SL.WINDOW_FRETS * SL.FRET_SP + SL.NAME_COL_W', () => {
    const expected = SL.LEFT_GUTTER + SL.NUT_W + SL.WINDOW_FRETS * SL.FRET_SP + SL.NAME_COL_W;
    expect(slViewBoxW()).toBe(expected);
  });
});

describe('slViewBoxH', () => {
  it('equals SL.TOP_PAD + 5 * SL.STRING_SP + SL.BOTTOM_PAD', () => {
    const expected = SL.TOP_PAD + 5 * SL.STRING_SP + SL.BOTTOM_PAD;
    expect(slViewBoxH()).toBe(expected);
  });
});
