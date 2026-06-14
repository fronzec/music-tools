<script lang="ts">
  import type { CagedShape } from '$lib/types/chord';
  import { CAGED_ORDER } from '$lib/types/chord';
  import { SHAPE_COLORS } from '$lib/theory/layout';

  interface Props {
    visibleShapes: Set<CagedShape>;
    onToggle: (s: CagedShape) => void;
    compact?: boolean;
  }

  let { visibleShapes, onToggle, compact = false }: Props = $props();
</script>

<div class="flex gap-1">
  {#each CAGED_ORDER as shape (shape)}
    {@const isActive = visibleShapes.has(shape)}
    <button
      type="button"
      aria-pressed={isActive}
      onclick={() => onToggle(shape)}
      style={isActive
        ? `background-color: ${SHAPE_COLORS[shape]}; color: white; border-color: ${SHAPE_COLORS[shape]};`
        : 'background-color: #E5E7EB; color: #9CA3AF; border-color: #D1D5DB;'}
      class={[
        'rounded font-semibold border transition-colors',
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      ].join(' ')}
    >
      {shape}
    </button>
  {/each}
</div>
