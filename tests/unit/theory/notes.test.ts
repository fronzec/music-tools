import { describe, it, expect } from 'vitest';
import { semitoneToNoteName, noteNameToSemitone, getIntervalName } from '$lib/theory/notes';

describe('semitoneToNoteName', () => {
  it('returns C for semitone 0', () => {
    expect(semitoneToNoteName(0)).toBe('C');
  });

  it('returns A for semitone 9', () => {
    expect(semitoneToNoteName(9)).toBe('A');
  });

  it('returns A# for semitone 10', () => {
    expect(semitoneToNoteName(10)).toBe('A#');
  });

  it('returns B for semitone 11', () => {
    expect(semitoneToNoteName(11)).toBe('B');
  });

  it('wraps around: semitone 12 returns C', () => {
    expect(semitoneToNoteName(12)).toBe('C');
  });

  it('wraps correctly for semitone 13 (C#)', () => {
    expect(semitoneToNoteName(13)).toBe('C#');
  });

  it('handles negative semitone: -1 returns B', () => {
    expect(semitoneToNoteName(-1)).toBe('B');
  });

  it('handles large negative: -12 returns C', () => {
    expect(semitoneToNoteName(-12)).toBe('C');
  });
});

describe('noteNameToSemitone', () => {
  it('returns 0 for C', () => {
    expect(noteNameToSemitone('C')).toBe(0);
  });

  it('returns 2 for D', () => {
    expect(noteNameToSemitone('D')).toBe(2);
  });

  it('returns 10 for A#', () => {
    expect(noteNameToSemitone('A#')).toBe(10);
  });

  it('returns 11 for B', () => {
    expect(noteNameToSemitone('B')).toBe(11);
  });

  it('round-trips: semitoneToNoteName(noteNameToSemitone("G#")) === "G#"', () => {
    const semitone = noteNameToSemitone('G#');
    expect(semitoneToNoteName(semitone)).toBe('G#');
  });

  it('round-trips: noteNameToSemitone(semitoneToNoteName(7)) === 7', () => {
    expect(noteNameToSemitone(semitoneToNoteName(7))).toBe(7);
  });
});

describe('getIntervalName', () => {
  describe('major quality', () => {
    it('returns R for semitone 0', () => {
      expect(getIntervalName(0, 'major')).toBe('R');
    });

    it('returns 3 for semitone 4', () => {
      expect(getIntervalName(4, 'major')).toBe('3');
    });

    it('returns 5 for semitone 7', () => {
      expect(getIntervalName(7, 'major')).toBe('5');
    });

    it('returns empty string for non-chord tone (semitone 2)', () => {
      expect(getIntervalName(2, 'major')).toBe('');
    });

    it('returns empty string for non-chord tone (semitone 6)', () => {
      expect(getIntervalName(6, 'major')).toBe('');
    });

    it('wraps: semitone 12 returns R', () => {
      expect(getIntervalName(12, 'major')).toBe('R');
    });

    it('wraps: semitone 16 returns 3', () => {
      expect(getIntervalName(16, 'major')).toBe('3');
    });
  });

  describe('minor quality', () => {
    it('returns R for semitone 0', () => {
      expect(getIntervalName(0, 'minor')).toBe('R');
    });

    it('returns b3 for semitone 3', () => {
      expect(getIntervalName(3, 'minor')).toBe('b3');
    });

    it('returns 5 for semitone 7', () => {
      expect(getIntervalName(7, 'minor')).toBe('5');
    });

    it('returns empty string for semitone 4 (major third — not in minor)', () => {
      expect(getIntervalName(4, 'minor')).toBe('');
    });
  });
});
