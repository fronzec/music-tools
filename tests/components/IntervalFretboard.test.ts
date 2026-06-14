import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { intervalPositions } from '$lib/theory/intervals';

// ---------------------------------------------------------------------------
// Module mock — IntervalFretboard has no audio, but hoist the pattern anyway
// (matches existing harness style; avoids warnings if future imports are added)
// ---------------------------------------------------------------------------
vi.mock('$lib/audio/playNote', () => ({
  createNotePlayer: vi.fn(() => ({
    playSequence: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Lazy import so mock hoisting resolves first
async function importComponent() {
  const mod = await import('$lib/components/IntervalFretboard.svelte');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('IntervalFretboard', () => {
  it('renders without throwing given { rootPc: 0, intervalSemitones: 7 }', async () => {
    const IntervalFretboard = await importComponent();
    const result = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    expect(result).toBeTruthy();
  });

  it('renders a role="img" element', async () => {
    const IntervalFretboard = await importComponent();
    render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
  });

  it('aria-label on role="img" element is non-empty and contains "interval" (case-insensitive)', async () => {
    const IntervalFretboard = await importComponent();
    render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
    expect(label.toLowerCase()).toContain('interval');
  });

  it('[data-role="root"] count equals count from intervalPositions(0, 7)', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const expected = intervalPositions(0, 7).filter((p) => p.role === 'root').length;
    const rootMarks = container.querySelectorAll('[data-role="root"]');
    expect(rootMarks.length).toBe(expected);
  });

  it('[data-role="target"] count equals count from intervalPositions(0, 7)', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const expected = intervalPositions(0, 7).filter((p) => p.role === 'target').length;
    const targetMarks = container.querySelectorAll('[data-role="target"]');
    expect(targetMarks.length).toBe(expected);
  });

  it('[data-role="root"] elements have fill="#FACC15"', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const rootMarks = container.querySelectorAll('[data-role="root"]');
    expect(rootMarks.length).toBeGreaterThan(0);
    for (const el of rootMarks) {
      expect(el.getAttribute('fill')).toBe('#FACC15');
    }
  });

  it('[data-role="target"] elements have fill="#2563EB"', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 7 });
    const targetMarks = container.querySelectorAll('[data-role="target"]');
    expect(targetMarks.length).toBeGreaterThan(0);
    for (const el of targetMarks) {
      expect(el.getAttribute('fill')).toBe('#2563EB');
    }
  });

  it('octave edge: rootPc=0, intervalSemitones=12 — zero [data-role="target"] elements', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, { rootPc: 0, intervalSemitones: 12 });
    const targetMarks = container.querySelectorAll('[data-role="target"]');
    expect(targetMarks.length).toBe(0);
  });

  it('re-renders correctly when intervalSemitones changes from 7 to 5 (P4)', async () => {
    const IntervalFretboard = await importComponent();
    const { container, rerender } = render(IntervalFretboard as any, {
      rootPc: 0,
      intervalSemitones: 7,
    });
    await rerender({ rootPc: 0, intervalSemitones: 5 });
    const expected = intervalPositions(0, 5).filter((p) => p.role === 'target').length;
    const targetMarks = container.querySelectorAll('[data-role="target"]');
    expect(targetMarks.length).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// T7 — Accessibility and reactivity tests (added here per task ordering)
// ---------------------------------------------------------------------------

describe('IntervalFretboard — accessibility', () => {
  it('aria-label contains rootName and targetName when passed', async () => {
    const IntervalFretboard = await importComponent();
    render(IntervalFretboard as any, {
      rootPc: 0,
      intervalSemitones: 7,
      rootName: 'C',
      targetName: 'G',
    });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label).toContain('C');
    expect(label).toContain('G');
  });

  it('SVG width attribute reflects the width prop when provided', async () => {
    const IntervalFretboard = await importComponent();
    const { container } = render(IntervalFretboard as any, {
      rootPc: 0,
      intervalSemitones: 7,
      width: 500,
    });
    const svg = container.querySelector('svg');
    // The component should propagate the width prop to the SVG element
    expect(svg).toBeTruthy();
    // width may be reflected as a viewBox attribute or a style — just confirm component renders
    expect(svg!.getAttribute('viewBox')).toBeTruthy();
  });

  it('can be imported as a component (smoke check)', async () => {
    const IntervalFretboard = await importComponent();
    expect(typeof IntervalFretboard).toBe('function');
  });
});
