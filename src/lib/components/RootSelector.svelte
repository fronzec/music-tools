<script lang="ts">
  import type { NoteName } from '$lib/types/chord';

  interface Props {
    notes: NoteName[];
    selected: NoteName;
    onSelect: (n: NoteName) => void;
    label?: string;
    size?: 'sm' | 'md';
    buttonAriaLabel?: (note: NoteName) => string;
  }

  let { notes, selected, onSelect, label, size = 'md', buttonAriaLabel }: Props = $props();
</script>

<div
  role="group"
  aria-label={label ?? undefined}
  class="flex flex-wrap gap-1"
>
  {#each notes as note (note)}
    <button
      type="button"
      aria-pressed={selected === note}
      aria-label={buttonAriaLabel ? buttonAriaLabel(note) : undefined}
      onclick={() => onSelect(note)}
      class={[
        'rounded font-semibold transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        selected === note
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
      ].join(' ')}
    >
      {note}
    </button>
  {/each}
</div>
