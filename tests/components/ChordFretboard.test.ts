import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { chordPositions } from '$lib/theory/chordFretboard';

// ---------------------------------------------------------------------------
// Module mock — ChordFretboard has no audio, but follow house style
// ---------------------------------------------------------------------------
vi.mock('$lib/audio/playNote', () => ({
  createNotePlayer: vi.fn(() => ({
    playSequence: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Lazy import so mock hoisting resolves first
async function importComponent() {
  const mod = await import('$lib/components/ChordFretboard.svelte');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChordFretboard', () => {
  it('renders without throwing given { rootPc:0, offsets:[0,4,7], degrees:["1","3","5"] }', async () => {
    const ChordFretboard = await importComponent();
    const result = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    expect(result).toBeTruthy();
  });

  it('renders a role="img" element', async () => {
    const ChordFretboard = await importComponent();
    render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
  });

  it('aria-label on role="img" is a non-empty string', async () => {
    const ChordFretboard = await importComponent();
    render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
  });

  it('aria-label contains rootName when rootName="C" is passed', async () => {
    const ChordFretboard = await importComponent();
    render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
      rootName: 'C',
    });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label).toContain('C');
  });

  it('[data-role="root"] count equals chordPositions(0,[0,4,7]) root count', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const expected = chordPositions(0, [0, 4, 7]).filter((p) => p.role === 'root').length;
    const rootMarks = container.querySelectorAll('[data-role="root"]');
    expect(rootMarks.length).toBe(expected);
  });

  it('[data-role="tone"] count equals chordPositions(0,[0,4,7]) tone count', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const expected = chordPositions(0, [0, 4, 7]).filter((p) => p.role === 'tone').length;
    const toneMarks = container.querySelectorAll('[data-role="tone"]');
    expect(toneMarks.length).toBe(expected);
  });

  it('total [data-role] count equals chordPositions(0,[0,4,7]).length', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const expected = chordPositions(0, [0, 4, 7]).length;
    const allMarks = container.querySelectorAll('[data-role]');
    expect(allMarks.length).toBe(expected);
  });

  it('[data-role="root"] elements have fill-note-root class and NOT fill-accent', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const rootMarks = container.querySelectorAll('[data-role="root"]');
    expect(rootMarks.length).toBeGreaterThan(0);
    for (const el of rootMarks) {
      expect(el.classList.contains('fill-note-root')).toBe(true);
      expect(el.classList.contains('fill-accent')).toBe(false);
    }
  });

  it('[data-role="tone"] elements have fill-note-tone class', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const toneMarks = container.querySelectorAll('[data-role="tone"]');
    expect(toneMarks.length).toBeGreaterThan(0);
    for (const el of toneMarks) {
      expect(el.classList.contains('fill-note-tone')).toBe(true);
    }
  });

  it('no hardcoded colors (#, rgb(, hsl() on chord-tone [data-role] elements', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const allMarks = container.querySelectorAll('[data-role]');
    for (const el of allMarks) {
      const outerHTML = el.outerHTML;
      // No hex color, no rgb(), no hsl() on chord-tone circles
      expect(outerHTML).not.toMatch(/#[0-9a-fA-F]{3,6}/);
      expect(outerHTML).not.toContain('rgb(');
      expect(outerHTML).not.toContain('hsl(');
    }
  });

  it('degree labels for C major include "1", "3", "5" across dots', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    const html = container.innerHTML;
    expect(html).toContain('>1<');
    expect(html).toContain('>3<');
    expect(html).toContain('>5<');
  });

  it('degree labels — minor: pitchClass===3 has associated text "♭3"', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 3, 7],
      degrees: ['1', '♭3', '5'],
    });
    const html = container.innerHTML;
    expect(html).toContain('♭3');
  });

  it('degree labels — augmented: text "♯5" is present', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 8],
      degrees: ['1', '3', '♯5'],
    });
    const html = container.innerHTML;
    expect(html).toContain('♯5');
  });

  it('reactivity — rootPc change: [data-role="root"] count updates to G major', async () => {
    const ChordFretboard = await importComponent();
    const { container, rerender } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    await rerender({ rootPc: 7, offsets: [0, 4, 7], degrees: ['1', '3', '5'] });
    const expected = chordPositions(7, [0, 4, 7]).filter((p) => p.role === 'root').length;
    const rootMarks = container.querySelectorAll('[data-role="root"]');
    expect(rootMarks.length).toBe(expected);
  });

  it('reactivity — offsets change (quality maj→min): tone count updates', async () => {
    const ChordFretboard = await importComponent();
    const { container, rerender } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
    });
    await rerender({ rootPc: 0, offsets: [0, 3, 7], degrees: ['1', '♭3', '5'] });
    const expected = chordPositions(0, [0, 3, 7]).filter((p) => p.role === 'tone').length;
    const toneMarks = container.querySelectorAll('[data-role="tone"]');
    expect(toneMarks.length).toBe(expected);
  });

  it('width prop: SVG viewBox attribute is present on the role="img" element', async () => {
    const ChordFretboard = await importComponent();
    const { container } = render(ChordFretboard as any, {
      rootPc: 0,
      offsets: [0, 4, 7],
      degrees: ['1', '3', '5'],
      width: 600,
    });
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('viewBox')).toBeTruthy();
  });
});
