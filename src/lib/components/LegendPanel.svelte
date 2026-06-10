<script lang="ts">
  import { SHAPE_COLORS } from '$lib/theory/layout';
  import { CAGED_ORDER } from '$lib/types/chord';

  interface Props {
    open: boolean;
    viewMode?: 'full' | 'grid' | 'dual';
  }

  let { open, viewMode = 'full' }: Props = $props();
</script>

<div
  id="legend-panel"
  style="max-height: {open ? '500px' : '0'}; overflow: hidden; transition: max-height 0.3s ease"
  role="region"
  aria-label="Fretboard legend"
>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <!-- Shape Colors -->
    <h3 class="mb-3 text-sm font-semibold text-gray-800">CAGED Shapes</h3>
    <div class="grid grid-cols-2 gap-4">
      {#each CAGED_ORDER as shape (shape)}
        {@const color = SHAPE_COLORS[shape]}
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full shrink-0" style="background-color: {color}"></span>
          <span class="text-sm font-medium text-gray-700">{shape}</span>
          <span class="text-xs text-gray-500">{color}</span>
        </div>
      {/each}
    </div>

    <!-- Symbols -->
    <h3 class="mt-4 mb-3 text-sm font-semibold text-gray-800">Symbols</h3>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-blue-600 font-bold shrink-0">◆</span>
        <span class="text-sm text-gray-700">Root note</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-green-600 font-bold shrink-0">●</span>
        <span class="text-sm text-gray-700">Chord tone</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-400 shrink-0">○</span>
        <span class="text-sm text-gray-700">Overlapping note</span>
      </div>
    </div>

    <!-- Open & Muted -->
    <h3 class="mt-4 mb-3 text-sm font-semibold text-gray-800">Open &amp; Muted</h3>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold text-gray-700 shrink-0">O</span>
        <span class="text-sm text-gray-700">Open string</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold text-gray-700 shrink-0">×</span>
        <span class="text-sm text-gray-700">Muted string</span>
      </div>
    </div>

    <!-- Diff Highlights (dual mode only) -->
    {#if viewMode === 'dual'}
      <h3 class="mt-4 mb-3 text-sm font-semibold text-gray-800">Dual Compare</h3>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="shrink-0">🟢</span>
          <span class="text-sm text-gray-700">Same interval in both chords</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="shrink-0">🟠</span>
          <span class="text-sm text-gray-700">Different interval</span>
        </div>
      </div>
    {/if}
  </div>
</div>
