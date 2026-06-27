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
    type PlaybackMode,
  } from '$lib/types/progression';
  import { buildArpeggio } from '$lib/theory/arpeggioShape';
  import { advancePlayback } from '$lib/theory/transport';
  import FullFretboard from './FullFretboard.svelte';
  import SweepFretboard from './SweepFretboard.svelte';
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

  // T-13: mode, activeNoteIndex, loop state
  let mode = $state<PlaybackMode>('caged');
  let activeNoteIndex = $state(0);
  let loop = $state(false);

  // ── Derived ──────────────────────────────────────────────────────
  let currentChord = $derived(progression[activeIndex]!);
  let shapes = $derived(
    currentChord ? getShapes(currentChord.root, currentChord.quality) : [],
  );

  // T-14: current arpeggio for sweep mode
  let currentArpeggio = $derived(
    currentChord ? buildArpeggio(currentChord.root, currentChord.quality) : [],
  );

  // ── Reset activeNoteIndex on chord or mode change (T-14) ─────────
  $effect(() => {
    // Dependencies: activeIndex, mode, and the active chord identity.
    // When any of these change, reset sub-step to 0.
    void activeIndex;
    void mode;
    void currentChord?.id;
    activeNoteIndex = 0;
  });

  // ── Playback timer (T-15) ─────────────────────────────────────────
  let timer: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    if (isPlaying && progression.length > 0) {
      timer = setInterval(() => {
        const next = advancePlayback(
          { activeIndex, activeNoteIndex, isPlaying },
          {
            mode,
            progressionLength: progression.length,
            arpeggioLength: currentArpeggio.length > 0 ? currentArpeggio.length : 5,
            loop,
          },
        );
        activeIndex = next.activeIndex;
        activeNoteIndex = next.activeNoteIndex;
        isPlaying = next.isPlaying;
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
        <!-- T-16: mode toggle -->
        <div class="mb-3 flex items-center gap-1" role="radiogroup" aria-label="Fretboard mode">
          <button
            class={[
              'rounded-md px-3 py-1 text-xs font-semibold transition-all duration-200',
              mode === 'caged'
                ? 'bg-accent/15 text-accent-soft border border-accent/50'
                : 'bg-surface text-muted hover:border-accent/40 border border-hairline',
            ].join(' ')}
            role="radio"
            aria-checked={mode === 'caged'}
            aria-label="CAGED chord view"
            onclick={() => (mode = 'caged')}
          >
            CAGED
          </button>
          <button
            class={[
              'rounded-md px-3 py-1 text-xs font-semibold transition-all duration-200',
              mode === 'sweep'
                ? 'bg-accent/15 text-accent-soft border border-accent/50'
                : 'bg-surface text-muted hover:border-accent/40 border border-hairline',
            ].join(' ')}
            role="radio"
            aria-checked={mode === 'sweep'}
            aria-label="Sweep arpeggio view"
            onclick={() => (mode = 'sweep')}
          >
            Sweep
          </button>
        </div>

        <!-- T-17: board swap -->
        {#if progression.length > 0}
          {#if mode === 'caged'}
            <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
          {:else}
            <SweepFretboard notes={currentArpeggio} {activeNoteIndex} />
          {/if}
        {:else}
          <p class="py-8 text-center text-muted">Add chords to see shapes</p>
        {/if}
      </div>

      <!-- T-18: pass loop and onToggleLoop to ProgressionTimeline -->
      <ProgressionTimeline
        length={progression.length}
        {activeIndex}
        {isPlaying}
        speed={playbackSpeed}
        {loop}
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
        onToggleLoop={() => (loop = !loop)}
      />
    </div>
  </div>
</div>
