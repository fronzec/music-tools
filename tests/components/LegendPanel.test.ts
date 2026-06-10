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
      expect(screen.getByText('CAGED Shapes')).toBeTruthy();
      for (const shape of ['C', 'A', 'G', 'E', 'D']) {
        expect(screen.getByText(shape)).toBeTruthy();
      }
    });

    it('displays correct hex codes for each shape', () => {
      renderPanel();
      const hexCodes = [
        '#2563EB',
        '#F97316',
        '#16A34A',
        '#EF4444',
        '#9333EA',
      ];
      for (const hex of hexCodes) {
        expect(screen.getByText(hex)).toBeTruthy();
      }
    });
  });

  describe('symbols section', () => {
    it('shows symbols section with diamond and circle', () => {
      renderPanel();
      expect(screen.getByText('Symbols')).toBeTruthy();
      expect(screen.getByText('Root note — name inside')).toBeTruthy();
      expect(screen.getByText('Chord tone — name inside')).toBeTruthy();
    });
  });

  describe('open & muted section', () => {
    it('shows open and muted string indicators', () => {
      renderPanel();
      expect(screen.getByText('Open & Muted')).toBeTruthy();
      expect(screen.getByText('Open string — color shows shape')).toBeTruthy();
      expect(screen.getByText('Muted string — dimmed for muted')).toBeTruthy();
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
      expect(screen.getByText('Dual Compare')).toBeTruthy();
      expect(
        screen.getByText('Same interval in both chords'),
      ).toBeTruthy();
      expect(screen.getByText('Different interval')).toBeTruthy();
    });
  });

  describe('collapse behavior', () => {
    it('collapses content when open=false (max-height: 0)', () => {
      const { container } = renderPanel({ open: false });
      const panel = container.querySelector('[role="region"]');
      expect(panel).toBeTruthy();
      expect(panel!.getAttribute('style')).toContain('max-height: 0');
    });

    it('expands content when open=true', () => {
      const { container } = renderPanel({ open: true });
      const panel = container.querySelector('[role="region"]');
      expect(panel).toBeTruthy();
      expect(panel!.getAttribute('style')).toContain('max-height: 700px');
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
