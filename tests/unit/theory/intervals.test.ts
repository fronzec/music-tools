import { describe, it, expect } from 'vitest';
import {
  midiToFreq,
  INTERVALS,
  intervalBySemitones,
  generateQuestion,
  ROOT_MIN,
  ROOT_SPAN,
} from '$lib/theory/intervals';
import type { Rng } from '$lib/theory/intervals';

// ---------------------------------------------------------------------------
// Deterministic RNG helper: returns values from the array in order.
// Cycles back to 0 if more values are consumed than provided.
// ---------------------------------------------------------------------------
function fakeRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

// ---------------------------------------------------------------------------
// midiToFreq
// ---------------------------------------------------------------------------
describe('midiToFreq', () => {
  it('A4 (MIDI 69) equals exactly 440 Hz', () => {
    expect(midiToFreq(69)).toBe(440);
  });

  it('A3 (MIDI 57) equals exactly 220 Hz', () => {
    expect(midiToFreq(57)).toBe(220);
  });

  it('A5 (MIDI 81) equals exactly 880 Hz', () => {
    expect(midiToFreq(81)).toBe(880);
  });

  it('C4 (MIDI 60) is within 0.01 Hz of 261.63', () => {
    expect(Math.abs(midiToFreq(60) - 261.63)).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------------------
// INTERVALS table
// ---------------------------------------------------------------------------
describe('INTERVALS table', () => {
  it('has exactly 12 entries', () => {
    expect(INTERVALS.length).toBe(12);
  });

  it('each entry semitones equals index + 1', () => {
    for (let i = 0; i < 12; i++) {
      expect(INTERVALS[i].semitones).toBe(i + 1);
    }
  });

  it('contains all 12 canonical interval names', () => {
    const names = INTERVALS.map((e) => e.name);
    const expected = [
      'Minor 2nd',
      'Major 2nd',
      'Minor 3rd',
      'Major 3rd',
      'Perfect 4th',
      'Tritone',
      'Perfect 5th',
      'Minor 6th',
      'Major 6th',
      'Minor 7th',
      'Major 7th',
      'Perfect Octave',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('has no duplicate names', () => {
    const names = INTERVALS.map((e) => e.name);
    expect(new Set(names).size).toBe(12);
  });

  it('has no duplicate semitone values', () => {
    const semitones = INTERVALS.map((e) => e.semitones);
    expect(new Set(semitones).size).toBe(12);
  });

  it('semitone 6 maps to Tritone', () => {
    expect(INTERVALS[5].name).toBe('Tritone');
    expect(INTERVALS[5].semitones).toBe(6);
  });

  it('semitone 7 maps to Perfect 5th', () => {
    expect(INTERVALS[6].name).toBe('Perfect 5th');
    expect(INTERVALS[6].semitones).toBe(7);
  });

  it('semitone 12 maps to Perfect Octave', () => {
    expect(INTERVALS[11].name).toBe('Perfect Octave');
    expect(INTERVALS[11].semitones).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// intervalBySemitones
// ---------------------------------------------------------------------------
describe('intervalBySemitones', () => {
  it('returns the correct entry for each semitone 1..12', () => {
    for (let n = 1; n <= 12; n++) {
      const entry = intervalBySemitones(n);
      expect(entry.semitones).toBe(n);
    }
  });

  it('throws RangeError for semitone 0', () => {
    expect(() => intervalBySemitones(0)).toThrow(RangeError);
  });

  it('throws RangeError for semitone 13', () => {
    expect(() => intervalBySemitones(13)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// generateQuestion
// ---------------------------------------------------------------------------
describe('generateQuestion', () => {
  it('rootMidi is within ROOT_MIN .. ROOT_MIN + ROOT_SPAN - 1', () => {
    // With rng always returning 0: interval index=0 (Minor 2nd), root=ROOT_MIN
    const q = generateQuestion(fakeRng([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    expect(q.rootMidi).toBeGreaterThanOrEqual(ROOT_MIN);
    expect(q.rootMidi).toBeLessThanOrEqual(ROOT_MIN + ROOT_SPAN - 1);
  });

  it('returns choices array of length 4', () => {
    const q = generateQuestion(fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0.1, 0.2]));
    expect(q.choices.length).toBe(4);
  });

  it('all 4 choice names are distinct', () => {
    const q = generateQuestion(fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0.1, 0.2]));
    expect(new Set(q.choices).size).toBe(4);
  });

  it('correct interval name is among the 4 choices', () => {
    const q = generateQuestion(fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0.1, 0.2]));
    expect(q.choices).toContain(q.interval.name);
  });

  it('lowMidi equals rootMidi', () => {
    const q = generateQuestion(fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0.1, 0.2]));
    expect(q.lowMidi).toBe(q.rootMidi);
  });

  it('highMidi equals rootMidi + interval.semitones', () => {
    const q = generateQuestion(fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0.1, 0.2]));
    expect(q.highMidi).toBe(q.rootMidi + q.interval.semitones);
  });

  it('is deterministic: pinned concrete case with rng returning [0, 0, ...]', () => {
    // rng sequence: interval pick=0 → Minor 2nd (index 0, floor(0*12)=0)
    // root pick=0 → ROOT_MIN + floor(0*13)=ROOT_MIN=57
    // distractors: picks from rng continue, eventually gets 3 distinct non-Minor-2nd intervals
    // With all-zeros rng the dedup loop would keep picking index 0.
    // Use a rng that returns 0 for first two calls, then 0.1, 0.2, 0.3 for distractors, then 0 values for shuffle
    const rng = fakeRng([0, 0, 0.1, 0.2, 0.3, 0, 0, 0, 0, 0, 0, 0]);
    const q = generateQuestion(rng);
    // interval index = floor(0 * 12) = 0 → Minor 2nd
    expect(q.interval.name).toBe('Minor 2nd');
    // root = ROOT_MIN + floor(0 * ROOT_SPAN) = 57
    expect(q.rootMidi).toBe(57);
    expect(q.lowMidi).toBe(57);
    expect(q.highMidi).toBe(58); // 57 + 1 semitone
  });
});
