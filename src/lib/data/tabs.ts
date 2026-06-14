/**
 * Curated tab library for the Tab Player.
 *
 * 3–5 short beginner-friendly tabs: riffs, exercises, and simple chord passages.
 * All frets within 0–14, all string indices within 0–5.
 * String 0 = low E, string 5 = high E (tablature convention).
 *
 * Order is deterministic — the export is a frozen array and must not be sorted
 * or filtered at runtime. Consumers iterate by index for stable playback ordering.
 */
import type { Tab } from '$lib/theory/tab';

/**
 * "E Minor Pentatonic — Box 1"
 * Classic open-position pattern (E G A B D) ascending across the strings.
 * Single notes only.
 */
const ePentatonicBox1: Tab = {
  title: 'E Minor Pentatonic — Box 1',
  steps: [
    [{ string: 0, fret: 0 }],
    [{ string: 0, fret: 3 }],
    [{ string: 1, fret: 0 }],
    [{ string: 1, fret: 2 }],
    [{ string: 2, fret: 0 }],
    [{ string: 2, fret: 2 }],
    [{ string: 3, fret: 0 }],
    [{ string: 3, fret: 2 }],
    [{ string: 4, fret: 0 }],
    [{ string: 4, fret: 3 }],
    [{ string: 5, fret: 0 }],
    [{ string: 5, fret: 3 }],
  ],
};

/**
 * "Smoke on the Water — Intro Riff"
 * Iconic Deep Purple riff — 3 notes on the D string.
 * Only single-note steps; uses frets 0–5.
 */
const smokeOnTheWater: Tab = {
  title: 'Smoke on the Water — Intro',
  steps: [
    [{ string: 2, fret: 0 }],
    [{ string: 2, fret: 3 }],
    [{ string: 2, fret: 5 }],
    [{ string: 2, fret: 0 }],
    [{ string: 2, fret: 3 }],
    [{ string: 2, fret: 6 }],
    [{ string: 2, fret: 5 }],
  ],
};

/**
 * "Power Chord Groove"
 * A simple rock riff using E5 and A5 power chords (chord steps).
 * Demonstrates multi-note steps (two-note power chords).
 */
const powerChordGroove: Tab = {
  title: 'Power Chord Groove',
  steps: [
    // E5 power chord
    [{ string: 0, fret: 0 }, { string: 1, fret: 2 }],
    // E5 power chord
    [{ string: 0, fret: 0 }, { string: 1, fret: 2 }],
    // A5 power chord
    [{ string: 1, fret: 0 }, { string: 2, fret: 2 }],
    // A5 power chord
    [{ string: 1, fret: 0 }, { string: 2, fret: 2 }],
    // G5 power chord
    [{ string: 0, fret: 3 }, { string: 1, fret: 5 }],
    // G5 power chord
    [{ string: 0, fret: 3 }, { string: 1, fret: 5 }],
    // E5 power chord
    [{ string: 0, fret: 0 }, { string: 1, fret: 2 }],
  ],
};

/**
 * "Ode to Joy"
 * Beethoven's melody (E E F G G F E D C C D E E D D) on the B and high-E
 * strings. E/F/G on the high-E string (5), C/D on the B string (4).
 */
const odeToJoy: Tab = {
  title: 'Ode to Joy',
  steps: [
    [{ string: 5, fret: 0 }], // E
    [{ string: 5, fret: 0 }], // E
    [{ string: 5, fret: 1 }], // F
    [{ string: 5, fret: 3 }], // G
    [{ string: 5, fret: 3 }], // G
    [{ string: 5, fret: 1 }], // F
    [{ string: 5, fret: 0 }], // E
    [{ string: 4, fret: 3 }], // D
    [{ string: 4, fret: 1 }], // C
    [{ string: 4, fret: 1 }], // C
    [{ string: 4, fret: 3 }], // D
    [{ string: 5, fret: 0 }], // E
    [{ string: 5, fret: 0 }], // E
    [{ string: 4, fret: 3 }], // D
    [{ string: 4, fret: 3 }], // D
  ],
};

/**
 * "C Major Scale — Low Strings"
 * Basic C major scale across the low strings, frets 0–5.
 * Great for warmup exercises.
 */
const cMajorScale: Tab = {
  title: 'C Major Scale — Low Strings',
  steps: [
    [{ string: 1, fret: 3 }], // C
    [{ string: 1, fret: 5 }], // D
    [{ string: 2, fret: 2 }], // E
    [{ string: 2, fret: 3 }], // F
    [{ string: 2, fret: 5 }], // G
    [{ string: 3, fret: 2 }], // A
    [{ string: 3, fret: 4 }], // B
    [{ string: 3, fret: 5 }], // C
  ],
};

/**
 * The curated tab library.
 * 5 entries — mix of riffs, a scale exercise, and chord steps.
 * Order is stable and deterministic.
 */
export const TABS: readonly Tab[] = Object.freeze([
  ePentatonicBox1,
  smokeOnTheWater,
  powerChordGroove,
  odeToJoy,
  cMajorScale,
]);
