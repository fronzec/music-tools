<script lang="ts">
  import type { ViewName } from '$lib/types/chord';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  let audioCtx: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let activeString = $state<number | null>(null);
  let volume = $state(0.3);
  let waveType = $state<OscillatorType>('sine');

  const STRINGS = [
    { name: 'E2', note: 'E', freq: 82.41, num: 6, label: 'Low E' },
    { name: 'A2', note: 'A', freq: 110.0, num: 5, label: 'A' },
    { name: 'D3', note: 'D', freq: 146.83, num: 4, label: 'D' },
    { name: 'G3', note: 'G', freq: 196.0, num: 3, label: 'G' },
    { name: 'B3', note: 'B', freq: 246.94, num: 2, label: 'B' },
    { name: 'E4', note: 'E', freq: 329.63, num: 1, label: 'High E' },
  ];

  const WAVE_TYPES: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];

  function play(freq: number, stringIdx: number) {
    if (!audioCtx) audioCtx = new AudioContext();
    stop();

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = waveType;
    oscillator.frequency.value = freq;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    activeString = stringIdx;
  }

  function stop() {
    if (oscillator) {
      try { oscillator.stop(); } catch { /* already stopped */ }
    }
    oscillator = null;
    activeString = null;
  }

  function toggle(freq: number, stringIdx: number) {
    if (activeString === stringIdx) {
      stop();
    } else {
      play(freq, stringIdx);
    }
  }

  $effect(() => {
    return () => {
      stop();
      audioCtx?.close();
    };
  });
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Tone Generator</h1>

  <div class="space-y-6">
    <!-- Strings Card -->
    <div class="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Strings</div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each STRINGS as s, i (s.name)}
          <button
            class="flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200"
            class:border-blue-400={activeString === i}
            class:bg-blue-50={activeString === i}
            class:border-gray-200={activeString !== i}
            class:hover:border-blue-300={activeString !== i}
            class:hover:bg-gray-50={activeString !== i}
            aria-label="{activeString === i ? 'Stop' : 'Play'} {s.label} ({s.name}) {s.freq} Hz"
            onclick={() => toggle(s.freq, i)}
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              {s.num}
            </span>
            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-900">{s.label} <span class="font-normal text-gray-400">({s.name})</span></div>
              <div class="text-xs text-gray-500">{s.freq} Hz</div>
            </div>
            <span
              class="ml-auto shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
              class:bg-blue-600={activeString === i}
              class:text-white={activeString === i}
              class:bg-gray-100={activeString !== i}
              class:text-gray-600={activeString !== i}
            >
              {activeString === i ? '■ Stop' : '▶ Play'}
            </span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Sound Card -->
    <div class="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Sound</div>

      <!-- Volume -->
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-gray-700" for="volume-slider">
          Volume
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          bind:value={volume}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
          aria-label="Volume"
        />
        <div class="mt-1 text-xs text-gray-400">{Math.round(volume * 100)}%</div>
      </div>

      <!-- Wave Type -->
      <div>
        <div class="mb-1.5 text-sm font-medium text-gray-700">Waveform</div>
        <div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5" role="radiogroup" aria-label="Waveform">
          {#each WAVE_TYPES as wt (wt)}
            <button
              class="rounded-md px-3 py-1 text-sm font-medium capitalize transition-all duration-200"
              class:bg-white={waveType === wt}
              class:text-gray-900={waveType === wt}
              class:shadow-sm={waveType === wt}
              class:text-gray-500={waveType !== wt}
              class:hover:text-gray-700={waveType !== wt}
              role="radio"
              aria-checked={waveType === wt}
              onclick={() => (waveType = wt)}
            >
              {wt}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
