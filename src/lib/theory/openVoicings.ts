/**
 * Open-position diatonic chord voicings.
 *
 * Stores 84 hand-authored voicings (12 major keys × 7 degrees) with absolute
 * fret numbers (not relative). Absolute frets allow role derivation to collapse
 * to `(STANDARD_TUNING[i] + frets[i]) % 12` with no baseFret arithmetic, and
 * let the correctness test compare played PCs against `diatonicTriads()` directly.
 *
 * Design ADR-1: keyed by NoteName → array of exactly 7 OpenVoicing objects in
 * degree order (index 0 = degree I, index 6 = degree vii°).
 */

import type { NoteName } from '$lib/types/chord';
import type { TriadQuality } from '$lib/theory/chords';
import type { Degree } from '$lib/theory/diatonics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single string's fret: null = muted (×), 0 = open (O), >0 = absolute fretted note. */
export type StringFret = number | null;

/** Fretting-hand finger; null where no finger is needed (open/muted). */
export type Finger = 1 | 2 | 3 | 4 | null;

/** A barre spanning a contiguous string range at one absolute fret. */
export interface BarreSpec {
  fret: number;        // absolute fret of the barre
  fromString: number;  // 0..5 inclusive, low side
  toString: number;    // 0..5 inclusive, high side (>= fromString)
}

export interface OpenVoicing {
  roman: string;                                   // e.g. 'I', 'ii', 'vii°' — mirrors DiatonicTriad.roman
  name: string;                                    // e.g. 'C major' — mirrors DiatonicTriad.name
  quality: TriadQuality;                           // 'maj' | 'min' | 'dim'
  rootPc: number;                                  // 0..11 — the triad root pitch class
  frets: readonly [StringFret, StringFret, StringFret, StringFret, StringFret, StringFret];
  fingers: readonly [Finger, Finger, Finger, Finger, Finger, Finger];
  barre?: BarreSpec;                               // present only for barre/movable shapes
  baseFret: number;                                // 1 = open position (thick nut); >1 = window start (Nfr label)
}

export type OpenVoicingMap = Partial<Record<NoteName, readonly OpenVoicing[]>>;

/** Role of a played pitch class relative to the triad root. */
export type VoicingRole = 'root' | 'third' | 'fifth';

// ---------------------------------------------------------------------------
// ADR-2 — Role-derivation helper
// ---------------------------------------------------------------------------

/**
 * Pure: classifies a played pitch class against the triad root.
 * semis = (pc - rootPc + 12) % 12 → 0=root; 3|4=third; 6|7=fifth (dim 5th = 6).
 * Returns null for any pc that is not a triad tone.
 */
export function voicingRole(pc: number, rootPc: number): VoicingRole | null {
  const semis = (((pc - rootPc) % 12) + 12) % 12;
  if (semis === 0) return 'root';
  if (semis === 3 || semis === 4) return 'third';
  if (semis === 6 || semis === 7) return 'fifth';
  return null;
}

// ---------------------------------------------------------------------------
// Voicing data — C major only in PR1
// STANDARD_TUNING = [4, 9, 2, 7, 11, 4] (low E idx 0 → high e idx 5, pitch classes)
// ---------------------------------------------------------------------------

/**
 * C major diatonic voicings (degree I–vii°).
 *
 * Verification (STANDARD_TUNING = [4,9,2,7,11,4]):
 *   I   (C maj, rootPc=0): [null,3,2,0,1,0]  → A+3=C, D+2=E, G+0=G, B+1=C, e+0=E → F,A,C set ✓
 *   ii  (D min, rootPc=2): [null,null,0,2,3,1] → D+0=D, G+2=A, B+3=D, e+1=F → D,F,A set ✓
 *   iii (E min, rootPc=4): [0,2,2,0,0,0]      → E+0=E, A+2=B, D+2=E, G+0=G, B+0=B, e+0=E ✓
 *   IV  (F maj, rootPc=5): [1,3,3,2,1,1]      → E+1=F, A+3=C, D+3=F, G+2=A, B+1=C, e+1=F ✓
 *   V   (G maj, rootPc=7): [3,2,0,0,0,3]      → E+3=G, A+2=B, D+0=D, G+0=G, B+0=B, e+3=G ✓
 *   vi  (A min, rootPc=9): [null,0,2,2,1,0]   → A+0=A, D+2=E, G+2=A, B+1=C, e+0=E ✓
 *   vii°(B dim, rootPc=11): [null,2,0,null,0,1] → A+2=B, D+0=D, B+0=B, e+1=F ✓
 */
const C_MAJOR: readonly OpenVoicing[] = [
  // I — C major
  {
    roman: 'I',
    name: 'C major',
    quality: 'maj',
    rootPc: 0,
    baseFret: 1,
    frets:   [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
  },
  // ii — D minor
  {
    roman: 'ii',
    name: 'D minor',
    quality: 'min',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, null, 0, 2, 3, 1],
    fingers: [null, null, null, 2, 3, 1],
  },
  // iii — E minor
  {
    roman: 'iii',
    name: 'E minor',
    quality: 'min',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
  },
  // IV — F major (barre at fret 1)
  // Correct voicing: [1,3,3,2,1,1] — A string fret 3 = C (not fret 1 = A#)
  {
    roman: 'IV',
    name: 'F major',
    quality: 'maj',
    rootPc: 5,
    baseFret: 1,
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 4, 3, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  // V — G major
  {
    roman: 'V',
    name: 'G major',
    quality: 'maj',
    rootPc: 7,
    baseFret: 1,
    frets:   [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3],
  },
  // vi — A minor
  {
    roman: 'vi',
    name: 'A minor',
    quality: 'min',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
  },
  // vii° — B diminished
  // Correct voicing: [null,2,0,null,0,1] → A+2=B(root), D+0=D(third), B+0=B(root), e+1=F(fifth)
  // Note: str3 G+1=G# is NOT in B dim (B,D,F), so string 3 is muted here
  {
    roman: 'vii°',
    name: 'B diminished',
    quality: 'dim',
    rootPc: 11,
    baseFret: 1,
    frets:   [null, 2, 0, null, 0, 1],
    fingers: [null, 2, null, null, null, 1],
  },
];

// ---------------------------------------------------------------------------
// Voicing map — add keys per PR batch
// ---------------------------------------------------------------------------

export const OPEN_VOICINGS: OpenVoicingMap = {
  C: C_MAJOR,
  // G, D, A, E, F → PR2
  // A#, D#, G#, B → PR3
  // C#, F# → PR4
};

// ---------------------------------------------------------------------------
// ADR-1 — Lookup with descriptive throws
// ---------------------------------------------------------------------------

/**
 * Returns the OpenVoicing for the given major key root and scale degree.
 * Throws a descriptive Error if the key or degree has no authored voicing.
 */
export function getOpenVoicing(keyRoot: NoteName, degree: Degree): OpenVoicing {
  const keyVoicings = OPEN_VOICINGS[keyRoot];
  if (!keyVoicings) {
    throw new Error(`No voicings authored for key "${keyRoot}"`);
  }
  const voicing = keyVoicings[degree - 1];
  if (voicing === undefined) {
    throw new Error(`No voicing for ${keyRoot} degree ${degree}`);
  }
  return voicing;
}
