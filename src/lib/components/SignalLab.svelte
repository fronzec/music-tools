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
  let analyser = $state<AnalyserNode | null>(null);

  type Wave = 'sine' | 'triangle' | 'sawtooth' | 'square';

  let isPlaying = $state(false);
  let waveType = $state<Wave>('sawtooth');
  let frequency = $state(220);
  let volume = $state(0.3);

  const WAVE_TYPES: Wave[] = ['sine', 'triangle', 'sawtooth', 'square'];
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
    const an = audioCtx.createAnalyser();
    an.fftSize = FFT_SIZE;

    oscillator.type = waveType;
    oscillator.frequency.value = frequency;

    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + ATTACK);

    oscillator.connect(an);
    an.connect(masterGain);
    masterGain.connect(audioCtx.destination);
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

    <!-- Visualizations -->
    <div
      class="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <SignalScope {analyser} mode="scope" active={isPlaying} color="#3B82F6" label="Oscilloscope" />
      <SignalScope {analyser} mode="spectrum" active={isPlaying} color="#16A34A" label="Spectrum" />
    </div>
  </div>
</div>
