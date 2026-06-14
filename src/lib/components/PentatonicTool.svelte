<script lang="ts">
  import type { NoteName, ViewName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import type { BoxName, ScaleQuality } from '$lib/types/scale';
  import { BOX_ORDER } from '$lib/types/scale';
  import { SvelteSet } from 'svelte/reactivity';
  import { getPentatonicBoxes, getPentatonicNotes } from '$lib/theory/pentatonic';
  import { BOX_COLORS, ROOT_COLOR } from '$lib/theory/layout';
  import RootSelector from './RootSelector.svelte';
  import PentatonicFretboard from './PentatonicFretboard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ── State ─────────────────────────────────────────────────────────
  let selectedRoot = $state<NoteName>('A');
  let quality = $state<ScaleQuality>('minor');
  // Start focused on Box 1 so shared notes between boxes don't overdraw each
  // other; the learner adds positions with the toggles as they connect them.
  let visibleBoxes = new SvelteSet<BoxName>(['1']);

  let boxes = $derived(getPentatonicBoxes(selectedRoot, quality));
  let scaleNotes = $derived(getPentatonicNotes(selectedRoot, quality));

  // ── Helpers ───────────────────────────────────────────────────────
  function toggleBox(box: BoxName) {
    if (visibleBoxes.has(box)) {
      visibleBoxes.delete(box);
    } else {
      visibleBoxes.add(box);
    }
  }
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
  <h1
    class="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl"
    id="pentatonic-heading"
  >
    Pentatonic Scale Explorer
  </h1>

  <!-- Controls -->
  <div class="mb-8 space-y-4">
    <!-- Root selector card -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <div
        class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        Root Note
      </div>
      <RootSelector
        notes={CHROMATIC}
        selected={selectedRoot}
        onSelect={(n) => (selectedRoot = n)}
        label="Select root note"
        buttonAriaLabel={(note) => `Select ${note} root`}
      />
    </div>

    <!-- Type card -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <div
        class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        Type
      </div>
      <div
        class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-800"
        role="radiogroup"
        aria-label="Scale quality"
      >
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={quality === 'major'}
          class:dark:bg-gray-900={quality === 'major'}
          class:text-gray-900={quality === 'major'}
          class:dark:text-gray-100={quality === 'major'}
          class:shadow-sm={quality === 'major'}
          class:text-gray-500={quality !== 'major'}
          class:dark:text-gray-400={quality !== 'major'}
          class:hover:text-gray-700={quality !== 'major'}
          class:dark:hover:text-gray-300={quality !== 'major'}
          role="radio"
          aria-checked={quality === 'major'}
          onclick={() => (quality = 'major')}>Major</button
        >
        <button
          class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
          class:bg-white={quality === 'minor'}
          class:dark:bg-gray-900={quality === 'minor'}
          class:text-gray-900={quality === 'minor'}
          class:dark:text-gray-100={quality === 'minor'}
          class:shadow-sm={quality === 'minor'}
          class:text-gray-500={quality !== 'minor'}
          class:dark:text-gray-400={quality !== 'minor'}
          class:hover:text-gray-700={quality !== 'minor'}
          class:dark:hover:text-gray-300={quality !== 'minor'}
          role="radio"
          aria-checked={quality === 'minor'}
          onclick={() => (quality = 'minor')}>Minor</button
        >
      </div>
    </div>

    <!-- Boxes + Scale Notes side by side -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Box toggle card -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <div
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          Boxes
        </div>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Toggle boxes">
          {#each BOX_ORDER as box (box)}
            {@const color = BOX_COLORS[box as BoxName]}
            {@const isActive = visibleBoxes.has(box as BoxName)}
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-gray-100={!isActive}
              class:text-gray-600={!isActive}
              class:border-gray-300={!isActive}
              class:dark:bg-gray-800={!isActive}
              class:dark:text-gray-400={!isActive}
              class:dark:border-gray-700={!isActive}
              style={isActive
                ? `background-color: ${color}; color: white; border-color: ${color};`
                : ''}
              aria-label="Toggle Box {box}"
              aria-pressed={isActive}
              onclick={() => toggleBox(box as BoxName)}
            >
              <span class="inline-block h-3 w-3 rounded-full" style="background-color: {color}"
              ></span>
              Box {box}
            </button>
          {/each}
        </div>
      </div>

      <!-- Scale notes card -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <div
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          Scale Notes
        </div>
        <div
          class="flex flex-wrap gap-2"
          role="list"
          aria-label="Notes in the {selectedRoot} {quality} pentatonic scale"
        >
          {#each scaleNotes as sn (sn.interval)}
            {@const isRoot = sn.interval === 'R'}
            <div
              role="listitem"
              class="flex min-w-[3.25rem] flex-col items-center rounded-lg border px-3 py-1.5"
              class:border-gray-200={!isRoot}
              class:dark:border-gray-700={!isRoot}
              style={isRoot ? `border-color: ${ROOT_COLOR};` : ''}
            >
              <span
                class="text-lg font-bold leading-none text-gray-900 dark:text-gray-100"
                style={isRoot ? `color: ${ROOT_COLOR};` : ''}>{sn.note}</span
              >
              <span class="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400"
                >{sn.interval}</span
              >
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Fretboard -->
  <div
    class="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
  >
    <PentatonicFretboard {boxes} {visibleBoxes} root={selectedRoot} {quality} />
  </div>
</div>
