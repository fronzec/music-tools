import { describe, it, expect } from 'vitest';
import { chordPositions } from '$lib/theory/chordFretboard';
import type { ChordFretboardPosition } from '$lib/theory/chordFretboard';
import { STANDARD_TUNING } from '$lib/theory/tuning';
import { TRIAD_OFFSETS } from '$lib/theory/chords';
import type { TriadQuality } from '$lib/theory/chords';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('chordFretboard — chordPositions', () => {
  // -------------------------------------------------------------------------
  // Shape / smoke
  // -------------------------------------------------------------------------

  it('smoke: chordPositions(0, [0,4,7]) returns a non-empty array with valid shapes', () => {
    const result = chordPositions(0, [0, 4, 7]);
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect(p.stringIndex).toBeGreaterThanOrEqual(0);
      expect(p.stringIndex).toBeLessThanOrEqual(5);
      expect(p.fret).toBeGreaterThanOrEqual(0);
      expect(p.fret).toBeLessThanOrEqual(14);
      expect(p.pitchClass).toBeGreaterThanOrEqual(0);
      expect(p.pitchClass).toBeLessThanOrEqual(11);
      expect(p.degreeIndex).toBeGreaterThanOrEqual(0);
      expect(p.degreeIndex).toBeLessThanOrEqual(2);
      expect(['root', 'tone']).toContain(p.role);
    }
  });

  // -------------------------------------------------------------------------
  // C major — count and pitch class set
  // -------------------------------------------------------------------------

  it('C major: result.length > 3 and every pitchClass is in {0,4,7}', () => {
    const result = chordPositions(0, [0, 4, 7]);
    expect(result.length).toBeGreaterThan(3);
    for (const p of result) {
      expect([0, 4, 7]).toContain(p.pitchClass);
    }
  });

  it('C major: all 6 string indices are represented', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const strings = new Set(result.map((p) => p.stringIndex));
    for (let s = 0; s <= 5; s++) {
      expect(strings.has(s)).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // C major — root/tone role split
  // -------------------------------------------------------------------------

  it('C major: pitchClass===0 positions have role=root and degreeIndex===0', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const roots = result.filter((p) => p.pitchClass === 0);
    expect(roots.length).toBeGreaterThan(0);
    for (const p of roots) {
      expect(p.role).toBe('root');
      expect(p.degreeIndex).toBe(0);
    }
  });

  it('C major: pitchClass!==0 positions have role=tone and degreeIndex>0', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const tones = result.filter((p) => p.pitchClass !== 0);
    expect(tones.length).toBeGreaterThan(0);
    for (const p of tones) {
      expect(p.role).toBe('tone');
      expect(p.degreeIndex).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // C major — specific cells on string 0 (low E, open = pitchClass 4)
  // -------------------------------------------------------------------------

  it('C major string 0: fret 0 → pitchClass 4, degreeIndex 1, role tone', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const cell = result.find((p) => p.stringIndex === 0 && p.fret === 0);
    expect(cell).toBeDefined();
    expect(cell!.pitchClass).toBe(4);
    expect(cell!.degreeIndex).toBe(1);
    expect(cell!.role).toBe('tone');
  });

  it('C major string 0: fret 3 → pitchClass 7, degreeIndex 2, role tone', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const cell = result.find((p) => p.stringIndex === 0 && p.fret === 3);
    expect(cell).toBeDefined();
    expect(cell!.pitchClass).toBe(7);
    expect(cell!.degreeIndex).toBe(2);
    expect(cell!.role).toBe('tone');
  });

  it('C major string 0: fret 8 → pitchClass 0, degreeIndex 0, role root', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const cell = result.find((p) => p.stringIndex === 0 && p.fret === 8);
    expect(cell).toBeDefined();
    expect(cell!.pitchClass).toBe(0);
    expect(cell!.degreeIndex).toBe(0);
    expect(cell!.role).toBe('root');
  });

  // -------------------------------------------------------------------------
  // C major — pitch class repeats across strings
  // -------------------------------------------------------------------------

  it('C major: pitchClass===4 exists on MORE THAN ONE distinct stringIndex', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const eStrings = new Set(result.filter((p) => p.pitchClass === 4).map((p) => p.stringIndex));
    expect(eStrings.size).toBeGreaterThan(1);
  });

  it('C major: role=root count > 1 (root appears multiple times on the neck)', () => {
    const result = chordPositions(0, [0, 4, 7]);
    const rootCount = result.filter((p) => p.role === 'root').length;
    expect(rootCount).toBeGreaterThan(1);
  });

  // -------------------------------------------------------------------------
  // G major
  // -------------------------------------------------------------------------

  it('G major: all pitchClass in {7,11,2}; root at pitchClass 7; tones otherwise', () => {
    const result = chordPositions(7, [0, 4, 7]);
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect([7, 11, 2]).toContain(p.pitchClass);
    }
    for (const p of result.filter((p) => p.pitchClass === 7)) {
      expect(p.role).toBe('root');
    }
    for (const p of result.filter((p) => p.pitchClass !== 7)) {
      expect(p.role).toBe('tone');
    }
  });

  // -------------------------------------------------------------------------
  // Four quality spot-checks
  // -------------------------------------------------------------------------

  it('C minor [0,3,7]: all pitchClass in {0,3,7}, root at pitchClass 0', () => {
    const result = chordPositions(0, [0, 3, 7]);
    for (const p of result) {
      expect([0, 3, 7]).toContain(p.pitchClass);
    }
    for (const p of result.filter((p) => p.pitchClass === 0)) {
      expect(p.role).toBe('root');
    }
  });

  it('C diminished [0,3,6]: all pitchClass in {0,3,6}, root at pitchClass 0', () => {
    const result = chordPositions(0, [0, 3, 6]);
    for (const p of result) {
      expect([0, 3, 6]).toContain(p.pitchClass);
    }
    for (const p of result.filter((p) => p.pitchClass === 0)) {
      expect(p.role).toBe('root');
    }
  });

  it('C augmented [0,4,8]: all pitchClass in {0,4,8}, root at pitchClass 0', () => {
    const result = chordPositions(0, [0, 4, 8]);
    for (const p of result) {
      expect([0, 4, 8]).toContain(p.pitchClass);
    }
    for (const p of result.filter((p) => p.pitchClass === 0)) {
      expect(p.role).toBe('root');
    }
  });

  // -------------------------------------------------------------------------
  // All 12 roots × all 4 qualities loop
  // -------------------------------------------------------------------------

  it('all 12 roots × 4 qualities: non-empty, bounds valid, pitch-class alignment correct', () => {
    const qualities: TriadQuality[] = ['maj', 'min', 'dim', 'aug'];
    for (let root = 0; root < 12; root++) {
      for (const q of qualities) {
        const offsets = TRIAD_OFFSETS[q];
        const result = chordPositions(root, offsets);
        expect(result.length).toBeGreaterThan(0);
        for (const p of result) {
          expect(p.fret).toBeGreaterThanOrEqual(0);
          expect(p.fret).toBeLessThanOrEqual(14);
          expect(p.stringIndex).toBeGreaterThanOrEqual(0);
          expect(p.stringIndex).toBeLessThanOrEqual(5);
          // Pitch class alignment: (openNote + fret) % 12 === (root + offsets[degreeIndex]) % 12
          const expected = ((root + offsets[p.degreeIndex]) % 12 + 12) % 12;
          expect(p.pitchClass).toBe(expected);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // Edge — open string (B string, stringIndex=1, open=9=A... wait, string 1 = A)
  // STANDARD_TUNING = [4, 9, 2, 7, 11, 4]
  // string 1 = 9 (A), but rootPc=11 (B)... need to find a string with open=B
  // Actually B string is stringIndex=4: STANDARD_TUNING[4] = 11 = B
  // Let's verify: string 0=E(4), 1=A(9), 2=D(2), 3=G(7), 4=B(11), 5=E(4)
  // So for rootPc=11 (B), string 4 open fret=0 → pitchClass=11 → root
  // -------------------------------------------------------------------------

  it('edge B root: chordPositions(11, [0,4,7]) contains { stringIndex:4, fret:0, pitchClass:11, degreeIndex:0, role:root }', () => {
    const result = chordPositions(11, [0, 4, 7]);
    const cell = result.find((p) => p.stringIndex === 4 && p.fret === 0);
    expect(cell).toBeDefined();
    expect(cell!.pitchClass).toBe(11);
    expect(cell!.degreeIndex).toBe(0);
    expect(cell!.role).toBe('root');
  });

  // -------------------------------------------------------------------------
  // Edge — negative root normalization
  // -------------------------------------------------------------------------

  it('edge: chordPositions(-1, [0,4,7]) deep-equals chordPositions(11, [0,4,7])', () => {
    const a = chordPositions(-1, [0, 4, 7]);
    const b = chordPositions(11, [0, 4, 7]);
    expect(a).toEqual(b);
  });

  // -------------------------------------------------------------------------
  // Edge — rootPc=12 wraps to 0
  // -------------------------------------------------------------------------

  it('edge: chordPositions(12, [0,4,7]) deep-equals chordPositions(0, [0,4,7])', () => {
    const a = chordPositions(12, [0, 4, 7]);
    const b = chordPositions(0, [0, 4, 7]);
    expect(a).toEqual(b);
  });

  // -------------------------------------------------------------------------
  // Edge — duplicate offset tie discipline (octave overlap [0, 12])
  // -------------------------------------------------------------------------

  it('edge tie: chordPositions(0, [0,12]) — every cell has role=root and degreeIndex=0, no tone', () => {
    const result = chordPositions(0, [0, 12]);
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect(p.role).toBe('root');
      expect(p.degreeIndex).toBe(0);
    }
    expect(result.filter((p) => p.role === 'tone').length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Determinism
  // -------------------------------------------------------------------------

  it('determinism: calling chordPositions(0, [0,4,7]) twice returns deeply equal arrays', () => {
    const a = chordPositions(0, [0, 4, 7]);
    const b = chordPositions(0, [0, 4, 7]);
    expect(a).toEqual(b);
  });
});
