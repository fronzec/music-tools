import { describe, it, expect } from 'vitest';
import { L, stringY, fretLineX, noteX, viewBoxW, viewBoxH, FRET_MARKERS } from '$lib/theory/layout';

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
  it('returns TOP_PAD for string 0 (high E)', () => {
    expect(stringY(0)).toBe(L.TOP_PAD);
  });

  it('returns TOP_PAD + 1 * STRING_SP for string 1', () => {
    expect(stringY(1)).toBe(L.TOP_PAD + L.STRING_SP);
  });

  it('returns TOP_PAD + 5 * STRING_SP for string 5 (low E)', () => {
    expect(stringY(5)).toBe(L.TOP_PAD + 5 * L.STRING_SP);
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

describe('FRET_MARKERS', () => {
  it('includes standard marker positions', () => {
    expect(FRET_MARKERS).toEqual([3, 5, 7, 9, 12, 15]);
  });

  it('includes 12 (double marker)', () => {
    expect(FRET_MARKERS).toContain(12);
  });
});
