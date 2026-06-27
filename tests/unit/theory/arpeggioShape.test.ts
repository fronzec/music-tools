import { describe, it, expect } from 'vitest';
import { buildArpeggio } from '$lib/theory/arpeggioShape';
import { STRING_OPEN_MIDI } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';

const CHROMATIC: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

describe('buildArpeggio — event structure', () => {
  it('returns exactly 5 events', () => {
    const notes = buildArpeggio('C', 'major');
    expect(notes).toHaveLength(5);
  });

  it('events are for strings 1–5 in ascending order', () => {
    const notes = buildArpeggio('C', 'major');
    expect(notes.map((n) => n.string)).toEqual([1, 2, 3, 4, 5]);
  });

  it('first event is on string 1 (A string — root)', () => {
    const notes = buildArpeggio('C', 'major');
    expect(notes[0].string).toBe(1);
  });

  it('stepIndex values are [0,1,2,3,4] in order', () => {
    const notes = buildArpeggio('C', 'major');
    expect(notes.map((n) => n.stepIndex)).toEqual([0, 1, 2, 3, 4]);
  });

  it('midi === STRING_OPEN_MIDI[string] + fret for every event', () => {
    const notes = buildArpeggio('C', 'major');
    for (const note of notes) {
      expect(note.midi, `string ${note.string} fret ${note.fret}`).toBe(
        STRING_OPEN_MIDI[note.string] + note.fret,
      );
    }
  });
});

describe('buildArpeggio — major quality', () => {
  it('C major → MIDI [48, 55, 60, 64, 72]', () => {
    const notes = buildArpeggio('C', 'major');
    expect(notes.map((n) => n.midi)).toEqual([48, 55, 60, 64, 72]);
  });

  it('all 12 roots for major produce strictly ascending MIDI sequences', () => {
    for (const root of CHROMATIC) {
      const notes = buildArpeggio(root, 'major');
      for (let i = 1; i < notes.length; i++) {
        expect(
          notes[i].midi,
          `${root} major: note[${i}].midi should be > note[${i - 1}].midi`,
        ).toBeGreaterThan(notes[i - 1].midi);
      }
    }
  });

  it('all 12 roots for major have frets in [0, 24]', () => {
    for (const root of CHROMATIC) {
      const notes = buildArpeggio(root, 'major');
      for (const note of notes) {
        expect(note.fret, `${root} major string ${note.string}`).toBeGreaterThanOrEqual(0);
        expect(note.fret, `${root} major string ${note.string}`).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe('buildArpeggio — minor quality', () => {
  it('C minor → MIDI [48, 55, 60, 63, 72]', () => {
    const notes = buildArpeggio('C', 'minor');
    expect(notes.map((n) => n.midi)).toEqual([48, 55, 60, 63, 72]);
  });

  it('midi === STRING_OPEN_MIDI[string] + fret for minor', () => {
    const notes = buildArpeggio('A', 'minor');
    for (const note of notes) {
      expect(note.midi).toBe(STRING_OPEN_MIDI[note.string] + note.fret);
    }
  });
});

describe('buildArpeggio — dim quality', () => {
  it('C dim → MIDI [48, 54, 60, 63, 72]', () => {
    const notes = buildArpeggio('C', 'dim');
    expect(notes.map((n) => n.midi)).toEqual([48, 54, 60, 63, 72]);
  });

  it('D dim → all 5 frets in [0, 24]', () => {
    const notes = buildArpeggio('D', 'dim');
    for (const note of notes) {
      expect(note.fret, `D dim string ${note.string}`).toBeGreaterThanOrEqual(0);
      expect(note.fret, `D dim string ${note.string}`).toBeLessThanOrEqual(24);
    }
  });

  it('D dim → interval set matches R, b5, R, b3, R (relative semitones from root A)', () => {
    // D root → rootFret on A string: ((CHROMATIC.indexOf('D') - 9) % 12 + 12) % 12 = ((2-9)%12+12)%12 = 5
    // template: +0, +1, +2, +1, +5
    // A string (str 1): fret 5  → midi = 45+5 = 50 (D3)  — root
    // D string (str 2): fret 6  → midi = 50+6 = 56 (Ab3) — b5 above D
    // G string (str 3): fret 7  → midi = 55+7 = 62 (D4)  — root
    // B string (str 4): fret 6  → midi = 59+6 = 65 (F4)  — b3 above D
    // E string (str 5): fret 10 → midi = 64+10 = 74 (D5) — root
    const notes = buildArpeggio('D', 'dim');
    expect(notes[0].midi).toBe(50); // D3 root
    expect(notes[1].midi).toBe(56); // Ab3 b5
    expect(notes[2].midi).toBe(62); // D4 root
    expect(notes[3].midi).toBe(65); // F4 b3
    expect(notes[4].midi).toBe(74); // D5 root
  });

  it('dim sequences are strictly ascending MIDI for all 12 roots', () => {
    for (const root of CHROMATIC) {
      const notes = buildArpeggio(root, 'dim');
      for (let i = 1; i < notes.length; i++) {
        expect(
          notes[i].midi,
          `${root} dim: note[${i}].midi should be > note[${i - 1}].midi`,
        ).toBeGreaterThan(notes[i - 1].midi);
      }
    }
  });

  it('midi === STRING_OPEN_MIDI[string] + fret for dim', () => {
    const notes = buildArpeggio('D', 'dim');
    for (const note of notes) {
      expect(note.midi).toBe(STRING_OPEN_MIDI[note.string] + note.fret);
    }
  });
});
