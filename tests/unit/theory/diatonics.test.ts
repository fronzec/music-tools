import { describe, it, expect } from 'vitest';
import { MAJOR_SCALE_INTERVALS, type DiatonicTriad, diatonicTriads } from '$lib/theory/diatonics';
import { CHROMATIC } from '$lib/types/chord';

describe('MAJOR_SCALE_INTERVALS', () => {
  it('deep-equals [0,2,4,5,7,9,11]', () => {
    expect([...MAJOR_SCALE_INTERVALS]).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('has length 7', () => {
    expect(MAJOR_SCALE_INTERVALS.length).toBe(7);
  });
});

describe('diatonicTriads — return shape', () => {
  it('returns exactly 7 items for C major', () => {
    expect(diatonicTriads('C')).toHaveLength(7);
  });

  it('degrees are [1,2,3,4,5,6,7] in order', () => {
    const triads = diatonicTriads('C');
    expect(triads.map((t) => t.degree)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('each item has required keys', () => {
    const triads = diatonicTriads('C');
    const keys: (keyof DiatonicTriad)[] = [
      'degree',
      'roman',
      'quality',
      'rootPc',
      'rootName',
      'notes',
      'name',
    ];
    for (const t of triads) {
      for (const k of keys) {
        expect(t).toHaveProperty(k);
      }
    }
  });
});

describe('diatonicTriads — C major full assertions', () => {
  const triads = diatonicTriads('C');

  it('degree 1: C major', () => {
    const t = triads[0];
    expect(t.rootName).toBe('C');
    expect(t.rootPc).toBe(0);
    expect(t.notes).toEqual(['C', 'E', 'G']);
    expect(t.quality).toBe('maj');
    expect(t.roman).toBe('I');
  });

  it('degree 2: D minor', () => {
    const t = triads[1];
    expect(t.rootName).toBe('D');
    expect(t.rootPc).toBe(2);
    expect(t.notes).toEqual(['D', 'F', 'A']);
    expect(t.quality).toBe('min');
    expect(t.roman).toBe('ii');
  });

  it('degree 3: E minor', () => {
    const t = triads[2];
    expect(t.rootName).toBe('E');
    expect(t.rootPc).toBe(4);
    expect(t.notes).toEqual(['E', 'G', 'B']);
    expect(t.quality).toBe('min');
    expect(t.roman).toBe('iii');
  });

  it('degree 4: F major', () => {
    const t = triads[3];
    expect(t.rootName).toBe('F');
    expect(t.rootPc).toBe(5);
    expect(t.notes).toEqual(['F', 'A', 'C']);
    expect(t.quality).toBe('maj');
    expect(t.roman).toBe('IV');
  });

  it('degree 5: G major', () => {
    const t = triads[4];
    expect(t.rootName).toBe('G');
    expect(t.rootPc).toBe(7);
    expect(t.notes).toEqual(['G', 'B', 'D']);
    expect(t.quality).toBe('maj');
    expect(t.roman).toBe('V');
  });

  it('degree 6: A minor', () => {
    const t = triads[5];
    expect(t.rootName).toBe('A');
    expect(t.rootPc).toBe(9);
    expect(t.notes).toEqual(['A', 'C', 'E']);
    expect(t.quality).toBe('min');
    expect(t.roman).toBe('vi');
  });

  it('degree 7: B diminished', () => {
    const t = triads[6];
    expect(t.rootName).toBe('B');
    expect(t.rootPc).toBe(11);
    expect(t.notes).toEqual(['B', 'D', 'F']);
    expect(t.quality).toBe('dim');
    expect(t.roman).toBe('vii°');
  });
});

describe('diatonicTriads — quality pattern for all 12 roots', () => {
  it('every root produces maj,min,min,maj,maj,min,dim', () => {
    const expected = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
    CHROMATIC.forEach((root) => {
      expect(
        diatonicTriads(root).map((t) => t.quality),
        `Quality pattern failed for root ${root}`,
      ).toEqual(expected);
    });
  });
});

describe('diatonicTriads — Roman labels', () => {
  it('C major roman labels are I,ii,iii,IV,V,vi,vii°', () => {
    expect(diatonicTriads('C').map((t) => t.roman)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ]);
  });

  it('G major roman labels are I,ii,iii,IV,V,vi,vii°', () => {
    expect(diatonicTriads('G').map((t) => t.roman)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ]);
  });

  it('vii° uses U+00B0 DEGREE SIGN (charCodeAt 3 === 176)', () => {
    const roman = diatonicTriads('C')[6].roman;
    expect(roman.charCodeAt(3)).toBe(176);
  });
});

describe('diatonicTriads — name reuses chordName', () => {
  it('degree 2 name is "D minor"', () => {
    expect(diatonicTriads('C')[1].name).toBe('D minor');
  });

  it('degree 7 name is "B diminished"', () => {
    expect(diatonicTriads('C')[6].name).toBe('B diminished');
  });
});

describe('diatonicTriads — rootPc range', () => {
  it('every rootPc is in 0..11 for all 12 roots', () => {
    CHROMATIC.forEach((root) => {
      diatonicTriads(root).forEach((t) => {
        expect(t.rootPc).toBeGreaterThanOrEqual(0);
        expect(t.rootPc).toBeLessThanOrEqual(11);
      });
    });
  });

  it('G major rootPc set is {7,9,11,0,2,4,6}', () => {
    const pcs = new Set(diatonicTriads('G').map((t) => t.rootPc));
    expect(pcs).toEqual(new Set([7, 9, 11, 0, 2, 4, 6]));
  });
});

describe('diatonicTriads — determinism', () => {
  it('two calls for C major produce identical results', () => {
    expect(diatonicTriads('C')).toEqual(diatonicTriads('C'));
  });
});

describe('diatonicTriads — no throw for valid roots', () => {
  it('all 12 CHROMATIC roots iterate without throwing', () => {
    expect(() => CHROMATIC.forEach((root) => diatonicTriads(root))).not.toThrow();
  });
});
