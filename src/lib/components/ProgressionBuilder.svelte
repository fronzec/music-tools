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
    progression.push({ id: createChordId(), root, quality: 'major' });
  }

  function removeChord(index: number) {
    if (progression.length <= 1) return;
    progression.splice(index, 1);
    if (activeIndex >= progression.length) activeIndex = progression.length - 1;
  }

  function setChordQuality(index: number, quality: ChordQuality) {
    const chord = progression[index];
    if (chord) chord.quality = quality;
  }
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-muted transition-colors hover:text-accent-soft hover:underline"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <!-- Title -->
  <h1 class="mb-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl" id="progression-heading">
    Progression Builder
  </h1>

  <!-- Controls bar: card-based layout -->
  <div class="mb-8 space-y-4">
    <ProgressionBar
      {progression}
      {activeIndex}
      quality="major"
      onSelect={(i: number) => {
        activeIndex = i;
      }}
      onAdd={addChord}
      onRemove={removeChord}
      onQualityChange={setChordQuality}
    />

    <!-- Fretboard + Playback (side by side on desktop) -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        {#if progression.length > 0}
          <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
        {:else}
          <p class="py-8 text-center text-muted">Add chords to see shapes</p>
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
