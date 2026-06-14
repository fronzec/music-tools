import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { TabStep } from '$lib/theory/tab';

// ---------------------------------------------------------------------------
// No audio imports in TabFretboard — pure presentational component.
// Mock pattern kept for future safety (mirrors IntervalFretboard.test.ts).
// ---------------------------------------------------------------------------
vi.mock('$lib/audio/playNote', () => ({
  createNotePlayer: vi.fn(() => ({
    playSequence: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Lazy import so mock hoisting resolves first
async function importComponent() {
  const mod = await import('$lib/components/TabFretboard.svelte');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Single-note step
// ---------------------------------------------------------------------------
describe('TabFretboard — single-note step', () => {
  it('renders without throwing', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 4, fret: 2 }];
    const result = render(TabFretboard as any, { step });
    expect(result).toBeTruthy();
  });

  it('renders exactly one active mark for a single-note step', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 4, fret: 2 }];
    const { container } = render(TabFretboard as any, { step });
    const marks = container.querySelectorAll('[data-role="active"]');
    expect(marks.length).toBe(1);
  });

  it('active mark has correct data-testid for (string=4, fret=2)', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 4, fret: 2 }];
    const { container } = render(TabFretboard as any, { step });
    const mark = container.querySelector('[data-testid="mark-4-2"]');
    expect(mark).not.toBeNull();
  });

  it('no mark for a different position (string=3, fret=0)', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 4, fret: 2 }];
    const { container } = render(TabFretboard as any, { step });
    const wrongMark = container.querySelector('[data-testid="mark-3-0"]');
    expect(wrongMark).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Chord step (multiple simultaneous notes)
// ---------------------------------------------------------------------------
describe('TabFretboard — chord step', () => {
  it('renders three active marks for a three-note chord', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 3 },
    ];
    const { container } = render(TabFretboard as any, { step });
    const marks = container.querySelectorAll('[data-role="active"]');
    expect(marks.length).toBe(3);
  });

  it('each note in the chord has the expected data-testid', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 3 },
    ];
    const { container } = render(TabFretboard as any, { step });
    expect(container.querySelector('[data-testid="mark-3-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mark-4-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mark-5-3"]')).not.toBeNull();
  });

  it('renders two active marks for a two-note power chord', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
    ];
    const { container } = render(TabFretboard as any, { step });
    const marks = container.querySelectorAll('[data-role="active"]');
    expect(marks.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Empty step — no marks
// ---------------------------------------------------------------------------
describe('TabFretboard — empty step', () => {
  it('renders no active marks for an empty step', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [];
    const { container } = render(TabFretboard as any, { step });
    const marks = container.querySelectorAll('[data-role="active"]');
    expect(marks.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Step change clears previous marks
// ---------------------------------------------------------------------------
describe('TabFretboard — step change', () => {
  it('marks from previous step are removed when step prop changes', async () => {
    const TabFretboard = await importComponent();
    const step1: TabStep = [{ string: 2, fret: 3 }];
    const step2: TabStep = [{ string: 0, fret: 0 }];
    const { container, rerender } = render(TabFretboard as any, { step: step1 });

    // Verify step1 mark is present
    expect(container.querySelector('[data-testid="mark-2-3"]')).not.toBeNull();

    // Change to step2
    await rerender({ step: step2 });

    // step1 mark should be gone
    expect(container.querySelector('[data-testid="mark-2-3"]')).toBeNull();
    // step2 mark should appear
    expect(container.querySelector('[data-testid="mark-0-0"]')).not.toBeNull();
  });

  it('active mark count stays at 1 after rerender with a single-note step', async () => {
    const TabFretboard = await importComponent();
    const step1: TabStep = [{ string: 2, fret: 3 }];
    const step2: TabStep = [{ string: 5, fret: 7 }];
    const { container, rerender } = render(TabFretboard as any, { step: step1 });
    await rerender({ step: step2 });
    const marks = container.querySelectorAll('[data-role="active"]');
    expect(marks.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe('TabFretboard — accessibility', () => {
  it('renders a role="img" element', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 0, fret: 0 }];
    render(TabFretboard as any, { step });
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
  });

  it('aria-label on role="img" is non-empty', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 0, fret: 0 }];
    render(TabFretboard as any, { step });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
  });

  it('aria-label mentions fretboard', async () => {
    const TabFretboard = await importComponent();
    const step: TabStep = [{ string: 0, fret: 0 }];
    render(TabFretboard as any, { step });
    const img = screen.getByRole('img');
    const label = (img.getAttribute('aria-label') ?? '').toLowerCase();
    expect(label).toContain('fretboard');
  });

  it('can be imported as a component (smoke check)', async () => {
    const TabFretboard = await importComponent();
    expect(typeof TabFretboard).toBe('function');
  });
});
