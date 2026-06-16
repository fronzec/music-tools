<script lang="ts">
  import type { NoteName, ChordQuality } from '$lib/types/chord';
  import type { ProgressionChord } from '$lib/types/progression';
  import { CHROMATIC } from '$lib/types/chord';
  import { MAX_CHORDS } from '$lib/types/progression';

  interface Props {
    progression: ProgressionChord[];
    activeIndex: number;
    /** Quality assigned to newly added chords. */
    quality: ChordQuality;
    onSelect: (index: number) => void;
    onAdd: (root: NoteName) => void;
    onRemove: (index: number) => void;
    onQualityChange: (index: number, quality: ChordQuality) => void;
  }

  let { progression, activeIndex, quality, onSelect, onAdd, onRemove, onQualityChange }: Props =
    $props();

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

<div class="rounded-xl border border-hairline bg-surface-raised p-4">
  <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
    Progression
  </div>
  <!-- Chord chips scroll horizontally; the Add picker sits OUTSIDE the scroll
       container so its dropdown is not clipped by overflow-x's implied overflow-y. -->
  <div class="flex items-start gap-2">
    <div class="flex gap-2 overflow-x-auto pb-1">
      {#each progression as chord, index (chord.id)}
        <div
          class={[
            'group relative flex shrink-0 items-center gap-1 rounded-lg p-1 transition-all duration-200',
            index === activeIndex
              ? 'bg-accent/15 border border-accent/50'
              : 'bg-surface border border-transparent',
          ].join(' ')}
        >
          <button
            class={[
              'rounded-md px-2 py-0.5 text-sm font-semibold transition-colors duration-200',
              index === activeIndex
                ? 'text-accent-soft'
                : 'text-muted hover:text-ink',
            ].join(' ')}
            aria-label="Select chord {chord.root} {chord.quality} at position {index + 1}"
            aria-pressed={index === activeIndex}
            onclick={() => onSelect(index)}
          >
            {chord.root}
          </button>

          <!-- Inline per-chord quality toggle (M = major, m = minor) -->
          <div
            class="flex rounded-md bg-surface/90 p-0.5"
            role="radiogroup"
            aria-label="Quality for chord {index + 1}"
          >
            <button
              class={[
                'rounded px-1.5 py-0.5 text-xs font-bold leading-none transition-colors duration-150',
                chord.quality === 'major'
                  ? 'bg-accent/15 text-accent-soft border border-accent/50'
                  : 'text-muted',
              ].join(' ')}
              role="radio"
              aria-checked={chord.quality === 'major'}
              aria-label="Set chord {index + 1} to major"
              onclick={() => onQualityChange(index, 'major')}
            >
              M
            </button>
            <button
              class={[
                'rounded px-1.5 py-0.5 text-xs font-bold leading-none transition-colors duration-150',
                chord.quality === 'minor'
                  ? 'bg-accent/15 text-accent-soft border border-accent/50'
                  : 'text-muted',
              ].join(' ')}
              role="radio"
              aria-checked={chord.quality === 'minor'}
              aria-label="Set chord {index + 1} to minor"
              onclick={() => onQualityChange(index, 'minor')}
            >
              m
            </button>
          </div>

          <button
            class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-hairline text-[10px] text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-error/80"
            aria-label="Remove chord {chord.root} {chord.quality}"
            onclick={() => onRemove(index)}
          >
            &times;
          </button>
        </div>
      {/each}
    </div>

    {#if progression.length < MAX_CHORDS}
      <div class="relative shrink-0">
        <button
          class="rounded-lg px-3 py-1.5 text-sm bg-surface text-muted hover:border-accent/40 border border-hairline transition-all duration-200"
          aria-label="Add chord"
          aria-expanded={showPicker}
          onclick={togglePicker}
        >
          + Add
        </button>

        {#if showPicker}
          <div
            class="fixed inset-0 z-10 cursor-default"
            onclick={() => (showPicker = false)}
            aria-label="Close chord picker"
            role="presentation"
          ></div>
          <div
            class="absolute left-0 top-full z-20 mt-1 w-max rounded-xl border border-hairline bg-surface-raised p-3 shadow-panel-raised"
            role="group"
            aria-label="Select chord root"
          >
            <div class="grid grid-cols-4 gap-1">
              {#each CHROMATIC as note (note)}
                <button
                  class="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 bg-surface text-muted hover:bg-surface hover:border-accent/40 border border-hairline"
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
