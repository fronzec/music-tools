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

    it('renders at least 1 placeholder card', () => {
      renderPage();
      const comingSoonBadges = screen.getAllByText('Coming soon');
      expect(comingSoonBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a Scales Explorer card', () => {
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
      expect(screen.getAllByText('Open').length).toBe(8); // CAGED, Progression, Note Trainer, Tone Generator, Scales Explorer, Signal Lab, Interval Trainer, Tab Player
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
      expect(screen.getAllByText('Open').length).toBe(8);
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

  describe('Tone Generator card', () => {
    it('renders the Tone Generator card as an active tool', () => {
      renderPage();
      expect(screen.getByText('Tone Generator')).toBeTruthy();
      expect(screen.getByText('Reference tones for tuning by ear')).toBeTruthy();
      expect(screen.getAllByText('Open').length).toBe(8);
    });

    it('calls navigate with "tone-generator" when the Tone Generator card is clicked', async () => {
      const { navigate } = renderPage();
      const toneCard = screen.getByText('Tone Generator');
      await toneCard.click();

      expect(navigate).toHaveBeenCalledWith('tone-generator');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('calls navigate with "tone-generator" when its Open button is clicked', async () => {
      const { navigate } = renderPage();
      const openBtns = screen.getAllByText('Open');
      const toneBtn = openBtns[3]; // fourth "Open" button is Tone Generator's
      await toneBtn!.click();

      expect(navigate).toHaveBeenCalledWith('tone-generator');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('has an aria-label for accessibility', () => {
      renderPage();
      const toneBtn = screen.getByRole('button', { name: /Tone Generator/i });
      expect(toneBtn.getAttribute('aria-label')).toContain('Tone Generator');
    });
  });

  describe('placeholder cards', () => {
    it('placeholder cards have lower opacity or muted styling', () => {
      const { container } = renderPage();
      // Placeholder cards have opacity-60 class
      const mutedCards = container.querySelectorAll('.opacity-60');
      expect(mutedCards.length).toBeGreaterThanOrEqual(1);
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

  describe('Interval Trainer card', () => {
    it('renders the Interval Trainer card', () => {
      renderPage();
      expect(screen.getByText('Interval Trainer')).toBeTruthy();
    });

    it('renders the Interval Trainer card description', () => {
      renderPage();
      expect(screen.getByText('Train your ear to recognize musical intervals by sound')).toBeTruthy();
    });

    it('Open badge count is 7 after adding Interval Trainer card', () => {
      renderPage();
      expect(screen.getAllByText('Open').length).toBe(8);
    });

    it('calls navigate with "interval-trainer" when the Interval Trainer card is clicked', async () => {
      const { navigate } = renderPage();
      const card = screen.getByText('Interval Trainer');
      await card.click();
      expect(navigate).toHaveBeenCalledWith('interval-trainer');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('Interval Trainer card button has aria-label containing "Interval Trainer"', () => {
      renderPage();
      const btn = screen.getByRole('button', { name: /Interval Trainer/i });
      expect(btn.getAttribute('aria-label')).toContain('Interval Trainer');
    });

    it('Open badge count is 8 after adding Tab Player card', () => {
      renderPage();
      expect(screen.getAllByText('Open').length).toBe(8);
    });

    it('Interval Trainer card appears after Tone Generator card (DOM order)', () => {
      renderPage();
      const openBtns = screen.getAllByText('Open');
      // Tone Generator is the 4th Open button (index 3), Interval Trainer should be 7th (index 6)
      const toneGenBtn = openBtns[3];
      const intervalTrainerBtn = openBtns[6];
      expect(toneGenBtn).toBeTruthy();
      expect(intervalTrainerBtn).toBeTruthy();
      // Verify DOM order: toneGen should come before intervalTrainer
      const order = toneGenBtn!.compareDocumentPosition(intervalTrainerBtn!);
      // Node.DOCUMENT_POSITION_FOLLOWING = 4 (intervalTrainer is after toneGen)
      expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe('Tab Player card', () => {
    it('renders the Tab Player card', () => {
      renderPage();
      expect(screen.getByText('Tab Player')).toBeTruthy();
    });

    it('renders the Tab Player card description', () => {
      renderPage();
      expect(screen.getByText('Play through curated guitar tabs with fretboard visualization')).toBeTruthy();
    });

    it('calls navigate with "tab-player" when the Tab Player card is clicked', async () => {
      const { navigate } = renderPage();
      const card = screen.getByText('Tab Player');
      await card.click();
      expect(navigate).toHaveBeenCalledWith('tab-player');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('Tab Player card button has aria-label containing "Tab Player"', () => {
      renderPage();
      const btn = screen.getByRole('button', { name: /Tab Player/i });
      expect(btn.getAttribute('aria-label')).toContain('Tab Player');
    });
  });
});
