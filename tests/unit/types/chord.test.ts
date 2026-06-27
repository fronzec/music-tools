import { describe, it, expect } from 'vitest';
import { STRING_OPEN_MIDI, STANDARD_TUNING } from '$lib/types/chord';

describe('STRING_OPEN_MIDI', () => {
  it('is defined and exported', () => {
    expect(STRING_OPEN_MIDI).toBeDefined();
  });

  it('has 6 entries (one per string)', () => {
    expect(STRING_OPEN_MIDI).toHaveLength(6);
  });

  it('matches standard guitar tuning: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64', () => {
    expect(STRING_OPEN_MIDI).toEqual([40, 45, 50, 55, 59, 64]);
  });

  it('is consistent with STANDARD_TUNING: STRING_OPEN_MIDI[i] % 12 === STANDARD_TUNING[i]', () => {
    for (let i = 0; i < 6; i++) {
      expect(STRING_OPEN_MIDI[i] % 12, `string index ${i}`).toBe(STANDARD_TUNING[i]);
    }
  });

  it('low E string (index 0) is MIDI 40 (E2)', () => {
    expect(STRING_OPEN_MIDI[0]).toBe(40);
  });

  it('A string (index 1) is MIDI 45 (A2)', () => {
    expect(STRING_OPEN_MIDI[1]).toBe(45);
  });

  it('D string (index 2) is MIDI 50 (D3)', () => {
    expect(STRING_OPEN_MIDI[2]).toBe(50);
  });

  it('G string (index 3) is MIDI 55 (G3)', () => {
    expect(STRING_OPEN_MIDI[3]).toBe(55);
  });

  it('B string (index 4) is MIDI 59 (B3)', () => {
    expect(STRING_OPEN_MIDI[4]).toBe(59);
  });

  it('high E string (index 5) is MIDI 64 (E4)', () => {
    expect(STRING_OPEN_MIDI[5]).toBe(64);
  });
});
