import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import SignalLab from '$lib/components/SignalLab.svelte';
import type { ViewName } from '$lib/types/chord';
import { normalizeAmps, buildPeriodicWave, presetAmps } from '$lib/audio/additive';

describe('SignalLab', () => {
  type OscillatorMock = {
    type: string;
    frequency: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    setPeriodicWave: ReturnType<typeof vi.fn>;
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
  type DelayMock = {
    delayTime: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let mockGain: GainMock;
  let mockTremoloGain: GainMock;
  let mockLfoDepth: GainMock;
  // Delay sub-graph nodes (dry/wet split + feedback loop).
  let mockFeedbackGain: GainMock;
  let mockDelayInput: GainMock;
  let mockDelayOutput: GainMock;
  let mockWetGain: GainMock;
  let mockDelay: DelayMock;
  type AnalyserMock = {
    fftSize: number;
    frequencyBinCount: number;
    getByteTimeDomainData: ReturnType<typeof vi.fn>;
    getByteFrequencyData: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  };
  // Two analysers: the processed tap (end of the effect chain) and the clean
  // tap (raw oscillator), so the scopes can show input vs output side by side.
  let mockAnalyser: AnalyserMock;
  let mockCleanAnalyser: AnalyserMock;
  let mockCtx: {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createAnalyser: ReturnType<typeof vi.fn>;
    createWaveShaper: ReturnType<typeof vi.fn>;
    createBiquadFilter: ReturnType<typeof vi.fn>;
    createDelay: ReturnType<typeof vi.fn>;
    createPeriodicWave: ReturnType<typeof vi.fn>;
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
      setPeriodicWave: vi.fn(),
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

  function makeAnalyser(): AnalyserMock {
    return {
      fftSize: 0,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      connect: vi.fn(),
    };
  }

  beforeEach(() => {
    // Creation order in start() drives the index arrays below. Oscillators:
    // tone osc, then tremolo LFO. Gains: master, tremolo gain, LFO depth, then
    // the delay sub-graph (feedback, dry/wet input, output, wet). Handing each
    // create() the next distinct mock lets tests assert on a specific node.
    mockOscillator = makeOscillator();
    mockLfo = makeOscillator();
    mockGain = makeGain();
    mockTremoloGain = makeGain();
    mockLfoDepth = makeGain();
    mockFeedbackGain = makeGain();
    mockDelayInput = makeGain();
    mockDelayOutput = makeGain();
    mockWetGain = makeGain();
    mockDelay = {
      delayTime: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const oscillators = [mockOscillator, mockLfo];
    const gains = [
      mockGain,
      mockTremoloGain,
      mockLfoDepth,
      mockFeedbackGain,
      mockDelayInput,
      mockDelayOutput,
      mockWetGain,
    ];
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
    // Processed analyser is created first, clean tap second (matches start()).
    mockAnalyser = makeAnalyser();
    mockCleanAnalyser = makeAnalyser();
    const analysers = [mockAnalyser, mockCleanAnalyser];
    let analyserIdx = 0;
    mockCtx = {
      createOscillator: vi.fn(() => oscillators[oscIdx++] ?? makeOscillator()),
      createGain: vi.fn(() => gains[gainIdx++] ?? makeGain()),
      createAnalyser: vi.fn(() => analysers[analyserIdx++] ?? makeAnalyser()),
      createWaveShaper: vi.fn().mockReturnValue(mockWaveShaper),
      createBiquadFilter: vi.fn().mockReturnValue(mockBiquad),
      createDelay: vi.fn().mockReturnValue(mockDelay),
      createPeriodicWave: vi.fn((real: Float32Array, imag: Float32Array) => ({ _periodicWave: true, real, imag })),
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

    it('renders clean + processed oscilloscope and spectrum canvases', () => {
      const { container } = renderTool();
      // Two columns (clean vs processed), each with a scope + spectrum = 4.
      expect(container.querySelectorAll('canvas')).toHaveLength(4);
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

  describe('delay effect', () => {
    it('is off (bypassed) by default', () => {
      renderTool();
      expect(
        effectGroup('Delay').getByRole('radio', { name: 'Off' }).getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('builds the delay sub-graph (dry/wet split + feedback loop) on play', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      expect(mockCtx.createDelay).toHaveBeenCalled();
      // Dry path: input → output. Wet path: input → delay → wet → output.
      expect(mockDelayInput.connect).toHaveBeenCalledWith(mockDelayOutput);
      expect(mockDelayInput.connect).toHaveBeenCalledWith(mockDelay);
      expect(mockDelay.connect).toHaveBeenCalledWith(mockWetGain);
      expect(mockWetGain.connect).toHaveBeenCalledWith(mockDelayOutput);
      // Feedback loop: delay → feedback → delay.
      expect(mockDelay.connect).toHaveBeenCalledWith(mockFeedbackGain);
      expect(mockFeedbackGain.connect).toHaveBeenCalledWith(mockDelay);
    });

    it('routes the chain through the delay input/output when turned on', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Delay').getByRole('radio', { name: 'On' }));
      // With other effects off and delay on: oscillator → delayInput, delayOutput → analyser.
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockDelayInput);
      expect(mockDelayOutput.connect).toHaveBeenCalledWith(mockAnalyser);
    });

    it('updates time, feedback, and mix live', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Delay time' }), {
        target: { value: '0.4' },
      });
      await fireEvent.input(screen.getByRole('slider', { name: 'Delay feedback' }), {
        target: { value: '0.6' },
      });
      await fireEvent.input(screen.getByRole('slider', { name: 'Delay mix' }), {
        target: { value: '0.7' },
      });
      expect(mockDelay.delayTime.setTargetAtTime).toHaveBeenCalledWith(
        0.4,
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockFeedbackGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        0.6,
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockWetGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        0.7,
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('clean vs processed comparison', () => {
    it('creates a second analyser for the clean (pre-effects) tap on play', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      // One analyser for the processed output, one for the clean input.
      expect(mockCtx.createAnalyser).toHaveBeenCalledTimes(2);
    });

    it('taps the raw oscillator into the clean analyser', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      // The clean scope observes the oscillator directly, before any effect.
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockCleanAnalyser);
    });

    it('keeps the clean tap wired after an effect is toggled', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      mockOscillator.connect.mockClear();
      // rebuildChain() disconnects the oscillator, so it must re-establish the
      // clean tap on every rewire — otherwise toggling an effect kills it.
      await fireEvent.click(effectGroup('Distortion').getByRole('radio', { name: 'On' }));
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockCleanAnalyser);
    });

    it('never wires the clean analyser onward (stays a passive leaf)', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      // Safety invariant: the clean tap only observes. If it ever connected
      // forward it would feed the audible chain — so it must have NO outputs,
      // even after rewiring from an effect toggle.
      await fireEvent.click(effectGroup('Distortion').getByRole('radio', { name: 'On' }));
      expect(mockCleanAnalyser.connect).not.toHaveBeenCalled();
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

  describe('source mode', () => {
    it('renders a Source radiogroup', () => {
      renderTool();
      expect(screen.getByRole('radiogroup', { name: 'Source' })).toBeTruthy();
    });

    it('defaults to Waveform mode selected', () => {
      renderTool();
      expect(
        effectGroup('Source').getByRole('radio', { name: 'Waveform' }).getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('in waveform mode, selecting square still sets oscillator.type (regression guard)', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(screen.getByRole('radio', { name: 'square' }));
      expect(mockOscillator.type).toBe('square');
    });

    it('in waveform mode, setPeriodicWave is never called', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(screen.getByRole('radio', { name: 'square' }));
      expect(mockOscillator.setPeriodicWave).not.toHaveBeenCalled();
    });
  });

  describe('harmonic slider bank', () => {
    it('harmonic sliders are not visible/interactable in Waveform mode', () => {
      renderTool();
      // In waveform mode, harmonic sliders should not exist
      expect(screen.queryByRole('slider', { name: 'Harmonic 1 amplitude' })).toBeNull();
    });

    it('switching to Additive mode shows 8 harmonic sliders', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      expect(screen.getAllByRole('slider', { name: /Harmonic \d+ amplitude/ })).toHaveLength(8);
    });

    it('harmonic slider 1 defaults to 1, others to 0', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      const sliders = screen.getAllByRole('slider', { name: /Harmonic \d+ amplitude/ });
      expect(Number(sliders[0].getAttribute('value') ?? (sliders[0] as HTMLInputElement).value)).toBeCloseTo(1);
      for (let i = 1; i < 8; i++) {
        expect(Number(sliders[i].getAttribute('value') ?? (sliders[i] as HTMLInputElement).value)).toBeCloseTo(0);
      }
    });

    it('each harmonic slider has the correct aria-label', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      for (let k = 1; k <= 8; k++) {
        expect(screen.getByRole('slider', { name: `Harmonic ${k} amplitude` })).toBeTruthy();
      }
    });

    it('moving a harmonic slider while stopped does not throw or touch the oscillator', async () => {
      renderTool();
      // Switch to Additive WITHOUT playing — no oscillator exists yet.
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      await fireEvent.input(screen.getByRole('slider', { name: 'Harmonic 2 amplitude' }), {
        target: { value: '0.5' },
      });
      // The additive effect must no-op when not playing (oscillator is null).
      expect(mockOscillator.setPeriodicWave).not.toHaveBeenCalled();
    });

    it('setting all harmonic sliders to 0 does not throw and calls setPeriodicWave without NaN', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      for (let k = 1; k <= 8; k++) {
        await fireEvent.input(screen.getByRole('slider', { name: `Harmonic ${k} amplitude` }), {
          target: { value: '0' },
        });
      }
      expect(mockOscillator.setPeriodicWave).toHaveBeenCalled();
      const lastCall = mockCtx.createPeriodicWave.mock.calls.at(-1)!;
      const imag: Float32Array = lastCall[1];
      expect(Array.from(imag).some((v) => Number.isNaN(v))).toBe(false);
    });
  });

  describe('play-in-additive mode', () => {
    it('switching to Additive before play applies PeriodicWave on first play, not oscillator.type', async () => {
      renderTool();
      // Switch to Additive BEFORE playing
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      expect(mockOscillator.setPeriodicWave).toHaveBeenCalled();
      // oscillator.type should remain at its default ('sine') — not written during start()
      expect(mockOscillator.type).toBe('sine');
    });
  });

  describe('additive mode switching', () => {
    it('switching to Additive calls setPeriodicWave with the periodic wave object', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      expect(mockCtx.createPeriodicWave).toHaveBeenCalled();
      expect(mockOscillator.setPeriodicWave).toHaveBeenCalled();
      const wave = mockCtx.createPeriodicWave.mock.results[0].value;
      expect(mockOscillator.setPeriodicWave).toHaveBeenCalledWith(wave);
    });

    it('in additive mode, oscillator.type is not written after the switch', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      // Note initial type set is in waveform mode during start()
      const typeBeforeSwitch = mockOscillator.type;
      // Switch to additive
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      // type should not change after switching to additive
      expect(mockOscillator.type).toBe(typeBeforeSwitch);
    });

    it('moving a harmonic slider re-calls createPeriodicWave and setPeriodicWave without recreating the oscillator', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      const oscCallsBefore = mockCtx.createOscillator.mock.calls.length;
      const waveCallsBefore = mockCtx.createPeriodicWave.mock.calls.length;
      // Move the harmonic-2 slider
      await fireEvent.input(screen.getByRole('slider', { name: 'Harmonic 2 amplitude' }), {
        target: { value: '0.5' },
      });
      expect(mockCtx.createOscillator.mock.calls.length).toBe(oscCallsBefore);
      expect(mockCtx.createPeriodicWave.mock.calls.length).toBeGreaterThan(waveCallsBefore);
      expect(mockOscillator.setPeriodicWave.mock.calls.length).toBeGreaterThan(1);
    });

    it('switching back to Waveform mode writes oscillator.type and stops calling setPeriodicWave', async () => {
      renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      // Now switch back
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Waveform' }));
      // type should be set back (waveform effect ran)
      expect(mockOscillator.type).toBe('sawtooth');
      const waveCallsAfterSwitch = mockOscillator.setPeriodicWave.mock.calls.length;
      // Move a waveform button — setPeriodicWave should NOT be called again
      await fireEvent.click(screen.getByRole('radio', { name: 'sine' }));
      expect(mockOscillator.setPeriodicWave.mock.calls.length).toBe(waveCallsAfterSwitch);
    });
  });

  describe('preset waveforms', () => {
    async function switchToAdditive() {
      await fireEvent.click(screen.getByRole('button', { name: 'Play tone' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
    }

    it('Sawtooth preset button has correct aria-label', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      expect(screen.getByRole('button', { name: 'Sawtooth preset' })).toBeTruthy();
    });

    it('clicking Sawtooth preset creates a wave with monotonically non-increasing imag and Σ|imag|≈1', async () => {
      renderTool();
      await switchToAdditive();
      mockCtx.createPeriodicWave.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Sawtooth preset' }));
      expect(mockCtx.createPeriodicWave).toHaveBeenCalled();
      const [real, imag] = mockCtx.createPeriodicWave.mock.calls[0];
      // real all zeros
      expect(Array.from(real as Float32Array).every((v: unknown) => v === 0)).toBe(true);
      // DC offset = 0
      expect((imag as Float32Array)[0]).toBe(0);
      // Monotonically non-increasing: imag[1] >= imag[2] >= ... >= imag[8]
      for (let k = 1; k <= 7; k++) {
        expect((imag as Float32Array)[k]).toBeGreaterThanOrEqual((imag as Float32Array)[k + 1]);
      }
      // L1 normalization: Σ|imag[1..8]| ≈ 1
      let sum = 0;
      for (let k = 1; k <= 8; k++) sum += Math.abs((imag as Float32Array)[k]);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-5);
    });

    it('Sine preset button has correct aria-label', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      expect(screen.getByRole('button', { name: 'Sine preset' })).toBeTruthy();
    });

    it('clicking Sine preset sets harmonic 1 to ~1, others to ~0', async () => {
      renderTool();
      await switchToAdditive();
      // First set sawtooth to have non-trivial state
      await fireEvent.click(screen.getByRole('button', { name: 'Sawtooth preset' }));
      mockCtx.createPeriodicWave.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Sine preset' }));
      expect(mockCtx.createPeriodicWave).toHaveBeenCalled();
      const [, imag] = mockCtx.createPeriodicWave.mock.calls[0];
      expect((imag as Float32Array)[1]).toBeCloseTo(1, 5);
      for (let k = 2; k <= 8; k++) {
        expect(Math.abs((imag as Float32Array)[k])).toBeCloseTo(0, 5);
      }
      // Σ|imag[1..8]| ≈ 1
      let sum = 0;
      for (let k = 1; k <= 8; k++) sum += Math.abs((imag as Float32Array)[k]);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-5);
    });

    it('Square preset button has correct aria-label', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      expect(screen.getByRole('button', { name: 'Square preset' })).toBeTruthy();
    });

    it('clicking Square preset sets odd harmonics > 0, even harmonics = 0', async () => {
      renderTool();
      await switchToAdditive();
      mockCtx.createPeriodicWave.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Square preset' }));
      expect(mockCtx.createPeriodicWave).toHaveBeenCalled();
      const [, imag] = mockCtx.createPeriodicWave.mock.calls[0];
      // k=1 (imag[1]): odd → >0; k=2 (imag[2]): even → =0; k=3 (imag[3]): odd → >0; etc.
      expect((imag as Float32Array)[1]).toBeGreaterThan(0);
      expect((imag as Float32Array)[2]).toBe(0);
      expect((imag as Float32Array)[3]).toBeGreaterThan(0);
      expect((imag as Float32Array)[4]).toBe(0);
      // Σ|imag| ≈ 1
      let sum = 0;
      for (let k = 1; k <= 8; k++) sum += Math.abs((imag as Float32Array)[k]);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-5);
    });

    it('preset updates slider UI positions immediately', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Sawtooth preset' }));
      // After sawtooth preset, slider 1 should be > slider 2 (1/1 > 1/2)
      const sliders = screen.getAllByRole('slider', { name: /Harmonic \d+ amplitude/ });
      expect(Number((sliders[0] as HTMLInputElement).value)).toBeGreaterThan(
        Number((sliders[1] as HTMLInputElement).value),
      );
    });
  });

  describe('waveform radiogroup disabled in additive mode', () => {
    it('waveform radio buttons are disabled when in Additive mode', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      for (const wt of ['sine', 'triangle', 'sawtooth', 'square']) {
        const btn = screen.getByRole('radio', { name: wt });
        expect(btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true').toBe(true);
      }
    });

    it('waveform radio buttons are re-enabled when switching back to Waveform mode', async () => {
      renderTool();
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Additive' }));
      await fireEvent.click(effectGroup('Source').getByRole('radio', { name: 'Waveform' }));
      for (const wt of ['sine', 'triangle', 'sawtooth', 'square']) {
        const btn = screen.getByRole('radio', { name: wt });
        expect(btn.hasAttribute('disabled')).toBe(false);
      }
    });
  });

  describe('additive helpers', () => {
    it('normalizeAmps: single harmonic sums to 1', () => {
      const out = normalizeAmps([1, 0, 0, 0, 0, 0, 0, 0]);
      const sum = out.reduce((a, b) => a + Math.abs(b), 0);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    });

    it('normalizeAmps: sawtooth raw amps L1-sum to 1', () => {
      const raw = [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8];
      const out = normalizeAmps(raw);
      const sum = out.reduce((a, b) => a + Math.abs(b), 0);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    });

    it('normalizeAmps: all-zero input returns all zeros with no NaN', () => {
      const out = normalizeAmps([0, 0, 0, 0, 0, 0, 0, 0]);
      expect(out.every((v) => v === 0)).toBe(true);
      expect(out.some((v) => Number.isNaN(v))).toBe(false);
    });

    it('presetAmps: sawtooth has length 8 and 1/k rolloff', () => {
      const amps = presetAmps('sawtooth');
      expect(amps).toHaveLength(8);
      for (let k = 1; k <= 8; k++) {
        expect(amps[k - 1]).toBeCloseTo(1 / k, 10);
      }
      expect(amps[0]).toBeGreaterThan(amps[1]);
    });

    it('presetAmps: sine has fundamental 1, all others 0', () => {
      const amps = presetAmps('sine');
      expect(amps[0]).toBe(1);
      expect(amps.slice(1).every((v) => v === 0)).toBe(true);
    });

    it('presetAmps: square has odd harmonics with 1/k, evens zero', () => {
      const amps = presetAmps('square');
      // k=1 (index 0): 1/1, k=2 (index 1): 0, k=3 (index 2): 1/3, ...
      expect(amps[0]).toBeCloseTo(1 / 1, 10);
      expect(amps[1]).toBe(0);
      expect(amps[2]).toBeCloseTo(1 / 3, 10);
      expect(amps[3]).toBe(0);
    });

    it('buildPeriodicWave: calls createPeriodicWave with real=zeros, imag[0]=0, disableNormalization', () => {
      const fakeCtx = {
        createPeriodicWave: vi.fn((r: Float32Array, im: Float32Array) => ({ _periodicWave: true, real: r, imag: im })),
      } as unknown as AudioContext;
      buildPeriodicWave(fakeCtx, [1, 0, 0, 0, 0, 0, 0, 0]);
      expect(fakeCtx.createPeriodicWave).toHaveBeenCalledTimes(1);
      const [real, imag, opts] = (fakeCtx.createPeriodicWave as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(real).toBeInstanceOf(Float32Array);
      expect(imag).toBeInstanceOf(Float32Array);
      expect(real.every((v: number) => v === 0)).toBe(true);
      expect(imag[0]).toBe(0);
      expect(imag[1]).toBeCloseTo(1, 5);
      expect(opts).toEqual({ disableNormalization: true });
    });

    it('buildPeriodicWave: DC term imag[0] is always 0', () => {
      const fakeCtx = {
        createPeriodicWave: vi.fn((r: Float32Array, im: Float32Array) => ({ _periodicWave: true, real: r, imag: im })),
      } as unknown as AudioContext;
      buildPeriodicWave(fakeCtx, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
      const [, imag] = (fakeCtx.createPeriodicWave as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(imag[0]).toBe(0);
    });
  });
});
