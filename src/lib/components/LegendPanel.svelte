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
  <div class="border-t border-hairline pt-4 mt-4">
    <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
      <!-- Shape Colors -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Shapes</h3>
        {#each CAGED_ORDER as shape (shape)}
          {@const color = SHAPE_COLORS[shape]}
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: {color}"></span>
            <span class="text-xs font-medium text-ink">{shape}</span>
          </div>
        {/each}
      </div>

      <!-- Symbols -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Symbols</h3>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="text-note-root text-xs shrink-0">◆</span>
          <span class="text-xs text-ink">Root note</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="text-note-tone text-xs shrink-0">●</span>
          <span class="text-xs text-ink">Chord tone</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-note-root/40 text-success shrink-0">O</span>
          <span class="text-xs text-ink">Open string</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-note-root/40 text-error shrink-0">×</span>
          <span class="text-xs text-ink">Muted string</span>
        </div>
      </div>

      <!-- Interval Labels -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Intervals</h3>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-ink shrink-0 w-4">R</span>
          <span class="text-xs text-ink">Root</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-ink shrink-0 w-4">3</span>
          <span class="text-xs text-ink">Major 3rd</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-ink shrink-0 w-4">b3</span>
          <span class="text-xs text-ink">Minor 3rd</span>
        </div>
        <div class="flex items-center gap-1.5 py-0.5">
          <span class="font-mono text-xs font-bold text-ink shrink-0 w-4">5</span>
          <span class="text-xs text-ink">Perfect 5th</span>
        </div>
      </div>

      <!-- Dual Compare (only in dual mode) -->
      {#if viewMode === 'dual'}
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Dual Compare</h3>
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="shrink-0 text-xs">🟢</span>
            <span class="text-xs text-ink">Same interval</span>
          </div>
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="shrink-0 text-xs">🟠</span>
            <span class="text-xs text-ink">Different interval</span>
          </div>
        </div>
      {:else}
        <div></div>
      {/if}
    </div>
  </div>
</div>
