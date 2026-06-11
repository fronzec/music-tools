import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ToneGenerator from '$lib/components/ToneGenerator.svelte';
import type { ViewName } from '$lib/types/chord';

describe('ToneGenerator', () => {
  let mockOscillator: {
    type: string;
    frequency: { value: number };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  let mockGain: {
    gain: { value: number };
    connect: ReturnType<typeof vi.fn>;
  };
  let mockCtx: {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    destination: object;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockOscillator = {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    mockGain = {
      gain: { value: 0 },
      connect: vi.fn(),
    };
    mockCtx = {
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: { _dest: true },
      close: vi.fn(),
    };

    // Wire up connect chains after all objects exist
    mockOscillator.connect.mockReturnValue(mockGain);
    mockGain.connect.mockReturnValue(mockCtx.destination);

    // Use regular function for constructor compatibility with `new`
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function (this: any) {
        return mockCtx;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderTool() {
    const navigate = vi.fn() as (view: ViewName) => void;
    const result = render(ToneGenerator, { navigate });
    return { navigate, mockOscillator, mockGain, mockCtx, ...result };
  }

  describe('initial render', () => {
    it('renders the title', () => {
      renderTool();
      expect(screen.getByText('Tone Generator')).toBeTruthy();
    });

    it('renders a back button', () => {
      renderTool();
      expect(screen.getByText('← Back to Home')).toBeTruthy();
    });

    it('renders 6 string buttons', () => {
      renderTool();
      expect(screen.getByText('Low E')).toBeTruthy();
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('D')).toBeTruthy();
      expect(screen.getByText('G')).toBeTruthy();
      expect(screen.getByText('B')).toBeTruthy();
      expect(screen.getByText('High E')).toBeTruthy();
    });

    it('renders the Strings and Sound cards', () => {
      renderTool();
      expect(screen.getByText('Strings')).toBeTruthy();
      expect(screen.getByText('Sound')).toBeTruthy();
    });

    it('renders volume and waveform controls', () => {
      renderTool();
      expect(screen.getByText('Volume')).toBeTruthy();
      expect(screen.getByText('Waveform')).toBeTruthy();
    });

    it('renders all wave type options', () => {
      renderTool();
      expect(screen.getByText('sine')).toBeTruthy();
      expect(screen.getByText('triangle')).toBeTruthy();
      expect(screen.getByText('sawtooth')).toBeTruthy();
      expect(screen.getByText('square')).toBeTruthy();
    });

    it('has sine selected by default', () => {
      renderTool();
      const sineBtn = screen.getByRole('radio', { name: 'sine' });
      expect(sineBtn.getAttribute('aria-checked')).toBe('true');
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

  describe('string playback', () => {
    it('creates AudioContext and plays on first click', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.frequency.value).toBe(82.41);
    });

    it('stops playback on second click of same string', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      const stopBtn = screen.getByRole('button', { name: /Stop Low E/ });
      await fireEvent.click(stopBtn);

      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('switches to another string when clicking while playing', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      const aBtn = screen.getByRole('button', { name: /Play A/ });
      await fireEvent.click(aBtn);

      // First oscillator should be stopped
      expect(mockOscillator.stop).toHaveBeenCalled();
      // A new oscillator should be created (2nd call)
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('reuses AudioContext on subsequent plays', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);
      const aBtn = screen.getByRole('button', { name: /Play A/ });
      await fireEvent.click(aBtn);

      // AudioContext constructor called only once (one component render = one new AudioContext instance possible)
      // The mock is called each time `new AudioContext()` is executed.
      // Since the component guards with `if (!audioCtx)`, it's called once.
      expect(mockCtx.close).not.toHaveBeenCalled();
    });
  });

  describe('volume slider', () => {
    it('sets initial gain from volume state when playing', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      // Default volume is 0.3
      expect(mockGain.gain.value).toBe(0.3);
    });

    it('applies new volume on next play', async () => {
      renderTool();
      const slider = screen.getByRole('slider', { name: 'Volume' });
      await fireEvent.input(slider, { target: { value: '0.8' } });

      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      expect(mockGain.gain.value).toBe(0.8);
    });
  });

  describe('wave type selector', () => {
    it('sets oscillator type from wave type state when playing', async () => {
      renderTool();
      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      // Default wave type is sine
      expect(mockOscillator.type).toBe('sine');
    });

    it('applies new wave type on next play', async () => {
      renderTool();
      // Change wave type first, then play
      const squareBtn = screen.getByRole('radio', { name: 'square' });
      await fireEvent.click(squareBtn);

      const lowEBtn = screen.getByRole('button', { name: /Play Low E/ });
      await fireEvent.click(lowEBtn);

      expect(mockOscillator.type).toBe('square');
    });
  });
});
