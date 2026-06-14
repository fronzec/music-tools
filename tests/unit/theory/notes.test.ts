import { describe, it, expect } from 'vitest';
import { semitoneToNoteName, noteNameToSemitone, getIntervalName, getNoteName, getLabel } from '$lib/theory/notes';

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

describe('getNoteName', () => {
  it('open low E string (stringIndex=0, fret=0) returns E', () => {
    // STANDARD_TUNING[0] = 4 (E) + 0 = 4 → E
    expect(getNoteName(0, 0)).toBe('E');
  });

  it('open A string (stringIndex=1, fret=0) returns A', () => {
    // STANDARD_TUNING[1] = 9 (A) + 0 = 9 → A
    expect(getNoteName(1, 0)).toBe('A');
  });

  it('5th fret on low E string returns A', () => {
    // STANDARD_TUNING[0] = 4 (E) + 5 = 9 → A
    expect(getNoteName(0, 5)).toBe('A');
  });

  it('5th fret on A string returns D', () => {
    // STANDARD_TUNING[1] = 9 (A) + 5 = 14 → wraps to 2 → D
    expect(getNoteName(1, 5)).toBe('D');
  });

  it('open high E string (stringIndex=5, fret=0) returns E', () => {
    // STANDARD_TUNING[5] = 4 (E) + 0 = 4 → E
    expect(getNoteName(5, 0)).toBe('E');
  });
});

describe('getLabel', () => {
  it('intervals mode returns the interval string', () => {
    expect(getLabel(0, 5, 'R', 'intervals')).toBe('R');
    expect(getLabel(0, 5, '3', 'intervals')).toBe('3');
    expect(getLabel(0, 5, 'b3', 'intervals')).toBe('b3');
  });

  it('notes mode returns the note name', () => {
    // stringIndex=0, fret=5 → A
    expect(getLabel(0, 5, 'R', 'notes')).toBe('A');
  });

  it('both mode returns note and interval combined', () => {
    // stringIndex=0, fret=5 → A
    expect(getLabel(0, 5, 'R', 'both')).toBe('A (R)');
  });

  it('returns null when interval is null', () => {
    expect(getLabel(0, 5, null, 'notes')).toBeNull();
    expect(getLabel(0, 5, null, 'intervals')).toBeNull();
    expect(getLabel(0, 5, null, 'both')).toBeNull();
  });
});
