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
// G major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// G major scale PCs: G=7, A=9, B=11, C=0, D=2, E=4, F#=6
//
//   I   G maj  rootPc=7:  [3,2,0,0,0,3]   → E+3=G, A+2=B, D+0=D, G+0=G, B+0=B, e+3=G ✓
//   ii  A min  rootPc=9:  [x,0,2,2,1,0]   → A+0=A, D+2=E, G+2=A, B+1=C, e+0=E ✓
//   iii B min  rootPc=11: [x,2,4,4,3,2]   → A+2=B, D+4=F#, G+4=B, B+3=D, e+2=F# ✓
//   IV  C maj  rootPc=0:  [x,3,2,0,1,0]   → A+3=C, D+2=E, G+0=G, B+1=C, e+0=E ✓
//   V   D maj  rootPc=2:  [x,x,0,2,3,2]   → D+0=D, G+2=A, B+3=D, e+2=F# ✓
//   vi  E min  rootPc=4:  [0,2,2,0,0,0]   → E+0=E, A+2=B, D+2=E, G+0=G, B+0=B, e+0=E ✓
//   vii°F# dim rootPc=6:  [2,0,x,2,1,x]   → E+2=F#, A+0=A, G+2=A, B+1=C ✓
// ---------------------------------------------------------------------------

const G_MAJOR: readonly OpenVoicing[] = [
  // I — G major
  {
    roman: 'I',
    name: 'G major',
    quality: 'maj',
    rootPc: 7,
    baseFret: 1,
    frets:   [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3],
  },
  // ii — A minor
  {
    roman: 'ii',
    name: 'A minor',
    quality: 'min',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
  },
  // iii — B minor (barre at fret 2)
  {
    roman: 'iii',
    name: 'B minor',
    quality: 'min',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // IV — C major
  {
    roman: 'IV',
    name: 'C major',
    quality: 'maj',
    rootPc: 0,
    baseFret: 1,
    frets:   [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
  },
  // V — D major
  {
    roman: 'V',
    name: 'D major',
    quality: 'maj',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
  },
  // vi — E minor
  {
    roman: 'vi',
    name: 'E minor',
    quality: 'min',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
  },
  // vii° — F# diminished
  // str0: E+2=F#(6,root), str1: A+0=A(9), str3: G+2=A(9), str4: B+1=C(0)
  // {F#=6, A=9, C=0} ✓ root F#(6) via str0 ✓
  {
    roman: 'vii°',
    name: 'F# diminished',
    quality: 'dim',
    rootPc: 6,
    baseFret: 1,
    frets:   [2, 0, null, 2, 1, null],
    fingers: [1, null, null, 3, 2, null],
  },
];

// ---------------------------------------------------------------------------
// F major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// F major scale PCs: F=5, G=7, A=9, A#=10, C=0, D=2, E=4
//
//   I   F maj  rootPc=5:  [1,3,3,2,1,1]   barre@1 → E+1=F, A+3=C, D+3=F, G+2=A, B+1=C, e+1=F ✓
//   ii  G min  rootPc=7:  [3,1,0,0,3,3]   → E+3=G, A+1=A#, D+0=D, G+0=G, B+3=D, e+3=G ✓
//   iii A min  rootPc=9:  [x,0,2,2,1,0]   → A+0=A, D+2=E, G+2=A, B+1=C, e+0=E ✓
//   IV  A# maj rootPc=10: [x,1,3,3,3,1]   barre@1(str1-5) → A+1=A#, D+3=F, G+3=A#, B+3=D, e+1=F ✓
//   V   C maj  rootPc=0:  [x,3,2,0,1,0]   → A+3=C, D+2=E, G+0=G, B+1=C, e+0=E ✓
//   vi  D min  rootPc=2:  [x,x,0,2,3,1]   → D+0=D, G+2=A, B+3=D, e+1=F ✓
//   vii°E dim  rootPc=4:  [0,1,2,0,x,x]   → E+0=E, A+1=A#, D+2=E, G+0=G ✓
// ---------------------------------------------------------------------------

const F_MAJOR: readonly OpenVoicing[] = [
  // I — F major (barre at fret 1)
  {
    roman: 'I',
    name: 'F major',
    quality: 'maj',
    rootPc: 5,
    baseFret: 1,
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 4, 3, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  // ii — G minor
  // E+3=G(7,root), A+1=A#(10), D+0=D(2), G+0=G(7), B+3=D(2,14%12=2), e+3=G(7) ✓
  {
    roman: 'ii',
    name: 'G minor',
    quality: 'min',
    rootPc: 7,
    baseFret: 1,
    frets:   [3, 1, 0, 0, 3, 3],
    fingers: [2, 1, null, null, 3, 4],
  },
  // iii — A minor
  {
    roman: 'iii',
    name: 'A minor',
    quality: 'min',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
  },
  // IV — A# major (barre at fret 1, strings 1-5)
  // A+1=A#(10,root), D+3=F(5), G+3=A#(10), B+3=D(2), e+1=F(5) ✓
  {
    roman: 'IV',
    name: 'A# major',
    quality: 'maj',
    rootPc: 10,
    baseFret: 1,
    frets:   [null, 1, 3, 3, 3, 1],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  // V — C major
  {
    roman: 'V',
    name: 'C major',
    quality: 'maj',
    rootPc: 0,
    baseFret: 1,
    frets:   [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
  },
  // vi — D minor
  // D+0=D(2,root), G+2=A(9), B+3=D(2), e+1=F(5) — {D=2,F=5,A=9} ✓
  {
    roman: 'vi',
    name: 'D minor',
    quality: 'min',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, null, 0, 2, 3, 1],
    fingers: [null, null, null, 2, 3, 1],
  },
  // vii° — E diminished
  // E+0=E(4,root), A+1=A#(10), D+2=E(4), G+0=G(7) — {E=4,G=7,A#=10} ✓
  {
    roman: 'vii°',
    name: 'E diminished',
    quality: 'dim',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 1, 2, 0, null, null],
    fingers: [null, 1, 2, null, null, null],
  },
];

// ---------------------------------------------------------------------------
// E major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// E major scale PCs: E=4, F#=6, G#=8, A=9, B=11, C#=1, D#=3
//
//   I   E maj  rootPc=4:  [0,2,2,1,0,0]   → E+0=E, A+2=B, D+2=E, G+1=G#, B+0=B, e+0=E ✓
//   ii  F# min rootPc=6:  [2,4,4,2,2,2]   → E+2=F#, A+4=C#, D+4=F#, G+2=A, B+2=C#, e+2=F# ✓
//   iii G# min rootPc=8:  [4,6,6,4,4,4]   → E+4=G#, A+6=D#, D+6=G#, G+4=B, B+4=D#, e+4=G# ✓
//   IV  A maj  rootPc=9:  [x,0,2,2,2,0]   → A+0=A, D+2=E, G+2=A, B+2=C#, e+0=E ✓
//   V   B maj  rootPc=11: [x,2,4,4,4,2]   → A+2=B, D+4=F#, G+4=B, B+4=D#, e+2=F# ✓
//   vi  C# min rootPc=1:  [x,4,6,6,5,4]   → A+4=C#, D+6=G#, G+6=C#, B+5=E, e+4=G# ✓
//   vii°D# dim rootPc=3:  [x,0,1,2,x,2]   → A+0=A, D+1=D#, G+2=A, e+2=F# ✓
// ---------------------------------------------------------------------------

const E_MAJOR: readonly OpenVoicing[] = [
  // I — E major
  {
    roman: 'I',
    name: 'E major',
    quality: 'maj',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null],
  },
  // ii — F# minor (barre at fret 2)
  {
    roman: 'ii',
    name: 'F# minor',
    quality: 'min',
    rootPc: 6,
    baseFret: 2,
    frets:   [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  // iii — G# minor (barre at fret 4)
  // E+4=G#(8), A+6=D#(3,15%12=3), D+6=G#(8,8), G+4=B(11), B+4=D#(3,15%12=3), e+4=G#(8) ✓
  {
    roman: 'iii',
    name: 'G# minor',
    quality: 'min',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // IV — A major
  {
    roman: 'IV',
    name: 'A major',
    quality: 'maj',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
  },
  // V — B major (barre at fret 2)
  // A+2=B(11), D+4=F#(6), G+4=B(11), B+4=D#(3,15%12=3), e+2=F#(6) ✓
  {
    roman: 'V',
    name: 'B major',
    quality: 'maj',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 4, 2],
    fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // vi — C# minor (barre at fret 4)
  {
    roman: 'vi',
    name: 'C# minor',
    quality: 'min',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 5, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // vii° — D# diminished
  // A+0=A(9), D+1=D#(3,root), G+2=A(9), e+2=F#(6) — {D#=3,F#=6,A=9} ✓
  {
    roman: 'vii°',
    name: 'D# diminished',
    quality: 'dim',
    rootPc: 3,
    baseFret: 1,
    frets:   [null, 0, 1, 2, null, 2],
    fingers: [null, null, 1, 2, null, 3],
  },
];

// ---------------------------------------------------------------------------
// A major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// A major scale PCs: A=9, B=11, C#=1, D=2, E=4, F#=6, G#=8
//
//   I   A maj  rootPc=9:  [x,0,2,2,2,0]   → A+0=A, D+2=E, G+2=A, B+2=C#, e+0=E ✓
//   ii  B min  rootPc=11: [x,2,4,4,3,2]   → A+2=B, D+4=F#, G+4=B, B+3=D, e+2=F# ✓
//   iii C# min rootPc=1:  [x,4,6,6,5,4]   → A+4=C#, D+6=G#, G+6=C#, B+5=E, e+4=G# ✓
//   IV  D maj  rootPc=2:  [x,x,0,2,3,2]   → D+0=D, G+2=A, B+3=D, e+2=F# ✓
//   V   E maj  rootPc=4:  [0,2,2,1,0,0]   → E+0=E, A+2=B, D+2=E, G+1=G#, B+0=B, e+0=E ✓
//   vi  F# min rootPc=6:  [2,4,4,2,2,2]   → E+2=F#, A+4=C#, D+4=F#, G+2=A, B+2=C#, e+2=F# ✓
//   vii°G# dim rootPc=8:  [x,2,0,1,0,x]   → A+2=B, D+0=D, G+1=G#, B+0=B ✓
// ---------------------------------------------------------------------------

const A_MAJOR: readonly OpenVoicing[] = [
  // I — A major
  {
    roman: 'I',
    name: 'A major',
    quality: 'maj',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
  },
  // ii — B minor (barre at fret 2)
  {
    roman: 'ii',
    name: 'B minor',
    quality: 'min',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // iii — C# minor (barre at fret 4)
  // A+4=C#(1), D+6=G#(8), G+6=C#(1,13%12=1), B+5=E(4,16%12=4), e+4=G#(8) ✓
  {
    roman: 'iii',
    name: 'C# minor',
    quality: 'min',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 5, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // IV — D major
  {
    roman: 'IV',
    name: 'D major',
    quality: 'maj',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
  },
  // V — E major
  // E+0=E(4), A+2=B(11), D+2=E(4), G+1=G#(8), B+0=B(11), e+0=E(4) ✓
  {
    roman: 'V',
    name: 'E major',
    quality: 'maj',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null],
  },
  // vi — F# minor (barre at fret 2)
  {
    roman: 'vi',
    name: 'F# minor',
    quality: 'min',
    rootPc: 6,
    baseFret: 2,
    frets:   [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  // vii° — G# diminished
  // A+2=B(11), D+0=D(2), G+1=G#(8,root), B+0=B(11) — {G#=8,B=11,D=2} ✓
  {
    roman: 'vii°',
    name: 'G# diminished',
    quality: 'dim',
    rootPc: 8,
    baseFret: 1,
    frets:   [null, 2, 0, 1, 0, null],
    fingers: [null, 2, null, 1, null, null],
  },
];

// ---------------------------------------------------------------------------
// D major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// D major scale PCs: D=2, E=4, F#=6, G=7, A=9, B=11, C#=1
//
//   I   D maj  rootPc=2:  [x,x,0,2,3,2]   → D+0=D, G+2=A, B+3=D, e+2=F# ✓
//   ii  E min  rootPc=4:  [0,2,2,0,0,0]   → E+0=E, A+2=B, D+2=E, G+0=G, B+0=B, e+0=E ✓
//   iii F# min rootPc=6:  [2,4,4,2,2,2]   → E+2=F#, A+4=C#, D+4=F#, G+2=A, B+2=C#, e+2=F# ✓
//   IV  G maj  rootPc=7:  [3,2,0,0,0,3]   → E+3=G, A+2=B, D+0=D, G+0=G, B+0=B, e+3=G ✓
//   V   A maj  rootPc=9:  [x,0,2,2,2,0]   → A+0=A, D+2=E, G+2=A, B+2=C#, e+0=E ✓
//   vi  B min  rootPc=11: [x,2,4,4,3,2]   → A+2=B, D+4=F#, G+4=B, B+3=D, e+2=F# ✓
//   vii°C# dim rootPc=1:  [x,4,2,0,x,x]   → A+4=C#, D+2=E, G+0=G ✓
// ---------------------------------------------------------------------------

const D_MAJOR: readonly OpenVoicing[] = [
  // I — D major
  {
    roman: 'I',
    name: 'D major',
    quality: 'maj',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
  },
  // ii — E minor
  {
    roman: 'ii',
    name: 'E minor',
    quality: 'min',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
  },
  // iii — F# minor (barre at fret 2)
  // E+2=F#(6), A+4=C#(1), D+4=F#(6), G+2=A(9), B+2=C#(1), e+2=F#(6) ✓
  {
    roman: 'iii',
    name: 'F# minor',
    quality: 'min',
    rootPc: 6,
    baseFret: 2,
    frets:   [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  // IV — G major
  {
    roman: 'IV',
    name: 'G major',
    quality: 'maj',
    rootPc: 7,
    baseFret: 1,
    frets:   [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3],
  },
  // V — A major
  // A+0=A(9), D+2=E(4), G+2=A(9), B+2=C#(1), e+0=E(4) — {A=9,C#=1,E=4} ✓
  {
    roman: 'V',
    name: 'A major',
    quality: 'maj',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
  },
  // vi — B minor (barre at fret 2)
  {
    roman: 'vi',
    name: 'B minor',
    quality: 'min',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // vii° — C# diminished
  // A+4=C#(1,root), D+2=E(4), G+0=G(7) — {C#=1,E=4,G=7} ✓
  {
    roman: 'vii°',
    name: 'C# diminished',
    quality: 'dim',
    rootPc: 1,
    baseFret: 1,
    frets:   [null, 4, 2, 0, null, null],
    fingers: [null, 3, 2, null, null, null],
  },
];

// ---------------------------------------------------------------------------
// A# major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// A# major scale PCs: A#=10, C=0, D=2, D#=3, F=5, G=7, A=9
//
//   I   A# maj rootPc=10: [x,1,3,3,3,1]  barre@1(str1-5) → A+1=A#, D+3=F, G+3=A#, B+3=D, e+1=F ✓
//   ii  C min  rootPc=0:  [x,3,5,5,4,3]  barre@3(str1-5) → A+3=C, D+5=G, G+5=C, B+4=D#, e+3=G ✓
//   iii D min  rootPc=2:  [x,5,7,7,6,5]  barre@5(str1-5) → A+5=D, D+7=A, G+7=D, B+6=F, e+5=A ✓
//   IV  D# maj rootPc=3:  [x,6,8,8,8,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+8=G, e+6=A# ✓
//   V   F maj  rootPc=5:  [1,3,3,2,1,1]  barre@1(str0-5) → E+1=F, A+3=C, D+3=F, G+2=A, B+1=C, e+1=F ✓
//   vi  G min  rootPc=7:  [3,5,5,3,3,3]  barre@3(str0-5) → E+3=G, A+5=D, D+5=G, G+3=A#, B+3=D, e+3=G ✓
//   vii°A dim  rootPc=9:  [x,x,1,2,1,x]  → D+1=D#, G+2=A(root), B+1=C — {A=9,C=0,D#=3} ✓
// ---------------------------------------------------------------------------

const AS_MAJOR: readonly OpenVoicing[] = [
  // I — A# major (A-shape barre at fret 1)
  // A+1=A#(10,root), D+3=F(5), G+3=A#(10), B+3=D(2), e+1=F(5) ✓
  {
    roman: 'I',
    name: 'A# major',
    quality: 'maj',
    rootPc: 10,
    baseFret: 1,
    frets:   [null, 1, 3, 3, 3, 1],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  // ii — C minor (Am-shape barre at fret 3)
  // A+3=C(0,root), D+5=G(7), G+5=C(0), B+4=D#(3), e+3=G(7) ✓
  {
    roman: 'ii',
    name: 'C minor',
    quality: 'min',
    rootPc: 0,
    baseFret: 3,
    frets:   [null, 3, 5, 5, 4, 3],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 1, toString: 5 },
  },
  // iii — D minor (Am-shape barre at fret 5)
  // A+5=D(2,root), D+7=A(9), G+7=D(2), B+6=F(5), e+5=A(9) ✓
  {
    roman: 'iii',
    name: 'D minor',
    quality: 'min',
    rootPc: 2,
    baseFret: 5,
    frets:   [null, 5, 7, 7, 6, 5],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 5, fromString: 1, toString: 5 },
  },
  // IV — D# major (A-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+8=G(7), e+6=A#(10) ✓
  {
    roman: 'IV',
    name: 'D# major',
    quality: 'maj',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 8, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // V — F major (E-shape barre at fret 1)
  // E+1=F(5,root), A+3=C(0), D+3=F(5), G+2=A(9), B+1=C(0), e+1=F(5) ✓
  {
    roman: 'V',
    name: 'F major',
    quality: 'maj',
    rootPc: 5,
    baseFret: 1,
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 4, 3, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  // vi — G minor (Em-shape barre at fret 3)
  // E+3=G(7,root), A+5=D(2), D+5=G(7), G+3=A#(10), B+3=D(2), e+3=G(7) ✓
  {
    roman: 'vi',
    name: 'G minor',
    quality: 'min',
    rootPc: 7,
    baseFret: 3,
    frets:   [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 3, fromString: 0, toString: 5 },
  },
  // vii° — A diminished (partial 3-string shape)
  // D+1=D#(3), G+2=A(9,root), B+1=C(0) — {A=9,C=0,D#=3} ✓
  {
    roman: 'vii°',
    name: 'A diminished',
    quality: 'dim',
    rootPc: 9,
    baseFret: 1,
    frets:   [null, null, 1, 2, 1, null],
    fingers: [null, null, 1, 3, 2, null],
  },
];

// ---------------------------------------------------------------------------
// D# major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// D# major scale PCs: D#=3, F=5, G=7, G#=8, A#=10, C=0, D=2
//
//   I   D# maj rootPc=3:  [x,6,8,8,8,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+8=G, e+6=A# ✓
//   ii  F min  rootPc=5:  [x,8,10,10,9,8] barre@8(str1-5) → A+8=F, D+10=C, G+10=F, B+9=G#, e+8=C ✓
//   iii G min  rootPc=7:  [3,5,5,3,3,3]  barre@3(str0-5) → E+3=G, A+5=D, D+5=G, G+3=A#, B+3=D, e+3=G ✓
//   IV  G# maj rootPc=8:  [4,6,6,5,4,4]  barre@4(str0-5) → E+4=G#, A+6=D#, D+6=G#, G+5=C, B+4=D#, e+4=G# ✓
//   V   A# maj rootPc=10: [x,1,3,3,3,1]  barre@1(str1-5) → A+1=A#, D+3=F, G+3=A#, B+3=D, e+1=F ✓
//   vi  C min  rootPc=0:  [x,3,5,5,4,3]  barre@3(str1-5) → A+3=C, D+5=G, G+5=C, B+4=D#, e+3=G ✓
//   vii°D dim  rootPc=2:  [x,5,3,1,x,x]  → A+5=D(root), D+3=F, G+1=G# — {D=2,F=5,G#=8} ✓
// ---------------------------------------------------------------------------

const DS_MAJOR: readonly OpenVoicing[] = [
  // I — D# major (A-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+8=G(7), e+6=A#(10) ✓
  {
    roman: 'I',
    name: 'D# major',
    quality: 'maj',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 8, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // ii — F minor (Am-shape barre at fret 8)
  // A+8=F(5,root), D+10=C(0), G+10=F(5), B+9=G#(8), e+8=C(0) ✓
  {
    roman: 'ii',
    name: 'F minor',
    quality: 'min',
    rootPc: 5,
    baseFret: 8,
    frets:   [null, 8, 10, 10, 9, 8],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 8, fromString: 1, toString: 5 },
  },
  // iii — G minor (Em-shape barre at fret 3)
  // E+3=G(7,root), A+5=D(2), D+5=G(7), G+3=A#(10), B+3=D(2), e+3=G(7) ✓
  {
    roman: 'iii',
    name: 'G minor',
    quality: 'min',
    rootPc: 7,
    baseFret: 3,
    frets:   [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 3, fromString: 0, toString: 5 },
  },
  // IV — G# major (E-shape barre at fret 4)
  // E+4=G#(8,root), A+6=D#(3), D+6=G#(8), G+5=C(0), B+4=D#(3), e+4=G#(8) ✓
  {
    roman: 'IV',
    name: 'G# major',
    quality: 'maj',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // V — A# major (A-shape barre at fret 1)
  // A+1=A#(10,root), D+3=F(5), G+3=A#(10), B+3=D(2), e+1=F(5) ✓
  {
    roman: 'V',
    name: 'A# major',
    quality: 'maj',
    rootPc: 10,
    baseFret: 1,
    frets:   [null, 1, 3, 3, 3, 1],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  // vi — C minor (Am-shape barre at fret 3)
  // A+3=C(0,root), D+5=G(7), G+5=C(0), B+4=D#(3), e+3=G(7) ✓
  {
    roman: 'vi',
    name: 'C minor',
    quality: 'min',
    rootPc: 0,
    baseFret: 3,
    frets:   [null, 3, 5, 5, 4, 3],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 1, toString: 5 },
  },
  // vii° — D diminished (partial 3-string shape)
  // A+5=D(2,root), D+3=F(5), G+1=G#(8) — {D=2,F=5,G#=8} ✓
  {
    roman: 'vii°',
    name: 'D diminished',
    quality: 'dim',
    rootPc: 2,
    baseFret: 1,
    frets:   [null, 5, 3, 1, null, null],
    fingers: [null, 3, 2, 1, null, null],
  },
];

// ---------------------------------------------------------------------------
// G# major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// G# major scale PCs: G#=8, A#=10, C=0, C#=1, D#=3, F=5, G=7
//
//   I   G# maj rootPc=8:  [4,6,6,5,4,4]  barre@4(str0-5) → E+4=G#, A+6=D#, D+6=G#, G+5=C, B+4=D#, e+4=G# ✓
//   ii  A# min rootPc=10: [6,8,8,6,6,6]  barre@6(str0-5) → E+6=A#, A+8=F, D+8=A#, G+6=C#, B+6=F, e+6=A# ✓
//   iii C min  rootPc=0:  [x,3,5,5,4,3]  barre@3(str1-5) → A+3=C, D+5=G, G+5=C, B+4=D#, e+3=G ✓
//   IV  C# maj rootPc=1:  [x,4,6,6,6,4]  barre@4(str1-5) → A+4=C#, D+6=G#, G+6=C#, B+6=F, e+4=G# ✓
//   V   D# maj rootPc=3:  [x,6,8,8,8,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+8=G, e+6=A# ✓
//   vi  F min  rootPc=5:  [x,8,10,10,9,8] barre@8(str1-5) → A+8=F, D+10=C, G+10=F, B+9=G#, e+8=C ✓
//   vii°G dim  rootPc=7:  [3,1,x,3,2,x]  → E+3=G(root), A+1=A#, G+3=A#, B+2=C# — {G=7,A#=10,C#=1} ✓
// ---------------------------------------------------------------------------

const GS_MAJOR: readonly OpenVoicing[] = [
  // I — G# major (E-shape barre at fret 4)
  // E+4=G#(8,root), A+6=D#(3), D+6=G#(8), G+5=C(0), B+4=D#(3), e+4=G#(8) ✓
  {
    roman: 'I',
    name: 'G# major',
    quality: 'maj',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // ii — A# minor (Em-shape barre at fret 6)
  // E+6=A#(10,root), A+8=F(5), D+8=A#(10), G+6=C#(1), B+6=F(5), e+6=A#(10) ✓
  {
    roman: 'ii',
    name: 'A# minor',
    quality: 'min',
    rootPc: 10,
    baseFret: 6,
    frets:   [6, 8, 8, 6, 6, 6],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 6, fromString: 0, toString: 5 },
  },
  // iii — C minor (Am-shape barre at fret 3)
  // A+3=C(0,root), D+5=G(7), G+5=C(0), B+4=D#(3), e+3=G(7) ✓
  {
    roman: 'iii',
    name: 'C minor',
    quality: 'min',
    rootPc: 0,
    baseFret: 3,
    frets:   [null, 3, 5, 5, 4, 3],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 1, toString: 5 },
  },
  // IV — C# major (A-shape barre at fret 4)
  // A+4=C#(1,root), D+6=G#(8), G+6=C#(1), B+6=F(5), e+4=G#(8) ✓
  {
    roman: 'IV',
    name: 'C# major',
    quality: 'maj',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 6, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // V — D# major (A-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+8=G(7), e+6=A#(10) ✓
  {
    roman: 'V',
    name: 'D# major',
    quality: 'maj',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 8, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // vi — F minor (Am-shape barre at fret 8)
  // A+8=F(5,root), D+10=C(0), G+10=F(5), B+9=G#(8), e+8=C(0) ✓
  {
    roman: 'vi',
    name: 'F minor',
    quality: 'min',
    rootPc: 5,
    baseFret: 8,
    frets:   [null, 8, 10, 10, 9, 8],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 8, fromString: 1, toString: 5 },
  },
  // vii° — G diminished (partial 4-string shape)
  // E+3=G(7,root), A+1=A#(10), G+3=A#(10), B+2=C#(1) — {G=7,A#=10,C#=1} ✓
  {
    roman: 'vii°',
    name: 'G diminished',
    quality: 'dim',
    rootPc: 7,
    baseFret: 1,
    frets:   [3, 1, null, 3, 2, null],
    fingers: [3, 1, null, 4, 2, null],
  },
];

// ---------------------------------------------------------------------------
// B major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// B major scale PCs: B=11, C#=1, D#=3, E=4, F#=6, G#=8, A#=10
//
//   I   B maj  rootPc=11: [x,2,4,4,4,2]  barre@2(str1-5) → A+2=B, D+4=F#, G+4=B, B+4=D#, e+2=F# ✓
//   ii  C# min rootPc=1:  [x,4,6,6,5,4]  barre@4(str1-5) → A+4=C#, D+6=G#, G+6=C#, B+5=E, e+4=G# ✓
//   iii D# min rootPc=3:  [x,6,8,8,7,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+7=F#, e+6=A# ✓
//   IV  E maj  rootPc=4:  [0,2,2,1,0,0]  → E+0=E, A+2=B, D+2=E, G+1=G#, B+0=B, e+0=E ✓
//   V   F# maj rootPc=6:  [2,4,4,3,2,2]  barre@2(str0-5) → E+2=F#, A+4=C#, D+4=F#, G+3=A#, B+2=C#, e+2=F# ✓
//   vi  G# min rootPc=8:  [4,6,6,4,4,4]  barre@4(str0-5) → E+4=G#, A+6=D#, D+6=G#, G+4=B, B+4=D#, e+4=G# ✓
//   vii°A# dim rootPc=10: [x,x,x,3,2,0]  → G+3=A#(root), B+2=C#, e+0=E — {A#=10,C#=1,E=4} ✓
// ---------------------------------------------------------------------------

const B_MAJOR: readonly OpenVoicing[] = [
  // I — B major (A-shape barre at fret 2)
  // A+2=B(11,root), D+4=F#(6), G+4=B(11), B+4=D#(3), e+2=F#(6) ✓
  {
    roman: 'I',
    name: 'B major',
    quality: 'maj',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 4, 2],
    fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // ii — C# minor (Am-shape barre at fret 4)
  // A+4=C#(1,root), D+6=G#(8), G+6=C#(1), B+5=E(4), e+4=G#(8) ✓
  {
    roman: 'ii',
    name: 'C# minor',
    quality: 'min',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 5, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // iii — D# minor (Am-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+7=F#(6), e+6=A#(10) ✓
  {
    roman: 'iii',
    name: 'D# minor',
    quality: 'min',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 7, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // IV — E major (open E-shape)
  // E+0=E(4,root), A+2=B(11), D+2=E(4), G+1=G#(8), B+0=B(11), e+0=E(4) ✓
  {
    roman: 'IV',
    name: 'E major',
    quality: 'maj',
    rootPc: 4,
    baseFret: 1,
    frets:   [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null],
  },
  // V — F# major (E-shape barre at fret 2)
  // E+2=F#(6,root), A+4=C#(1), D+4=F#(6), G+3=A#(10), B+2=C#(1), e+2=F#(6) ✓
  {
    roman: 'V',
    name: 'F# major',
    quality: 'maj',
    rootPc: 6,
    baseFret: 2,
    frets:   [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  // vi — G# minor (Em-shape barre at fret 4)
  // E+4=G#(8,root), A+6=D#(3), D+6=G#(8), G+4=B(11), B+4=D#(3), e+4=G#(8) ✓
  {
    roman: 'vi',
    name: 'G# minor',
    quality: 'min',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // vii° — A# diminished (partial 3-string shape)
  // G+3=A#(10,root), B+2=C#(1), e+0=E(4) — {A#=10,C#=1,E=4} ✓
  {
    roman: 'vii°',
    name: 'A# diminished',
    quality: 'dim',
    rootPc: 10,
    baseFret: 1,
    frets:   [null, null, null, 3, 2, 0],
    fingers: [null, null, null, 3, 2, null],
  },
];

// ---------------------------------------------------------------------------
// C# major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// C# major scale PCs: C#=1, D#=3, F=5, F#=6, G#=8, A#=10, C=0
//
//   I   C# maj rootPc=1:  [x,4,6,6,6,4]  barre@4(str1-5) → A+4=C#, D+6=G#, G+6=C#, B+6=F, e+4=G# ✓
//   ii  D# min rootPc=3:  [x,6,8,8,7,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+7=F#, e+6=A# ✓
//   iii F min  rootPc=5:  [x,8,10,10,9,8] barre@8(str1-5) → A+8=F, D+10=C, G+10=F, B+9=G#, e+8=C ✓
//   IV  F# maj rootPc=6:  [x,9,11,11,11,9] barre@9(str1-5) → A+9=F#, D+11=C#, G+11=F#, B+11=A#, e+9=C# ✓
//   V   G# maj rootPc=8:  [4,6,6,5,4,4]  barre@4(str0-5) → E+4=G#, A+6=D#, D+6=G#, G+5=C, B+4=D#, e+4=G# ✓
//   vi  A# min rootPc=10: [6,8,8,6,6,6]  barre@6(str0-5) → E+6=A#, A+8=F, D+8=A#, G+6=C#, B+6=F, e+6=A# ✓
//   vii°C dim  rootPc=0:  [x,3,10,11,x,x] → A+3=C(root), D+10=C, G+11=F# — {C=0,D#=3,F#=6} ✓
// ---------------------------------------------------------------------------

const CS_MAJOR: readonly OpenVoicing[] = [
  // I — C# major (A-shape barre at fret 4)
  // A+4=C#(1,root), D+6=G#(8), G+6=C#(1), B+6=F(5), e+4=G#(8) ✓
  {
    roman: 'I',
    name: 'C# major',
    quality: 'maj',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 6, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // ii — D# minor (Am-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+7=F#(6), e+6=A#(10) ✓
  {
    roman: 'ii',
    name: 'D# minor',
    quality: 'min',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 7, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // iii — F minor (Am-shape barre at fret 8)
  // A+8=F(5,root), D+10=C(0), G+10=F(5), B+9=G#(8), e+8=C(0) ✓
  {
    roman: 'iii',
    name: 'F minor',
    quality: 'min',
    rootPc: 5,
    baseFret: 8,
    frets:   [null, 8, 10, 10, 9, 8],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 8, fromString: 1, toString: 5 },
  },
  // IV — F# major (A-shape barre at fret 9)
  // A+9=F#(6,root), D+11=C#(1), G+11=F#(6), B+11=A#(10), e+9=C#(1) ✓
  {
    roman: 'IV',
    name: 'F# major',
    quality: 'maj',
    rootPc: 6,
    baseFret: 9,
    frets:   [null, 9, 11, 11, 11, 9],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 9, fromString: 1, toString: 5 },
  },
  // V — G# major (E-shape barre at fret 4)
  // E+4=G#(8,root), A+6=D#(3), D+6=G#(8), G+5=C(0), B+4=D#(3), e+4=G#(8) ✓
  {
    roman: 'V',
    name: 'G# major',
    quality: 'maj',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // vi — A# minor (Em-shape barre at fret 6)
  // E+6=A#(10,root), A+8=F(5), D+8=A#(10), G+6=C#(1), B+6=F(5), e+6=A#(10) ✓
  {
    roman: 'vi',
    name: 'A# minor',
    quality: 'min',
    rootPc: 10,
    baseFret: 6,
    frets:   [6, 8, 8, 6, 6, 6],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 6, fromString: 0, toString: 5 },
  },
  // vii° — C diminished (partial 3-string shape)
  // A+9=F#(6), D+10=C(0,root), G+8=D#(3) — {C=0,D#=3,F#=6} ✓
  // No open strings. Compact shape at fret 8–10.
  {
    roman: 'vii°',
    name: 'C diminished',
    quality: 'dim',
    rootPc: 0,
    baseFret: 8,
    frets:   [null, 9, 10, 8, null, null],
    fingers: [null, 2, 3, 1, null, null],
  },
];

// ---------------------------------------------------------------------------
// F# major diatonic voicings (degree I–vii°)
//
// STANDARD_TUNING = [4,9,2,7,11,4]
// F# major scale PCs: F#=6, G#=8, A#=10, B=11, C#=1, D#=3, F=5
//
//   I   F# maj rootPc=6:  [2,4,4,3,2,2]  barre@2(str0-5) → E+2=F#, A+4=C#, D+4=F#, G+3=A#, B+2=C#, e+2=F# ✓
//   ii  G# min rootPc=8:  [4,6,6,4,4,4]  barre@4(str0-5) → E+4=G#, A+6=D#, D+6=G#, G+4=B, B+4=D#, e+4=G# ✓
//   iii A# min rootPc=10: [x,1,3,3,2,1]  barre@1(str1-5) → A+1=A#, D+3=F, G+3=A#, B+2=C#, e+1=F ✓
//   IV  B maj  rootPc=11: [x,2,4,4,4,2]  barre@2(str1-5) → A+2=B, D+4=F#, G+4=B, B+4=D#, e+2=F# ✓
//   V   C# maj rootPc=1:  [x,4,6,6,6,4]  barre@4(str1-5) → A+4=C#, D+6=G#, G+6=C#, B+6=F, e+4=G# ✓
//   vi  D# min rootPc=3:  [x,6,8,8,7,6]  barre@6(str1-5) → A+6=D#, D+8=A#, G+8=D#, B+7=F#, e+6=A# ✓
//   vii°F dim  rootPc=5:  [1,x,3,1,x,7]  → E+1=F(root), D+3=F, G+1=G#, e+7=B — {F=5,G#=8,B=11} ✓
// ---------------------------------------------------------------------------

const FS_MAJOR: readonly OpenVoicing[] = [
  // I — F# major (E-shape barre at fret 2)
  // E+2=F#(6,root), A+4=C#(1), D+4=F#(6), G+3=A#(10), B+2=C#(1), e+2=F#(6) ✓
  {
    roman: 'I',
    name: 'F# major',
    quality: 'maj',
    rootPc: 6,
    baseFret: 2,
    frets:   [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
  // ii — G# minor (Em-shape barre at fret 4)
  // E+4=G#(8,root), A+6=D#(3), D+6=G#(8), G+4=B(11), B+4=D#(3), e+4=G#(8) ✓
  {
    roman: 'ii',
    name: 'G# minor',
    quality: 'min',
    rootPc: 8,
    baseFret: 4,
    frets:   [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 4, fromString: 0, toString: 5 },
  },
  // iii — A# minor (Am-shape barre at fret 1)
  // A+1=A#(10,root), D+3=F(5), G+3=A#(10), B+2=C#(1), e+1=F(5) ✓
  {
    roman: 'iii',
    name: 'A# minor',
    quality: 'min',
    rootPc: 10,
    baseFret: 1,
    frets:   [null, 1, 3, 3, 2, 1],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  // IV — B major (A-shape barre at fret 2)
  // A+2=B(11,root), D+4=F#(6), G+4=B(11), B+4=D#(3), e+2=F#(6) ✓
  {
    roman: 'IV',
    name: 'B major',
    quality: 'maj',
    rootPc: 11,
    baseFret: 2,
    frets:   [null, 2, 4, 4, 4, 2],
    fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  // V — C# major (A-shape barre at fret 4)
  // A+4=C#(1,root), D+6=G#(8), G+6=C#(1), B+6=F(5), e+4=G#(8) ✓
  {
    roman: 'V',
    name: 'C# major',
    quality: 'maj',
    rootPc: 1,
    baseFret: 4,
    frets:   [null, 4, 6, 6, 6, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 1, toString: 5 },
  },
  // vi — D# minor (Am-shape barre at fret 6)
  // A+6=D#(3,root), D+8=A#(10), G+8=D#(3), B+7=F#(6), e+6=A#(10) ✓
  {
    roman: 'vi',
    name: 'D# minor',
    quality: 'min',
    rootPc: 3,
    baseFret: 6,
    frets:   [null, 6, 8, 8, 7, 6],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 1, toString: 5 },
  },
  // vii° — F diminished (partial 3-string shape)
  // A+8=F(5,root), D+6=G#(8), e+7=B(11) — {F=5,G#=8,B=11} ✓
  // No open strings. Compact shape at fret 6–8.
  {
    roman: 'vii°',
    name: 'F diminished',
    quality: 'dim',
    rootPc: 5,
    baseFret: 6,
    frets:   [null, 8, 6, null, null, 7],
    fingers: [null, 3, 1, null, null, 2],
  },
];

// ---------------------------------------------------------------------------
// Voicing map — add keys per PR batch
// ---------------------------------------------------------------------------

export const OPEN_VOICINGS: OpenVoicingMap = {
  C: C_MAJOR,
  G: G_MAJOR,
  D: D_MAJOR,
  A: A_MAJOR,
  E: E_MAJOR,
  F: F_MAJOR,
  'A#': AS_MAJOR,
  'D#': DS_MAJOR,
  'G#': GS_MAJOR,
  B: B_MAJOR,
  'C#': CS_MAJOR,
  'F#': FS_MAJOR,
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
