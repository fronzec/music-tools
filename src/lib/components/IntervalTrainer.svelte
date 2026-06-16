<script lang="ts">
  import { untrack } from 'svelte';
  import type { ViewName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { generateQuestion, midiToFreq, intervalBySemitones, INTERVALS } from '$lib/theory/intervals';
  import type { IntervalName, Question, Rng } from '$lib/theory/intervals';
  import { semitoneToNoteName } from '$lib/theory/notes';
  import { createNotePlayer } from '$lib/audio/playNote';
  import IntervalFretboard from '$lib/components/IntervalFretboard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
    /** Injectable RNG for deterministic tests; defaults to Math.random. */
    rng?: Rng;
  }

  let { navigate, rng = Math.random }: Props = $props();

  // ---------------------------------------------------------------------------
  // Audio player — one instance per component mount, disposed on unmount
  // ---------------------------------------------------------------------------

  const player = createNotePlayer();

  // ---------------------------------------------------------------------------
  // Mode state — Practice (default) or Explore
  // ---------------------------------------------------------------------------

  let mode = $state<'practice' | 'explore'>('practice');

  // Explore selections (independent of quiz state)
  let exploreRootPc = $state(0);      // default C
  let exploreSemitones = $state(7);   // default Perfect 5th

  let exploreInterval = $derived(intervalBySemitones(exploreSemitones));
  let exploreRootName = $derived(semitoneToNoteName(exploreRootPc));
  let exploreTargetName = $derived(semitoneToNoteName((exploreRootPc + exploreSemitones) % 12));

  // Fixed reference octave for Explore playback (C4)
  const EXPLORE_ROOT_MIDI = 60;

  function playExplore() {
    const low = EXPLORE_ROOT_MIDI + exploreRootPc;
    player.playSequence([midiToFreq(low), midiToFreq(low + exploreSemitones)]);
  }

  // ---------------------------------------------------------------------------
  // Quiz state (flat $state runes, mirroring NoteTrainer)
  // ---------------------------------------------------------------------------

  let correct = $state(0);
  let total = $state(0);
  let question = $state<Question | null>(null);
  let lastAnswer = $state<'correct' | 'incorrect' | null>(null);
  let selected = $state<IntervalName | null>(null);

  // Pending auto-advance timer after a correct answer. Tracked so it can be
  // cancelled — on manual Next, on a new question, and on unmount — to avoid a
  // ghost question skip and a use-after-dispose on the audio player.
  let pendingNext: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function cancelPending() {
    if (pendingNext !== null) {
      clearTimeout(pendingNext);
      pendingNext = null;
    }
  }

  // Switching modes must cancel any pending Practice auto-advance, or its timer
  // fires later and plays audio / mutates the quiz while in Explore mode.
  function setMode(m: 'practice' | 'explore') {
    cancelPending();
    mode = m;
  }

  // Generate a fresh question WITHOUT playing audio. Used on mount so entering
  // the tool never triggers autoplay (jarring UX + the AudioContext is suspended
  // until a user gesture, so mount-time playback is unreliable anyway).
  function loadQuestion(): Question {
    cancelPending();
    const q = generateQuestion(rng);
    question = q;
    lastAnswer = null;
    selected = null;
    return q;
  }

  // Advance to a new question AND play it. Only ever runs from a user gesture
  // (the Next button, or auto-advance after a correct answer).
  function next() {
    const q = loadQuestion();
    player.playSequence([midiToFreq(q.lowMidi), midiToFreq(q.highMidi)]);
  }

  function replay() {
    if (!question) return;
    player.playSequence([midiToFreq(question.lowMidi), midiToFreq(question.highMidi)]);
  }

  function answer(name: IntervalName) {
    if (!question || selected !== null) return;
    total++;
    if (name === question.interval.name) {
      correct++;
      lastAnswer = 'correct';
      selected = name;
      pendingNext = setTimeout(next, 1500);
    } else {
      lastAnswer = 'incorrect';
      selected = name;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle — initialise on mount, dispose on unmount
  // ---------------------------------------------------------------------------

  $effect(() => {
    // Run once on mount: generate the first question SILENTLY (no autoplay).
    // untrack so the (reactive) rng prop can't retrigger this effect and
    // regenerate the question / dispose the player mid-use.
    untrack(() => loadQuestion());
    return () => {
      cancelPending();
      player.dispose();
    };
  });
</script>

<div class="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-muted transition-colors duration-200 hover:text-accent-soft"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
    Interval Trainer
  </h1>
  <p class="mb-4 text-sm text-muted">
    Listen to two notes and identify the interval between them.
  </p>

  <!-- Mode toggle -->
  <div class="mb-6 flex gap-2">
    <button
      class={['rounded-lg px-4 py-2 text-sm font-semibold transition-colors border', mode === 'practice' ? 'bg-accent/15 text-accent-soft border-accent/50' : 'bg-surface text-muted border-transparent hover:border-accent/40'].join(' ')}
      aria-pressed={mode === 'practice' ? 'true' : 'false'}
      onclick={() => setMode('practice')}
    >
      Practice
    </button>
    <button
      class={['rounded-lg px-4 py-2 text-sm font-semibold transition-colors border', mode === 'explore' ? 'bg-accent/15 text-accent-soft border-accent/50' : 'bg-surface text-muted border-transparent hover:border-accent/40'].join(' ')}
      aria-pressed={mode === 'explore' ? 'true' : 'false'}
      onclick={() => setMode('explore')}
    >
      Explore
    </button>
  </div>

  {#if mode === 'practice'}
    <!-- Score + replay row -->
    <div class="mb-6 flex items-center justify-between rounded-xl border border-hairline bg-surface-raised p-4">
      <div>
        <div class="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted">Score</div>
        <div aria-live="polite" class="text-lg font-bold text-ink">
          {correct} / {total}
        </div>
      </div>
      <button
        class="rounded-lg border border-hairline bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink hover:border-accent/40"
        aria-label="Replay interval"
        onclick={replay}
      >
        ↩ Replay
      </button>
    </div>

    <!-- Answer choices -->
    {#if question}
      <div class="mb-6 grid grid-cols-2 gap-3" role="group" aria-label="Choose the interval">
        {#each question.choices as name (name)}
          {@const isSelected = selected === name}
          {@const isCorrect = question.interval.name === name}
          {@const revealed = lastAnswer !== null}
          <button
            class={[
              'rounded-xl border p-4 text-left text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed',
              !revealed ? 'border-hairline bg-surface-raised hover:border-accent/40 hover:bg-accent/10' : '',
              revealed && isCorrect ? 'border-success/50 bg-success/10 text-success' : '',
              revealed && isSelected && !isCorrect ? 'border-error/50 bg-error/10 text-error' : '',
              revealed && !isCorrect && !isSelected ? 'opacity-60' : '',
            ].join(' ')}
            aria-label="Answer {name}"
            disabled={selected !== null}
            onclick={() => answer(name)}
          >
            {name}
          </button>
        {/each}
      </div>

      <!-- Feedback + Next -->
      {#if lastAnswer !== null}
        <div class={['flex items-center justify-between rounded-xl border p-4', lastAnswer === 'correct' ? 'border-success/50 bg-success/10' : 'border-error/50 bg-error/10'].join(' ')}>
          <p class={['text-sm font-medium', lastAnswer === 'correct' ? 'text-success' : 'text-error'].join(' ')}>
            {#if lastAnswer === 'correct'}
              Correct! Moving to next…
            {:else}
              The correct answer was <strong>{question.interval.name}</strong>.
            {/if}
          </p>
          <button
            class="ml-4 rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-medium text-accent-soft transition-all hover:bg-accent/20 hover:shadow-led-sm"
            aria-label="Next question"
            onclick={next}
          >
            Next
          </button>
        </div>
      {/if}
    {/if}
  {:else}
    <!-- Explore mode -->
    <div class="mb-4 flex flex-col gap-3">
      <!-- Root note -->
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">Root note</span>
        <div class="flex flex-wrap gap-1" role="radiogroup" aria-label="Root note">
          {#each CHROMATIC as note, i (note)}
            <button
              class={['min-w-[2.5rem] rounded-md px-2.5 py-1 text-sm font-medium transition-colors border', i === exploreRootPc ? 'bg-accent/15 text-accent-soft border-accent/50' : 'bg-surface text-muted border-transparent hover:border-accent/40'].join(' ')}
              role="radio"
              aria-checked={i === exploreRootPc ? 'true' : 'false'}
              aria-label="Root {note}"
              onclick={() => (exploreRootPc = i)}
            >
              {note}
            </button>
          {/each}
        </div>
      </div>

      <!-- Interval -->
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">Interval</span>
        <div class="flex flex-wrap gap-1" role="radiogroup" aria-label="Interval">
          {#each INTERVALS as interval (interval.semitones)}
            <button
              class={['min-w-[2.5rem] rounded-md px-2.5 py-1 text-sm font-medium transition-colors border', interval.semitones === exploreSemitones ? 'bg-accent/15 text-accent-soft border-accent/50' : 'bg-surface text-muted border-transparent hover:border-accent/40'].join(' ')}
              role="radio"
              aria-checked={interval.semitones === exploreSemitones ? 'true' : 'false'}
              aria-label="Interval {interval.name}"
              onclick={() => (exploreSemitones = interval.semitones)}
            >
              {interval.short}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <button
          class="rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent-soft transition-all hover:bg-accent/20 hover:shadow-led-sm"
          aria-label="Play interval"
          onclick={playExplore}
        >
          ▶ Play
        </button>
      </div>
    </div>

    <p class="mb-4 text-sm text-muted">
      {exploreRootName} → {exploreTargetName}: <strong>{exploreInterval.name} ({exploreInterval.short})</strong>.
      Same shape everywhere it repeats across the neck.
    </p>

    <IntervalFretboard
      rootPc={exploreRootPc}
      intervalSemitones={exploreSemitones}
      rootName={exploreRootName}
      targetName={exploreTargetName}
    />
  {/if}
</div>
