import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PentatonicTool from '$lib/components/PentatonicTool.svelte';
import type { ViewName } from '$lib/types/chord';

describe('PentatonicTool', () => {
  function renderTool() {
    const navigate = vi.fn() as (view: ViewName) => void;
    return { navigate, ...render(PentatonicTool, { navigate }) };
  }

  describe('initial render', () => {
    it('renders the title', () => {
      renderTool();
      expect(screen.getByText('Pentatonic Scale Explorer')).toBeTruthy();
    });

    it('renders a back button', () => {
      renderTool();
      expect(screen.getByRole('button', { name: 'Back to Home' })).toBeTruthy();
    });

    it('back button calls navigate with home', async () => {
      const { navigate } = renderTool();
      const btn = screen.getByRole('button', { name: 'Back to Home' });
      await btn.click();
      expect(navigate).toHaveBeenCalledWith('home');
    });

    it('defaults to A root', () => {
      renderTool();
      const aBtn = screen.getByRole('button', { name: 'Select A root' });
      expect(aBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('defaults to minor quality', () => {
      renderTool();
      const minorBtn = screen.getByRole('radio', { name: 'Minor' });
      expect(minorBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('renders all 5 box toggle buttons with only Box 1 active by default', () => {
      renderTool();
      for (const box of ['1', '2', '3', '4', '5']) {
        const btn = screen.getByRole('button', { name: `Toggle Box ${box}` });
        expect(btn).toBeTruthy();
        // Default view starts focused on Box 1; the rest are off so the
        // shared notes between boxes don't overdraw each other.
        expect(btn.getAttribute('aria-pressed')).toBe(box === '1' ? 'true' : 'false');
      }
    });

    it('renders an SVG fretboard', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('SVG has aria-label describing A minor pentatonic', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg[role="img"]');
      expect(svg).toBeTruthy();
      const label = svg!.getAttribute('aria-label');
      expect(label).toContain('A');
      expect(label).toContain('minor');
    });
  });

  describe('root selection', () => {
    it('changing root updates SVG aria-label', async () => {
      const { container } = renderTool();
      const eBtn = screen.getByRole('button', { name: 'Select E root' });
      await eBtn.click();
      const svg = container.querySelector('svg[role="img"]');
      expect(svg!.getAttribute('aria-label')).toContain('E');
    });
  });

  describe('quality toggle', () => {
    it('switching to major updates aria-label', async () => {
      const { container } = renderTool();
      const majorBtn = screen.getByRole('radio', { name: 'Major' });
      await majorBtn.click();
      const svg = container.querySelector('svg[role="img"]');
      expect(svg!.getAttribute('aria-label')).toContain('major');
    });
  });

  describe('box toggles', () => {
    it('toggling off a box updates its aria-pressed', async () => {
      renderTool();
      const box1Btn = screen.getByRole('button', { name: 'Toggle Box 1' });
      await box1Btn.click();
      expect(box1Btn.getAttribute('aria-pressed')).toBe('false');
    });

    it('turning off the only active box shows the empty state in the SVG', async () => {
      const { container } = renderTool();
      // Box 1 is the only one on by default — turning it off empties the board.
      await screen.getByRole('button', { name: 'Toggle Box 1' }).click();
      const svg = container.querySelector('svg[role="img"]');
      expect(svg!.getAttribute('aria-label')).toContain('no boxes');
    });

    it('adding a box shows more notes than the default single box', async () => {
      const { container } = renderTool();
      const before = container.querySelectorAll('svg circle, svg polygon').length;
      await screen.getByRole('button', { name: 'Toggle Box 2' }).click();
      const after = container.querySelectorAll('svg circle, svg polygon').length;
      expect(after).toBeGreaterThan(before);
    });
  });

  describe('scale notes list', () => {
    it('lists the five notes of the current pentatonic scale', () => {
      const { container } = renderTool();
      const region = container.querySelector('[aria-label^="Notes in"]')!;
      const text = region.textContent ?? '';
      for (const n of ['A', 'C', 'D', 'E', 'G']) {
        expect(text).toContain(n);
      }
    });

    it('updates the notes list when the root changes', async () => {
      const { container } = renderTool();
      await screen.getByRole('button', { name: 'Select C root' }).click();
      const region = container.querySelector('[aria-label^="Notes in the C"]');
      expect(region).toBeTruthy();
    });
  });

  describe('note labels', () => {
    it('shows both the note name and its interval on the fretboard', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg[role="img"]')!;
      const text = svg.textContent ?? '';
      // Default A minor pentatonic: note names and interval labels both render.
      expect(text).toContain('A'); // a note name
      expect(text).toContain('R'); // its interval
      expect(text).toContain('b3'); // another interval
    });
  });
});
