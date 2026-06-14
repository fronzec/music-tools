import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LegendPanel from '$lib/components/LegendPanel.svelte';

describe('LegendPanel', () => {
  function renderPanel(
    props: { open?: boolean; viewMode?: 'full' | 'grid' | 'dual' } = {},
  ) {
    return render(LegendPanel, { open: true, viewMode: 'full', ...props });
  }

  describe('shape colors section', () => {
    it('renders with 5 shape items', () => {
      renderPanel();
      expect(screen.getByRole('heading', { name: 'Shapes' })).toBeTruthy();
      for (const shape of ['C', 'A', 'G', 'E', 'D']) {
        expect(screen.getByText(shape)).toBeTruthy();
      }
    });

    it('renders a color swatch for each shape', () => {
      const { container } = renderPanel();
      const swatches = container.querySelectorAll('.rounded-full[style*="background-color"]');
      expect(swatches.length).toBe(5);
    });
  });

  describe('symbols section', () => {
    it('shows symbols section with diamond and circle', () => {
      renderPanel();
      expect(screen.getByRole('heading', { name: 'Symbols' })).toBeTruthy();
      expect(screen.getByText('Root note')).toBeTruthy();
      expect(screen.getByText('Chord tone')).toBeTruthy();
    });

    it('shows open and muted string indicators', () => {
      renderPanel();
      expect(screen.getByText('Open')).toBeTruthy();
      expect(screen.getByText('Muted')).toBeTruthy();
    });
  });

  describe('diff highlights', () => {
    it('hides diff section when viewMode is full', () => {
      renderPanel({ viewMode: 'full' });
      expect(() => screen.getByText('Dual Compare')).toThrow();
    });

    it('hides diff section when viewMode is grid', () => {
      renderPanel({ viewMode: 'grid' });
      expect(() => screen.getByText('Dual Compare')).toThrow();
    });

    it('shows diff section when viewMode is dual', () => {
      renderPanel({ viewMode: 'dual' });
      expect(screen.getByRole('heading', { name: 'Dual Compare' })).toBeTruthy();
      expect(screen.getByText('Same interval')).toBeTruthy();
      expect(screen.getByText('Different interval')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes', () => {
      const { container } = renderPanel();
      const panel = container.querySelector('[role="region"]');
      expect(panel).toBeTruthy();
      expect(panel!.getAttribute('aria-label')).toBe('Fretboard legend');
      expect(panel!.getAttribute('id')).toBe('legend-panel');
    });
  });
});
