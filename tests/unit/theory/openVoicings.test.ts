import { describe, it, expect } from 'vitest';
import { CHROMATIC, STANDARD_TUNING } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';
import { diatonicTriads } from '$lib/theory/diatonics';
import type { Degree } from '$lib/theory/diatonics';
import { voicingRole, getOpenVoicing } from '$lib/theory/openVoicings';

// ---------------------------------------------------------------------------
// Block A — voicingRole unit table (design ADR-2)
// ---------------------------------------------------------------------------

describe('voicingRole', () => {
  it('voicingRole(0, 0) → root', () => expect(voicingRole(0, 0)).toBe('root'));
  it('voicingRole(3, 0) → third (minor third)', () => expect(voicingRole(3, 0)).toBe('third'));
  it('voicingRole(4, 0) → third (major third)', () => expect(voicingRole(4, 0)).toBe('third'));
  it('voicingRole(6, 0) → fifth (diminished fifth)', () => expect(voicingRole(6, 0)).toBe('fifth'));
  it('voicingRole(7, 0) → fifth (perfect fifth)', () => expect(voicingRole(7, 0)).toBe('fifth'));
  it('voicingRole(1, 0) → null (not a triad tone)', () => expect(voicingRole(1, 0)).toBeNull());
  it('voicingRole(11, 0) → null (not a triad tone)', () => expect(voicingRole(11, 0)).toBeNull());
  it('voicingRole(4, 4) → root (pc === rootPc)', () => expect(voicingRole(4, 4)).toBe('root'));
  it('voicingRole(7, 4) → third (3 semis above E = G#? No — G=7, rootPc=4(E), semis=3 → third)', () => {
    expect(voicingRole(7, 4)).toBe('third');
  });
});

// ---------------------------------------------------------------------------
// Block B — getOpenVoicing happy path (C major only in PR1)
// ---------------------------------------------------------------------------

describe('getOpenVoicing — C major', () => {
  it('getOpenVoicing("C", 1) returns rootPc === 0', () => {
    expect(getOpenVoicing('C', 1).rootPc).toBe(0);
  });

  it('getOpenVoicing("C", 1) returns baseFret === 1', () => {
    expect(getOpenVoicing('C', 1).baseFret).toBe(1);
  });

  it('getOpenVoicing("C", 1) returns roman === "I"', () => {
    expect(getOpenVoicing('C', 1).roman).toBe('I');
  });

  it('getOpenVoicing("C", 1) returns quality === "maj"', () => {
    expect(getOpenVoicing('C', 1).quality).toBe('maj');
  });

  it('getOpenVoicing("C", 1).frets has length 6', () => {
    expect(getOpenVoicing('C', 1).frets).toHaveLength(6);
  });

  it('all 7 degrees 1–7 return successfully for key C without throwing', () => {
    for (let d = 1; d <= 7; d++) {
      expect(() => getOpenVoicing('C', d as Degree)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// Block C — throw path
// ---------------------------------------------------------------------------

describe('getOpenVoicing — throw path', () => {
  it('getOpenVoicing("G#", 1) throws (G# not yet authored in PR1)', () => {
    expect(() => getOpenVoicing('G#', 1)).toThrow(/G#/);
  });

  it('getOpenVoicing("C", 8 as any) throws (degree out of range)', () => {
    expect(() => getOpenVoicing('C', 8 as any)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Block D — correctness invariants (authored-keys-only gate)
// Design-review finding #1: NoteNames → PCs BEFORE comparison
// ---------------------------------------------------------------------------

const AUTHORED_KEYS: NoteName[] = ['C']; // PR1 starts with C only; expand each batch PR

describe('openVoicings correctness invariants (authored keys only)', () => {
  for (const key of AUTHORED_KEYS) {
    for (let degree = 1; degree <= 7; degree++) {
      const d = degree as Degree;

      it(`${key} degree ${degree}: all played PCs are in the triad tone set`, () => {
        const triad = diatonicTriads(key)[degree - 1];
        const v = getOpenVoicing(key, d);

        // Design-review finding #1 — EXACT pattern: NoteNames → PCs
        const triadPcSet = new Set(triad.notes.map((n) => CHROMATIC.indexOf(n)));

        v.frets.forEach((f, i) => {
          if (f === null) return;
          const pc = (STANDARD_TUNING[i] + f) % 12;
          expect(
            triadPcSet.has(pc),
            `${key} degree ${degree} string ${i}: pc ${pc} not in triad PC set ${JSON.stringify([...triadPcSet])}`,
          ).toBe(true);
        });
      });

      it(`${key} degree ${degree}: root PC is present in played strings`, () => {
        const triad = diatonicTriads(key)[degree - 1];
        const v = getOpenVoicing(key, d);

        const playedPcs = v.frets
          .map((f, i) => (f !== null ? (STANDARD_TUNING[i] + f) % 12 : null))
          .filter((pc): pc is number => pc !== null);

        expect(
          playedPcs,
          `${key} degree ${degree}: rootPc ${triad.rootPc} not in played PCs [${playedPcs}]`,
        ).toContain(triad.rootPc);
      });

      it(`${key} degree ${degree}: at least 3 strings played`, () => {
        const v = getOpenVoicing(key, d);
        const playedCount = v.frets.filter((f) => f !== null).length;
        expect(
          playedCount,
          `${key} degree ${degree}: fewer than 3 strings played (got ${playedCount})`,
        ).toBeGreaterThanOrEqual(3);
      });

      it(`${key} degree ${degree}: every fretted string has a non-null finger`, () => {
        const v = getOpenVoicing(key, d);
        v.frets.forEach((f, i) => {
          if (f !== null && f > 0) {
            expect(
              v.fingers[i],
              `${key} degree ${degree} string ${i}: fretted but no finger`,
            ).not.toBeNull();
          }
        });
      });

      it(`${key} degree ${degree}: metadata agrees with diatonicTriads`, () => {
        const triad = diatonicTriads(key)[degree - 1];
        const v = getOpenVoicing(key, d);
        expect(v.quality).toBe(triad.quality);
        expect(v.rootPc).toBe(triad.rootPc);
        expect(v.roman).toBe(triad.roman);
        expect(v.name).toBe(triad.name);
      });

      it(`${key} degree ${degree}: voicingRole is non-null for every played PC`, () => {
        const v = getOpenVoicing(key, d);
        const playedPcs = v.frets
          .map((f, i) => (f !== null ? (STANDARD_TUNING[i] + f) % 12 : null))
          .filter((pc): pc is number => pc !== null);

        playedPcs.forEach((pc) => {
          expect(
            voicingRole(pc, v.rootPc),
            `${key} degree ${degree}: pc ${pc} has null role`,
          ).not.toBeNull();
        });
      });

      it(`${key} degree ${degree}: baseFret sanity`, () => {
        const v = getOpenVoicing(key, d);
        expect(v.baseFret).toBeGreaterThanOrEqual(1);
        if (v.barre) {
          expect(v.barre.fromString).toBeLessThanOrEqual(v.barre.toString);
          expect(v.barre.fret).toBeGreaterThanOrEqual(v.baseFret);
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Block E — sharp-key baseFret constraint (design-review finding #3)
// Written RED in PR1 (sharps not yet authored) — stays SKIPPED until PR4.
// Remove the .skip in PR4 after sharps are authored.
// ---------------------------------------------------------------------------

const SHARP_KEYS = ['C#', 'F#', 'G#', 'D#', 'A#'] as const;

describe.skip('sharp-key baseFret > 1 (activate in PR4 when sharps are authored)', () => {
  for (const key of SHARP_KEYS) {
    for (let degree = 1; degree <= 7; degree++) {
      it(`${key} degree ${degree} has baseFret > 1`, () => {
        const v = getOpenVoicing(key as NoteName, degree as Degree);
        expect(v.baseFret, `${key} deg ${degree}: expected baseFret > 1`).toBeGreaterThan(1);
      });
    }
  }
});
