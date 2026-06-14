<script lang="ts">
  import { untrack } from 'svelte';
  import type { ViewName } from '$lib/types/chord';
  import { generateQuestion, midiToFreq } from '$lib/theory/intervals';
  import type { IntervalName, Question, Rng } from '$lib/theory/intervals';
  import { createNotePlayer } from '$lib/audio/playNote';

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

  function next() {
    cancelPending();
    const q = generateQuestion(rng);
    question = q;
    lastAnswer = null;
    selected = null;
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
    // Run once on mount: untrack so the (reactive) rng prop can't retrigger
    // this effect and restart audio / dispose the player mid-use.
    untrack(() => next());
    return () => {
      cancelPending();
      player.dispose();
    };
  });
</script>

<div class="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
    Interval Trainer
  </h1>
  <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">
    Listen to two notes and identify the interval between them.
  </p>

  <!-- Score + replay row -->
  <div class="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div>
      <div class="mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Score</div>
      <div aria-live="polite" class="text-lg font-bold text-gray-900 dark:text-gray-100">
        {correct} / {total}
      </div>
    </div>
    <button
      class="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
          class="rounded-xl border p-4 text-left text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed"
          class:border-gray-200={!revealed}
          class:bg-white={!revealed}
          class:hover:border-blue-400={!revealed}
          class:hover:bg-blue-50={!revealed}
          class:dark:border-gray-700={!revealed}
          class:dark:bg-gray-900={!revealed}
          class:border-green-400={revealed && isCorrect}
          class:bg-green-50={revealed && isCorrect}
          class:text-green-800={revealed && isCorrect}
          class:dark:bg-green-900={revealed && isCorrect}
          class:dark:text-green-200={revealed && isCorrect}
          class:border-red-400={revealed && isSelected && !isCorrect}
          class:bg-red-50={revealed && isSelected && !isCorrect}
          class:text-red-800={revealed && isSelected && !isCorrect}
          class:dark:bg-red-900={revealed && isSelected && !isCorrect}
          class:dark:text-red-200={revealed && isSelected && !isCorrect}
          class:opacity-60={revealed && !isCorrect && !isSelected}
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
      <div class="flex items-center justify-between rounded-xl border p-4"
        class:border-green-200={lastAnswer === 'correct'}
        class:bg-green-50={lastAnswer === 'correct'}
        class:dark:border-green-800={lastAnswer === 'correct'}
        class:dark:bg-green-900={lastAnswer === 'correct'}
        class:border-red-200={lastAnswer === 'incorrect'}
        class:bg-red-50={lastAnswer === 'incorrect'}
        class:dark:border-red-800={lastAnswer === 'incorrect'}
        class:dark:bg-red-900={lastAnswer === 'incorrect'}
      >
        <p class="text-sm font-medium"
          class:text-green-800={lastAnswer === 'correct'}
          class:dark:text-green-200={lastAnswer === 'correct'}
          class:text-red-800={lastAnswer === 'incorrect'}
          class:dark:text-red-200={lastAnswer === 'incorrect'}
        >
          {#if lastAnswer === 'correct'}
            Correct! Moving to next…
          {:else}
            The correct answer was <strong>{question.interval.name}</strong>.
          {/if}
        </p>
        <button
          class="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          aria-label="Next question"
          onclick={next}
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>
