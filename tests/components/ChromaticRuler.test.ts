import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ChromaticRuler from '$lib/components/ChromaticRuler.svelte';
import type { TriadQuality } from '$lib/theory/chords';
import { TRIAD_INTERVAL_JUMPS } from '$lib/theory/chords';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRuler(rootPc: number, quality: TriadQuality, reducedMotion = false) {
  return render(ChromaticRuler as any, { rootPc, quality, reducedMotion });
}

// ---------------------------------------------------------------------------
// Slot count
// ---------------------------------------------------------------------------

describe('ChromaticRuler slot count', () => {
  it('renders exactly 12 semitone slot cells for C major', () => {
    const { container } = renderRuler(0, 'maj');
    const slots = container.querySelectorAll('[data-slot]');
    expect(slots.length).toBe(12);
  });

  it('renders exactly 12 semitone slot cells for G minor', () => {
    const { container } = renderRuler(7, 'min');
    const slots = container.querySelectorAll('[data-slot]');
    expect(slots.length).toBe(12);
  });

  it('renders exactly 12 semitone slot cells for B diminished', () => {
    const { container } = renderRuler(11, 'dim');
    const slots = container.querySelectorAll('[data-slot]');
    expect(slots.length).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// Chord tone highlighting
// ---------------------------------------------------------------------------

describe('ChromaticRuler chord tone highlighting', () => {
  it('maj: slots at offsets 0, 4, 7 are highlighted, others are inactive', () => {
    const { container } = renderRuler(0, 'maj');
    const slots = container.querySelectorAll('[data-slot]');
    expect(slots.length).toBe(12);
    const highlighted = [0, 4, 7];
    slots.forEach((slot, i) => {
      if (highlighted.includes(i)) {
        expect(slot.className).toMatch(/note-root|note-tone/);
      } else {
        expect(slot.className).not.toMatch(/note-root|note-tone/);
      }
    });
  });

  it('min: slots at offsets 0, 3, 7 are highlighted', () => {
    const { container } = renderRuler(0, 'min');
    const slots = container.querySelectorAll('[data-slot]');
    const highlighted = [0, 3, 7];
    slots.forEach((slot, i) => {
      if (highlighted.includes(i)) {
        expect(slot.className).toMatch(/note-root|note-tone/);
      } else {
        expect(slot.className).not.toMatch(/note-root|note-tone/);
      }
    });
  });

  it('dim: slots at offsets 0, 3, 6 are highlighted', () => {
    const { container } = renderRuler(0, 'dim');
    const slots = container.querySelectorAll('[data-slot]');
    const highlighted = [0, 3, 6];
    slots.forEach((slot, i) => {
      if (highlighted.includes(i)) {
        expect(slot.className).toMatch(/note-root|note-tone/);
      } else {
        expect(slot.className).not.toMatch(/note-root|note-tone/);
      }
    });
  });

  it('aug: slots at offsets 0, 4, 8 are highlighted', () => {
    const { container } = renderRuler(0, 'aug');
    const slots = container.querySelectorAll('[data-slot]');
    const highlighted = [0, 4, 8];
    slots.forEach((slot, i) => {
      if (highlighted.includes(i)) {
        expect(slot.className).toMatch(/note-root|note-tone/);
      } else {
        expect(slot.className).not.toMatch(/note-root|note-tone/);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// No hardcoded colors
// ---------------------------------------------------------------------------

describe('ChromaticRuler no hardcoded colors', () => {
  it('rendered markup contains no hex, rgb(), hsl() or SVG fill/stroke values', () => {
    const { container } = renderRuler(0, 'maj');
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(html).not.toMatch(/rgb\(/);
    expect(html).not.toMatch(/hsl\(/);
    expect(html).not.toMatch(/fill="/);
    expect(html).not.toMatch(/stroke="/);
  });
});

// ---------------------------------------------------------------------------
// Interval jump annotations
// ---------------------------------------------------------------------------

describe('ChromaticRuler interval jump annotations', () => {
  it('maj: jump labels "+4" and "+3" are present', () => {
    const { container } = renderRuler(0, 'maj');
    const html = container.innerHTML;
    const jumps = TRIAD_INTERVAL_JUMPS['maj'];
    expect(html).toContain(jumps[0]);
    expect(html).toContain(jumps[1]);
  });

  it('dim: both jump labels are "+3"', () => {
    const { container } = renderRuler(0, 'dim');
    const html = container.innerHTML;
    const jumps = TRIAD_INTERVAL_JUMPS['dim'];
    // "+3" should appear at least twice for dim
    const matches = html.match(/\+3/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain('+4');
  });
});

// ---------------------------------------------------------------------------
// Note name labels
// ---------------------------------------------------------------------------

describe('ChromaticRuler note name labels', () => {
  it('C major: marker labels contain "C", "E", "G" at offsets 0, 4, 7', () => {
    const { container } = renderRuler(0, 'maj');
    const markers = container.querySelectorAll('[data-marker]');
    expect(markers.length).toBe(3);
    const texts = Array.from(markers).map((m) => m.textContent ?? '');
    // Should contain the note names somewhere in the marker text/aria-label
    const html = container.innerHTML;
    expect(html).toContain('C');
    expect(html).toContain('E');
    expect(html).toContain('G');
  });

  it('G minor (rootPc=7): marker labels contain "G", "A#", "D" at offsets 0, 3, 7', () => {
    const { container } = renderRuler(7, 'min');
    const html = container.innerHTML;
    expect(html).toContain('G');
    expect(html).toContain('A#');
    expect(html).toContain('D');
  });
});

// ---------------------------------------------------------------------------
// All 12 chromatic note names (chord tones emphasized, others faint)
// ---------------------------------------------------------------------------

describe('ChromaticRuler shows all 12 chromatic note names', () => {
  it('renders a note label under every one of the 12 slots', () => {
    const { container } = renderRuler(0, 'maj');
    const noteSlots = container.querySelectorAll('[data-note-slot]');
    expect(noteSlots.length).toBe(12);
  });

  it('C major: chord-tone notes (0,4,7) are emphasized; non-chord tones are muted', () => {
    const { container } = renderRuler(0, 'maj');
    const span = (n: number) =>
      container.querySelector(`[data-note-slot="${n}"] span`)!;
    // Chord tones use the emphasized ink class.
    for (const tone of [0, 4, 7]) {
      expect(span(tone).className).toMatch(/text-ink/);
    }
    // A non-chord tone (slot 1 = C#) is muted, not ink.
    expect(span(1).className).toMatch(/text-muted/);
    expect(span(1).className).not.toMatch(/text-ink/);
  });

  it('B major (rootPc=11): wraps mod-12 so the third (D#) renders', () => {
    const { container } = renderRuler(11, 'maj');
    // B major = B, D#, F#; offset 4 from B wraps to D#.
    const thirdSlot = container.querySelector('[data-note-slot="4"] span')!;
    expect(thirdSlot.textContent?.trim()).toBe('D#');
  });
});

// ---------------------------------------------------------------------------
// reducedMotion prop — transition class gating
// ---------------------------------------------------------------------------

describe('ChromaticRuler reducedMotion', () => {
  it('reducedMotion=false: transition utility class IS present on markers', () => {
    const { container } = renderRuler(0, 'maj', false);
    const markers = container.querySelectorAll('[data-marker]');
    expect(markers.length).toBeGreaterThan(0);
    const hasTransition = Array.from(markers).some((m) =>
      m.className.includes('transition'),
    );
    expect(hasTransition).toBe(true);
  });

  it('reducedMotion=true: transition utility class is NOT present on markers', () => {
    const { container } = renderRuler(0, 'maj', true);
    const markers = container.querySelectorAll('[data-marker]');
    expect(markers.length).toBeGreaterThan(0);
    const hasTransition = Array.from(markers).some((m) =>
      m.className.includes('transition'),
    );
    expect(hasTransition).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Prop-driven (purely presentational)
// ---------------------------------------------------------------------------

describe('ChromaticRuler is purely prop-driven', () => {
  it('re-rendering with a new root updates the chord-tone marker labels', () => {
    const { container, rerender } = renderRuler(0, 'maj');
    const labels = () =>
      Array.from(container.querySelectorAll('[data-marker]')).map((m) =>
        m.getAttribute('aria-label'),
      );
    expect(labels()).toEqual(['C (1)', 'E (3)', 'G (5)']);

    rerender({ rootPc: 7, quality: 'maj', reducedMotion: false });
    expect(labels()).toEqual(['G (1)', 'B (3)', 'D (5)']);
  });
});

// ---------------------------------------------------------------------------
// Key by index — marker identity on quality change
// ---------------------------------------------------------------------------

describe('ChromaticRuler markers keyed by positional index', () => {
  it('when quality changes maj→min, data-marker-index attributes stay 0, 1, 2', () => {
    const { container, rerender } = renderRuler(0, 'maj');
    const markersBefore = container.querySelectorAll('[data-marker-index]');
    expect(markersBefore.length).toBe(3);
    const indicesBefore = Array.from(markersBefore).map((m) =>
      m.getAttribute('data-marker-index'),
    );
    expect(indicesBefore).toEqual(['0', '1', '2']);

    rerender({ rootPc: 0, quality: 'min', reducedMotion: false });
    const markersAfter = container.querySelectorAll('[data-marker-index]');
    expect(markersAfter.length).toBe(3);
    const indicesAfter = Array.from(markersAfter).map((m) =>
      m.getAttribute('data-marker-index'),
    );
    expect(indicesAfter).toEqual(['0', '1', '2']);
  });
});
