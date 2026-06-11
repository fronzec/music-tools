import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProgressionBar from '$lib/components/ProgressionBar.svelte';
import type { ProgressionChord } from '$lib/types/progression';
import { MAX_CHORDS } from '$lib/types/progression';

describe('ProgressionBar', () => {
  function makeChord(overrides: Partial<ProgressionChord> = {}): ProgressionChord {
    return {
      id: crypto.randomUUID(),
      root: 'C',
      quality: 'major',
      ...overrides,
    };
  }

  function renderBar(opts: {
    progression?: ProgressionChord[];
    activeIndex?: number;
    quality?: 'major' | 'minor';
  } = {}) {
    const {
      progression = [makeChord({ root: 'C' }), makeChord({ root: 'F' }), makeChord({ root: 'G' })],
      activeIndex = 0,
      quality = 'major',
    } = opts;
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const result = render(ProgressionBar, {
      progression,
      activeIndex,
      quality,
      onSelect,
      onAdd,
      onRemove,
    });
    return { onSelect, onAdd, onRemove, ...result };
  }

  describe('initial render', () => {
    it('renders the Progression title', () => {
      renderBar();
      expect(screen.getByText('Progression')).toBeTruthy();
    });

    it('renders chord pills with root and quality text', () => {
      renderBar({
        progression: [
          makeChord({ root: 'C', quality: 'major' }),
          makeChord({ root: 'F', quality: 'major' }),
        ],
      });
      expect(screen.getByText('C major')).toBeTruthy();
      expect(screen.getByText('F major')).toBeTruthy();
    });

    it('renders the + Add button when under MAX_CHORDS', () => {
      renderBar();
      expect(screen.getByText('+ Add')).toBeTruthy();
    });
  });

  describe('active highlighting', () => {
    it('highlights the active chord pill with aria-pressed', () => {
      renderBar({ activeIndex: 1 });
      const pills = screen.getAllByRole('button', { name: /Select chord/ });
      expect(pills[0]!.getAttribute('aria-pressed')).toBe('false');
      expect(pills[1]!.getAttribute('aria-pressed')).toBe('true');
    });

    it('clicking a chord pill calls onSelect with the correct index', async () => {
      const { onSelect } = renderBar();
      const pills = screen.getAllByRole('button', { name: /Select chord/ });
      await pills[1]!.click();
      expect(onSelect).toHaveBeenCalledWith(1);
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('add chord picker', () => {
    it('clicking + Add opens the chromatic note picker', async () => {
      renderBar();
      const addBtn = screen.getByText('+ Add');
      await addBtn.click();
      // After clicking + Add, the 12 note buttons should be visible
      expect(screen.getByText('C')).toBeTruthy();
      expect(screen.getByText('F#')).toBeTruthy();
    });

    it('selecting a note from the picker calls onAdd with that note', async () => {
      const { onAdd } = renderBar();
      const addBtn = screen.getByText('+ Add');
      await addBtn.click();
      // Find the D# button in the picker grid
      const noteBtn = screen.getByRole('button', { name: /Add D# major chord/ });
      await noteBtn.click();
      expect(onAdd).toHaveBeenCalledWith('D#');
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove chord', () => {
    it('calls onRemove when the remove button is clicked', async () => {
      const { onRemove } = renderBar();
      const removeBtns = screen.getAllByRole('button', { name: /Remove chord/ });
      await removeBtns[0]!.click();
      expect(onRemove).toHaveBeenCalledWith(0);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('MAX_CHORDS guard', () => {
    it('hides the + Add button when progression is at MAX_CHORDS', () => {
      const fullProgression = Array.from({ length: MAX_CHORDS }, (_, i) =>
        makeChord({ root: 'C', id: `chord-${i}` }),
      );
      renderBar({ progression: fullProgression });
      expect(screen.queryByText('+ Add')).toBeNull();
    });
  });
});
