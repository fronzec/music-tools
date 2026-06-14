import { describe, it, expect } from 'vitest';
import { fretToMidi, OPEN_MIDI } from '$lib/theory/tab';
import type { Tab, TabStep, TabNote } from '$lib/theory/tab';

// ---------------------------------------------------------------------------
// OPEN_MIDI constant
// ---------------------------------------------------------------------------
describe('OPEN_MIDI', () => {
  it('has exactly 6 entries (one per string)', () => {
    expect(OPEN_MIDI.length).toBe(6);
  });

  it('matches standard tuning: [40, 45, 50, 55, 59, 64]', () => {
    expect(Array.from(OPEN_MIDI)).toEqual([40, 45, 50, 55, 59, 64]);
  });

  it('string 0 (low E) = MIDI 40 (E2)', () => {
    expect(OPEN_MIDI[0]).toBe(40);
  });

  it('string 5 (high E) = MIDI 64 (E4)', () => {
    expect(OPEN_MIDI[5]).toBe(64);
  });
});

// ---------------------------------------------------------------------------
// fretToMidi
// ---------------------------------------------------------------------------
describe('fretToMidi', () => {
  it('open low E string (0,0) = 40', () => {
    expect(fretToMidi(0, 0)).toBe(40);
  });

  it('open A string (1,0) = 45', () => {
    expect(fretToMidi(1, 0)).toBe(45);
  });

  it('open D string (2,0) = 50', () => {
    expect(fretToMidi(2, 0)).toBe(50);
  });

  it('open G string (3,0) = 55', () => {
    expect(fretToMidi(3, 0)).toBe(55);
  });

  it('open B string (4,0) = 59', () => {
    expect(fretToMidi(4, 0)).toBe(59);
  });

  it('open high E string (5,0) = 64', () => {
    expect(fretToMidi(5, 0)).toBe(64);
  });

  it('all open strings match OPEN_MIDI values', () => {
    for (let s = 0; s <= 5; s++) {
      expect(fretToMidi(s, 0)).toBe(OPEN_MIDI[s]);
    }
  });

  it('D string (2) fret 2 = 52 (E3)', () => {
    expect(fretToMidi(2, 2)).toBe(52);
  });

  it('D string (2) fret 3 = 53', () => {
    expect(fretToMidi(2, 3)).toBe(53);
  });

  it('low E string (0) fret 5 = 45 (A2 — same as open A string)', () => {
    expect(fretToMidi(0, 5)).toBe(45);
  });

  it('low E string (0) fret 12 = 52 (E3 — octave up)', () => {
    expect(fretToMidi(0, 12)).toBe(52);
  });

  it('high E string (5) fret 5 = 69 (A4)', () => {
    expect(fretToMidi(5, 5)).toBe(69);
  });

  it('G string (3) fret 0 = 55', () => {
    expect(fretToMidi(3, 0)).toBe(55);
  });

  it('A string (1) fret 7 = 52 (same as D string fret 2)', () => {
    expect(fretToMidi(1, 7)).toBe(52);
  });
});

// ---------------------------------------------------------------------------
// Type shape — compile-time checks via runtime ducktyping
// ---------------------------------------------------------------------------
describe('TabNote type', () => {
  it('accepts { string: 0, fret: 0 }', () => {
    const note: TabNote = { string: 0, fret: 0 };
    expect(note.string).toBe(0);
    expect(note.fret).toBe(0);
  });

  it('accepts { string: 5, fret: 14 }', () => {
    const note: TabNote = { string: 5, fret: 14 };
    expect(note.string).toBe(5);
    expect(note.fret).toBe(14);
  });
});

describe('TabStep type', () => {
  it('is an array of TabNote', () => {
    const step: TabStep = [{ string: 3, fret: 2 }];
    expect(step.length).toBe(1);
  });

  it('supports chord (multiple notes in one step)', () => {
    const chord: TabStep = [
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ];
    expect(chord.length).toBe(2);
  });
});

describe('Tab type', () => {
  it('has title and steps fields', () => {
    const tab: Tab = {
      title: 'Test Tab',
      steps: [[{ string: 0, fret: 0 }]],
    };
    expect(tab.title).toBe('Test Tab');
    expect(tab.steps.length).toBe(1);
  });

  it('supports multiple steps', () => {
    const tab: Tab = {
      title: 'Multi-step',
      steps: [
        [{ string: 0, fret: 0 }],
        [{ string: 1, fret: 2 }],
        [{ string: 2, fret: 4 }],
      ],
    };
    expect(tab.steps.length).toBe(3);
  });
});
