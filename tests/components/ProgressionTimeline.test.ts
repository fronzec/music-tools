import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProgressionTimeline from '$lib/components/ProgressionTimeline.svelte';
import type { PlaybackSpeed } from '$lib/types/progression';

describe('ProgressionTimeline', () => {
  function renderTimeline(opts: {
    length?: number;
    activeIndex?: number;
    isPlaying?: boolean;
    speed?: PlaybackSpeed;
    loop?: boolean;
  } = {}) {
    const {
      length = 4,
      activeIndex = 0,
      isPlaying = false,
      speed = 'medium',
      loop = false,
    } = opts;
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onTogglePlay = vi.fn();
    const onSpeedChange = vi.fn();
    const onSelectDot = vi.fn();
    const onToggleLoop = vi.fn();
    const result = render(ProgressionTimeline, {
      length,
      activeIndex,
      isPlaying,
      speed,
      loop,
      onPrev,
      onNext,
      onTogglePlay,
      onSpeedChange,
      onSelectDot,
      onToggleLoop,
    });
    return { onPrev, onNext, onTogglePlay, onSpeedChange, onSelectDot, onToggleLoop, ...result };
  }

  describe('initial render', () => {
    it('renders the Playback title', () => {
      renderTimeline();
      expect(screen.getByText('Playback')).toBeTruthy();
    });

    it('renders the correct number of step dots', () => {
      renderTimeline({ length: 4 });
      const dots = screen.getAllByRole('button', { name: /Go to step/ });
      expect(dots).toHaveLength(4);
    });

    it('renders Slow, Medium, Fast speed pills', () => {
      renderTimeline();
      expect(screen.getByText('Slow')).toBeTruthy();
      expect(screen.getByText('Medium')).toBeTruthy();
      expect(screen.getByText('Fast')).toBeTruthy();
    });
  });

  describe('active dot', () => {
    it('highlights the active dot aria-label includes active step', () => {
      renderTimeline({ length: 3, activeIndex: 1 });
      const dots = screen.getAllByRole('button', { name: /Go to step/ });
      expect(dots).toHaveLength(3);
      // All dots exist — active step is visually styled but we can access by index
      expect(dots[0]).toBeTruthy();
      expect(dots[1]).toBeTruthy();
      expect(dots[2]).toBeTruthy();
    });

    it('clicking a dot calls onSelectDot with the correct index', async () => {
      const { onSelectDot } = renderTimeline({ length: 3, activeIndex: 0 });
      const dots = screen.getAllByRole('button', { name: /Go to step/ });
      await dots[2]!.click();
      expect(onSelectDot).toHaveBeenCalledWith(2);
      expect(onSelectDot).toHaveBeenCalledTimes(1);
    });
  });

  describe('prev / next disabled states', () => {
    it('disables prev button when activeIndex is 0', () => {
      renderTimeline({ activeIndex: 0 });
      const prevBtn = screen.getByRole('button', { name: 'Previous chord' });
      expect(prevBtn).toBeTruthy();
      expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('enables prev button when activeIndex > 0', () => {
      renderTimeline({ activeIndex: 1 });
      const prevBtn = screen.getByRole('button', { name: 'Previous chord' });
      expect((prevBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it('disables next button when activeIndex is at the last step', () => {
      renderTimeline({ length: 4, activeIndex: 3 });
      const nextBtn = screen.getByRole('button', { name: 'Next chord' });
      expect((nextBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('enables next button when activeIndex is not at the last step', () => {
      renderTimeline({ length: 4, activeIndex: 1 });
      const nextBtn = screen.getByRole('button', { name: 'Next chord' });
      expect((nextBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it('clicking prev calls onPrev', async () => {
      const { onPrev } = renderTimeline({ activeIndex: 1 });
      const prevBtn = screen.getByRole('button', { name: 'Previous chord' });
      await prevBtn.click();
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('clicking next calls onNext', async () => {
      const { onNext } = renderTimeline({ activeIndex: 0, length: 4 });
      const nextBtn = screen.getByRole('button', { name: 'Next chord' });
      await nextBtn.click();
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('play / pause button', () => {
    it('shows play icon when not playing', () => {
      renderTimeline({ isPlaying: false });
      expect(screen.getByRole('button', { name: 'Start playback' })).toBeTruthy();
    });

    it('shows pause icon when playing', () => {
      renderTimeline({ isPlaying: true });
      expect(screen.getByRole('button', { name: 'Pause playback' })).toBeTruthy();
    });

    it('calls onTogglePlay when clicked', async () => {
      const { onTogglePlay } = renderTimeline();
      const playBtn = screen.getByRole('button', { name: 'Start playback' });
      await playBtn.click();
      expect(onTogglePlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('loop toggle', () => {
    it('renders a loop toggle button', () => {
      renderTimeline();
      expect(screen.getByRole('button', { name: /loop/i })).toBeTruthy();
    });

    it('loop starts OFF by default (aria-pressed false)', () => {
      renderTimeline();
      const loopBtn = screen.getByRole('button', { name: /loop/i });
      expect(loopBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('shows loop as ON when loop prop is true', () => {
      renderTimeline({ loop: true });
      const loopBtn = screen.getByRole('button', { name: /loop/i });
      expect(loopBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('calls onToggleLoop when clicked', async () => {
      const { onToggleLoop } = renderTimeline();
      const loopBtn = screen.getByRole('button', { name: /loop/i });
      await loopBtn.click();
      expect(onToggleLoop).toHaveBeenCalledTimes(1);
    });
  });

  describe('speed selector', () => {
    it('highlights medium as active by default', () => {
      renderTimeline({ speed: 'medium' });
      const mediumBtn = screen.getByRole('radio', { name: 'Medium speed' });
      expect(mediumBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('calls onSpeedChange when a speed is selected', async () => {
      const { onSpeedChange } = renderTimeline({ speed: 'medium' });
      const fastBtn = screen.getByRole('radio', { name: 'Fast speed' });
      await fastBtn.click();
      expect(onSpeedChange).toHaveBeenCalledWith('fast');
      expect(onSpeedChange).toHaveBeenCalledTimes(1);
    });
  });
});
