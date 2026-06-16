<script lang="ts">
  import type { NoteName, ChordQuality, LabelMode, CagedShape, OverlapStyle } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { getShapes } from '$lib/data/chords';
  import { buildPositionMap, type DiffEntry } from '$lib/theory/fretboard';
  import FullFretboard from './FullFretboard.svelte';
  import RootSelector from './RootSelector.svelte';
  import ShapeToggleBar from './ShapeToggleBar.svelte';

  interface Props {
    root1: NoteName;
    root2: NoteName;
    quality: ChordQuality;
    labelMode: LabelMode;
    visibleShapes1: Set<CagedShape>;
    visibleShapes2: Set<CagedShape>;
    onRoot1Change?: (root: NoteName) => void;
    onRoot2Change?: (root: NoteName) => void;
    onToggleShape1?: (shape: CagedShape) => void;
    onToggleShape2?: (shape: CagedShape) => void;
    overlapStyle?: OverlapStyle;
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
    onToggleShape1,
    onToggleShape2,
    overlapStyle = 'split',
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

  // Internal fallback toggles — used when external callbacks are not provided
  function toggleShape1(shape: CagedShape) {
    if (onToggleShape1) {
      onToggleShape1(shape);
    } else {
      if (visibleShapes1.has(shape)) {
        visibleShapes1.delete(shape);
      } else {
        visibleShapes1.add(shape);
      }
    }
  }

  function toggleShape2(shape: CagedShape) {
    if (onToggleShape2) {
      onToggleShape2(shape);
    } else {
      if (visibleShapes2.has(shape)) {
        visibleShapes2.delete(shape);
      } else {
        visibleShapes2.add(shape);
      }
    }
  }
</script>

<div class="flex flex-col gap-3 w-full overflow-auto">
  <!-- Top fretboard -->
  <section aria-label={`${root1} ${quality} — top fretboard`} class="flex flex-col gap-2">
    <div class="text-sm font-medium text-muted">{root1} {quality}</div>

    <!-- Root selector row 1 -->
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-xs font-medium text-muted">From:</span>
      <RootSelector
        notes={CHROMATIC}
        selected={root1}
        onSelect={(note) => onRoot1Change?.(note)}
        label="Top root selector"
        size="sm"
        buttonAriaLabel={(note) => `Select ${note} as top root`}
      />
    </div>

    <!-- Shape toggle bar 1 -->
    <div class="flex items-center gap-1.5">
      <span class="text-xs font-medium text-muted">Shapes</span>
      <ShapeToggleBar
        visibleShapes={visibleShapes1}
        onToggle={toggleShape1}
        groupAriaLabel="Top fretboard shape toggles"
        buttonAriaLabel={(shape) => `Toggle ${shape} shape on top fretboard`}
      />
    </div>

    <FullFretboard shapes={shapes1} visibleShapes={visibleShapes1} {labelMode} {width} highlightPositions={diffPositions} {overlapStyle} />
  </section>

  <!-- Bottom fretboard -->
  <section aria-label={`${root2} ${quality} — bottom fretboard`} class="flex flex-col gap-2">
    <div class="text-sm font-medium text-muted">{root2} {quality}</div>

    <!-- Root selector row 2 -->
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-xs font-medium text-muted">To:</span>
      <RootSelector
        notes={CHROMATIC}
        selected={root2}
        onSelect={(note) => onRoot2Change?.(note)}
        label="Bottom root selector"
        size="sm"
        buttonAriaLabel={(note) => `Select ${note} as bottom root`}
      />
    </div>

    <!-- Shape toggle bar 2 -->
    <div class="flex items-center gap-1.5">
      <span class="text-xs font-medium text-muted">Shapes</span>
      <ShapeToggleBar
        visibleShapes={visibleShapes2}
        onToggle={toggleShape2}
        groupAriaLabel="Bottom fretboard shape toggles"
        buttonAriaLabel={(shape) => `Toggle ${shape} shape on bottom fretboard`}
      />
    </div>

    <FullFretboard shapes={shapes2} visibleShapes={visibleShapes2} {labelMode} {width} highlightPositions={diffPositions} {overlapStyle} />
  </section>
</div>
