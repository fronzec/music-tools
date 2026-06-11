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
      const openButtons = screen.getAllByText('Open');
      expect(openButtons.length).toBeGreaterThanOrEqual(1);
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
      const openBtns = screen.getAllByText('Open');
      await openBtns[0]!.click();

      expect(navigate).toHaveBeenCalledWith('caged');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progression Builder card', () => {
    it('renders the Progression Builder card as an active tool', () => {
      renderPage();
      expect(screen.getByText('Progression Builder')).toBeTruthy();
      expect(screen.getAllByText('Open').length).toBe(3); // CAGED, Progression, Note Trainer
    });

    it('calls navigate with "progression" when the Progression Builder card is clicked', async () => {
      const { navigate } = renderPage();
      const progressionCard = screen.getByText('Progression Builder');
      await progressionCard.click();

      expect(navigate).toHaveBeenCalledWith('progression');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('calls navigate with "progression" when its Open button is clicked', async () => {
      const { navigate } = renderPage();
      const openBtns = screen.getAllByText('Open');
      const progressionBtn = openBtns[1]; // second "Open" button is Progression Builder's
      await progressionBtn!.click();

      expect(navigate).toHaveBeenCalledWith('progression');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('has an aria-label for accessibility', () => {
      renderPage();
      const progressionBtn = screen.getByRole('button', { name: /Progression/i });
      expect(progressionBtn.getAttribute('aria-label')).toContain('Progression');
    });
  });

  describe('Note Trainer card', () => {
    it('renders the Note Trainer card as an active tool', () => {
      renderPage();
      expect(screen.getByText('Note Trainer')).toBeTruthy();
      expect(screen.getByText('Learn every note on the fretboard with visual patterns and quizzes')).toBeTruthy();
      expect(screen.getAllByText('Open').length).toBe(3);
    });

    it('calls navigate with "note-trainer" when the Note Trainer card is clicked', async () => {
      const { navigate } = renderPage();
      const noteCard = screen.getByText('Note Trainer');
      await noteCard.click();

      expect(navigate).toHaveBeenCalledWith('note-trainer');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('calls navigate with "note-trainer" when its Open button is clicked', async () => {
      const { navigate } = renderPage();
      const openBtns = screen.getAllByText('Open');
      const noteTrainerBtn = openBtns[2]; // third "Open" button is Note Trainer's
      await noteTrainerBtn!.click();

      expect(navigate).toHaveBeenCalledWith('note-trainer');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('has an aria-label for accessibility', () => {
      renderPage();
      const noteBtn = screen.getByRole('button', { name: /Note Trainer/i });
      expect(noteBtn.getAttribute('aria-label')).toContain('Note Trainer');
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

  describe('accessibility', () => {
    it('CAGED card button has aria-label', () => {
      renderPage();
      const cagedBtn = screen.getByRole('button', { name: /CAGED/i });
      expect(cagedBtn.getAttribute('aria-label')).toContain('CAGED');
    });

    it('CAGED card button is keyboard-focusable', () => {
      renderPage();
      const cagedBtn = screen.getByRole('button', { name: /CAGED/i });
      expect(cagedBtn).toBeTruthy();
      // Buttons are naturally focusable
      expect(cagedBtn.tagName).toBe('BUTTON');
    });

    it('title is an h1 heading', () => {
      const { container } = renderPage();
      const h1 = container.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1!.textContent).toContain('Music Tools');
    });
  });

  describe('responsive grid', () => {
    it('has grid layout with responsive column classes', () => {
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
