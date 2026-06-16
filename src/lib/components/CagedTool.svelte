<script lang="ts">
  import type { NoteName, ChordQuality, ViewName, CagedShape, OverlapStyle } from '$lib/types/chord';
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
  let viewMode = $state<'full' | 'grid' | 'dual'>('full');
  let visibleShapes = new SvelteSet(CAGED_ORDER);
  let secondRoot = $state<NoteName>('G');
  let secondVisibleShapes = new SvelteSet(CAGED_ORDER);

  let overlapStyle = $state<OverlapStyle>(
    (() => {
      const saved = localStorage.getItem('caged-overlap-style');
      return saved === 'split' || saved === 'dots' || saved === 'gradient' ? saved : 'split';
    })(),
  );

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

  // Persist overlap style to localStorage
  $effect(() => {
    localStorage.setItem('caged-overlap-style', overlapStyle);
  });
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Back button -->
  <button
    class="mb-6 text-sm font-medium text-muted transition-colors duration-200 hover:text-accent-soft"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <!-- Title -->
  <h1 class="mb-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl" id="caged-heading">
    CAGED Chord Visualizer
  </h1>

  <!-- Controls bar: card-based layout -->
  <div class="mb-8 space-y-4">
    <!-- Chord selector card (hidden in dual mode) -->
    {#if viewMode !== 'dual'}
    <div class="rounded-xl border border-hairline bg-surface-raised p-4">
      <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Chord</div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Select chord root">
        {#each CHROMATIC as note (note)}
          <button
            aria-label="Select {note} chord"
            aria-pressed={selectedRoot === note}
            class={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 border',
              selectedRoot === note
                ? 'bg-accent/15 text-accent-soft border-accent/50'
                : 'bg-surface text-muted border-transparent hover:border-accent/40',
            ].join(' ')}
            onclick={() => (selectedRoot = note)}
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
      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Type</div>
        <div class="inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="radiogroup" aria-label="Quality">
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={selectedQuality === 'major'}
            class:text-ink={selectedQuality === 'major'}
            class:shadow-sm={selectedQuality === 'major'}
            class:text-muted={selectedQuality !== 'major'}
            class:hover:text-ink={selectedQuality !== 'major'}
            role="radio"
            aria-checked={selectedQuality === 'major'}
            onclick={() => (selectedQuality = 'major')}
          >Major</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={selectedQuality === 'minor'}
            class:text-ink={selectedQuality === 'minor'}
            class:shadow-sm={selectedQuality === 'minor'}
            class:text-muted={selectedQuality !== 'minor'}
            class:hover:text-ink={selectedQuality !== 'minor'}
            role="radio"
            aria-checked={selectedQuality === 'minor'}
            onclick={() => (selectedQuality = 'minor')}
          >Minor</button>
        </div>
      </div>

      <!-- View mode card -->
      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">View</div>
        <div class="inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="radiogroup" aria-label="View mode">
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={viewMode === 'full'}
            class:text-ink={viewMode === 'full'}
            class:shadow-sm={viewMode === 'full'}
            class:text-muted={viewMode !== 'full'}
            class:hover:text-ink={viewMode !== 'full'}
            role="radio" aria-checked={viewMode === 'full'}
            aria-label="Full Neck view"
            onclick={() => (viewMode = 'full')}
          >Full Neck</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={viewMode === 'grid'}
            class:text-ink={viewMode === 'grid'}
            class:shadow-sm={viewMode === 'grid'}
            class:text-muted={viewMode !== 'grid'}
            class:hover:text-ink={viewMode !== 'grid'}
            role="radio" aria-checked={viewMode === 'grid'}
            aria-label="Shape Grid view"
            onclick={() => (viewMode = 'grid')}
          >Shape Grid</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={viewMode === 'dual'}
            class:text-ink={viewMode === 'dual'}
            class:shadow-sm={viewMode === 'dual'}
            class:text-muted={viewMode !== 'dual'}
            class:hover:text-ink={viewMode !== 'dual'}
            role="radio" aria-checked={viewMode === 'dual'}
            aria-label="Dual Compare view"
            onclick={() => (viewMode = 'dual')}
          >Dual Compare</button>
        </div>
      </div>

      <!-- Overlap Style card (hidden in grid mode — no overlaps to render) -->
      {#if viewMode !== 'grid'}
        <div class="rounded-xl border border-hairline bg-surface-raised p-4">
          <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Overlap</div>
          <div class="inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="radiogroup" aria-label="Overlap style">
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-surface-raised={overlapStyle === 'split'}
              class:text-ink={overlapStyle === 'split'}
              class:shadow-sm={overlapStyle === 'split'}
              class:text-muted={overlapStyle !== 'split'}
              class:hover:text-ink={overlapStyle !== 'split'}
              role="radio"
              aria-checked={overlapStyle === 'split'}
              onclick={() => (overlapStyle = 'split')}
            >Split</button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-surface-raised={overlapStyle === 'dots'}
              class:text-ink={overlapStyle === 'dots'}
              class:shadow-sm={overlapStyle === 'dots'}
              class:text-muted={overlapStyle !== 'dots'}
              class:hover:text-ink={overlapStyle !== 'dots'}
              role="radio"
              aria-checked={overlapStyle === 'dots'}
              onclick={() => (overlapStyle = 'dots')}
            >Dots</button>
            <button
              class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
              class:bg-surface-raised={overlapStyle === 'gradient'}
              class:text-ink={overlapStyle === 'gradient'}
              class:shadow-sm={overlapStyle === 'gradient'}
              class:text-muted={overlapStyle !== 'gradient'}
              class:hover:text-ink={overlapStyle !== 'gradient'}
              role="radio"
              aria-checked={overlapStyle === 'gradient'}
              onclick={() => (overlapStyle = 'gradient')}
            >Gradient</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Shape toggle bar (only in Full Neck mode) -->
    {#if viewMode === 'full'}
      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Shapes</div>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Toggle shapes">
          {#each CAGED_ORDER as shapeName (shapeName)}
            {@const color = SHAPE_COLORS[shapeName]}
            {@const isActive = visibleShapes.has(shapeName)}
            <button
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200"
              class:border={true}
              class:bg-surface={!isActive}
              class:text-muted={!isActive}
              class:border-hairline={!isActive}
              style={isActive ? `background-color: ${color}; color: white; border-color: ${color};` : undefined}
              aria-label="Toggle {shapeName} shape"
              aria-pressed={isActive}
              onclick={() => toggleShape(shapeName)}
            >
              <span
                class="inline-block h-3 w-3 rounded-full"
                style="background-color: {color}"
                class:ring-1={!isActive}
                class:ring-ink={!isActive}
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
    <FullFretboard shapes={shapes} {visibleShapes} labelMode="intervals" {overlapStyle} />
  {:else if viewMode === 'dual'}
    <DualFretboard
      root1={selectedRoot}
      root2={secondRoot}
      quality={selectedQuality}
      labelMode="intervals"
      visibleShapes1={visibleShapes}
      visibleShapes2={secondVisibleShapes}
      onRoot1Change={(n) => (selectedRoot = n)}
      onRoot2Change={(n) => (secondRoot = n)}
      onToggleShape1={(s) => toggleShape(s)}
      onToggleShape2={(s) => { if (secondVisibleShapes.has(s)) secondVisibleShapes.delete(s); else secondVisibleShapes.add(s); }}
      {overlapStyle}
    />
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each shapes as shape (shape.shape)}
        <ShapeCard {shape} labelMode="intervals" />
      {/each}
    </div>
  {/if}

  <!-- Legend — always visible below fretboard -->
  <LegendPanel viewMode={viewMode} />
</div>
