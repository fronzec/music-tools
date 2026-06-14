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
    const onQualityChange = vi.fn();
    const result = render(ProgressionBar, {
      progression,
      activeIndex,
      quality,
      onSelect,
      onAdd,
      onRemove,
      onQualityChange,
    });
    return { onSelect, onAdd, onRemove, onQualityChange, ...result };
  }

  describe('initial render', () => {
    it('renders the Progression title', () => {
      renderBar();
      expect(screen.getByText('Progression')).toBeTruthy();
    });

    it('renders chord pills with the root and an accessible quality label', () => {
      renderBar({
        progression: [
          makeChord({ root: 'C', quality: 'major' }),
          makeChord({ root: 'F', quality: 'major' }),
        ],
      });
      // The visible label is the root only; quality lives in the inline toggle.
      expect(screen.getByRole('button', { name: 'Select chord C major at position 1' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Select chord F major at position 2' })).toBeTruthy();
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
      // After clicking + Add, the 12 note buttons should be visible.
      // Target by the picker aria-label since roots also appear on chips.
      expect(screen.getByRole('button', { name: 'Add C major chord' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Add F# major chord' })).toBeTruthy();
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

  describe('per-chord quality toggle', () => {
    it('renders a major/minor toggle for every chord', () => {
      renderBar({
        progression: [makeChord({ root: 'C' }), makeChord({ root: 'F' })],
      });
      expect(screen.getAllByRole('radio', { name: /to major$/ })).toHaveLength(2);
      expect(screen.getAllByRole('radio', { name: /to minor$/ })).toHaveLength(2);
    });

    it('marks the active quality segment with aria-checked', () => {
      renderBar({
        progression: [makeChord({ root: 'A', quality: 'minor' })],
      });
      const major = screen.getByRole('radio', { name: 'Set chord 1 to major' });
      const minor = screen.getByRole('radio', { name: 'Set chord 1 to minor' });
      expect(major.getAttribute('aria-checked')).toBe('false');
      expect(minor.getAttribute('aria-checked')).toBe('true');
    });

    it('clicking the minor segment calls onQualityChange with index and minor', async () => {
      const { onQualityChange } = renderBar({
        progression: [makeChord({ root: 'C' }), makeChord({ root: 'F' })],
      });
      const minorToggles = screen.getAllByRole('radio', { name: /to minor$/ });
      await minorToggles[1]!.click();
      expect(onQualityChange).toHaveBeenCalledWith(1, 'minor');
      expect(onQualityChange).toHaveBeenCalledTimes(1);
    });

    it('clicking the major segment calls onQualityChange with index and major', async () => {
      const { onQualityChange } = renderBar({
        progression: [makeChord({ root: 'C', quality: 'minor' })],
      });
      const majorToggle = screen.getByRole('radio', { name: 'Set chord 1 to major' });
      await majorToggle.click();
      expect(onQualityChange).toHaveBeenCalledWith(0, 'major');
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
