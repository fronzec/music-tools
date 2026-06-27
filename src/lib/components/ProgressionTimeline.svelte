<script lang="ts">
  import type { PlaybackSpeed } from '$lib/types/progression';

  interface Props {
    length: number;
    activeIndex: number;
    isPlaying: boolean;
    speed: PlaybackSpeed;
    loop?: boolean;
    onPrev: () => void;
    onNext: () => void;
    onTogglePlay: () => void;
    onSpeedChange: (speed: PlaybackSpeed) => void;
    onSelectDot?: (index: number) => void;
    onToggleLoop?: () => void;
  }

  let {
    length,
    activeIndex,
    isPlaying,
    speed,
    loop = false,
    onPrev,
    onNext,
    onTogglePlay,
    onSpeedChange,
    onSelectDot,
    onToggleLoop,
  }: Props = $props();

  const SPEEDS: PlaybackSpeed[] = ['slow', 'medium', 'fast'];

  function speedLabel(s: PlaybackSpeed): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
</script>

<div class="rounded-xl border border-hairline bg-surface-raised p-4">
  <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Playback</div>

  <!-- Step dots -->
  <div class="mb-3 flex items-center justify-center gap-2" role="group" aria-label="Chord steps">
    {#each Array(length) as _, i (i)}
      <button
        class={[
          'h-3 w-3 rounded-full transition-all',
          i === activeIndex
            ? 'bg-accent scale-110'
            : 'bg-hairline',
        ].join(' ')}
        aria-label="Go to step {i + 1}"
        onclick={() => onSelectDot?.(i)}
      ></button>
    {/each}
  </div>

  <!-- Controls -->
  <div class="mb-3 flex items-center justify-center gap-3">
    <button
      class={[
        'rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 bg-surface',
        activeIndex > 0
          ? 'text-muted hover:text-ink border border-hairline'
          : 'text-muted/40 border border-hairline/40 cursor-not-allowed',
      ].join(' ')}
      disabled={activeIndex === 0}
      aria-label="Previous chord"
      onclick={onPrev}
    >
      &#9664;
    </button>

    <button
      class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 bg-surface text-muted hover:text-ink border border-hairline"
      aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
      onclick={onTogglePlay}
    >
      {isPlaying ? '⏸' : '▶'}
    </button>

    <button
      class={[
        'rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 bg-surface',
        activeIndex < length - 1
          ? 'text-muted hover:text-ink border border-hairline'
          : 'text-muted/40 border border-hairline/40 cursor-not-allowed',
      ].join(' ')}
      disabled={activeIndex >= length - 1}
      aria-label="Next chord"
      onclick={onNext}
    >
      &#9654;
    </button>
  </div>

  <!-- Speed selector -->
  <div class="mb-2 flex items-center justify-center gap-2" role="radiogroup" aria-label="Playback speed">
    {#each SPEEDS as s (s)}
      <button
        class={[
          'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
          speed === s
            ? 'bg-accent/15 text-accent-soft border border-accent/50'
            : 'bg-surface text-muted hover:border-accent/40 border border-hairline',
        ].join(' ')}
        role="radio"
        aria-checked={speed === s}
        aria-label="{speedLabel(s)} speed"
        onclick={() => onSpeedChange(s)}
      >
        {speedLabel(s)}
      </button>
    {/each}
  </div>

  <!-- Loop toggle -->
  <div class="flex items-center justify-center">
    <button
      class={[
        'rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200',
        loop
          ? 'bg-accent/15 text-accent-soft border border-accent/50'
          : 'bg-surface text-muted hover:border-accent/40 border border-hairline',
      ].join(' ')}
      aria-pressed={loop}
      aria-label={loop ? 'Disable loop' : 'Enable loop'}
      onclick={onToggleLoop}
    >
      ↺ Loop
    </button>
  </div>
</div>
