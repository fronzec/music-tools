import { describe, it, expect } from 'vitest';
import {
  PENTATONIC_INTERVALS,
  getPentatonicIntervalName,
  getPentatonicBoxes,
  getPentatonicNotes,
} from '$lib/theory/pentatonic';
import { getNoteName, noteNameToSemitone } from '$lib/theory/notes';
import { BOX_ORDER } from '$lib/types/scale';
import type { NoteName } from '$lib/types/chord';
import type { ScaleQuality } from '$lib/types/scale';

/** Oracle: is the note at (string, fret) a member of the pentatonic scale for
 *  this root + quality? Independent of the box-grouping logic under test. */
function isScaleNote(
  stringIndex: number,
  fret: number,
  root: NoteName,
  quality: ScaleQuality,
): boolean {
  const noteSemitone = noteNameToSemitone(getNoteName(stringIndex, fret) as NoteName);
  const rootSemitone = noteNameToSemitone(root);
  const distance = (((noteSemitone - rootSemitone) % 12) + 12) % 12;
  return PENTATONIC_INTERVALS[quality].includes(distance);
}

describe('pentatonic intervals', () => {
  it('minor pentatonic is R b3 4 5 b7', () => {
    expect(PENTATONIC_INTERVALS.minor).toEqual([0, 3, 5, 7, 10]);
    expect(getPentatonicIntervalName(0, 'minor')).toBe('R');
    expect(getPentatonicIntervalName(3, 'minor')).toBe('b3');
    expect(getPentatonicIntervalName(5, 'minor')).toBe('4');
    expect(getPentatonicIntervalName(7, 'minor')).toBe('5');
    expect(getPentatonicIntervalName(10, 'minor')).toBe('b7');
  });

  it('major pentatonic is R 2 3 5 6', () => {
    expect(PENTATONIC_INTERVALS.major).toEqual([0, 2, 4, 7, 9]);
    expect(getPentatonicIntervalName(0, 'major')).toBe('R');
    expect(getPentatonicIntervalName(2, 'major')).toBe('2');
    expect(getPentatonicIntervalName(4, 'major')).toBe('3');
    expect(getPentatonicIntervalName(7, 'major')).toBe('5');
    expect(getPentatonicIntervalName(9, 'major')).toBe('6');
  });

  it('returns null for notes outside the scale', () => {
    expect(getPentatonicIntervalName(1, 'minor')).toBeNull();
    expect(getPentatonicIntervalName(6, 'minor')).toBeNull();
    expect(getPentatonicIntervalName(1, 'major')).toBeNull();
  });

  it('normalizes octaves and negatives', () => {
    expect(getPentatonicIntervalName(12, 'minor')).toBe('R'); // 12 mod 12 = 0
    expect(getPentatonicIntervalName(-9, 'minor')).toBe('b3'); // -9 mod 12 = 3
    expect(getPentatonicIntervalName(-5, 'major')).toBe('5'); // -5 mod 12 = 7
  });
});

const ROOTS: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const QUALITIES: ScaleQuality[] = ['minor', 'major'];

describe('getPentatonicBoxes — structure', () => {
  it('returns the five boxes in order', () => {
    const boxes = getPentatonicBoxes('A', 'minor');
    expect(boxes.map((b) => b.name)).toEqual(BOX_ORDER);
  });

  for (const root of ROOTS) {
    for (const quality of QUALITIES) {
      it(`${root} ${quality}: every box has two notes per string, all in the scale`, () => {
        const boxes = getPentatonicBoxes(root, quality);
        expect(boxes).toHaveLength(5);

        for (const box of boxes) {
          // Two notes on each of the six strings = 12 positions.
          expect(box.positions).toHaveLength(12);
          for (let s = 0; s < 6; s++) {
            const onString = box.positions.filter((p) => p.stringIndex === s);
            expect(onString).toHaveLength(2);
          }

          for (const pos of box.positions) {
            // No negative frets.
            expect(pos.fret).toBeGreaterThanOrEqual(0);
            // Oracle: the note really belongs to the scale.
            expect(isScaleNote(pos.stringIndex, pos.fret, root, quality)).toBe(true);
            // Interval label is consistent with the note.
            const noteSemitone = noteNameToSemitone(
              getNoteName(pos.stringIndex, pos.fret) as NoteName,
            );
            const rootSemitone = noteNameToSemitone(root);
            const distance = (((noteSemitone - rootSemitone) % 12) + 12) % 12;
            expect(pos.interval).toBe(getPentatonicIntervalName(distance, quality));
            expect(pos.isRoot).toBe(pos.interval === 'R');
          }
        }
      });
    }
  }

  it('boxes tile the neck — each overlaps its neck-position neighbor', () => {
    // Order by neck position (box 5 can sit below box 1 depending on root).
    const boxes = getPentatonicBoxes('A', 'minor').sort((a, b) => a.minFret - b.minFret);
    for (let i = 0; i < boxes.length - 1; i++) {
      const a = new Set(boxes[i].positions.map((p) => `${p.stringIndex}:${p.fret}`));
      const shared = boxes[i + 1].positions.some((p) => a.has(`${p.stringIndex}:${p.fret}`));
      expect(shared).toBe(true);
    }
  });
});

describe('getPentatonicBoxes — A minor box 1 (the iconic shape)', () => {
  it('box 1 sits at fret 5 with the root on the low and high E strings', () => {
    const box1 = getPentatonicBoxes('A', 'minor').find((b) => b.name === '1')!;
    expect(box1.minFret).toBe(5);

    const lowE = box1.positions.filter((p) => p.stringIndex === 0);
    expect(lowE.map((p) => p.fret).sort((x, y) => x - y)).toEqual([5, 8]);
    expect(lowE.find((p) => p.fret === 5)!.interval).toBe('R');
  });
});

describe('getPentatonicNotes', () => {
  it('A minor pentatonic notes are A C D E G', () => {
    const notes = getPentatonicNotes('A', 'minor');
    expect(notes.map((n) => n.note)).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(notes.map((n) => n.interval)).toEqual(['R', 'b3', '4', '5', 'b7']);
  });

  it('C major pentatonic notes are C D E G A', () => {
    const notes = getPentatonicNotes('C', 'major');
    expect(notes.map((n) => n.note)).toEqual(['C', 'D', 'E', 'G', 'A']);
    expect(notes.map((n) => n.interval)).toEqual(['R', '2', '3', '5', '6']);
  });

  it('always starts on the root', () => {
    for (const root of ROOTS) {
      for (const quality of QUALITIES) {
        const notes = getPentatonicNotes(root, quality);
        expect(notes).toHaveLength(5);
        expect(notes[0].note).toBe(root);
        expect(notes[0].interval).toBe('R');
      }
    }
  });
});

describe('major box numbering — Box 1 is the major-root position', () => {
  it('C major Box 1 starts on the root — root is the lower low-E note', () => {
    const box1 = getPentatonicBoxes('C', 'major').find((b) => b.name === '1')!;
    const lowE = box1.positions.filter((p) => p.stringIndex === 0).sort((a, b) => a.fret - b.fret);
    // The lower of the two low-E notes is the root (C at fret 8), i.e. the box
    // is the major-root position, not the relative-minor's box 1.
    expect(lowE[0].isRoot).toBe(true);
    expect(getNoteName(0, lowE[0].fret)).toBe('C');
    expect(lowE[0].fret).toBe(8);
  });

  it('still returns five boxes named 1–5 for major', () => {
    const names = getPentatonicBoxes('G', 'major')
      .map((b) => b.name)
      .sort();
    expect(names).toEqual(['1', '2', '3', '4', '5']);
  });

  it('minor numbering is unchanged — Box 1 still has the root on low-E', () => {
    const box1 = getPentatonicBoxes('A', 'minor').find((b) => b.name === '1')!;
    const rootOnLowE = box1.positions.filter((p) => p.stringIndex === 0).find((p) => p.isRoot);
    expect(getNoteName(0, rootOnLowE!.fret)).toBe('A');
  });
});

describe('getPentatonicBoxes — major relabels intervals', () => {
  it('C major box contains the root C and uses major interval labels', () => {
    const boxes = getPentatonicBoxes('C', 'major');
    const roots = boxes.flatMap((b) => b.positions).filter((p) => p.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const r of roots) {
      expect(getNoteName(r.stringIndex, r.fret)).toBe('C');
    }
    // Major pentatonic must never contain a b3/4/b7 label.
    const labels = new Set(boxes.flatMap((b) => b.positions).map((p) => p.interval));
    expect(labels.has('b3')).toBe(false);
    expect(labels.has('b7')).toBe(false);
  });
});
