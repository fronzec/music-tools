import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ToolCard from '$lib/components/ToolCard.svelte';
import type { ViewName } from '$lib/types/chord';
import type { ToolEntry } from '$lib/data/tools';

const activeTool: ToolEntry = {
  status: 'active',
  view: 'caged',
  title: 'CAGED Visualizer',
  description: 'Understand the CAGED system across the fretboard',
  icon: '🎸',
};

const comingSoonTool: ToolEntry = {
  status: 'coming-soon',
  title: 'Chord Library',
  description: 'Browse chord voicings and variations',
  icon: '🎹',
};

function renderCard(tool: ToolEntry) {
  const navigate = vi.fn() as (view: ViewName) => void;
  const result = render(ToolCard, { tool, navigate });
  return { navigate, ...result };
}

describe('ToolCard', () => {
  describe('active tool', () => {
    it('renders the title, description and icon', () => {
      renderCard(activeTool);
      expect(screen.getByText('CAGED Visualizer')).toBeTruthy();
      expect(screen.getByText('Understand the CAGED system across the fretboard')).toBeTruthy();
      expect(screen.getByText('🎸')).toBeTruthy();
    });

    it('renders an "Open" badge', () => {
      renderCard(activeTool);
      expect(screen.getByText('Open')).toBeTruthy();
    });

    it('is a button with an aria-label containing the tool title', () => {
      renderCard(activeTool);
      const btn = screen.getByRole('button', { name: /CAGED Visualizer/i });
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.getAttribute('aria-label')).toContain('CAGED Visualizer');
    });

    it('calls navigate with the tool view when clicked', async () => {
      const { navigate } = renderCard(activeTool);
      await screen.getByRole('button', { name: /CAGED Visualizer/i }).click();
      expect(navigate).toHaveBeenCalledWith('caged');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('coming-soon tool', () => {
    it('renders the title, description and a "Coming soon" badge', () => {
      renderCard(comingSoonTool);
      expect(screen.getByText('Chord Library')).toBeTruthy();
      expect(screen.getByText('Browse chord voicings and variations')).toBeTruthy();
      expect(screen.getByText('Coming soon')).toBeTruthy();
    });

    it('is NOT a button (not clickable)', () => {
      renderCard(comingSoonTool);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('has muted styling (opacity-60)', () => {
      const { container } = renderCard(comingSoonTool);
      expect(container.querySelector('.opacity-60')).toBeTruthy();
    });

    it('signals inert status to assistive tech with aria-disabled="true"', () => {
      const { container } = renderCard(comingSoonTool);
      expect(container.querySelector('[aria-disabled="true"]')).toBeTruthy();
    });

    it('does not render an "Open" badge', () => {
      renderCard(comingSoonTool);
      expect(screen.queryByText('Open')).toBeNull();
    });
  });
});
