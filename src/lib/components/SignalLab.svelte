<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import SignalScope from './SignalScope.svelte';

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
  // Plain ref used for graph wiring; `analyser` ($state) is for the scopes.
  let analyserNode: AnalyserNode | null = null;
  let analyser = $state<AnalyserNode | null>(null);

  type Wave = 'sine' | 'triangle' | 'sawtooth' | 'square';

  let isPlaying = $state(false);
  let waveType = $state<Wave>('sawtooth');
  let frequency = $state(220);
  let volume = $state(0.3);

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

  /** (Re)wires the effect chain in order: oscillator → [active effects] → analyser. */
  function rebuildChain(distOn: boolean, filtOn: boolean) {
    if (!oscillator || !analyserNode) return;
    oscillator.disconnect();
    waveShaper?.disconnect();
    biquad?.disconnect();
    const chain: AudioNode[] = [oscillator];
    if (distOn && waveShaper) chain.push(waveShaper);
    if (filtOn && biquad) chain.push(biquad);
    chain.push(analyserNode);
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
  }

  const WAVE_TYPES: Wave[] = ['sine', 'triangle', 'sawtooth', 'square'];
  const MIN_CUTOFF = 100;
  const MAX_CUTOFF = 8000;
  const MIN_FREQ = 50;
  const MAX_FREQ = 1000;
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
    const an = audioCtx.createAnalyser();
    an.fftSize = FFT_SIZE;

    oscillator.type = waveType;
    oscillator.frequency.value = frequency;

    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + ATTACK);

    // Tail of the chain is fixed; the effect order is built by rebuildChain().
    an.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    analyserNode = an;
    rebuildChain(distortionOn, filterOn);
    oscillator.start();

    analyser = an;
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
      } catch {
        /* already stopped */
      }
    }
    oscillator = null;
    masterGain = null;
    waveShaper = null;
    biquad = null;
    analyserNode = null;
    analyser = null;
    isPlaying = false;
  }

  function toggle() {
    if (isPlaying) stop();
    else start();
  }

  // Live updates while playing.
  $effect(() => {
    const t = waveType;
    if (oscillator) oscillator.type = t;
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
    rebuildChain(distortionOn, filterOn);
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
                role="radio"
                aria-checked={waveType === wt}
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
    </div>

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

    <!-- Visualizations -->
    <div
      class="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <SignalScope {analyser} mode="scope" active={isPlaying} color="#3B82F6" label="Oscilloscope" />
      <SignalScope {analyser} mode="spectrum" active={isPlaying} color="#16A34A" label="Spectrum" />
    </div>
  </div>
</div>
