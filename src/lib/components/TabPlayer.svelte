<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import type { Tab, TabStep } from '$lib/theory/tab';
  import { fretToMidi } from '$lib/theory/tab';
  import { midiToFreq } from '$lib/theory/intervals';
  import { createNotePlayer } from '$lib/audio/playNote';
  import { TABS } from '$lib/data/tabs';
  import TabFretboard from '$lib/components/TabFretboard.svelte';

  // ---------------------------------------------------------------------------
  // Props
  // ---------------------------------------------------------------------------

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ---------------------------------------------------------------------------
  // Audio player — one instance per mount, disposed on unmount
  // ---------------------------------------------------------------------------

  const player = createNotePlayer();

  // ---------------------------------------------------------------------------
  // State (flat runes — mirrors IntervalTrainer pattern)
  // ---------------------------------------------------------------------------

  let selectedTab: Tab = $state(TABS[0]);
  let stepIndex: number = $state(0);
  let isPlaying: boolean = $state(false);
  let tempo: number = $state(80); // BPM

  // Clamped tempo: 40..200 BPM. Prevents division explosions and CPU pins.
  let clampedTempo = $derived(Math.min(200, Math.max(40, tempo)));

  // Step duration in milliseconds derived from clamped tempo.
  let stepMs = $derived(60000 / clampedTempo);

  // Current step (the array of notes to highlight on fretboard)
  let currentStep: TabStep = $derived(selectedTab.steps[stepIndex] ?? []);

  // Notation row: string/fret representation for the current step
  let notationLabel = $derived.by(() => {
    if (currentStep.length === 0) return '—';
    return currentStep.map((n) => `s${n.string}:f${n.fret}`).join(' + ');
  });

  // ---------------------------------------------------------------------------
  // Playback engine — single bounded recursive setTimeout
  // Mirrors IntervalTrainer pendingNext / cancelPending pattern.
  // ---------------------------------------------------------------------------

  // The one timer handle. null = no pending tick.
  let tick: ReturnType<typeof setTimeout> | null = null;

  /** Cancel the pending tick — safe to call when tick is null. */
  function cancelTick() {
    if (tick !== null) {
      clearTimeout(tick);
      tick = null;
    }
  }

  /**
   * Play the notes at stepIndex via the audio player.
   * Skips notes whose fretToMidi is NaN or out of MIDI range (0..127).
   */
  function playCurrentStep() {
    const notes = selectedTab.steps[stepIndex];
    if (!notes) return;
    const freqs = notes
      .map((n) => fretToMidi(n.string, n.fret))
      .filter((midi) => !isNaN(midi) && midi >= 0 && midi <= 127)
      .map((midi) => midiToFreq(midi));
    if (freqs.length > 0) {
      player.playSequence(freqs);
    }
  }

  /**
   * Schedule the next step after stepMs ms.
   * BOUNDED: when the last step is reached, stops — no unbounded loop.
   */
  function scheduleNext() {
    tick = setTimeout(() => {
      tick = null;
      const lastIndex = selectedTab.steps.length - 1;
      if (stepIndex >= lastIndex) {
        // Reached end of tab — stop cleanly
        isPlaying = false;
        return;
      }
      stepIndex = stepIndex + 1;
      playCurrentStep();
      scheduleNext();
    }, stepMs);
  }

  /** Start playback from the current step. */
  function play() {
    if (isPlaying) return;
    // If already at the end, restart from beginning
    if (stepIndex >= selectedTab.steps.length - 1 && stepIndex > 0) {
      stepIndex = 0;
    }
    isPlaying = true;
    playCurrentStep();
    scheduleNext();
  }

  /** Stop playback, cancel any pending timer, and park the playhead at step 0. */
  function stop() {
    isPlaying = false;
    cancelTick();
    stepIndex = 0;
  }

  /**
   * Manually move to a step while stopped.
   * No-op when isPlaying (Next/Prev are disabled during play).
   */
  function stepTo(i: number) {
    cancelTick();
    isPlaying = false;
    stepIndex = Math.max(0, Math.min(i, selectedTab.steps.length - 1));
    playCurrentStep();
  }

  /** Select a new tab — cancels playback and resets to step 0. */
  function selectTab(t: Tab) {
    cancelTick();
    isPlaying = false;
    selectedTab = t;
    stepIndex = 0;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle — cancel timer + dispose audio on unmount
  // ---------------------------------------------------------------------------

  $effect(() => {
    return () => {
      cancelTick();
      player.dispose();
    };
  });
</script>

<div class="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
    Tab Player
  </h1>
  <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
    Play through curated guitar tabs with fretboard visualization.
  </p>

  <!-- Tab selector -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Select Tab
    </span>
    <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Tab selector">
      {#each TABS as tab, i (tab.title)}
        <button
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          class:bg-blue-600={selectedTab.title === tab.title}
          class:text-white={selectedTab.title === tab.title}
          class:bg-gray-100={selectedTab.title !== tab.title}
          class:text-gray-700={selectedTab.title !== tab.title}
          class:dark:bg-gray-800={selectedTab.title !== tab.title}
          class:dark:text-gray-300={selectedTab.title !== tab.title}
          role="radio"
          aria-checked={selectedTab.title === tab.title ? 'true' : 'false'}
          aria-label={tab.title}
          data-tab-selector={i}
          onclick={() => selectTab(tab)}
        >
          {tab.title}
        </button>
      {/each}
    </div>
  </div>

  <!-- Notation row: lightweight text representation of current step -->
  <div
    class="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
    aria-label="Current step notation"
  >
    <span class="mr-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      Step {stepIndex + 1}/{selectedTab.steps.length}
    </span>
    {notationLabel}
  </div>

  <!-- Fretboard -->
  <div class="mb-6">
    <TabFretboard step={currentStep} />
  </div>

  <!-- Controls row -->
  <div class="flex flex-wrap items-center gap-3">
    <!-- Play button -->
    <button
      class="min-h-[44px] min-w-[80px] rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Play"
      disabled={isPlaying}
      onclick={play}
    >
      ▶ Play
    </button>

    <!-- Stop button -->
    <button
      class="min-h-[44px] min-w-[80px] rounded-lg border border-gray-300 bg-gray-50 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label="Stop"
      disabled={!isPlaying}
      onclick={stop}
    >
      ■ Stop
    </button>

    <!-- Previous step -->
    <button
      class="min-h-[44px] rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label="Previous step"
      disabled={isPlaying || stepIndex === 0}
      onclick={() => stepTo(Math.max(0, stepIndex - 1))}
    >
      ← Prev
    </button>

    <!-- Next step -->
    <button
      class="min-h-[44px] rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label="Next step"
      disabled={isPlaying || stepIndex >= selectedTab.steps.length - 1}
      onclick={() => stepTo(Math.min(selectedTab.steps.length - 1, stepIndex + 1))}
    >
      Next →
    </button>

    <!-- Tempo control -->
    <div class="flex items-center gap-2">
      <label
        class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        for="tempo-input"
      >
        Tempo (BPM)
      </label>
      <input
        id="tempo-input"
        type="number"
        class="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        aria-label="Tempo in BPM"
        min="40"
        max="200"
        value={tempo}
        oninput={(e) => {
          tempo = Number((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  </div>
</div>
