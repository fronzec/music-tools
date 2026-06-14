import { describe, it, expect } from 'vitest';
import { L, FL, SHAPE_COLORS, stringY, fretLineX, noteX, viewBoxW, viewBoxH, FRET_MARKERS, indicatorX } from '$lib/theory/layout';

describe('layout constants', () => {
  it('has expected TOP_PAD', () => {
    expect(L.TOP_PAD).toBe(28);
  });

  it('has expected STRING_SP', () => {
    expect(L.STRING_SP).toBe(26);
  });

  it('has expected FRET_SP', () => {
    expect(L.FRET_SP).toBe(50);
  });

  it('has expected ROOT_R', () => {
    expect(L.ROOT_R).toBe(11);
  });

  it('has expected TONE_R', () => {
    expect(L.TONE_R).toBe(8);
  });

  it('has expected OTHER_R', () => {
    expect(L.OTHER_R).toBe(5);
  });

  it('L object is frozen (as const)', () => {
    expect(Object.isFrozen(L)).toBe(false); // 'as const' doesn't freeze in TS, but values are literal
  });
});

describe('stringY', () => {
  it('returns TOP_PAD + 5 * STRING_SP for string 0 (low E at bottom)', () => {
    expect(stringY(0)).toBe(L.TOP_PAD + 5 * L.STRING_SP);
  });

  it('returns TOP_PAD + 4 * STRING_SP for string 1', () => {
    expect(stringY(1)).toBe(L.TOP_PAD + 4 * L.STRING_SP);
  });

  it('returns TOP_PAD for string 5 (high E at top)', () => {
    expect(stringY(5)).toBe(L.TOP_PAD);
  });
});

describe('fretLineX', () => {
  it('returns LEFT_PAD + NUT_W for fret 0 (nut line)', () => {
    expect(fretLineX(0)).toBe(L.LEFT_PAD + L.NUT_W);
  });

  it('returns LEFT_PAD + NUT_W + 1 * FRET_SP for fret 1', () => {
    expect(fretLineX(1)).toBe(L.LEFT_PAD + L.NUT_W + L.FRET_SP);
  });

  it('returns LEFT_PAD + NUT_W + 3 * FRET_SP for fret 3', () => {
    expect(fretLineX(3)).toBe(L.LEFT_PAD + L.NUT_W + 3 * L.FRET_SP);
  });
});

describe('noteX', () => {
  it('places note center halfway between nut and first fret when absFret=1 rangeStart=0', () => {
    // fretLineX(0) = LEFT_PAD + NUT_W
    // fretLineX(1) = LEFT_PAD + NUT_W + FRET_SP
    // noteX(1, 0) = fretLineX(1) - FRET_SP/2 = LEFT_PAD + NUT_W + FRET_SP - 25 = LEFT_PAD + NUT_W + 25
    expect(noteX(1, 0)).toBe(L.LEFT_PAD + L.NUT_W + L.FRET_SP / 2);
  });

  it('handles rangeStart > 0 (barre chord)', () => {
    // For a shape at baseFret=5: rangeStart=5, absFret=7
    // noteX(7, 5) = fretLineX(2) - FRET_SP/2
    // fretLineX(2) = LEFT_PAD + NUT_W + 2*FRET_SP
    const expected = L.LEFT_PAD + L.NUT_W + 2 * L.FRET_SP - L.FRET_SP / 2;
    expect(noteX(7, 5)).toBe(expected);
  });

  it('open string (fret 0) with rangeStart 0', () => {
    // noteX(0, 0) = fretLineX(0) - FRET_SP/2 = LEFT_PAD + NUT_W - 25
    expect(noteX(0, 0)).toBe(L.LEFT_PAD + L.NUT_W - L.FRET_SP / 2);
  });
});

describe('viewBoxW', () => {
  it('calculates width for 5-fret span', () => {
    const expected = L.LEFT_PAD + L.NUT_W + 5 * L.FRET_SP + L.RIGHT_PAD;
    expect(viewBoxW(5)).toBe(expected);
  });

  it('calculates width for 3-fret span', () => {
    const expected = L.LEFT_PAD + L.NUT_W + 3 * L.FRET_SP + L.RIGHT_PAD;
    expect(viewBoxW(3)).toBe(expected);
  });

  it('returns minimal width for 0 fret span', () => {
    const expected = L.LEFT_PAD + L.NUT_W + 0 * L.FRET_SP + L.RIGHT_PAD;
    expect(viewBoxW(0)).toBe(expected);
  });
});

describe('viewBoxH', () => {
  it('returns height for 6 strings', () => {
    const expected = L.TOP_PAD + 5 * L.STRING_SP + L.BOTTOM_PAD;
    expect(viewBoxH()).toBe(expected);
  });
});

describe('indicatorX', () => {
  it('returns fretLineX(0) + 8 for baseFret=0 (centered on nut line)', () => {
    // fretLineX(0) = 18; 18+8 = 26 → after -8 offset → badge center at 18 (nut line)
    expect(indicatorX(0, 0)).toBe(fretLineX(0) + 8);
  });

  it('returns fretLineX(baseFret) - 5 for FullFretboard (same space as barre note)', () => {
    expect(indicatorX(3, 0)).toBe(fretLineX(3) - 5);
  });

  it('returns fretLineX(0) + 10 for Fretboard shifted coords', () => {
    expect(indicatorX(5, 5)).toBe(fretLineX(0) + 10);
  });
});

describe('FRET_MARKERS', () => {
  it('includes standard marker positions', () => {
    expect(FRET_MARKERS).toEqual([3, 5, 7, 9, 12, 15]);
  });

  it('includes 12 (double marker)', () => {
    expect(FRET_MARKERS).toContain(12);
  });
});

describe('FL (full layout constants)', () => {
  it('has MIN_FRET_SPAN of 14', () => {
    expect(FL.MIN_FRET_SPAN).toBe(14);
  });

  it('has MAX_FRET_SPAN of 14', () => {
    expect(FL.MAX_FRET_SPAN).toBe(14);
  });

  it('has FRET_PAD of 1', () => {
    expect(FL.FRET_PAD).toBe(1);
  });

  it('has FRET_NUM_Y_OFFSET of 22', () => {
    expect(FL.FRET_NUM_Y_OFFSET).toBe(22);
  });

  it('has FRET_NUM_FS of 9', () => {
    expect(FL.FRET_NUM_FS).toBe(9);
  });

  it('has ROOT_DIAMOND_R of 11', () => {
    expect(FL.ROOT_DIAMOND_R).toBe(11);
  });

  it('has NOTE_OPACITY of 0.75', () => {
    expect(FL.NOTE_OPACITY).toBe(0.75);
  });

  it('has BARRE_OPACITY of 0.35', () => {
    expect(FL.BARRE_OPACITY).toBe(0.35);
  });

  it('FL object is frozen (as const)', () => {
    expect(Object.isFrozen(FL)).toBe(false); // 'as const' in TS is compile-time
  });
});

describe('SHAPE_COLORS', () => {
  it('has entries for all 5 CAGED shapes', () => {
    const shapes = ['C', 'A', 'G', 'E', 'D'] as const;
    for (const s of shapes) {
      expect(SHAPE_COLORS[s]).toBeTruthy();
    }
    expect(Object.keys(SHAPE_COLORS).length).toBe(5);
  });

  it('C shape is blue-600', () => {
    expect(SHAPE_COLORS.C).toBe('#2563EB');
  });

  it('A shape is orange-500', () => {
    expect(SHAPE_COLORS.A).toBe('#F97316');
  });

  it('G shape is green-600', () => {
    expect(SHAPE_COLORS.G).toBe('#16A34A');
  });

  it('E shape is red-500', () => {
    expect(SHAPE_COLORS.E).toBe('#EF4444');
  });

  it('D shape is cyan-600', () => {
    expect(SHAPE_COLORS.D).toBe('#0891B2');
  });

  it('all shape colors are distinct', () => {
    const colors = Object.values(SHAPE_COLORS);
    expect(new Set(colors).size).toBe(5);
  });
});
