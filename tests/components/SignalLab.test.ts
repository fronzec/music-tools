import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import SignalLab from '$lib/components/SignalLab.svelte';
import type { ViewName } from '$lib/types/chord';

describe('SignalLab', () => {
  type OscillatorMock = {
    type: string;
    frequency: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  type GainMock = {
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      setTargetAtTime: ReturnType<typeof vi.fn>;
      cancelScheduledValues: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  // First oscillator/gain created are the tone osc + master gain; the rest
  // (LFO, tremolo gain, depth gain) back the tremolo effect.
  let mockOscillator: OscillatorMock;
  let mockLfo: OscillatorMock;
  let mockWaveShaper: {
    oversample: string;
    curve: Float32Array | null;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let mockBiquad: {
    type: string;
    frequency: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
    Q: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let mockGain: GainMock;
  let mockTremoloGain: GainMock;
  let mockLfoDepth: GainMock;
  let mockAnalyser: {
    fftSize: number;
    frequencyBinCount: number;
    getByteTimeDomainData: ReturnType<typeof vi.fn>;
    getByteFrequencyData: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  };
  let mockCtx: {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createAnalyser: ReturnType<typeof vi.fn>;
    createWaveShaper: ReturnType<typeof vi.fn>;
    createBiquadFilter: ReturnType<typeof vi.fn>;
    destination: object;
    currentTime: number;
    close: ReturnType<typeof vi.fn>;
  };

  function makeOscillator(): OscillatorMock {
    return {
      type: 'sine',
      frequency: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  function makeGain(): GainMock {
    return {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  beforeEach(() => {
    // Creation order in start(): tone osc, master gain, …, LFO, tremolo gain,
    // depth gain. Hand each create() call the next distinct mock so the tests
    // can assert on the tremolo nodes independently of the tone/master ones.
    mockOscillator = makeOscillator();
    mockLfo = makeOscillator();
    mockGain = makeGain();
    mockTremoloGain = makeGain();
    mockLfoDepth = makeGain();
    const oscillators = [mockOscillator, mockLfo];
    const gains = [mockGain, mockTremoloGain, mockLfoDepth];
    let oscIdx = 0;
    let gainIdx = 0;
    mockWaveShaper = { oversample: '', curve: null, connect: vi.fn(), disconnect: vi.fn() };
    mockBiquad = {
      type: '',
      frequency: { value: 0, setTargetAtTime: vi.fn() },
      Q: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    mockAnalyser = {
      fftSize: 0,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      connect: vi.fn(),
    };
    mockCtx = {
      createOscillator: vi.fn(() => oscillators[oscIdx++] ?? makeOscillator()),
      createGain: vi.fn(() => gains[gainIdx++] ?? makeGain()),
      createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
      createWaveShaper: vi.fn().mockReturnValue(mockWaveShaper),
      createBiquadFilter: vi.fn().mockReturnValue(mockBiquad),
      destination: { _dest: true },
      currentTime: 0,
      close: vi.fn(),
    };
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function (this: unknown) {
        return mockCtx;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderTool() {
    const navigate = vi.fn() as (view: ViewName) => void;
    return { navigate, ...render(SignalLab, { navigate }) };
  }

  describe('initial render', () => {
    it('renders the title and back button', () => {
      renderTool();
      expect(screen.getByText('Signal Lab')).toBeTruthy();
      expect(screen.getByText('← Back to Home')).toBeTruthy();
    });

    it('back button navigates home', async () => {
      const { navigate } = renderTool();
      await fireEvent.click(screen.getByText('← Back to Home'));
      expect(navigate).toHaveBeenCalledWith('home');
    });

    it('renders all four waveform options', () => {
      renderTool();
      for (const wt of ['sine', 'triangle', 'sawtooth', 'square']) {
        expect(screen.getByRole('radio', { name: wt })).toBeTruthy();
      }
    });

    it('defaults to sawtooth (rich spectrum to visualize)', () => {
      renderTool();
      expect(screen.getByRole('radio', { name: 'sawtooth' }).getAttribute('aria-checked')).toBe(
        'true',
      );
    });

    it('renders frequency and volume sliders', () => {
      renderTool();
      expect(screen.getByRole('slider', { name: 'Frequency' })).toBeTruthy();
      expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
    });

    it('renders the oscilloscope and spectrum canvases', () => {
      const { container } = renderTool();
      expect(container.querySelectorAll('canvas')).toHaveLength(2);
    });

    it('does not create an AudioContext until played', () => {
      renderTool();
      expect((globalThis.AudioContext as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    });
  });

  describe('playback', () => {
    it('Play creates the audio graph (oscillator + analyser) and starts', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createAnalyser).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.frequency.value).toBe(220);
    });

    it('toggles to Stop and stops the oscillator', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Stop tone' }));
      expect(mockOscillator.stop).toHaveBeenCalled();
    });
  });

  describe('live updates while playing', () => {
    it('moving the frequency slider updates the oscillator frequency live', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Frequency' }), {
        target: { value: '440' },
      });
      expect(mockOscillator.frequency.setTargetAtTime).toHaveBeenCalledWith(
        440,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('moving the volume slider updates the master gain live', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Volume' }), {
        target: { value: '0.2' },
      });
      expect(mockGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        0.2,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('closes the AudioContext on unmount', async () => {
      const { unmount } = renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      unmount();
      expect(mockCtx.close).toHaveBeenCalled();
    });
  });

  function effectGroup(name: string) {
    return within(screen.getByRole('radiogroup', { name }));
  }

  describe('distortion effect', () => {
    it('is off (bypassed) by default', () => {
      renderTool();
      expect(
        effectGroup('Distortion').getByRole('radio', { name: 'Off' }).getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('creates a waveshaper with a 4x-oversampled distortion curve on play', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      expect(mockCtx.createWaveShaper).toHaveBeenCalled();
      expect(mockWaveShaper.oversample).toBe('4x');
      expect(mockWaveShaper.curve).toBeInstanceOf(Float32Array);
    });

    it('routes the oscillator through the waveshaper when turned on', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Distortion').getByRole('radio', { name: 'On' }));
      expect(mockOscillator.disconnect).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockWaveShaper);
    });

    it('regenerates the curve when drive changes while playing', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      const before = mockWaveShaper.curve;
      await fireEvent.input(screen.getByRole('slider', { name: 'Distortion drive' }), {
        target: { value: '80' },
      });
      expect(mockWaveShaper.curve).toBeInstanceOf(Float32Array);
      expect(mockWaveShaper.curve).not.toBe(before);
    });
  });

  describe('low-pass filter effect', () => {
    it('is off (bypassed) by default', () => {
      renderTool();
      expect(
        effectGroup('Low-pass filter')
          .getByRole('radio', { name: 'Off' })
          .getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('creates a lowpass biquad on play', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
      expect(mockBiquad.type).toBe('lowpass');
    });

    it('routes the oscillator through the filter when turned on', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Low-pass filter').getByRole('radio', { name: 'On' }));
      // With distortion off and filter on: oscillator → biquad → analyser.
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockBiquad);
      expect(mockBiquad.connect).toHaveBeenCalledWith(mockAnalyser);
    });

    it('updates cutoff and resonance live', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Filter cutoff' }), {
        target: { value: '500' },
      });
      await fireEvent.input(screen.getByRole('slider', { name: 'Filter resonance' }), {
        target: { value: '5' },
      });
      expect(mockBiquad.frequency.setTargetAtTime).toHaveBeenCalledWith(
        500,
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockBiquad.Q.setTargetAtTime).toHaveBeenCalledWith(
        5,
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('tremolo effect', () => {
    it('is off (bypassed) by default', () => {
      renderTool();
      expect(
        effectGroup('Tremolo').getByRole('radio', { name: 'Off' }).getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('creates an LFO and tremolo gain on play and starts the LFO', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      // Two oscillators: the tone osc plus the tremolo LFO.
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockLfo.start).toHaveBeenCalled();
      // LFO → depth gain → tremolo gain's gain param (the modulation path).
      expect(mockLfo.connect).toHaveBeenCalledWith(mockLfoDepth);
      expect(mockLfoDepth.connect).toHaveBeenCalledWith(mockTremoloGain.gain);
    });

    it('routes the oscillator through the tremolo gain when turned on', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Tremolo').getByRole('radio', { name: 'On' }));
      // With other effects off and tremolo on: oscillator → tremolo gain → analyser.
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockTremoloGain);
      expect(mockTremoloGain.connect).toHaveBeenCalledWith(mockAnalyser);
    });

    it('stops the LFO when playback stops', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Stop tone' }));
      expect(mockLfo.stop).toHaveBeenCalled();
    });

    it('updates rate and depth live', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Tremolo rate' }), {
        target: { value: '8' },
      });
      await fireEvent.input(screen.getByRole('slider', { name: 'Tremolo depth' }), {
        target: { value: '0.8' },
      });
      expect(mockLfo.frequency.setTargetAtTime).toHaveBeenCalledWith(
        8,
        expect.any(Number),
        expect.any(Number),
      );
      // Depth centers the tremolo gain at 1 - depth/2 and scales the LFO by depth/2.
      expect(mockTremoloGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        1 - 0.8 / 2,
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockLfoDepth.gain.setTargetAtTime).toHaveBeenCalledWith(
        0.8 / 2,
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('waveform selection', () => {
    it('selecting square updates aria-checked and the live oscillator', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(screen.getByRole('radio', { name: 'square' }));
      expect(screen.getByRole('radio', { name: 'square' }).getAttribute('aria-checked')).toBe('true');
      expect(mockOscillator.type).toBe('square');
    });
  });
});
