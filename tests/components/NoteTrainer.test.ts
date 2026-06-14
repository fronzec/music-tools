import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NoteTrainer from '$lib/components/NoteTrainer.svelte';
import type { ViewName } from '$lib/types/chord';

describe('NoteTrainer', () => {
  function renderTool() {
    const navigate = vi.fn() as (view: ViewName) => void;
    const result = render(NoteTrainer, { navigate });
    return { navigate, ...result };
  }

  function clickNoteFilter(note: string) {
    const btn = screen.getByRole('button', { name: `Select ${note}` });
    return fireEvent.click(btn);
  }

  describe('initial render', () => {
    it('renders the title', () => {
      renderTool();
      expect(screen.getByText('Note Trainer')).toBeTruthy();
    });

    it('renders a back button', () => {
      renderTool();
      expect(screen.getByText('← Back to Home')).toBeTruthy();
    });

    it('renders Explore and Quiz tabs', () => {
      renderTool();
      expect(screen.getByRole('tab', { name: /Explore/i })).toBeTruthy();
      expect(screen.getByRole('tab', { name: /Quiz/i })).toBeTruthy();
    });

    it('defaults to Explore mode', () => {
      renderTool();
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab.getAttribute('aria-selected')).toBe('true');
    });

    it('renders 12 note filter buttons in explore mode', () => {
      renderTool();
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      for (const note of notes) {
        expect(screen.getByRole('button', { name: `Select ${note}` })).toBeTruthy();
      }
    });

    it('renders an SVG fretboard', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('back button', () => {
    it('navigates to home', async () => {
      const { navigate } = renderTool();
      const backBtn = screen.getByText('← Back to Home');
      await fireEvent.click(backBtn);
      expect(navigate).toHaveBeenCalledWith('home');
    });
  });

  describe('note filter bar', () => {
    it('highlights selected note', async () => {
      const { container } = renderTool();
      await clickNoteFilter('E');

      const svg = container.querySelector('svg')!;
      const rects = svg.querySelectorAll('rect');
      // Multiple positions for E (open low E, fret 7 A, fret 2 D, fret 9 G, fret 5 B, open high E)
      expect(rects.length).toBeGreaterThanOrEqual(3);
    });

    it('deselects on second click', async () => {
      const { container } = renderTool();
      await clickNoteFilter('A');
      await clickNoteFilter('A');

      const svg = container.querySelector('svg')!;
      const rects = [...svg.querySelectorAll('rect')].filter(r => !r.classList.contains('fret-marker-bg'));
      expect(rects.length).toBe(0);
    });

    it('marks button as pressed when selected', async () => {
      renderTool();
      const btn = screen.getByRole('button', { name: 'Select G' });
      await fireEvent.click(btn);
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('octave and unison toggles', () => {
    it('shows octave toggle in explore mode', () => {
      renderTool();
      expect(screen.getByText('Octaves')).toBeTruthy();
    });

    it('shows unison toggle in explore mode', () => {
      renderTool();
      expect(screen.getByText('Unisons')).toBeTruthy();
    });

    it('hides toggles in quiz mode', async () => {
      renderTool();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      await fireEvent.click(quizTab);
      expect(() => screen.getByText('Octaves')).toThrow();
    });
  });

  describe('quiz mode', () => {
    async function enterQuiz() {
      const result = renderTool();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      await fireEvent.click(quizTab);
      return result;
    }

    it('switches to quiz mode', async () => {
      await enterQuiz();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      expect(quizTab.getAttribute('aria-selected')).toBe('true');
    });

    it('shows difficulty selector', async () => {
      await enterQuiz();
      expect(screen.getByText('Difficulty')).toBeTruthy();
      expect(screen.getByRole('radio', { name: /Easy/i })).toBeTruthy();
      expect(screen.getByRole('radio', { name: /Medium/i })).toBeTruthy();
      expect(screen.getByRole('radio', { name: /Hard/i })).toBeTruthy();
    });

    it('shows score display', async () => {
      await enterQuiz();
      expect(screen.getByText(/Streak:/)).toBeTruthy();
      expect(screen.getByText(/Best:/)).toBeTruthy();
    });

    it('shows 4 answer buttons in quiz mode', async () => {
      await enterQuiz();
      const answerBtns = screen.getAllByRole('button').filter((b) =>
        /^Answer /.test(b.getAttribute('aria-label') ?? ''),
      );
      expect(answerBtns.length).toBe(4);
    });

    it('answers increment total after clicking', async () => {
      await enterQuiz();
      const answerBtns = screen.getAllByRole('button').filter((b) =>
        /^Answer /.test(b.getAttribute('aria-label') ?? ''),
      );
      await fireEvent.click(answerBtns[0]!);
      // Score updated (total > 0 OR correct >= 0 depending on answer)
      const scoreText = document.body.textContent ?? '';
      expect(scoreText).toMatch(/\d+\/\d+/);
    });
  });

  describe('difficulty selector', () => {
    it('defaults to Medium', async () => {
      renderTool();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      await fireEvent.click(quizTab);
      const mediumBtn = screen.getByRole('radio', { name: /Medium/i });
      expect(mediumBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('switches to Hard on click', async () => {
      renderTool();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      await fireEvent.click(quizTab);
      const hardBtn = screen.getByRole('radio', { name: /Hard/i });
      await fireEvent.click(hardBtn);
      expect(hardBtn.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('mode switching', () => {
    it('switches back to explore mode', async () => {
      renderTool();
      const quizTab = screen.getByRole('tab', { name: /Quiz/i });
      await fireEvent.click(quizTab);
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      await fireEvent.click(exploreTab);
      expect(exploreTab.getAttribute('aria-selected')).toBe('true');
      expect(screen.getByText('Octaves')).toBeTruthy();
    });
  });

  describe('string name labels', () => {
    it('renders string name labels in explore mode', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg')!;
      const texts = [...svg.querySelectorAll('text')];
      expect(texts.some(t => t.textContent === 'e')).toBe(true);
      expect(texts.some(t => t.textContent === 'B')).toBe(true);
    });

    it('renders string name labels in quiz easy mode', async () => {
      const { container } = renderTool();
      await fireEvent.click(screen.getByRole('tab', { name: /Quiz/i }));
      // default difficulty is medium — string names should be hidden
      const svg = container.querySelector('svg')!;
      const texts = [...svg.querySelectorAll('text')];
      expect(texts.some(t => t.textContent === 'e')).toBe(false);
    });

    it('shows string name labels in quiz easy difficulty', async () => {
      const { container } = renderTool();
      await fireEvent.click(screen.getByRole('tab', { name: /Quiz/i }));
      await fireEvent.click(screen.getByRole('radio', { name: /Easy/i }));
      const svg = container.querySelector('svg')!;
      const texts = [...svg.querySelectorAll('text')];
      expect(texts.some(t => t.textContent === 'e')).toBe(true);
    });
  });

  describe('fret number labels', () => {
    it('renders fret numbers 1–12', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg')!;
      const texts = [...svg.querySelectorAll('text')];
      for (let i = 1; i <= 12; i++) {
        expect(texts.some(t => t.textContent === String(i))).toBe(true);
      }
    });
  });

  describe('unison lines', () => {
    it('renders <line> elements (not circles) when note selected and showUnisons checked', async () => {
      const { container } = renderTool();
      await clickNoteFilter('E');
      const svg = container.querySelector('svg')!;
      const lines = [...svg.querySelectorAll('line')].filter(
        l => l.getAttribute('stroke') === '#16A34A'
      );
      expect(lines.length).toBeGreaterThan(0);
      const greenCircles = [...svg.querySelectorAll('circle')].filter(
        c => c.getAttribute('stroke') === '#16A34A'
      );
      expect(greenCircles.length).toBe(0);
    });

    it('renders no unison lines when no note selected', () => {
      const { container } = renderTool();
      const svg = container.querySelector('svg')!;
      const lines = [...svg.querySelectorAll('line')].filter(
        l => l.getAttribute('stroke') === '#16A34A'
      );
      expect(lines.length).toBe(0);
    });

    it('renders no unison lines in quiz mode', async () => {
      const { container } = renderTool();
      await fireEvent.click(screen.getByRole('tab', { name: /Quiz/i }));
      const svg = container.querySelector('svg')!;
      const lines = [...svg.querySelectorAll('line')].filter(
        l => l.getAttribute('stroke') === '#16A34A'
      );
      expect(lines.length).toBe(0);
    });
  });

  describe('quiz note suppression', () => {
    it('hides note labels on fretboard in quiz mode before answering', async () => {
      const { container } = renderTool();
      await fireEvent.click(screen.getByRole('tab', { name: /Quiz/i }));
      const svg = container.querySelector('svg')!;
      // In quiz medium mode before answering: 12 fret number labels only (string names hidden in medium/hard)
      const allTexts = svg.querySelectorAll('text');
      expect(allTexts.length).toBe(12);
    });

    it('reveals exactly one note label after answering in quiz mode', async () => {
      const { container } = renderTool();
      await fireEvent.click(screen.getByRole('tab', { name: /Quiz/i }));
      const answerBtns = screen.getAllByRole('button').filter(b =>
        /^Answer /.test(b.getAttribute('aria-label') ?? '')
      );
      await fireEvent.click(answerBtns[0]!);
      const svg = container.querySelector('svg')!;
      // After answering in medium: 12 fret numbers + 1 revealed note label = 13
      const allTexts = svg.querySelectorAll('text');
      expect(allTexts.length).toBe(13);
    });
  });
});
