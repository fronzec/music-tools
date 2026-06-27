import { CHROMATIC, STRING_OPEN_MIDI } from '$lib/types/chord';
import type { NoteName, ChordQuality } from '$lib/types/chord';
import type { ArpeggioNote } from '$lib/types/progression';

/**
 * Returns the absolute fret of the root note on the A string (stringIndex 1).
 * CHROMATIC is C-indexed (C=0), and the A string open pitch class is 9.
 * Result is always in [0, 11].
 */
function rootFretOnAString(root: NoteName): number {
  return ((CHROMATIC.indexOf(root) - 9) % 12 + 12) % 12;
}

/** One note position within the movable 5th-string-root template. */
interface TemplateEntry {
  string: number;
  fretOffset: number;
}

/**
 * Movable fret-offset templates relative to the A-string root fret.
 * Strings 1..5 in ascending sweep order (low→high).
 *
 * | Quality | A(1) | D(2) | G(3) | B(4) | hiE(5) | Tones        |
 * |---------|------|------|------|------|--------|--------------|
 * | major   |  +0  |  +2  |  +2  |  +2  |   +5   | R · 5 · R · 3 · R  |
 * | minor   |  +0  |  +2  |  +2  |  +1  |   +5   | R · 5 · R · b3 · R |
 * | dim     |  +0  |  +1  |  +2  |  +1  |   +5   | R · b5 · R · b3 · R |
 */
const ARPEGGIO_TEMPLATES: Record<ChordQuality, TemplateEntry[]> = {
  major: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 5 },
  ],
  minor: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 5 },
  ],
  dim: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 5 },
  ],
};

/**
 * Builds an ordered list of 5 arpeggio note events for the given root and quality.
 * The shape is a movable 5th-string-root barre pattern, ascending low→high string.
 *
 * Pure function — no side effects, no DOM, no audio.
 *
 * @param root   - Root note name (e.g. 'C', 'A#')
 * @param quality - 'major' | 'minor' | 'dim'
 * @returns 5 ArpeggioNote events in ascending string order (strings 1..5)
 */
export function buildArpeggio(root: NoteName, quality: ChordQuality): ArpeggioNote[] {
  const rootFret = rootFretOnAString(root);
  return ARPEGGIO_TEMPLATES[quality].map((t, i) => {
    const fret = rootFret + t.fretOffset;
    return {
      string: t.string,
      fret,
      midi: STRING_OPEN_MIDI[t.string] + fret,
      stepIndex: i,
    };
  });
}
