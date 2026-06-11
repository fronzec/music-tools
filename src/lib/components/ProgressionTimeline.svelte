<script lang="ts">
  import type { PlaybackSpeed } from '$lib/types/progression';

  interface Props {
    length: number;
    activeIndex: number;
    isPlaying: boolean;
    speed: PlaybackSpeed;
    onPrev: () => void;
    onNext: () => void;
    onTogglePlay: () => void;
    onSpeedChange: (speed: PlaybackSpeed) => void;
    onSelectDot?: (index: number) => void;
  }

  let {
    length,
    activeIndex,
    isPlaying,
    speed,
    onPrev,
    onNext,
    onTogglePlay,
    onSpeedChange,
    onSelectDot,
  }: Props = $props();

  const SPEEDS: PlaybackSpeed[] = ['slow', 'medium', 'fast'];

  function speedLabel(s: PlaybackSpeed): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4">
  <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Playback</div>

  <!-- Step dots -->
  <div class="mb-3 flex items-center justify-center gap-2" role="group" aria-label="Chord steps">
    {#each Array(length) as _, i}
      <button
        class="h-3 w-3 rounded-full transition-all"
        class:bg-blue-600={i === activeIndex}
        class:scale-110={i === activeIndex}
        class:bg-gray-300={i !== activeIndex}
        aria-label="Go to step {i + 1}"
        onclick={() => onSelectDot?.(i)}
      ></button>
    {/each}
  </div>

  <!-- Controls -->
  <div class="mb-3 flex items-center justify-center gap-3">
    <button
      class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
      class:bg-gray-100={activeIndex > 0}
      class:text-gray-700={activeIndex > 0}
      class:hover:bg-gray-200={activeIndex > 0}
      class:bg-gray-50={activeIndex === 0}
      class:text-gray-300={activeIndex === 0}
      class:cursor-not-allowed={activeIndex === 0}
      disabled={activeIndex === 0}
      aria-label="Previous chord"
      onclick={onPrev}
    >
      &#9664;
    </button>

    <button
      class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
      aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
      onclick={onTogglePlay}
    >
      {isPlaying ? '⏸' : '▶'}
    </button>

    <button
      class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
      class:bg-gray-100={activeIndex < length - 1}
      class:text-gray-700={activeIndex < length - 1}
      class:hover:bg-gray-200={activeIndex < length - 1}
      class:bg-gray-50={activeIndex >= length - 1}
      class:text-gray-300={activeIndex >= length - 1}
      class:cursor-not-allowed={activeIndex >= length - 1}
      disabled={activeIndex >= length - 1}
      aria-label="Next chord"
      onclick={onNext}
    >
      &#9654;
    </button>
  </div>

  <!-- Speed selector -->
  <div class="flex items-center justify-center gap-2" role="radiogroup" aria-label="Playback speed">
    {#each SPEEDS as s (s)}
      <button
        class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
        class:bg-blue-600={speed === s}
        class:text-white={speed === s}
        class:bg-gray-100={speed !== s}
        class:text-gray-700={speed !== s}
        class:hover:bg-gray-200={speed !== s}
        role="radio"
        aria-checked={speed === s}
        aria-label="{speedLabel(s)} speed"
        onclick={() => onSpeedChange(s)}
      >
        {speedLabel(s)}
      </button>
    {/each}
  </div>
</div>
