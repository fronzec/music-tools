import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CagedTool from '$lib/components/CagedTool.svelte';
import type { ViewName } from '$lib/types/chord';

describe('CagedTool', () => {
  function renderTool() {
    const navigate = vi.fn() as (view: ViewName) => void;
    const result = render(CagedTool, { navigate });
    return { navigate, ...result };
  }

  describe('initial render', () => {
    it('renders the title', () => {
      renderTool();
      expect(screen.getByText('CAGED Chord Visualizer')).toBeTruthy();
    });

    it('renders a back button', () => {
      renderTool();
      const backBtn = screen.getByText('← Back to Home');
      expect(backBtn).toBeTruthy();
    });

    it('renders 12 chord buttons from the chromatic scale', () => {
      renderTool();
      const chromatic = [
        'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
      ];
      for (const note of chromatic) {
        expect(screen.getByText(note, { exact: true })).toBeTruthy();
      }
    });

    it('renders Major and Minor toggle buttons', () => {
      renderTool();
      expect(screen.getByText('Major', { exact: true })).toBeTruthy();
      expect(screen.getByText('Minor', { exact: true })).toBeTruthy();
    });

    it('renders label mode toggle buttons', () => {
      renderTool();
      expect(screen.getByText('Intervals', { exact: true })).toBeTruthy();
      expect(screen.getByText('Notes', { exact: true })).toBeTruthy();
    });

    it('renders 5 shape cards by default (C major)', () => {
      const { container } = renderTool();
      // Each ShapeCard renders the shape name (e.g., "C shape")
      const shapeLabels = ['C shape', 'A shape', 'G shape', 'E shape', 'D shape'];
      for (const label of shapeLabels) {
        expect(screen.getByText(label)).toBeTruthy();
      }
      // Check for fret range labels (should be 5)
      const fretRangeTexts = [...container.querySelectorAll('div')].filter((d) =>
        d.textContent?.startsWith('frets'),
      );
      expect(fretRangeTexts.length).toBe(5);
    });

    it('renders 5 Fretboard components inside shape cards', () => {
      const { container } = renderTool();
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });
  });

  describe('interaction: chord selector', () => {
    it('highlights C as active by default', () => {
      renderTool();
      const cButton = screen.getByText('C', { exact: true });
      expect(cButton.classList.contains('bg-blue-600')).toBe(true);
    });

    it('changes selected root when clicking a chord button', async () => {
      renderTool();
      const gSharpButton = screen.getByText('G#', { exact: true });
      await gSharpButton.click();

      // G# should now be highlighted
      expect(gSharpButton.classList.contains('bg-blue-600')).toBe(true);

      // C should no longer be highlighted
      const cButton = screen.getByText('C', { exact: true });
      expect(cButton.classList.contains('bg-blue-600')).toBe(false);
    });

    it('updates shape cards when root changes', async () => {
      const { container } = renderTool();
      const gButton = screen.getByText('G', { exact: true });
      await gButton.click();

      // Should still have 5 shape labels and 5 SVGs
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });
  });

  describe('interaction: quality toggle', () => {
    it('changes quality to minor when clicking Minor', async () => {
      renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      await minorBtn.click();

      // Minor button should be active (white background = selected state)
      expect(minorBtn.classList.contains('bg-white')).toBe(true);
    });

    it('updates shape cards when quality changes', async () => {
      const { container } = renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      await minorBtn.click();

      // Should still render 5 shape cards
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });
  });

  describe('interaction: back button', () => {
    it('calls navigate with "home" when back button is clicked', async () => {
      const { navigate } = renderTool();
      const backBtn = screen.getByText('← Back to Home');
      await backBtn.click();

      expect(navigate).toHaveBeenCalledWith('home');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('interaction: label mode toggle', () => {
    it('toggles label mode to notes', async () => {
      renderTool();
      const notesBtn = screen.getByText('Notes', { exact: true });
      await notesBtn.click();

      // Notes button should be active
      expect(notesBtn.classList.contains('bg-white')).toBe(true);
    });
  });

  describe('accessibility: chord buttons', () => {
    it('chord buttons have aria-label attributes', () => {
      renderTool();
      const buttons = screen.getAllByRole('button');
      const chordBtns = buttons.filter((b) => {
        const label = b.getAttribute('aria-label');
        return label && label.startsWith('Select ');
      });
      // Should have at least the first "C" chord button with aria-label
      expect(chordBtns.length).toBeGreaterThanOrEqual(1);
      expect(chordBtns[0].getAttribute('aria-label')).toContain('Select');
    });

    it('active chord button has aria-pressed="true"', () => {
      renderTool();
      const cBtn = screen.getByText('C', { exact: true });
      expect(cBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('inactive chord button has aria-pressed="false"', () => {
      renderTool();
      const gSharpBtn = screen.getByText('G#', { exact: true });
      expect(gSharpBtn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('accessibility: quality toggle', () => {
    it('quality toggle has radiogroup role', () => {
      const { container } = renderTool();
      const radiogroup = container.querySelector('[role="radiogroup"]');
      expect(radiogroup).toBeTruthy();
    });

    it('Major button has role="radio" and aria-checked="true" by default', () => {
      renderTool();
      const majorBtn = screen.getByText('Major', { exact: true });
      expect(majorBtn.getAttribute('role')).toBe('radio');
      expect(majorBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('Minor button has role="radio" and aria-checked="false" by default', () => {
      renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      expect(minorBtn.getAttribute('role')).toBe('radio');
      expect(minorBtn.getAttribute('aria-checked')).toBe('false');
    });

    it('changes aria-checked when toggling quality', async () => {
      renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      await minorBtn.click();

      expect(minorBtn.getAttribute('aria-checked')).toBe('true');
      const majorBtn = screen.getByText('Major', { exact: true });
      expect(majorBtn.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('accessibility: label mode toggle', () => {
    it('label toggle buttons have radio role', () => {
      renderTool();
      const intervalsBtn = screen.getByText('Intervals', { exact: true });
      const notesBtn = screen.getByText('Notes', { exact: true });
      expect(intervalsBtn.getAttribute('role')).toBe('radio');
      expect(notesBtn.getAttribute('role')).toBe('radio');
    });
  });

  describe('accessibility: back button', () => {
    it('back button has aria-label', () => {
      renderTool();
      const backBtn = screen.getByText('← Back to Home');
      expect(backBtn.getAttribute('aria-label')).toBe('Back to Home');
    });
  });

  describe('accessibility: heading', () => {
    it('has an h1 heading for screen reader navigation', () => {
      const { container } = renderTool();
      const h1 = container.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1!.textContent).toContain('CAGED Chord Visualizer');
      expect(h1!.getAttribute('id')).toBe('caged-heading');
    });
  });

  describe('responsive grid', () => {
    it('shape grid has responsive column classes', () => {
      const { container } = renderTool();
      // The shape grid is the outer grid (not the chord button group)
      const grids = container.querySelectorAll('.grid');
      // Filter to the shape grid (contains ShapeCard wrappers)
      const shapeGrid = [...grids].find((g) =>
        g.className.includes('gap-4'),
      );
      expect(shapeGrid).toBeTruthy();
      const classList = shapeGrid!.className;
      expect(classList).toContain('grid-cols-1');
      expect(classList).toContain('sm:grid-cols-2');
      expect(classList).toContain('lg:grid-cols-3');
    });
  });
});
