<script lang="ts">
  import { SHAPE_COLORS } from '$lib/theory/layout';
  import { CAGED_ORDER } from '$lib/types/chord';

  interface Props {
    viewMode?: 'full' | 'grid' | 'dual';
  }

  let { viewMode = 'full' }: Props = $props();
</script>

<div
  id="legend-panel"
  role="region"
  aria-label="Fretboard legend"
>
  <div class="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
    <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
      <!-- Shape Colors -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Shapes</h3>
        {#each CAGED_ORDER as shape (shape)}
          {@const color = SHAPE_COLORS[shape]}
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: {color}"></span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{shape}</span>
          </div>
        {/each}
      </div>

      <!-- Symbols -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Symbols</h3>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="text-blue-600 text-xs shrink-0">◆</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Root note</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="text-green-600 text-xs shrink-0">●</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Chord tone</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-blue-600/40 shrink-0" style="color: #22C55E">O</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Open string</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-blue-600/40 shrink-0" style="color: #DC2626">×</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Muted string</span>
        </div>
      </div>

      <!-- Interval Labels -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Intervals</h3>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0 w-4">R</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Root</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0 w-4">3</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Major 3rd</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0 w-4">b3</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Minor 3rd</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0 w-4">5</span>
          <span class="text-xs text-gray-700 dark:text-gray-300">Perfect 5th</span>
        </div>
      </div>

      <!-- Dual Compare (only in dual mode) -->
      {#if viewMode === 'dual'}
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Dual Compare</h3>
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="shrink-0 text-xs">🟢</span>
            <span class="text-xs text-gray-700 dark:text-gray-300">Same interval</span>
          </div>
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="shrink-0 text-xs">🟠</span>
            <span class="text-xs text-gray-700 dark:text-gray-300">Different interval</span>
          </div>
        </div>
      {:else}
        <div></div>
      {/if}
    </div>
  </div>
</div>
