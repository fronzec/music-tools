import { describe, it, expect } from 'vitest';
import { getShapes, getAllRoots, getAllQualities, validate } from '$lib/data/chords';
import type { NoteName, ChordQuality, CagedShape } from '$lib/types/chord';
import { CHROMATIC } from '$lib/types/chord';

describe('getShapes', () => {
  it('returns 5 shapes for C major', () => {
    const shapes = getShapes('C', 'major');
    expect(shapes).toHaveLength(5);
  });

  it('returns 5 shapes for F# minor', () => {
    const shapes = getShapes('F#', 'minor');
    expect(shapes).toHaveLength(5);
  });

  it('returns shapes in CAGED order for C major', () => {
    const shapes = getShapes('C', 'major');
    expect(shapes.map((s) => s.shape)).toEqual(['C', 'A', 'G', 'E', 'D']);
  });

  it('returns shapes in CAGED order for A minor', () => {
    const shapes = getShapes('A', 'minor');
    expect(shapes.map((s) => s.shape)).toEqual(['C', 'A', 'G', 'E', 'D']);
  });

  it('every shape has exactly 6 fret values', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(
            shape.frets,
            `${root} ${quality} ${shape.shape}: frets must have 6 elements`,
          ).toHaveLength(6);
        }
      }
    }
  });

  it('every shape has exactly 6 interval values', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(
            shape.intervals,
            `${root} ${quality} ${shape.shape}: intervals must have 6 elements`,
          ).toHaveLength(6);
        }
      }
    }
  });

  it('throws for invalid root', () => {
    expect(() => getShapes('H' as NoteName, 'major')).toThrow();
  });

  it('throws for invalid quality', () => {
    expect(() => getShapes('C', 'dim' as ChordQuality)).toThrow();
  });

  it('returns 5 unique shape names for each root + quality', () => {
    const shapeNames: CagedShape[] = ['C', 'A', 'G', 'E', 'D'];
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        const shapes = getShapes(root, quality);
        const names = shapes.map((s) => s.shape).sort();
        expect(names).toEqual([...shapeNames].sort());
      }
    }
  });
});

describe('getAllRoots', () => {
  it('returns all 12 chromatic roots', () => {
    const roots = getAllRoots().sort();
    expect(roots).toEqual([...CHROMATIC].sort());
  });

  it('each root is a valid NoteName', () => {
    for (const root of getAllRoots()) {
      expect(CHROMATIC).toContain(root);
    }
  });
});

describe('getAllQualities', () => {
  it('returns major and minor', () => {
    const qualities = getAllQualities();
    expect(qualities).toContain('major');
    expect(qualities).toContain('minor');
    expect(qualities).toHaveLength(2);
  });
});

describe('null consistency', () => {
  it('frets[i] is null if and only if intervals[i] is null', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          for (let i = 0; i < 6; i++) {
            const fretIsNull = shape.frets[i] === null;
            const intervalIsNull = shape.intervals[i] === null;
            expect(
              fretIsNull,
              `${root} ${quality} ${shape.shape}[${i}]: fret and interval null mismatch`,
            ).toBe(intervalIsNull);
          }
        }
      }
    }
  });
});

describe('baseFret', () => {
  it('is >= 0 for all shapes', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(
            shape.baseFret,
            `${root} ${quality} ${shape.shape}: baseFret must be >= 0`,
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('shapes with baseFret > 0 have min non-null fret anchored at 0', () => {
    // Barre-position shapes must have at least one note on the barre (relative fret 0)
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          if (shape.baseFret > 0) {
            const nonNullFrets = shape.frets.filter((f): f is number => f !== null);
            const minFret = Math.min(...nonNullFrets);
            expect(
              minFret,
              `${root} ${quality} ${shape.shape}: barre shapes must anchor at fret 0`,
            ).toBe(0);
          }
        }
      }
    }
  });
});

describe('rootString', () => {
  it('is in range 0..5 for all shapes', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(shape.rootString).toBeGreaterThanOrEqual(0);
          expect(shape.rootString).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('rootString points to a non-null fret', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(
            shape.frets[shape.rootString],
            `${root} ${quality} ${shape.shape}: rootString must not point to null`,
          ).not.toBeNull();
        }
      }
    }
  });

  it('interval at rootString is always R', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          expect(
            shape.intervals[shape.rootString],
            `${root} ${quality} ${shape.shape}: interval at rootString must be R`,
          ).toBe('R');
        }
      }
    }
  });
});

describe('interval labels', () => {
  it('all interval labels are valid (R, 3, b3, 5, or null)', () => {
    const validLabels = ['R', '3', 'b3', '5'];
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        for (const shape of getShapes(root, quality)) {
          for (let i = 0; i < 6; i++) {
            const label = shape.intervals[i];
            if (label !== null) {
              expect(
                validLabels,
                `${root} ${quality} ${shape.shape}[${i}]: invalid interval "${label}"`,
              ).toContain(label);
            }
          }
        }
      }
    }
  });

  it('major shapes never contain b3', () => {
    for (const root of getAllRoots()) {
      for (const shape of getShapes(root, 'major')) {
        for (const interval of shape.intervals) {
          expect(interval, `${root} major ${shape.shape}: must not contain b3`).not.toBe('b3');
        }
      }
    }
  });

  it('minor shapes never contain 3', () => {
    for (const root of getAllRoots()) {
      for (const shape of getShapes(root, 'minor')) {
        for (const interval of shape.intervals) {
          expect(interval, `${root} minor ${shape.shape}: must not contain 3`).not.toBe('3');
        }
      }
    }
  });

  it('at least one R and one 5 present in each major shape', () => {
    for (const root of getAllRoots()) {
      for (const shape of getShapes(root, 'major')) {
        const labels = shape.intervals.filter((l): l is string => l !== null);
        expect(labels, `${root} major ${shape.shape}: must have at least one R`).toContain('R');
        expect(labels, `${root} major ${shape.shape}: must have at least one 5`).toContain('5');
      }
    }
  });

  it('at least one R and one 5 present in each minor shape', () => {
    for (const root of getAllRoots()) {
      for (const shape of getShapes(root, 'minor')) {
        const labels = shape.intervals.filter((l): l is string => l !== null);
        expect(labels, `${root} minor ${shape.shape}: must have at least one R`).toContain('R');
        expect(labels, `${root} minor ${shape.shape}: must have at least one 5`).toContain('5');
      }
    }
  });
});

describe('shape uniqueness', () => {
  it('every root+quality combo has exactly 5 unique shape names', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        const shapes = getShapes(root, quality);
        const names = new Set(shapes.map((s) => s.shape));
        expect(names.size, `${root} ${quality}: must have 5 unique shape names`).toBe(5);
      }
    }
  });

  it('no two shapes for same root+quality are identical', () => {
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        const shapes = getShapes(root, quality);
        for (let i = 0; i < shapes.length; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            const a = JSON.stringify(shapes[i].frets);
            const b = JSON.stringify(shapes[j].frets);
            expect(
              a,
              `${root} ${quality}: shapes ${shapes[i].shape} and ${shapes[j].shape} have identical frets`,
            ).not.toBe(b);
          }
        }
      }
    }
  });
});

describe('known open chords', () => {
  it('C major C-shape matches open C (x32010)', () => {
    const shape = getShapes('C', 'major').find((s) => s.shape === 'C')!;
    expect(shape.frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(shape.baseFret).toBe(0);
  });

  it('A major A-shape matches open A (x02220)', () => {
    const shape = getShapes('A', 'major').find((s) => s.shape === 'A')!;
    expect(shape.frets).toEqual([null, 0, 2, 2, 2, 0]);
    expect(shape.baseFret).toBe(0);
  });

  it('G major G-shape matches open G (320003)', () => {
    const shape = getShapes('G', 'major').find((s) => s.shape === 'G')!;
    expect(shape.frets).toEqual([3, 2, 0, 0, 0, 3]);
    expect(shape.baseFret).toBe(0);
  });

  it('E major E-shape matches open E (022100)', () => {
    const shape = getShapes('E', 'major').find((s) => s.shape === 'E')!;
    expect(shape.frets).toEqual([0, 2, 2, 1, 0, 0]);
    expect(shape.baseFret).toBe(0);
  });

  it('D major D-shape matches open D (xx0232)', () => {
    const shape = getShapes('D', 'major').find((s) => s.shape === 'D')!;
    expect(shape.frets).toEqual([null, null, 0, 2, 3, 2]);
    expect(shape.baseFret).toBe(0);
  });

  it('E minor E-shape matches open Em (022000)', () => {
    const shape = getShapes('E', 'minor').find((s) => s.shape === 'E')!;
    expect(shape.frets).toEqual([0, 2, 2, 0, 0, 0]);
    expect(shape.baseFret).toBe(0);
  });

  it('A minor A-shape matches open Am (x02210)', () => {
    const shape = getShapes('A', 'minor').find((s) => s.shape === 'A')!;
    expect(shape.frets).toEqual([null, 0, 2, 2, 1, 0]);
    expect(shape.baseFret).toBe(0);
  });
});

describe('validate', () => {
  it('returns true for the generated dataset', () => {
    expect(validate()).toBe(true);
  });
});

describe('total count', () => {
  it('has exactly 120 shapes total', () => {
    let count = 0;
    for (const root of getAllRoots()) {
      for (const quality of getAllQualities()) {
        count += getShapes(root, quality).length;
      }
    }
    expect(count).toBe(120);
  });

  it('has exactly 60 major shapes', () => {
    let count = 0;
    for (const root of getAllRoots()) {
      count += getShapes(root, 'major').length;
    }
    expect(count).toBe(60);
  });

  it('has exactly 60 minor shapes', () => {
    let count = 0;
    for (const root of getAllRoots()) {
      count += getShapes(root, 'minor').length;
    }
    expect(count).toBe(60);
  });
});
