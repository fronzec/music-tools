<script lang="ts">
  import type { NoteName, ChordQuality, ViewName, CagedShape } from '$lib/types/chord';
  import { CAGED_ORDER } from '$lib/types/chord';
  import { SvelteSet } from 'svelte/reactivity';
  import { getShapes } from '$lib/data/chords';
  import {
    createChordId,
    MAX_CHORDS,
    PLAYBACK_MS,
    type ProgressionChord,
    type PlaybackSpeed,
  } from '$lib/types/progression';
  import FullFretboard from './FullFretboard.svelte';
  import ProgressionBar from './ProgressionBar.svelte';
  import ProgressionTimeline from './ProgressionTimeline.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ── State ────────────────────────────────────────────────────────
  let progression = $state<ProgressionChord[]>([
    { id: createChordId(), root: 'C', quality: 'major' },
    { id: createChordId(), root: 'F', quality: 'major' },
    { id: createChordId(), root: 'G', quality: 'major' },
    { id: createChordId(), root: 'C', quality: 'major' },
  ]);
  let activeIndex = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state<PlaybackSpeed>('medium');
  let visibleShapes = new SvelteSet<CagedShape>(CAGED_ORDER);

  // ── Derived ──────────────────────────────────────────────────────
  let currentChord = $derived(progression[activeIndex]!);
  let shapes = $derived(
    currentChord ? getShapes(currentChord.root, currentChord.quality) : [],
  );

  // ── Playback timer ───────────────────────────────────────────────
  let timer: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    if (isPlaying && progression.length > 0) {
      timer = setInterval(() => {
        if (activeIndex < progression.length - 1) {
          activeIndex++;
        } else {
          isPlaying = false;
        }
      }, PLAYBACK_MS[playbackSpeed]);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  });

  // ── Callbacks ────────────────────────────────────────────────────
  function addChord(root: NoteName) {
    if (progression.length >= MAX_CHORDS) return;
    progression.push({
      id: createChordId(),
      root,
      quality: progression[0]?.quality ?? 'major',
    });
  }

  function removeChord(index: number) {
    if (progression.length <= 1) return;
    progression.splice(index, 1);
    if (activeIndex >= progression.length) activeIndex = progression.length - 1;
  }

  function changeQuality(quality: ChordQuality) {
    for (const chord of progression) chord.quality = quality;
  }

  let currentQuality = $derived(progression[0]?.quality ?? 'major');
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <!-- Title -->
  <h1 class="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl" id="progression-heading">
    Progression Builder
  </h1>

  <!-- Controls bar: card-based layout -->
  <div class="mb-8 space-y-4">
    <!-- Type card (shared quality) -->
    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</div>
      <div
        class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
        role="radiogroup"
        aria-label="Quality"
      >
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={currentQuality === 'major'}
          class:dark:bg-gray-900={currentQuality === 'major'}
          class:text-gray-900={currentQuality === 'major'}
          class:dark:text-gray-100={currentQuality === 'major'}
          class:shadow-sm={currentQuality === 'major'}
          class:text-gray-500={currentQuality !== 'major'}
          class:dark:text-gray-400={currentQuality !== 'major'}
          class:hover:text-gray-700={currentQuality !== 'major'}
          class:dark:hover:text-gray-300={currentQuality !== 'major'}
          role="radio"
          aria-checked={currentQuality === 'major'}
          onclick={() => changeQuality('major')}
        >
          Major
        </button>
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={currentQuality === 'minor'}
          class:dark:bg-gray-900={currentQuality === 'minor'}
          class:text-gray-900={currentQuality === 'minor'}
          class:dark:text-gray-100={currentQuality === 'minor'}
          class:shadow-sm={currentQuality === 'minor'}
          class:text-gray-500={currentQuality !== 'minor'}
          class:dark:text-gray-400={currentQuality !== 'minor'}
          class:hover:text-gray-700={currentQuality !== 'minor'}
          class:dark:hover:text-gray-300={currentQuality !== 'minor'}
          role="radio"
          aria-checked={currentQuality === 'minor'}
          onclick={() => changeQuality('minor')}
        >
          Minor
        </button>
      </div>
    </div>

    <ProgressionBar
      {progression}
      {activeIndex}
      quality={currentQuality}
      onSelect={(i: number) => {
        activeIndex = i;
      }}
      onAdd={addChord}
      onRemove={removeChord}
    />

    <!-- Fretboard + Playback (side by side on desktop) -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        {#if progression.length > 0}
          <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
        {:else}
          <p class="py-8 text-center text-gray-400 dark:text-gray-500">Add chords to see shapes</p>
        {/if}
      </div>

      <ProgressionTimeline
        length={progression.length}
        {activeIndex}
        {isPlaying}
        speed={playbackSpeed}
        onPrev={() => {
          if (activeIndex > 0) {
            isPlaying = false;
            activeIndex--;
          }
        }}
        onNext={() => {
          if (activeIndex < progression.length - 1) {
            isPlaying = false;
            activeIndex++;
          }
        }}
        onTogglePlay={() => (isPlaying = !isPlaying)}
        onSpeedChange={(s: PlaybackSpeed) => (playbackSpeed = s)}
        onSelectDot={(i: number) => {
          isPlaying = false;
          activeIndex = i;
        }}
      />
    </div>
  </div>
</div>
