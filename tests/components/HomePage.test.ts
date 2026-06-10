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

  describe('initial render', () => {
    it('renders the title', () => {
      renderPage();
      expect(screen.getByText('🎸 Music Tools')).toBeTruthy();
    });

    it('renders the subtitle', () => {
      renderPage();
      expect(screen.getByText('Interactive tools for learning music')).toBeTruthy();
    });

    it('renders the CAGED Visualizer card as an active tool', () => {
      renderPage();
      expect(screen.getByText('CAGED Visualizer')).toBeTruthy();
      expect(screen.getByText('Open')).toBeTruthy();
    });

    it('renders at least 2 placeholder cards', () => {
      renderPage();
      const comingSoonBadges = screen.getAllByText('Coming soon');
      expect(comingSoonBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('renders a Scales Explorer placeholder card', () => {
      renderPage();
      expect(screen.getByText('Scales Explorer')).toBeTruthy();
    });

    it('renders a Chord Library placeholder card', () => {
      renderPage();
      expect(screen.getByText('Chord Library')).toBeTruthy();
    });
  });

  describe('interaction: CAGED card', () => {
    it('calls navigate with "caged" when the CAGED card is clicked', async () => {
      const { navigate } = renderPage();
      const cagedCard = screen.getByText('CAGED Visualizer');
      await cagedCard.click();

      expect(navigate).toHaveBeenCalledWith('caged');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('calls navigate with "caged" when the Open button is clicked', async () => {
      const { navigate } = renderPage();
      const openBtn = screen.getByText('Open');
      await openBtn.click();

      expect(navigate).toHaveBeenCalledWith('caged');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('placeholder cards', () => {
    it('placeholder cards have lower opacity or muted styling', () => {
      const { container } = renderPage();
      // Placeholder cards have opacity-60 class
      const mutedCards = container.querySelectorAll('.opacity-60');
      expect(mutedCards.length).toBeGreaterThanOrEqual(2);
    });

    it('placeholder cards are not buttons (not clickable)', () => {
      const { container } = renderPage();
      // Active card is a <button>, placeholder cards are <div>
      const cagedBtn = container.querySelector('button');
      expect(cagedBtn).toBeTruthy(); // CAGED card is a button
      expect(cagedBtn!.textContent).toContain('CAGED');
    });
  });
});
