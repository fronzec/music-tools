<script lang="ts">
  import type { NoteName, ChordQuality, LabelMode, CagedShape } from '$lib/types/chord';
  import { CHROMATIC, CAGED_ORDER } from '$lib/types/chord';
  import { getShapes } from '$lib/data/chords';
  import { SHAPE_COLORS } from '$lib/theory/layout';
  import { buildPositionMap, type DiffEntry } from '$lib/theory/fretboard';
  import FullFretboard from './FullFretboard.svelte';

  interface Props {
    root1: NoteName;
    root2: NoteName;
    quality: ChordQuality;
    labelMode: LabelMode;
    visibleShapes1: Set<CagedShape>;
    visibleShapes2: Set<CagedShape>;
    onRoot1Change?: (root: NoteName) => void;
    onRoot2Change?: (root: NoteName) => void;
    width?: number;
  }

  let {
    root1,
    root2,
    quality,
    labelMode,
    visibleShapes1,
    visibleShapes2,
    onRoot1Change,
    onRoot2Change,
    width,
  }: Props = $props();

  let shapes1 = $derived(getShapes(root1, quality));
  let shapes2 = $derived(getShapes(root2, quality));

  let diffPositions = $derived.by(() => {
    const result = new Map<string, DiffEntry>();
    const map1 = buildPositionMap(shapes1, visibleShapes1);
    const map2 = buildPositionMap(shapes2, visibleShapes2);

    for (const [key, entries1] of map1) {
      const entries2 = map2.get(key);
      if (!entries2) continue;

      const interval1 = entries1[0]!.interval;
      const interval2 = entries2[0]!.interval;

      if (interval1 === null || interval2 === null) continue;

      result.set(key, {
        type: interval1 === interval2 ? 'same' : 'different',
        interval1,
        interval2,
      });
    }

    return result;
  });

  function toggleShape1(shape: CagedShape) {
    if (visibleShapes1.has(shape)) {
      visibleShapes1.delete(shape);
    } else {
      visibleShapes1.add(shape);
    }
  }

  function toggleShape2(shape: CagedShape) {
    if (visibleShapes2.has(shape)) {
      visibleShapes2.delete(shape);
    } else {
      visibleShapes2.add(shape);
    }
  }
</script>

<div class="flex flex-col gap-3 w-full overflow-auto">
  <!-- Top fretboard -->
  <section aria-label={`${root1} ${quality} — top fretboard`} class="flex flex-col gap-2">
    <div class="text-sm font-medium text-gray-600">{root1} {quality}</div>

    <!-- Root selector row 1 -->
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Top root selector">
      <span class="text-xs font-medium text-gray-500">From:</span>
      {#each CHROMATIC as note (note)}
        <button
          aria-label="Select {note} as top root"
          aria-pressed={root1 === note}
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200"
          class:bg-blue-600={root1 === note}
          class:text-white={root1 === note}
          class:shadow-sm={root1 === note}
          class:bg-gray-100={root1 !== note}
          class:text-gray-700={root1 !== note}
          class:hover:bg-gray-200={root1 !== note}
          onclick={() => onRoot1Change?.(note)}
        >
          {note}
        </button>
      {/each}
    </div>

    <!-- Shape toggle bar 1 -->
    <div class="flex flex-wrap gap-2" role="group" aria-label="Top fretboard shape toggles">
      {#each CAGED_ORDER as shapeName (shapeName)}
        {@const color = SHAPE_COLORS[shapeName]}
        {@const isActive = visibleShapes1.has(shapeName)}
        <button
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 border"
          style={isActive ? `background-color: ${color}; color: white; border-color: ${color};` : `background-color: #E5E7EB; color: #9CA3AF; border-color: #D1D5DB;`}
          aria-label="Toggle {shapeName} shape on top fretboard"
          aria-pressed={isActive}
          onclick={() => toggleShape1(shapeName)}
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

    <FullFretboard shapes={shapes1} visibleShapes={visibleShapes1} {labelMode} {width} highlightPositions={diffPositions} />
  </section>

  <!-- Bottom fretboard -->
  <section aria-label={`${root2} ${quality} — bottom fretboard`} class="flex flex-col gap-2">
    <div class="text-sm font-medium text-gray-600">{root2} {quality}</div>

    <!-- Root selector row 2 -->
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Bottom root selector">
      <span class="text-xs font-medium text-gray-500">To:</span>
      {#each CHROMATIC as note (note)}
        <button
          aria-label="Select {note} as bottom root"
          aria-pressed={root2 === note}
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200"
          class:bg-blue-600={root2 === note}
          class:text-white={root2 === note}
          class:shadow-sm={root2 === note}
          class:bg-gray-100={root2 !== note}
          class:text-gray-700={root2 !== note}
          class:hover:bg-gray-200={root2 !== note}
          onclick={() => onRoot2Change?.(note)}
        >
          {note}
        </button>
      {/each}
    </div>

    <!-- Shape toggle bar 2 -->
    <div class="flex flex-wrap gap-2" role="group" aria-label="Bottom fretboard shape toggles">
      {#each CAGED_ORDER as shapeName (shapeName)}
        {@const color = SHAPE_COLORS[shapeName]}
        {@const isActive = visibleShapes2.has(shapeName)}
        <button
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 border"
          style={isActive ? `background-color: ${color}; color: white; border-color: ${color};` : `background-color: #E5E7EB; color: #9CA3AF; border-color: #D1D5DB;`}
          aria-label="Toggle {shapeName} shape on bottom fretboard"
          aria-pressed={isActive}
          onclick={() => toggleShape2(shapeName)}
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

    <FullFretboard shapes={shapes2} visibleShapes={visibleShapes2} {labelMode} {width} highlightPositions={diffPositions} />
  </section>
</div>
