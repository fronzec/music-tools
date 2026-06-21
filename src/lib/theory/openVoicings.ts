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
// Voicing map — add keys per PR batch
// ---------------------------------------------------------------------------

export const OPEN_VOICINGS: OpenVoicingMap = {
  C: C_MAJOR,
  G: G_MAJOR,
  D: D_MAJOR,
  A: A_MAJOR,
  E: E_MAJOR,
  F: F_MAJOR,
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
