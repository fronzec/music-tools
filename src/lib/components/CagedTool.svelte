<script lang="ts">
  import type { NoteName, ChordQuality, LabelMode, ViewName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { getShapes } from '$lib/data/chords';
  import ShapeCard from './ShapeCard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ── State ────────────────────────────────────────────────────────
  let selectedRoot = $state<NoteName>('C');
  let selectedQuality = $state<ChordQuality>('major');
  let labelMode = $state<LabelMode>('intervals');

  let shapes = $derived(getShapes(selectedRoot, selectedQuality));
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <!-- Title -->
  <h1 class="mb-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl" id="caged-heading">
    CAGED Chord Visualizer
  </h1>

  <!-- Controls bar: chord selector + quality toggle + label toggle -->
  <div class="mb-8 space-y-6">
    <!-- Chord selector: 12 chromatic buttons -->
    <div>
      <div class="mb-2 text-sm font-medium text-gray-600" id="chord-label">Chord</div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-labelledby="chord-label">
        {#each CHROMATIC as note (note)}
          <button
            aria-label="Select {note} chord"
            aria-pressed={selectedRoot === note}
            class="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200"
            class:bg-blue-600={selectedRoot === note}
            class:text-white={selectedRoot === note}
            class:shadow-sm={selectedRoot === note}
            class:bg-gray-100={selectedRoot !== note}
            class:text-gray-700={selectedRoot !== note}
            class:hover:bg-gray-200={selectedRoot !== note}
            onclick={() => (selectedRoot = note)}
          >
            {note}
          </button>
        {/each}
      </div>
    </div>

    <!-- Major/Minor toggle -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="text-sm font-medium text-gray-600" id="quality-label">Quality</div>
      <div
        class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5"
        role="radiogroup"
        aria-labelledby="quality-label"
      >
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={selectedQuality === 'major'}
          class:text-gray-900={selectedQuality === 'major'}
          class:shadow-sm={selectedQuality === 'major'}
          class:text-gray-500={selectedQuality !== 'major'}
          class:hover:text-gray-700={selectedQuality !== 'major'}
          role="radio"
          aria-checked={selectedQuality === 'major'}
          onclick={() => (selectedQuality = 'major')}
        >
          Major
        </button>
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={selectedQuality === 'minor'}
          class:text-gray-900={selectedQuality === 'minor'}
          class:shadow-sm={selectedQuality === 'minor'}
          class:text-gray-500={selectedQuality !== 'minor'}
          class:hover:text-gray-700={selectedQuality !== 'minor'}
          role="radio"
          aria-checked={selectedQuality === 'minor'}
          onclick={() => (selectedQuality = 'minor')}
        >
          Minor
        </button>
      </div>
    </div>

    <!-- Label mode toggle -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="text-sm font-medium text-gray-600" id="label-mode-label">Labels</div>
      <div
        class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5"
        role="radiogroup"
        aria-labelledby="label-mode-label"
      >
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={labelMode === 'intervals'}
          class:text-gray-900={labelMode === 'intervals'}
          class:shadow-sm={labelMode === 'intervals'}
          class:text-gray-500={labelMode !== 'intervals'}
          class:hover:text-gray-700={labelMode !== 'intervals'}
          role="radio"
          aria-checked={labelMode === 'intervals'}
          onclick={() => (labelMode = 'intervals')}
        >
          Intervals
        </button>
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={labelMode === 'notes'}
          class:text-gray-900={labelMode === 'notes'}
          class:shadow-sm={labelMode === 'notes'}
          class:text-gray-500={labelMode !== 'notes'}
          class:hover:text-gray-700={labelMode !== 'notes'}
          role="radio"
          aria-checked={labelMode === 'notes'}
          onclick={() => (labelMode = 'notes')}
        >
          Notes
        </button>
      </div>
    </div>
  </div>

  <!-- Shape grid -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each shapes as shape (shape.shape)}
      <ShapeCard {shape} {labelMode} />
    {/each}
  </div>
</div>
