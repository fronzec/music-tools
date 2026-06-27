import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SweepFretboard from '$lib/components/SweepFretboard.svelte';
import type { ArpeggioNote } from '$lib/types/progression';
import type { NoteName, ChordQuality } from '$lib/types/chord';
import { buildArpeggio } from '$lib/theory/arpeggioShape';

function makeNotes(root: NoteName = 'C', quality: ChordQuality = 'major'): ArpeggioNote[] {
  return buildArpeggio(root, quality);
}

describe('SweepFretboard', () => {
  describe('initial render', () => {
    it('renders an SVG element', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('SVG has an aria-label for accessibility', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const svg = container.querySelector('svg');
      const label = svg?.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toContain('Sweep');
    });

    it('SVG has role="img"', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
    });

    it('SVG has responsive classes w-full and h-auto', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('w-full')).toBe(true);
      expect(svg?.classList.contains('h-auto')).toBe(true);
    });
  });

  describe('note circles', () => {
    it('renders exactly 5 note circles for a 5-note arpeggio', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      // Note circles have a data-testid attribute to distinguish from fret markers
      const noteCircles = container.querySelectorAll('[data-testid="sweep-note"]');
      expect(noteCircles).toHaveLength(5);
    });

    it('renders 0 note circles for an empty notes array', () => {
      const { container } = render(SweepFretboard, {
        notes: [],
        activeNoteIndex: 0,
      });
      const noteCircles = container.querySelectorAll('[data-testid="sweep-note"]');
      expect(noteCircles).toHaveLength(0);
    });

    it('does not crash for dim arpeggio', () => {
      const dimNotes = makeNotes('D', 'dim');
      expect(() =>
        render(SweepFretboard, { notes: dimNotes, activeNoteIndex: 0 }),
      ).not.toThrow();
    });
  });

  describe('active note highlighting', () => {
    it('active note circle has a distinct data-active attribute', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 2,
      });
      const activeCircles = container.querySelectorAll('[data-active="true"]');
      expect(activeCircles).toHaveLength(1);
    });

    it('non-active note circles do not have data-active="true"', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const allNotes = container.querySelectorAll('[data-testid="sweep-note"]');
      const inactiveNotes = Array.from(allNotes).filter(
        (el) => el.getAttribute('data-active') !== 'true',
      );
      expect(inactiveNotes).toHaveLength(4);
    });
  });

  describe('fretSpan prop', () => {
    it('defaults to a 24-fret span viewBox (wide enough for 24 frets)', () => {
      const { container } = render(SweepFretboard, {
        notes: makeNotes(),
        activeNoteIndex: 0,
      });
      const svg = container.querySelector('svg');
      const viewBox = svg?.getAttribute('viewBox') ?? '';
      // viewBoxW(24) = 12 + 6 + 24*50 + 16 = 1234; extended by LEFT_PAD(12) → width=1246
      // The viewBox width field (3rd token) must be >= 1234 to cover 24 frets
      const parts = viewBox.split(' ');
      const width = parseInt(parts[2] ?? '0', 10);
      expect(width).toBeGreaterThanOrEqual(1234);
    });
  });
});
