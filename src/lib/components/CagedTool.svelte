<script lang="ts">
  import type { NoteName, ChordQuality, LabelMode, ViewName, CagedShape } from '$lib/types/chord';
  import { CHROMATIC, CAGED_ORDER } from '$lib/types/chord';
  import { SvelteSet } from 'svelte/reactivity';
  import { getShapes } from '$lib/data/chords';
  import { SHAPE_COLORS } from '$lib/theory/layout';
  import ShapeCard from './ShapeCard.svelte';
  import FullFretboard from './FullFretboard.svelte';
  import DualFretboard from './DualFretboard.svelte';
  import LegendPanel from './LegendPanel.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ── State ────────────────────────────────────────────────────────
  let selectedRoot = $state<NoteName>('C');
  let selectedQuality = $state<ChordQuality>('major');
  let labelMode = $state<LabelMode>('intervals');
  let viewMode = $state<'full' | 'grid' | 'dual'>('full');
  let legendOpen = $state(false);
  let visibleShapes = new SvelteSet(CAGED_ORDER);
  let secondRoot = $state<NoteName>('G');
  let secondVisibleShapes = new SvelteSet(CAGED_ORDER);

  let shapes = $derived(getShapes(selectedRoot, selectedQuality));

  function toggleShape(shape: CagedShape) {
    if (visibleShapes.has(shape)) {
      visibleShapes.delete(shape);
    } else {
      visibleShapes.add(shape);
    }
  }

  // Reset visible shapes to all when root or quality changes
  $effect(() => {
    void shapes;
    visibleShapes.clear();
    for (const s of CAGED_ORDER) visibleShapes.add(s);
  });

  // Reset second visible shapes when entering dual mode
  $effect(() => {
    if (viewMode === 'dual') {
      secondVisibleShapes.clear();
      for (const s of CAGED_ORDER) secondVisibleShapes.add(s);
    }
  });
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

  <!-- Controls bar: card-based layout -->
  <div class="mb-8 space-y-4">
    <!-- Chord selector card -->
    <div class="rounded-xl border border-gray-200 bg-white p-4">
      <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Chord</div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Select chord root">
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

    <!-- Second root selector (dual mode only) -->
    {#if viewMode === 'dual'}
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">To</div>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Select second root">
          {#each CHROMATIC as note (note)}
            <button
              aria-label="Select {note} as second root"
              aria-pressed={secondRoot === note}
              class="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200"
              class:bg-blue-600={secondRoot === note}
              class:text-white={secondRoot === note}
              class:shadow-sm={secondRoot === note}
              class:bg-gray-100={secondRoot !== note}
              class:text-gray-700={secondRoot !== note}
              class:hover:bg-gray-200={secondRoot !== note}
              onclick={() => (secondRoot = note)}
            >
              {note}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Quality + Labels + View + Legend: grid of cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Quality card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Quality</div>
        <div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5" role="radiogroup" aria-label="Quality">
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
          >Major</button>
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
          >Minor</button>
        </div>
      </div>

      <!-- Labels card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Labels</div>
        <div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5" role="radiogroup" aria-label="Label mode">
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
          >Intervals</button>
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
          >Notes</button>
        </div>
      </div>

      <!-- View mode card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">View</div>
        <div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5" role="radiogroup" aria-label="View mode">
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-white={viewMode === 'full'}
            class:text-gray-900={viewMode === 'full'}
            class:shadow-sm={viewMode === 'full'}
            class:text-gray-500={viewMode !== 'full'}
            class:hover:text-gray-700={viewMode !== 'full'}
            role="radio" aria-checked={viewMode === 'full'}
            aria-label="Full Neck view"
            onclick={() => (viewMode = 'full')}
          >Full Neck</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-white={viewMode === 'grid'}
            class:text-gray-900={viewMode === 'grid'}
            class:shadow-sm={viewMode === 'grid'}
            class:text-gray-500={viewMode !== 'grid'}
            class:hover:text-gray-700={viewMode !== 'grid'}
            role="radio" aria-checked={viewMode === 'grid'}
            aria-label="Shape Grid view"
            onclick={() => (viewMode = 'grid')}
          >Shape Grid</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-white={viewMode === 'dual'}
            class:text-gray-900={viewMode === 'dual'}
            class:shadow-sm={viewMode === 'dual'}
            class:text-gray-500={viewMode !== 'dual'}
            class:hover:text-gray-700={viewMode !== 'dual'}
            role="radio" aria-checked={viewMode === 'dual'}
            aria-label="Dual Compare view"
            onclick={() => (viewMode = 'dual')}
          >Dual Compare</button>
        </div>
      </div>

      <!-- Legend card -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Help</div>
        <button
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
          class:bg-blue-600={legendOpen}
          class:text-white={legendOpen}
          class:bg-gray-100={!legendOpen}
          class:text-gray-700={!legendOpen}
          class:hover:bg-gray-200={!legendOpen}
          aria-expanded={legendOpen}
          aria-controls="legend-panel"
          aria-label="Toggle legend"
          onclick={() => (legendOpen = !legendOpen)}
        >Legend</button>
      </div>
    </div>

    <!-- Legend panel -->
    <LegendPanel open={legendOpen} viewMode={viewMode} />

    <!-- Shape toggle bar (only in Full Neck mode) -->
    {#if viewMode === 'full'}
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Shapes</div>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Toggle shapes">
          {#each CAGED_ORDER as shapeName (shapeName)}
            {@const color = SHAPE_COLORS[shapeName]}
            {@const isActive = visibleShapes.has(shapeName)}
            <button
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200"
              class:border={true}
              style={isActive ? `background-color: ${color}; color: white; border-color: ${color};` : `background-color: #E5E7EB; color: #9CA3AF; border-color: #D1D5DB;`}
              aria-label="Toggle {shapeName} shape"
              aria-pressed={isActive}
              onclick={() => toggleShape(shapeName)}
            >
              <span
                class="inline-block h-3 w-3 rounded-full"
                style="background-color: {color}"
                class:ring-1={!isActive}
                class:ring-white={!isActive}
              ></span>
              {shapeName}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Content area -->
  {#if viewMode === 'full'}
    <FullFretboard shapes={shapes} {visibleShapes} {labelMode} />
  {:else if viewMode === 'dual'}
    <DualFretboard
      root1={selectedRoot}
      root2={secondRoot}
      quality={selectedQuality}
      labelMode={labelMode}
      visibleShapes1={visibleShapes}
      visibleShapes2={secondVisibleShapes}
      onRoot1Change={(r) => (selectedRoot = r)}
      onRoot2Change={(r) => (secondRoot = r)}
    />
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each shapes as shape (shape.shape)}
        <ShapeCard {shape} {labelMode} />
      {/each}
    </div>
  {/if}
</div>
