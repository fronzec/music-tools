import { describe, it, expect } from 'vitest';
import {
  TRIAD_OFFSETS,
  TRIAD_FORMULA,
  TRIAD_INTERVAL_JUMPS,
  chordTones,
  chordName,
  chordMidi,
} from '$lib/theory/chords';
import type { TriadQuality } from '$lib/theory/chords';
import { CHROMATIC } from '$lib/types/chord';

// ---------------------------------------------------------------------------
// TRIAD_OFFSETS
// ---------------------------------------------------------------------------

describe('TRIAD_OFFSETS', () => {
  it('maj → [0, 4, 7]', () => {
    expect(TRIAD_OFFSETS['maj']).toEqual([0, 4, 7]);
  });

  it('min → [0, 3, 7]', () => {
    expect(TRIAD_OFFSETS['min']).toEqual([0, 3, 7]);
  });

  it('dim → [0, 3, 6]', () => {
    expect(TRIAD_OFFSETS['dim']).toEqual([0, 3, 6]);
  });

  it('aug → [0, 4, 8]', () => {
    expect(TRIAD_OFFSETS['aug']).toEqual([0, 4, 8]);
  });
});

// ---------------------------------------------------------------------------
// TRIAD_FORMULA
// ---------------------------------------------------------------------------

describe('TRIAD_FORMULA', () => {
  it('maj → "1 - 3 - 5"', () => {
    expect(TRIAD_FORMULA['maj']).toBe('1 - 3 - 5');
  });

  it('min → "1 - ♭3 - 5"', () => {
    expect(TRIAD_FORMULA['min']).toBe('1 - ♭3 - 5');
  });

  it('dim → "1 - ♭3 - ♭5"', () => {
    expect(TRIAD_FORMULA['dim']).toBe('1 - ♭3 - ♭5');
  });

  it('aug → "1 - 3 - ♯5"', () => {
    expect(TRIAD_FORMULA['aug']).toBe('1 - 3 - ♯5');
  });
});

// ---------------------------------------------------------------------------
// TRIAD_INTERVAL_JUMPS
// ---------------------------------------------------------------------------

describe('TRIAD_INTERVAL_JUMPS', () => {
  it('maj → ["+4", "+3"]', () => {
    expect(TRIAD_INTERVAL_JUMPS['maj']).toEqual(['+4', '+3']);
  });

  it('min → ["+3", "+4"]', () => {
    expect(TRIAD_INTERVAL_JUMPS['min']).toEqual(['+3', '+4']);
  });

  it('dim → ["+3", "+3"]', () => {
    expect(TRIAD_INTERVAL_JUMPS['dim']).toEqual(['+3', '+3']);
  });

  it('aug → ["+4", "+4"]', () => {
    expect(TRIAD_INTERVAL_JUMPS['aug']).toEqual(['+4', '+4']);
  });
});

// ---------------------------------------------------------------------------
// chordTones
// ---------------------------------------------------------------------------

describe('chordTones', () => {
  it('C major → ["C", "E", "G"]', () => {
    expect(chordTones(0, [0, 4, 7])).toEqual(['C', 'E', 'G']);
  });

  it('C minor → ["C", "D#", "G"]', () => {
    expect(chordTones(0, [0, 3, 7])).toEqual(['C', 'D#', 'G']);
  });

  it('C diminished → ["C", "D#", "F#"]', () => {
    expect(chordTones(0, [0, 3, 6])).toEqual(['C', 'D#', 'F#']);
  });

  it('C augmented → ["C", "E", "G#"]', () => {
    expect(chordTones(0, [0, 4, 8])).toEqual(['C', 'E', 'G#']);
  });

  it('G major (rootPc=7) → ["G", "B", "D"]', () => {
    expect(chordTones(7, [0, 4, 7])).toEqual(['G', 'B', 'D']);
  });

  it('A# minor (rootPc=10) → ["A#", "C#", "F"]', () => {
    expect(chordTones(10, [0, 3, 7])).toEqual(['A#', 'C#', 'F']);
  });

  const QUALITIES: TriadQuality[] = ['maj', 'min', 'dim', 'aug'];

  it('all 12 roots × 4 qualities return arrays of 3 valid note name strings', () => {
    const validNames = new Set(CHROMATIC);
    for (let rootPc = 0; rootPc < 12; rootPc++) {
      for (const q of QUALITIES) {
        const tones = chordTones(rootPc, TRIAD_OFFSETS[q]);
        expect(tones).toHaveLength(3);
        for (const tone of tones) {
          expect(validNames.has(tone as any)).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// chordName
// ---------------------------------------------------------------------------

describe('chordName', () => {
  it('("C", "maj") → "C major"', () => {
    expect(chordName('C', 'maj')).toBe('C major');
  });

  it('("C", "min") → "C minor"', () => {
    expect(chordName('C', 'min')).toBe('C minor');
  });

  it('("C", "dim") → "C diminished"', () => {
    expect(chordName('C', 'dim')).toBe('C diminished');
  });

  it('("C", "aug") → "C augmented"', () => {
    expect(chordName('C', 'aug')).toBe('C augmented');
  });

  it('("F#", "min") → "F# minor"', () => {
    expect(chordName('F#', 'min')).toBe('F# minor');
  });

  it('("A#", "dim") → "A# diminished"', () => {
    expect(chordName('A#', 'dim')).toBe('A# diminished');
  });

  it('("G#", "aug") → "G# augmented"', () => {
    expect(chordName('G#', 'aug')).toBe('G# augmented');
  });

  it('all 12 roots × 4 qualities produce non-empty strings matching "{root} {word}" pattern', () => {
    const QUALITIES: TriadQuality[] = ['maj', 'min', 'dim', 'aug'];
    for (const root of CHROMATIC) {
      for (const q of QUALITIES) {
        const name = chordName(root, q);
        expect(name.length).toBeGreaterThan(0);
        expect(name.startsWith(root)).toBe(true);
        expect(name.includes(' ')).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// chordMidi
// ---------------------------------------------------------------------------

describe('chordMidi', () => {
  it('C major at octave 4 → [60, 64, 67]', () => {
    expect(chordMidi(0, [0, 4, 7], 4)).toEqual([60, 64, 67]);
  });

  it('G major at default octave (4) → [67, 71, 74]', () => {
    expect(chordMidi(7, [0, 4, 7])).toEqual([67, 71, 74]);
  });

  it('C augmented at octave 4 → [60, 64, 68]', () => {
    expect(chordMidi(0, [0, 4, 8], 4)).toEqual([60, 64, 68]);
  });
});
