<script lang="ts">
  import type { NoteName, ChordQuality } from '$lib/types/chord';
  import type { ProgressionChord } from '$lib/types/progression';
  import { CHROMATIC } from '$lib/types/chord';
  import { MAX_CHORDS } from '$lib/types/progression';

  interface Props {
    progression: ProgressionChord[];
    activeIndex: number;
    quality: ChordQuality;
    onSelect: (index: number) => void;
    onAdd: (root: NoteName) => void;
    onRemove: (index: number) => void;
  }

  let { progression, activeIndex, quality, onSelect, onAdd, onRemove }: Props = $props();

  let showPicker = $state(false);

  function togglePicker() {
    if (progression.length < MAX_CHORDS) {
      showPicker = !showPicker;
    }
  }

  function handleAdd(note: NoteName) {
    onAdd(note);
    showPicker = false;
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4">
  <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Progression</div>
  <div class="flex gap-2 overflow-x-auto pb-1">
    {#each progression as chord, index (chord.id)}
      <div class="group relative shrink-0">
        <button
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
          class:bg-blue-600={index === activeIndex}
          class:text-white={index === activeIndex}
          class:shadow-sm={index === activeIndex}
          class:bg-gray-100={index !== activeIndex}
          class:text-gray-700={index !== activeIndex}
          class:hover:bg-gray-200={index !== activeIndex}
          aria-label="Select chord {chord.root} {chord.quality} at position {index + 1}"
          aria-pressed={index === activeIndex}
          onclick={() => onSelect(index)}
        >
          {chord.root} {chord.quality}
        </button>
        <button
          class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-500"
          aria-label="Remove chord {chord.root} {chord.quality}"
          onclick={() => onRemove(index)}
        >
          &times;
        </button>
      </div>
    {/each}

    {#if progression.length < MAX_CHORDS}
      <div class="relative shrink-0">
        <button
          class="rounded-lg px-3 py-1.5 text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200"
          aria-label="Add chord"
          aria-expanded={showPicker}
          onclick={togglePicker}
        >
          + Add
        </button>

        {#if showPicker}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="fixed inset-0 z-10 cursor-default"
            onclick={() => (showPicker = false)}
            aria-label="Close chord picker"
            role="presentation"
          ></div>
          <div
            class="absolute left-0 top-full z-20 mt-1 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
            role="group"
            aria-label="Select chord root"
          >
            <div class="grid grid-cols-4 gap-1">
              {#each CHROMATIC as note (note)}
                <button
                  class="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  aria-label="Add {note} {quality} chord"
                  onclick={() => handleAdd(note)}
                >
                  {note}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
