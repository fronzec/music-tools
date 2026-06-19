/**
 * Pure diatonic theory module for the Diatonic Harmonizer tool.
 *
 * Exports MAJOR_SCALE_INTERVALS, the DiatonicTriad interface, and
 * diatonicTriads() — which derives all 7 diatonic triads for any major key
 * from scale geometry (quality is NEVER hardcoded per degree; it emerges from
 * the measured semitone gaps between stacked thirds).
 *
 * No DOM, no audio, no side effects. Pure and total for all NoteName values.
 */

import { CHROMATIC } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';
import { chordTones, chordName, TRIAD_OFFSETS } from '$lib/theory/chords';
import type { TriadQuality } from '$lib/theory/chords';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Semitone offsets of the major scale (Ionian) from its root. */
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Scale degree 1-based (I through vii°). */
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** The full data model for a single diatonic triad. */
export interface DiatonicTriad {
  /** Scale degree, 1..7 (I..vii°). */
  readonly degree: Degree;
  /** Roman-numeral label derived from quality + degree (e.g. 'I', 'ii', 'vii°'). */
  readonly roman: string;
  /** Triad quality derived from semitone gaps — never hardcoded. */
  readonly quality: TriadQuality;
  /** Root pitch class of this triad, 0..11. */
  readonly rootPc: number;
  /** Root note name (uses the project-wide CHROMATIC spelling). */
  readonly rootName: NoteName;
  /** The three triad note names: root → third → fifth. */
  readonly notes: readonly NoteName[];
  /** Human-readable name, e.g. 'D minor'. Reuses chordName() for single-sourced naming. */
  readonly name: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Uppercase Roman numerals indexed by degree (1-based). */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/**
 * Derives the Roman-numeral label from the quality and degree index (0-based).
 * - 'maj' → uppercase as-is
 * - 'min' → lowercase
 * - 'dim' → lowercase + '°' (U+00B0 DEGREE SIGN)
 */
function deriveRoman(degreeIndex: number, quality: TriadQuality): string {
  const base = ROMAN_NUMERALS[degreeIndex];
  switch (quality) {
    case 'maj':
      return base; // already uppercase
    case 'min':
      return base.toLowerCase();
    case 'dim':
      return base.toLowerCase() + '°';
    default:
      // 'aug' never appears in a major scale; defensive fallback
      return base;
  }
}

/**
 * Classifies a triad quality from the two semitone gaps.
 * Throws on any combination that cannot occur in a real major scale.
 */
function classifyQuality(g1: number, g2: number): TriadQuality {
  if (g1 === 4 && g2 === 3) return 'maj';
  if (g1 === 3 && g2 === 4) return 'min';
  if (g1 === 3 && g2 === 3) return 'dim';
  throw new Error(`Unexpected interval gaps: ${g1}+${g2} — not a valid major-scale triad`);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tone-distance label helper
// ---------------------------------------------------------------------------

/**
 * Converts a semitone count into a whole-tone label string.
 * Used to display the interval gap between stacked chord tones.
 *
 * Examples: 0→"0", 1→"½", 2→"1", 3→"1½", 4→"2", 5→"2½", 6→"3"
 *
 * General rule: wholePart = Math.floor(n/2); halfPart = n%2 ? "½" : ""; join them.
 * If result is empty string, return "0".
 */
export function tonesLabel(semitones: number): string {
  const whole = Math.floor(semitones / 2);
  const half = semitones % 2 ? '½' : '';
  const result = whole > 0 ? `${whole}${half}` : half;
  return result || '0';
}

/**
 * Returns the 7 note names of the major scale starting at `root`, in degree
 * order (root → 2nd → 3rd → 4th → 5th → 6th → 7th). Uses the project-wide
 * CHROMATIC sharp spelling — e.g. F major yields F,G,A,A#,C,D,E.
 *
 * Pure, total for all 12 roots, no side effects.
 */
export function majorScaleNotes(root: NoteName): NoteName[] {
  const rootPc = CHROMATIC.indexOf(root);
  return MAJOR_SCALE_INTERVALS.map((interval) => CHROMATIC[(rootPc + interval) % 12]);
}

/**
 * Returns the 7 diatonic triads of the given major key in degree order
 * (I through vii°). Quality is DERIVED from the semitone gaps between stacked
 * scale thirds — the maj,min,min,maj,maj,min,dim pattern EMERGES; it is never
 * asserted or hardcoded.
 *
 * @param root - Any of the 12 chromatic note names.
 * @returns An array of exactly 7 DiatonicTriad objects, ordered degree 1..7.
 */
export function diatonicTriads(root: NoteName): DiatonicTriad[] {
  const rootPcBase = CHROMATIC.indexOf(root);
  const result: DiatonicTriad[] = [];

  for (let i = 0; i < 7; i++) {
    // Stack scale-degree thirds at indices i, i+2, i+4.
    // Each raw index may exceed 6, so we use i%7 for the interval lookup and
    // Math.floor(i/7) to determine which octave we are in — exactly the
    // "octave carry" approach so s0 < s1 < s2 as absolute semitones.
    const j0 = i;
    const j1 = i + 2;
    const j2 = i + 4;

    const s0 = rootPcBase + MAJOR_SCALE_INTERVALS[j0 % 7] + 12 * Math.floor(j0 / 7);
    const s1 = rootPcBase + MAJOR_SCALE_INTERVALS[j1 % 7] + 12 * Math.floor(j1 / 7);
    const s2 = rootPcBase + MAJOR_SCALE_INTERVALS[j2 % 7] + 12 * Math.floor(j2 / 7);

    const g1 = s1 - s0;
    const g2 = s2 - s1;

    const quality = classifyQuality(g1, g2);

    const triadRootPc = s0 % 12;
    const rootName = CHROMATIC[((triadRootPc % 12) + 12) % 12];
    const notes = chordTones(triadRootPc, TRIAD_OFFSETS[quality]);
    const degree = (i + 1) as Degree;
    const roman = deriveRoman(i, quality);

    result.push({
      degree,
      roman,
      quality,
      rootPc: triadRootPc,
      rootName,
      notes,
      name: chordName(rootName, quality),
    });
  }

  return result;
}
