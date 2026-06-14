<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import SignalScope from './SignalScope.svelte';
  import { N, DEFAULT_HARMONIC_AMPS, buildPeriodicWave, presetAmps } from '$lib/audio/additive.js';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ── Audio graph: oscillator → analyser → master gain → destination ──
  // The analyser taps the signal BEFORE the master gain, so the waveform/
  // spectrum render at a fixed scale and the volume only affects loudness.
  let audioCtx: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let masterGain: GainNode | null = null;
  let waveShaper: WaveShaperNode | null = null;
  let biquad: BiquadFilterNode | null = null;
  let lfo: OscillatorNode | null = null;
  let tremoloGain: GainNode | null = null;
  let lfoDepth: GainNode | null = null;
  let delayNode: DelayNode | null = null;
  let feedbackGain: GainNode | null = null;
  let delayInput: GainNode | null = null;
  let delayOutput: GainNode | null = null;
  let wetGain: GainNode | null = null;
  // Plain refs used for graph wiring; the `$state` ones drive the scopes.
  // `analyser` taps the processed signal (end of chain); `cleanAnalyser` taps
  // the raw oscillator, so the two can be shown side by side (input vs output).
  let analyserNode: AnalyserNode | null = null;
  let analyser = $state<AnalyserNode | null>(null);
  let cleanAnalyserNode: AnalyserNode | null = null;
  let cleanAnalyser = $state<AnalyserNode | null>(null);

  type Wave = 'sine' | 'triangle' | 'sawtooth' | 'square';

  let isPlaying = $state(false);
  let waveType = $state<Wave>('sawtooth');
  let frequency = $state(220);
  let volume = $state(0.3);

  // ── Source mode: Waveform (built-in oscillator.type) vs Additive (PeriodicWave) ──
  let sourceMode = $state<'waveform' | 'additive'>('waveform');
  let harmonicAmps = $state<number[]>([...DEFAULT_HARMONIC_AMPS]);

  // ── Distortion (WaveShaper) ─────────────────────────────────────────
  let distortionOn = $state(false);
  let drive = $state(30);

  /** Classic waveshaper distortion curve; `amount` is the drive intensity. */
  function makeDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // ── Low-pass filter (Biquad) ────────────────────────────────────────
  let filterOn = $state(false);
  let cutoff = $state(2000); // Hz
  let resonance = $state(1); // Q

  // ── Tremolo (LFO modulating a gain) ─────────────────────────────────
  let tremoloOn = $state(false);
  let tremRate = $state(5); // Hz
  let tremDepth = $state(0.5); // 0..1

  // ── Delay (echo / comb filtering) ───────────────────────────────────
  let delayOn = $state(false);
  let delayTime = $state(0.25); // seconds
  let feedback = $state(0.4); // 0..0.9 (loop gain)
  let mix = $state(0.5); // wet level 0..1

  // Most effects are a single in-line node, but the delay is a sub-graph with
  // a dry/wet split, so each stage carries both an `in` and an `out` endpoint.
  // Single-node effects use the same node for both.
  type Stage = { in: AudioNode; out: AudioNode };

  /** (Re)wires the effect chain in order: oscillator → [active effects] → analyser. */
  function rebuildChain(distOn: boolean, filtOn: boolean, tremOn: boolean, delOn: boolean) {
    if (!oscillator || !analyserNode) return;
    oscillator.disconnect();
    waveShaper?.disconnect();
    biquad?.disconnect();
    // Severs the audio-signal output only; the lfoDepth → gain.gain modulation
    // path is unaffected (disconnect removes connections where the node is the
    // source, and lfoDepth — not tremoloGain — is the source of that one).
    tremoloGain?.disconnect();
    // Severs delayOutput → next only; the dry/wet/feedback wiring feeding INTO
    // delayOutput stays intact (those nodes are the sources of those edges).
    delayOutput?.disconnect();
    // The oscillator.disconnect() above also drops the clean tap, so re-add it
    // on every rewire. It's a passive leaf (never connected onward), so it only
    // observes the raw signal and never feeds the audible chain.
    if (cleanAnalyserNode) oscillator.connect(cleanAnalyserNode);
    const stages: Stage[] = [{ in: oscillator, out: oscillator }];
    if (distOn && waveShaper) stages.push({ in: waveShaper, out: waveShaper });
    if (filtOn && biquad) stages.push({ in: biquad, out: biquad });
    if (tremOn && tremoloGain) stages.push({ in: tremoloGain, out: tremoloGain });
    if (delOn && delayInput && delayOutput) stages.push({ in: delayInput, out: delayOutput });
    stages.push({ in: analyserNode, out: analyserNode });
    for (let i = 0; i < stages.length - 1; i++) stages[i].out.connect(stages[i + 1].in);
  }

  const WAVE_TYPES: Wave[] = ['sine', 'triangle', 'sawtooth', 'square'];
  const MIN_CUTOFF = 100;
  const MAX_CUTOFF = 8000;
  const MIN_FREQ = 50;
  const MAX_FREQ = 1000;
  const MIN_RATE = 0.5; // Hz (tremolo LFO)
  const MAX_RATE = 20; // Hz (tremolo LFO)
  const MIN_DELAY = 0.05; // seconds
  const MAX_DELAY = 0.9; // seconds (slider ceiling)
  const MAX_FEEDBACK = 0.9; // keep < 1 so the loop always decays
  const MAX_GAIN = 0.4; // hearing-safety ceiling
  const FFT_SIZE = 2048;
  const ATTACK = 0.02; // fade-in seconds (avoids click on start)
  const RELEASE = 0.03; // fade-out seconds (avoids click on stop)

  function start() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (isPlaying) return;

    oscillator = audioCtx.createOscillator();
    masterGain = audioCtx.createGain();
    waveShaper = audioCtx.createWaveShaper();
    waveShaper.oversample = '4x';
    waveShaper.curve = makeDistortionCurve(drive);
    biquad = audioCtx.createBiquadFilter();
    biquad.type = 'lowpass';
    biquad.frequency.value = cutoff;
    biquad.Q.value = resonance;
    // Tremolo: an LFO drives the gain of `tremoloGain` through `lfoDepth`.
    // The gain centers at 1 - depth/2 and swings ±depth/2, so it oscillates
    // between (1 - depth) and 1 — never negative, so the phase never flips.
    // The LFO runs continuously while playing; bypass is done by routing
    // (rebuildChain drops tremoloGain from the chain), not by stopping it.
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = tremRate;
    tremoloGain = audioCtx.createGain();
    tremoloGain.gain.value = 1 - tremDepth / 2;
    lfoDepth = audioCtx.createGain();
    lfoDepth.gain.value = tremDepth / 2;
    lfo.connect(lfoDepth);
    lfoDepth.connect(tremoloGain.gain);
    // Delay: a dry/wet split around a delay line with a feedback loop. Input
    // fans out to a dry path and a wet path; the wet path is the delay line
    // (delayNode → wetGain) plus a feedback loop (delayNode → feedbackGain →
    // delayNode) that produces successive, decaying repeats. On a continuous
    // tone this reads as comb filtering (notches in the spectrum) rather than
    // discrete echoes. Internal wiring is permanent; rebuildChain only routes
    // delayInput/delayOutput in and out of the main chain.
    delayNode = audioCtx.createDelay(1);
    delayNode.delayTime.value = delayTime;
    feedbackGain = audioCtx.createGain();
    feedbackGain.gain.value = feedback;
    delayInput = audioCtx.createGain();
    delayOutput = audioCtx.createGain();
    wetGain = audioCtx.createGain();
    wetGain.gain.value = mix;
    delayInput.connect(delayOutput); // dry
    delayInput.connect(delayNode); // wet entry
    delayNode.connect(wetGain);
    wetGain.connect(delayOutput); // wet
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode); // feedback loop
    const an = audioCtx.createAnalyser();
    an.fftSize = FFT_SIZE;
    // Clean tap: a second analyser on the raw oscillator, for the side-by-side
    // input-vs-output comparison. Same fftSize so both scopes share a scale.
    const cleanAn = audioCtx.createAnalyser();
    cleanAn.fftSize = FFT_SIZE;

    if (sourceMode === 'additive' && audioCtx) {
      oscillator.setPeriodicWave(buildPeriodicWave(audioCtx, harmonicAmps));
    } else {
      oscillator.type = waveType;
    }
    oscillator.frequency.value = frequency;

    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + ATTACK);

    // Tail of the chain is fixed; the effect order is built by rebuildChain().
    an.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    analyserNode = an;
    cleanAnalyserNode = cleanAn;
    rebuildChain(distortionOn, filterOn, tremoloOn, delayOn);
    oscillator.start();
    lfo.start();

    analyser = an;
    cleanAnalyser = cleanAn;
    isPlaying = true;
  }

  function stop() {
    if (oscillator && masterGain && audioCtx) {
      const now = audioCtx.currentTime;
      try {
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + RELEASE);
        oscillator.stop(now + RELEASE + 0.01);
        lfo?.stop(now + RELEASE + 0.01);
      } catch {
        /* already stopped */
      }
    }
    oscillator = null;
    masterGain = null;
    waveShaper = null;
    biquad = null;
    lfo = null;
    tremoloGain = null;
    lfoDepth = null;
    delayNode = null;
    feedbackGain = null;
    delayInput = null;
    delayOutput = null;
    wetGain = null;
    analyserNode = null;
    analyser = null;
    cleanAnalyserNode = null;
    cleanAnalyser = null;
    isPlaying = false;
  }

  function toggle() {
    if (isPlaying) stop();
    else start();
  }

  // Live updates while playing.
  // SOURCE-OF-TRUTH GUARD: only runs in waveform mode so it never stomps a PeriodicWave.
  $effect(() => {
    const t = waveType;
    const mode = sourceMode;
    if (oscillator && mode === 'waveform') oscillator.type = t;
  });

  // Additive mode: rebuild PeriodicWave whenever harmonicAmps change or mode switches in.
  $effect(() => {
    const mode = sourceMode;
    const amps = harmonicAmps;
    if (oscillator && audioCtx && mode === 'additive') {
      oscillator.setPeriodicWave(buildPeriodicWave(audioCtx, amps));
    }
  });

  $effect(() => {
    const f = frequency;
    if (oscillator && audioCtx) oscillator.frequency.setTargetAtTime(f, audioCtx.currentTime, 0.01);
  });

  $effect(() => {
    const v = volume;
    if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.02);
  });

  // Re-wire the chain when any effect is toggled. Reading the flags as args
  // here registers them as dependencies, so this re-runs on either toggle.
  $effect(() => {
    rebuildChain(distortionOn, filterOn, tremoloOn, delayOn);
  });

  // Regenerate the waveshaper curve when the drive changes while playing.
  $effect(() => {
    const d = drive;
    if (waveShaper) waveShaper.curve = makeDistortionCurve(d);
  });

  // Live low-pass filter parameters.
  $effect(() => {
    const c = cutoff;
    if (biquad && audioCtx) biquad.frequency.setTargetAtTime(c, audioCtx.currentTime, 0.01);
  });

  $effect(() => {
    const q = resonance;
    if (biquad && audioCtx) biquad.Q.setTargetAtTime(q, audioCtx.currentTime, 0.01);
  });

  // Live tremolo rate.
  $effect(() => {
    const r = tremRate;
    if (lfo && audioCtx) lfo.frequency.setTargetAtTime(r, audioCtx.currentTime, 0.01);
  });

  // Live tremolo depth: recenter the gain and rescale the LFO modulation.
  $effect(() => {
    const d = tremDepth;
    if (tremoloGain && lfoDepth && audioCtx) {
      tremoloGain.gain.setTargetAtTime(1 - d / 2, audioCtx.currentTime, 0.02);
      lfoDepth.gain.setTargetAtTime(d / 2, audioCtx.currentTime, 0.02);
    }
  });

  // Live delay parameters.
  $effect(() => {
    const t = delayTime;
    if (delayNode && audioCtx) delayNode.delayTime.setTargetAtTime(t, audioCtx.currentTime, 0.01);
  });

  $effect(() => {
    const fb = feedback;
    if (feedbackGain && audioCtx) feedbackGain.gain.setTargetAtTime(fb, audioCtx.currentTime, 0.01);
  });

  $effect(() => {
    const m = mix;
    if (wetGain && audioCtx) wetGain.gain.setTargetAtTime(m, audioCtx.currentTime, 0.02);
  });

  $effect(() => {
    return () => {
      stop();
      audioCtx?.close();
    };
  });
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1
    class="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl"
    id="signal-lab-heading"
  >
    Signal Lab
  </h1>

  <div class="space-y-6">
    <!-- Controls -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div class="flex flex-wrap items-end gap-6">
        <!-- Play / Stop -->
        <button
          class="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200"
          class:bg-blue-600={!isPlaying}
          class:hover:bg-blue-700={!isPlaying}
          class:bg-red-600={isPlaying}
          class:hover:bg-red-700={isPlaying}
          aria-label={isPlaying ? 'Stop tone' : 'Play tone'}
          onclick={toggle}
        >
          {isPlaying ? '■ Stop' : '▶ Play'}
        </button>

        <!-- Source mode: Waveform vs Additive -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Source
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Source"
          >
            {#each (['waveform', 'additive'] as const) as sm (sm)}
              <button
                class="rounded-md px-3 py-1 text-sm font-medium capitalize transition-all duration-200"
                class:bg-white={sourceMode === sm}
                class:dark:bg-gray-900={sourceMode === sm}
                class:text-gray-900={sourceMode === sm}
                class:dark:text-gray-100={sourceMode === sm}
                class:shadow-sm={sourceMode === sm}
                class:text-gray-500={sourceMode !== sm}
                class:dark:text-gray-400={sourceMode !== sm}
                role="radio"
                aria-checked={sourceMode === sm}
                onclick={() => (sourceMode = sm)}
              >
                {sm === 'waveform' ? 'Waveform' : 'Additive'}
              </button>
            {/each}
          </div>
        </div>

        <!-- Waveform -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Waveform
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Waveform"
          >
            {#each WAVE_TYPES as wt (wt)}
              <button
                class="rounded-md px-3 py-1 text-sm font-medium capitalize transition-all duration-200"
                class:bg-white={waveType === wt}
                class:dark:bg-gray-900={waveType === wt}
                class:text-gray-900={waveType === wt}
                class:dark:text-gray-100={waveType === wt}
                class:shadow-sm={waveType === wt}
                class:text-gray-500={waveType !== wt}
                class:dark:text-gray-400={waveType !== wt}
                class:opacity-50={sourceMode === 'additive'}
                role="radio"
                aria-checked={waveType === wt}
                disabled={sourceMode === 'additive'}
                onclick={() => (waveType = wt)}
              >
                {wt}
              </button>
            {/each}
          </div>
        </div>

        <!-- Frequency -->
        <div class="min-w-[12rem] flex-1">
          <label
            for="freq-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Frequency — {Math.round(frequency)} Hz
          </label>
          <input
            id="freq-slider"
            type="range"
            min={MIN_FREQ}
            max={MAX_FREQ}
            step="1"
            bind:value={frequency}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
            aria-label="Frequency"
          />
        </div>

        <!-- Volume -->
        <div class="min-w-[8rem] flex-1">
          <label
            for="vol-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Volume — {Math.round((volume / MAX_GAIN) * 100)}%
          </label>
          <input
            id="vol-slider"
            type="range"
            min="0"
            max={MAX_GAIN}
            step="0.01"
            bind:value={volume}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
            aria-label="Volume"
          />
        </div>
      </div>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        The waveform sets a tone's harmonic content — a sine is a single spike, while sawtooth and
        square are rich in harmonics. Switch waveforms and watch the spectrum change.
      </p>
    </div>

    <!-- Additive synthesis: harmonic slider bank + presets (shown in Additive mode) -->
    {#if sourceMode === 'additive'}
      <div
        class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
      >
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Presets
          </span>
          {#each (['sine', 'sawtooth', 'square'] as const) as preset (preset)}
            <button
              class="rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm font-medium capitalize text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="{preset.charAt(0).toUpperCase() + preset.slice(1)} preset"
              onclick={() => (harmonicAmps = presetAmps(preset))}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          {/each}
        </div>
        <div class="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {#each harmonicAmps as amp, i}
            <div class="flex flex-col items-center gap-1">
              <label
                for="harmonic-{i + 1}-slider"
                class="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                H{i + 1}
              </label>
              <input
                id="harmonic-{i + 1}-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={harmonicAmps[i]}
                class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
                aria-label="Harmonic {i + 1} amplitude"
              />
              <span class="text-xs text-gray-400">{amp.toFixed(2)}</span>
            </div>
          {/each}
        </div>
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Each slider sets the amplitude of one harmonic — a tone IS a sum of sines. Drag them, or
          try a preset, and watch the waveform and spectrum rebuild from pure sines.
        </p>
      </div>
    {/if}

    <!-- Effects -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div class="flex flex-wrap items-end gap-6">
        <!-- Distortion on/off (bypass) -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Distortion
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Distortion"
          >
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={!distortionOn}
              class:dark:bg-gray-900={!distortionOn}
              class:text-gray-900={!distortionOn}
              class:dark:text-gray-100={!distortionOn}
              class:shadow-sm={!distortionOn}
              class:text-gray-500={distortionOn}
              class:dark:text-gray-400={distortionOn}
              role="radio"
              aria-checked={!distortionOn}
              onclick={() => (distortionOn = false)}
            >
              Off
            </button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={distortionOn}
              class:dark:bg-gray-900={distortionOn}
              class:text-gray-900={distortionOn}
              class:dark:text-gray-100={distortionOn}
              class:shadow-sm={distortionOn}
              class:text-gray-500={!distortionOn}
              class:dark:text-gray-400={!distortionOn}
              role="radio"
              aria-checked={distortionOn}
              onclick={() => (distortionOn = true)}
            >
              On
            </button>
          </div>
        </div>

        <!-- Drive -->
        <div class="min-w-[12rem] flex-1" class:opacity-50={!distortionOn}>
          <label
            for="drive-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Drive — {drive}
          </label>
          <input
            id="drive-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            bind:value={drive}
            disabled={!distortionOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Distortion drive"
          />
        </div>
      </div>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Turn distortion on to watch the waveform clip and new harmonics appear in the spectrum.
      </p>
    </div>

    <!-- Low-pass filter -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div class="flex flex-wrap items-end gap-6">
        <!-- Filter on/off (bypass) -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Low-pass filter
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Low-pass filter"
          >
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={!filterOn}
              class:dark:bg-gray-900={!filterOn}
              class:text-gray-900={!filterOn}
              class:dark:text-gray-100={!filterOn}
              class:shadow-sm={!filterOn}
              class:text-gray-500={filterOn}
              class:dark:text-gray-400={filterOn}
              role="radio"
              aria-checked={!filterOn}
              onclick={() => (filterOn = false)}
            >
              Off
            </button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={filterOn}
              class:dark:bg-gray-900={filterOn}
              class:text-gray-900={filterOn}
              class:dark:text-gray-100={filterOn}
              class:shadow-sm={filterOn}
              class:text-gray-500={!filterOn}
              class:dark:text-gray-400={!filterOn}
              role="radio"
              aria-checked={filterOn}
              onclick={() => (filterOn = true)}
            >
              On
            </button>
          </div>
        </div>

        <!-- Cutoff -->
        <div class="min-w-[12rem] flex-1" class:opacity-50={!filterOn}>
          <label
            for="cutoff-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Cutoff — {Math.round(cutoff)} Hz
          </label>
          <input
            id="cutoff-slider"
            type="range"
            min={MIN_CUTOFF}
            max={MAX_CUTOFF}
            step="1"
            bind:value={cutoff}
            disabled={!filterOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Filter cutoff"
          />
        </div>

        <!-- Resonance -->
        <div class="min-w-[8rem] flex-1" class:opacity-50={!filterOn}>
          <label
            for="resonance-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Resonance — {resonance.toFixed(1)}
          </label>
          <input
            id="resonance-slider"
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            bind:value={resonance}
            disabled={!filterOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Filter resonance"
          />
        </div>
      </div>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Lower the cutoff to watch the high harmonics fade out of the spectrum.
      </p>
    </div>

    <!-- Tremolo -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div class="flex flex-wrap items-end gap-6">
        <!-- Tremolo on/off (bypass) -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tremolo
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Tremolo"
          >
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={!tremoloOn}
              class:dark:bg-gray-900={!tremoloOn}
              class:text-gray-900={!tremoloOn}
              class:dark:text-gray-100={!tremoloOn}
              class:shadow-sm={!tremoloOn}
              class:text-gray-500={tremoloOn}
              class:dark:text-gray-400={tremoloOn}
              role="radio"
              aria-checked={!tremoloOn}
              onclick={() => (tremoloOn = false)}
            >
              Off
            </button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={tremoloOn}
              class:dark:bg-gray-900={tremoloOn}
              class:text-gray-900={tremoloOn}
              class:dark:text-gray-100={tremoloOn}
              class:shadow-sm={tremoloOn}
              class:text-gray-500={!tremoloOn}
              class:dark:text-gray-400={!tremoloOn}
              role="radio"
              aria-checked={tremoloOn}
              onclick={() => (tremoloOn = true)}
            >
              On
            </button>
          </div>
        </div>

        <!-- Rate -->
        <div class="min-w-[12rem] flex-1" class:opacity-50={!tremoloOn}>
          <label
            for="trem-rate-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Rate — {tremRate.toFixed(1)} Hz
          </label>
          <input
            id="trem-rate-slider"
            type="range"
            min={MIN_RATE}
            max={MAX_RATE}
            step="0.1"
            bind:value={tremRate}
            disabled={!tremoloOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Tremolo rate"
          />
        </div>

        <!-- Depth -->
        <div class="min-w-[8rem] flex-1" class:opacity-50={!tremoloOn}>
          <label
            for="trem-depth-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Depth — {Math.round(tremDepth * 100)}%
          </label>
          <input
            id="trem-depth-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={tremDepth}
            disabled={!tremoloOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Tremolo depth"
          />
        </div>
      </div>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Turn tremolo on to watch the waveform pulse — its amplitude rises and falls at the LFO rate.
      </p>
    </div>

    <!-- Delay -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div class="flex flex-wrap items-end gap-6">
        <!-- Delay on/off (bypass) -->
        <div>
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Delay
          </div>
          <div
            class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
            role="radiogroup"
            aria-label="Delay"
          >
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={!delayOn}
              class:dark:bg-gray-900={!delayOn}
              class:text-gray-900={!delayOn}
              class:dark:text-gray-100={!delayOn}
              class:shadow-sm={!delayOn}
              class:text-gray-500={delayOn}
              class:dark:text-gray-400={delayOn}
              role="radio"
              aria-checked={!delayOn}
              onclick={() => (delayOn = false)}
            >
              Off
            </button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-white={delayOn}
              class:dark:bg-gray-900={delayOn}
              class:text-gray-900={delayOn}
              class:dark:text-gray-100={delayOn}
              class:shadow-sm={delayOn}
              class:text-gray-500={!delayOn}
              class:dark:text-gray-400={!delayOn}
              role="radio"
              aria-checked={delayOn}
              onclick={() => (delayOn = true)}
            >
              On
            </button>
          </div>
        </div>

        <!-- Time -->
        <div class="min-w-[10rem] flex-1" class:opacity-50={!delayOn}>
          <label
            for="delay-time-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Time — {Math.round(delayTime * 1000)} ms
          </label>
          <input
            id="delay-time-slider"
            type="range"
            min={MIN_DELAY}
            max={MAX_DELAY}
            step="0.01"
            bind:value={delayTime}
            disabled={!delayOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Delay time"
          />
        </div>

        <!-- Feedback -->
        <div class="min-w-[8rem] flex-1" class:opacity-50={!delayOn}>
          <label
            for="delay-feedback-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Feedback — {Math.round(feedback * 100)}%
          </label>
          <input
            id="delay-feedback-slider"
            type="range"
            min="0"
            max={MAX_FEEDBACK}
            step="0.01"
            bind:value={feedback}
            disabled={!delayOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Delay feedback"
          />
        </div>

        <!-- Mix -->
        <div class="min-w-[8rem] flex-1" class:opacity-50={!delayOn}>
          <label
            for="delay-mix-slider"
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Mix — {Math.round(mix * 100)}%
          </label>
          <input
            id="delay-mix-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={mix}
            disabled={!delayOn}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-gray-700"
            aria-label="Delay mix"
          />
        </div>
      </div>
      <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Mixing the delayed signal back in creates comb filtering — watch the notches carve into the
        spectrum, sharpening as you raise the feedback.
      </p>
    </div>

    <!-- Visualizations: clean (raw oscillator) vs processed (after effects) -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <p class="mb-5 text-xs text-gray-500 dark:text-gray-400">
        Left is the raw oscillator; right is the signal after the effect chain. Toggle an effect and
        watch only the right column change.
      </p>
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Clean (input) -->
        <div class="space-y-5">
          <h2 class="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Clean — input
          </h2>
          <SignalScope
            analyser={cleanAnalyser}
            mode="scope"
            active={isPlaying}
            color="#3B82F6"
            label="Oscilloscope"
          />
          <SignalScope
            analyser={cleanAnalyser}
            mode="spectrum"
            active={isPlaying}
            color="#16A34A"
            label="Spectrum"
          />
        </div>

        <!-- Processed (output) -->
        <div class="space-y-5">
          <h2 class="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Processed — output
          </h2>
          <SignalScope
            {analyser}
            mode="scope"
            active={isPlaying}
            color="#3B82F6"
            label="Oscilloscope"
          />
          <SignalScope
            {analyser}
            mode="spectrum"
            active={isPlaying}
            color="#16A34A"
            label="Spectrum"
          />
        </div>
      </div>
    </div>
  </div>
</div>
