/**
 * Generator for caged-shapes.json — computes all 120 pre-calculated CAGED chord shapes.
 *
 * Run: npx tsx scripts/generate-caged-shapes.ts
 * Output: src/lib/data/caged-shapes.json
 *
 * This script is idempotent. It exists so shapes can be regenerated if templates change.
 * At runtime, the app imports the static JSON — zero computation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Constants ────────────────────────────────────────────────────────────────

/** Open string MIDI numbers: index 0 = string 5 (low E), index 5 = string 0 (high E). */
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// ── Types ────────────────────────────────────────────────────────────────────

interface ShapeTemplate {
  /** CAGED shape name */
  name: string;
  /** Semitone intervals from root. Index 0 = string 5 (low E). null = muted. */
  intervals: (number | null)[];
  /** Array index (0=low E) of the string carrying the root. */
  rootString: number;
}

interface ChordShape {
  root: string;
  quality: string;
  shape: string;
  frets: (number | null)[];
  intervals: (string | null)[];
  baseFret: number;
  rootString: number;
}

// ── Templates ────────────────────────────────────────────────────────────────

/**
 * CAGED shape templates.
 *
 * Each template gives semitone intervals from the root pitch.
 * Index 0 = string 5 (low E), index 5 = string 0 (high E).
 * null = muted/not played.
 *
 * rootString = index within the frets array (0=low E, 5=high E).
 */

const MAJOR_TEMPLATES: ShapeTemplate[] = [
  {
    name: 'E',
    intervals: [0, 7, 12, 16, 19, 24],
    rootString: 0, // low E string
  },
  {
    name: 'A',
    intervals: [null, 0, 7, 12, 16, 19],
    rootString: 1, // A string
  },
  {
    name: 'G',
    intervals: [-12, -8, -5, 0, 4, 12],
    rootString: 3, // G string
  },
  {
    name: 'D',
    intervals: [null, null, 0, 7, 12, 16],
    rootString: 2, // D string
  },
  {
    name: 'C',
    intervals: [null, 0, 4, 7, 12, 16],
    rootString: 1, // A string
  },
];

const MINOR_TEMPLATES: ShapeTemplate[] = [
  {
    name: 'E',
    intervals: [0, 7, 12, 15, 19, 24],
    rootString: 0,
  },
  {
    name: 'A',
    intervals: [null, 0, 7, 12, 15, 19],
    rootString: 1,
  },
  {
    name: 'G',
    intervals: [-12, -9, -5, 0, 3, 12],
    rootString: 3,
  },
  {
    name: 'D',
    intervals: [null, null, 0, 7, 12, 15],
    rootString: 2,
  },
  {
    name: 'C',
    intervals: [null, 0, 3, 7, 12, 15],
    rootString: 1,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a semitone offset to an interval label (R, 3, b3, 5) for the given quality. */
function getIntervalName(semitone: number, quality: string): string {
  const normalized = ((semitone % 12) + 12) % 12;
  if (normalized === 0) return 'R';
  if (normalized === 7) return '5';
  if (quality === 'major' && normalized === 4) return '3';
  if (quality === 'minor' && normalized === 3) return 'b3';
  // Non-chord tone — shouldn't happen with verified templates
  return '';
}

/**
 * Pick the MIDI pitch for the root that yields a playable chord shape.
 *
 * Strategy: try ascending octaves (C3=48, C4=60, C5=72, etc.)
 * and return the first where all non-null frets are ≥ 0 and ≤ 18.
 * Falls back to any octave where all frets ≥ 0.
 */
function chooseRootMidi(chromaticIndex: number, intervals: (number | null)[]): number {
  // Preferred: octaves 3–5 (C3=48 to B5=83)
  for (let octave = 3; octave <= 5; octave++) {
    const candidate = chromaticIndex + 12 * octave;
    if (allFretsFine(candidate, intervals, 18)) return candidate;
  }
  // Fallback: octaves 2–6, just require ≥ 0
  for (let octave = 2; octave <= 6; octave++) {
    const candidate = chromaticIndex + 12 * octave;
    if (allFretsFine(candidate, intervals, Infinity)) return candidate;
  }
  // Ultimate fallback
  return chromaticIndex + 48;
}

function allFretsFine(rootMidi: number, intervals: (number | null)[], maxFret: number): boolean {
  for (let i = 0; i < 6; i++) {
    const iv = intervals[i];
    if (iv === null) continue;
    const fret = rootMidi + iv - OPEN_MIDI[i];
    if (fret < 0 || fret > maxFret) return false;
  }
  return true;
}

// ── Computation ──────────────────────────────────────────────────────────────

function computeShape(
  rootChromatic: number,
  rootName: string,
  quality: string,
  template: ShapeTemplate,
): ChordShape {
  const rootMidi = chooseRootMidi(rootChromatic, template.intervals);

  // Compute absolute fret positions
  const absoluteFrets: (number | null)[] = template.intervals.map((iv, i) =>
    iv === null ? null : rootMidi + iv - OPEN_MIDI[i],
  );

  // Determine baseFret and rebase
  const nonNullFrets = absoluteFrets.filter((f): f is number => f !== null);
  const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 0;

  const baseFret = minFret === 0 ? 1 : minFret;
  const frets = absoluteFrets.map((f) =>
    f === null ? null : minFret === 0 ? f : f - minFret,
  );

  // Interval names
  const intervals = template.intervals.map((iv) =>
    iv === null ? null : getIntervalName(iv, quality),
  );

  // rootFret for validation: the relative fret on the root string
  const _computedRootFret = frets[template.rootString];

  return {
    root: rootName,
    quality,
    shape: template.name,
    frets,
    intervals,
    baseFret,
    rootString: template.rootString,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function generate(): Record<string, Record<string, ChordShape[]>> {
  const data: Record<string, Record<string, ChordShape[]>> = {};

  for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
    const rootName = CHROMATIC[rootIdx];
    const majorShapes = MAJOR_TEMPLATES.map((t) => computeShape(rootIdx, rootName, 'major', t));
    const minorShapes = MINOR_TEMPLATES.map((t) => computeShape(rootIdx, rootName, 'minor', t));

    data[rootName] = {
      major: majorShapes,
      minor: minorShapes,
    };
  }

  return data;
}

// ── Execute ──────────────────────────────────────────────────────────────────

const data = generate();
const outputPath = path.resolve(import.meta.dirname, '..', 'src', 'lib', 'data', 'caged-shapes.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`Generated caged-shapes.json — ${countShapes(data)} total shapes`);

function countShapes(d: typeof data): number {
  return Object.values(d).reduce((n, r) => n + r.major.length + r.minor.length, 0);
}
