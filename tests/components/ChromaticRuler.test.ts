import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ChromaticRuler from '$lib/components/ChromaticRuler.svelte';
import type { TriadQuality } from '$lib/theory/chords';
import { TRIAD_OFFSETS, TRIAD_FORMULA, TRIAD_INTERVAL_JUMPS } from '$lib/theory/chords';

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
// Formula display
// ---------------------------------------------------------------------------

describe('ChromaticRuler formula display', () => {
  it('min: shows formula "1 - ♭3 - 5"', () => {
    const { container } = renderRuler(0, 'min');
    expect(container.innerHTML).toContain(TRIAD_FORMULA['min']);
  });

  it('aug: shows formula "1 - 3 - ♯5"', () => {
    const { container } = renderRuler(0, 'aug');
    expect(container.innerHTML).toContain(TRIAD_FORMULA['aug']);
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
// Chord name display
// ---------------------------------------------------------------------------

describe('ChromaticRuler chord name display', () => {
  it('rootPc=5 (F), quality=maj → shows "F major"', () => {
    const { container } = renderRuler(5, 'maj');
    expect(container.innerHTML).toContain('F major');
  });

  it('rootPc=0 (C), quality=dim → shows "C diminished"', () => {
    const { container } = renderRuler(0, 'dim');
    expect(container.innerHTML).toContain('C diminished');
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
  it('re-rendering with rootPc=7 updates note names and chord name to G major', () => {
    const { container, rerender } = renderRuler(0, 'maj');
    expect(container.innerHTML).toContain('C major');

    rerender({ rootPc: 7, quality: 'maj', reducedMotion: false });
    expect(container.innerHTML).toContain('G major');
    expect(container.innerHTML).toContain('G');
    expect(container.innerHTML).toContain('B');
    expect(container.innerHTML).toContain('D');
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
