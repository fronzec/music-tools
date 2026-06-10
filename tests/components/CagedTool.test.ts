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

  /** Get a chord selector button by note name. */
  function getChordBtn(note: string): HTMLElement {
    return screen.getByRole('button', { name: `Select ${note} chord` });
  }

  /** Get a shape toggle button by shape name. */
  function getShapeToggle(shape: string): HTMLElement {
    return screen.getByRole('button', { name: `Toggle ${shape} shape` });
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
        expect(getChordBtn(note)).toBeTruthy();
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

    it('renders view mode toggle buttons', () => {
      renderTool();
      expect(screen.getByText('Full Neck', { exact: true })).toBeTruthy();
      expect(screen.getByText('Shape Grid', { exact: true })).toBeTruthy();
    });

    it('defaults to Full Neck view mode', () => {
      renderTool();
      const fullBtn = screen.getByText('Full Neck', { exact: true });
      expect(fullBtn.classList.contains('bg-white')).toBe(true);
    });

    it('renders shape toggle buttons in Full Neck mode', () => {
      renderTool();
      const shapes = ['C', 'A', 'G', 'E', 'D'];
      for (const shape of shapes) {
        const btn = getShapeToggle(shape);
        expect(btn).toBeTruthy();
        expect(btn.getAttribute('aria-pressed')).toBe('true');
      }
    });

    it('renders FullFretboard SVG in full mode by default', () => {
      const { container } = renderTool();
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });

    it('shape toggle bar is visible in full mode', () => {
      renderTool();
      const toggleLabel = screen.getByText('Shapes', { exact: true });
      expect(toggleLabel).toBeTruthy();
    });

    it('shape toggle bar hidden in grid mode', async () => {
      renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();
      expect(() => screen.getByText('Shapes', { exact: true })).toThrow();
    });
  });

  describe('view mode toggle', () => {
    it('switches to grid mode when clicking Shape Grid', async () => {
      const { container } = renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();

      const shapeGrid = container.querySelector('.grid');
      expect(shapeGrid).toBeTruthy();
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });

    it('switches back to full mode when clicking Full Neck', async () => {
      const { container } = renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();
      const fullBtn = screen.getByText('Full Neck', { exact: true });
      await fullBtn.click();

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });
  });

  describe('shape toggle bar', () => {
    it('toggles a shape off when clicking its button', async () => {
      const { container } = renderTool();
      const cBtn = getShapeToggle('C');

      await cBtn.click();

      expect(cBtn.getAttribute('aria-pressed')).toBe('false');
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });

    it('toggles a shape back on', async () => {
      renderTool();
      const cBtn = getShapeToggle('C');

      await cBtn.click();
      expect(cBtn.getAttribute('aria-pressed')).toBe('false');

      await cBtn.click();
      expect(cBtn.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('interaction: chord selector', () => {
    it('highlights C as active by default', () => {
      renderTool();
      const cButton = getChordBtn('C');
      expect(cButton.classList.contains('bg-blue-600')).toBe(true);
    });

    it('changes selected root when clicking a chord button', async () => {
      renderTool();
      const gSharpButton = getChordBtn('G#');
      await gSharpButton.click();

      expect(gSharpButton.classList.contains('bg-blue-600')).toBe(true);

      const cButton = getChordBtn('C');
      expect(cButton.classList.contains('bg-blue-600')).toBe(false);
    });

    it('updates shapes when root changes', async () => {
      const { container } = renderTool();
      const gButton = getChordBtn('G');
      await gButton.click();

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });

    it('resets shape visibility on chord change', async () => {
      renderTool();
      // Toggle off C shape first
      const cToggle = getShapeToggle('C');
      await cToggle.click();
      expect(cToggle.getAttribute('aria-pressed')).toBe('false');

      // Now change chord to G (which resets visibility)
      const gButton = getChordBtn('G');
      await gButton.click();

      // C toggle should be back to active since visibility reset
      const cAfter = getShapeToggle('C');
      expect(cAfter.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('interaction: quality toggle', () => {
    it('changes quality to minor when clicking Minor', async () => {
      renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      await minorBtn.click();

      expect(minorBtn.classList.contains('bg-white')).toBe(true);
    });

    it('updates shapes when quality changes', async () => {
      const { container } = renderTool();
      const minorBtn = screen.getByText('Minor', { exact: true });
      await minorBtn.click();

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
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

      expect(notesBtn.classList.contains('bg-white')).toBe(true);
    });
  });

  describe('grid mode shape cards', () => {
    it('renders 5 shape cards in grid mode', async () => {
      const { container } = renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();

      const shapeLabels = ['C shape', 'A shape', 'G shape', 'E shape', 'D shape'];
      for (const label of shapeLabels) {
        expect(screen.getByText(label)).toBeTruthy();
      }
      const fretRangeTexts = [...container.querySelectorAll('div')].filter((d) =>
        d.textContent?.startsWith('frets'),
      );
      expect(fretRangeTexts.length).toBe(5);
    });

    it('renders 5 Fretboard SVGs inside shape cards in grid mode', async () => {
      const { container } = renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });
  });

  describe('accessibility: chord buttons', () => {
    it('chord buttons have aria-label attributes', () => {
      renderTool();
      const chordBtns = screen.getAllByRole('button').filter((b) => {
        const label = b.getAttribute('aria-label');
        return label && label.startsWith('Select ');
      });
      expect(chordBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('active chord button has aria-pressed="true"', () => {
      renderTool();
      const chordC = getChordBtn('C');
      expect(chordC.getAttribute('aria-pressed')).toBe('true');
    });

    it('inactive chord button has aria-pressed="false"', () => {
      renderTool();
      const chordGSharp = getChordBtn('G#');
      expect(chordGSharp.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('accessibility: quality toggle', () => {
    it('quality toggle has radiogroup role', () => {
      const { container } = renderTool();
      const radiogroups = container.querySelectorAll('[role="radiogroup"]');
      expect(radiogroups.length).toBeGreaterThanOrEqual(1);
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

  describe('accessibility: view mode toggle', () => {
    it('view toggle has radiogroup role', () => {
      const { container } = renderTool();
      const radiogroups = container.querySelectorAll('[role="radiogroup"]');
      expect(radiogroups.length).toBe(3);
    });

    it('Full Neck button has aria-checked="true" by default', () => {
      renderTool();
      const fullBtn = screen.getByText('Full Neck', { exact: true });
      expect(fullBtn.getAttribute('role')).toBe('radio');
      expect(fullBtn.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('accessibility: shape toggle bar', () => {
    it('shape toggle buttons have aria-pressed', () => {
      renderTool();
      const cBtn = getShapeToggle('C');
      expect(cBtn.getAttribute('aria-pressed')).toBe('true');
      expect(cBtn.getAttribute('aria-label')).toContain('Toggle');
    });
  });

  describe('responsive grid', () => {
    it('shape grid has responsive column classes when in grid mode', async () => {
      const { container } = renderTool();
      const gridBtn = screen.getByText('Shape Grid', { exact: true });
      await gridBtn.click();

      const grids = container.querySelectorAll('.grid');
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
