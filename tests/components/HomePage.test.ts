import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomePage from '$lib/components/HomePage.svelte';
import type { ViewName } from '$lib/types/chord';

describe('HomePage', () => {
  function renderPage() {
    const navigate = vi.fn() as (view: ViewName) => void;
    const result = render(HomePage, { navigate });
    return { navigate, ...result };
  }

  describe('header', () => {
    it('renders the title as an h1', () => {
      const { container } = renderPage();
      const h1 = container.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1!.textContent).toContain('Music Tools');
    });

    it('renders the subtitle', () => {
      renderPage();
      expect(screen.getByText('Interactive tools for learning music')).toBeTruthy();
    });
  });

  describe('tool cards', () => {
    it('renders exactly 9 active tools (9 "Open" badges)', () => {
      renderPage();
      expect(screen.getAllByText('Open').length).toBe(9);
    });

    it('renders at least one "Coming soon" placeholder', () => {
      renderPage();
      expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(1);
    });

    // Each active tool: rendered by name + clicking it navigates to its view.
    const ACTIVE: ReadonlyArray<{ name: string; view: ViewName }> = [
      { name: 'CAGED Visualizer', view: 'caged' },
      { name: 'Progression Builder', view: 'progression' },
      { name: 'Note Trainer', view: 'note-trainer' },
      { name: 'Tone Generator', view: 'tone-generator' },
      { name: 'Scales Explorer', view: 'pentatonic' },
      { name: 'Signal Lab', view: 'signal-lab' },
      { name: 'Interval Trainer', view: 'interval-trainer' },
      { name: 'Tab Player', view: 'tab-player' },
      { name: 'Chord Builder', view: 'chord-builder' },
    ];

    for (const { name, view } of ACTIVE) {
      it(`renders the "${name}" card with an accessible label`, () => {
        renderPage();
        const btn = screen.getByRole('button', { name: new RegExp(name, 'i') });
        expect(btn.getAttribute('aria-label')).toContain(name);
      });

      it(`navigates to "${view}" when the "${name}" card is clicked`, async () => {
        const { navigate } = renderPage();
        await screen.getByRole('button', { name: new RegExp(name, 'i') }).click();
        expect(navigate).toHaveBeenCalledWith(view);
        expect(navigate).toHaveBeenCalledTimes(1);
      });
    }

    it('renders the Chord Library placeholder', () => {
      renderPage();
      expect(screen.getByText('Chord Library')).toBeTruthy();
    });
  });

  describe('categories', () => {
    const LABELS = ['Fretboard & Theory', 'Ear & Sound', 'Composition'];

    for (const label of LABELS) {
      it(`renders the "${label}" category heading`, () => {
        renderPage();
        expect(screen.getByText(label)).toBeTruthy();
      });
    }

    it('renders category headings in declared order', () => {
      renderPage();
      const headings = LABELS.map((l) => screen.getByText(l));
      for (let i = 0; i < headings.length - 1; i++) {
        const order = headings[i]!.compareDocumentPosition(headings[i + 1]!);
        // Next heading must FOLLOW the current one in the DOM.
        expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });
  });

  describe('placeholder cards', () => {
    it('have muted styling (opacity-60)', () => {
      const { container } = renderPage();
      expect(container.querySelectorAll('.opacity-60').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('responsive grid', () => {
    it('uses responsive column classes on the card grid', () => {
      const { container } = renderPage();
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
      const classList = grid!.className;
      expect(classList).toContain('grid-cols-1');
      expect(classList).toContain('md:grid-cols-2');
      expect(classList).toContain('lg:grid-cols-3');
    });
  });
});
