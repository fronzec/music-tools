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

  // Only the clean waveforms — sine (pure, best for tuning by ear) and triangle
  // (soft). Sawtooth/square are harsh raw synth tones that don't help tuning.
  const WAVE_TYPES: OscillatorType[] = ['sine', 'triangle'];

  // Cap output gain well below 0 dBFS to protect hearing and avoid harsh
  // clipping on square/sawtooth waves. The slider reads 0–100% of this ceiling.
  const MAX_GAIN = 0.5;

  // Short gain ramps avoid the audible click that an abrupt start/stop produces.
  const ATTACK = 0.015; // seconds — fade in
  const RELEASE = 0.03; // seconds — fade out

  function play(freq: number, stringIdx: number) {
    if (!audioCtx) audioCtx = new AudioContext();
    stop();

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = waveType;
    oscillator.frequency.value = freq;

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + ATTACK);

    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    activeString = stringIdx;
  }

  function stop() {
    if (oscillator && gainNode && audioCtx) {
      const now = audioCtx.currentTime;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + RELEASE);
        oscillator.stop(now + RELEASE);
      } catch {
        /* already stopped */
      }
    }
    oscillator = null;
    gainNode = null;
    activeString = null;
  }

  // Live updates: reflect control changes on the currently playing tone.
  $effect(() => {
    const v = volume;
    if (gainNode && audioCtx) {
      gainNode.gain.setTargetAtTime(v, audioCtx.currentTime, 0.02);
    }
  });

  $effect(() => {
    const t = waveType;
    if (oscillator) oscillator.type = t;
  });

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
    class="mb-6 text-sm font-medium text-muted transition-colors hover:text-accent-soft hover:underline"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Tone Generator</h1>

  <div class="space-y-6">
    <!-- Strings Card -->
    <div class="rounded-xl border border-hairline bg-surface-raised p-5 sm:p-6">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted font-technical">Strings</div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each STRINGS as s, i (s.name)}
          <button
            class="flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 {activeString === i ? 'border-accent/50 bg-accent/15' : 'border-hairline hover:border-accent/40'}"
            aria-label="{activeString === i ? 'Stop' : 'Play'} {s.label} ({s.name}) {s.freq} Hz"
            onclick={() => toggle(s.freq, i)}
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted">
              {s.num}
            </span>
            <div class="flex-1">
              <div class="text-sm font-semibold text-ink">{s.label} <span class="font-normal text-muted">({s.name})</span></div>
              <div class="text-xs text-muted">{s.freq} Hz</div>
            </div>
            <span
              class="ml-auto shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors {activeString === i ? 'bg-accent/15 text-accent-soft border border-accent/50' : 'bg-surface text-muted border border-transparent'}"
            >
              {activeString === i ? '■ Stop' : '▶ Play'}
            </span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Sound Card -->
    <div class="rounded-xl border border-hairline bg-surface-raised p-5 sm:p-6">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted font-technical">Sound</div>

      <!-- Volume -->
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-muted" for="volume-slider">
          Volume
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max={MAX_GAIN}
          step="0.01"
          bind:value={volume}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-hairline accent-accent"
          aria-label="Volume"
        />
        <div class="mt-1 text-xs text-muted">
          {Math.round((volume / MAX_GAIN) * 100)}%
        </div>
      </div>

      <!-- Wave Type -->
      <div>
        <div class="mb-1.5 text-sm font-medium text-muted">Waveform</div>
        <div class="inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="radiogroup" aria-label="Waveform">
          {#each WAVE_TYPES as wt (wt)}
            <button
              class="rounded-md px-3 py-1 text-sm font-medium capitalize transition-all duration-200 {waveType === wt ? 'bg-surface-raised text-ink shadow-sm' : 'text-muted hover:text-ink'}"
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
