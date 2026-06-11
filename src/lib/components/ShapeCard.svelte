<script lang="ts">
  import type { ChordShape, LabelMode } from '$lib/types/chord';
  import Fretboard from './Fretboard.svelte';

  interface Props {
    shape: ChordShape;
    labelMode: LabelMode;
  }

  let { shape, labelMode }: Props = $props();

  /**
   * Computes the fret range label (e.g., "frets 1–3").
   * For open shapes (baseFret === 0): frets are absolute positions.
   * For barre shapes (baseFret > 0): frets are relative to baseFret.
   */
  let isBarre = $derived(shape.baseFret > 0);

  let fretRange = $derived.by(() => {
    const absFrets = shape.frets
      .map((f) => {
        if (f === null) return null;
        return isBarre ? shape.baseFret + f : f;
      })
      .filter((f): f is number => f !== null);

    if (absFrets.length === 0) return '';
    const min = Math.min(...absFrets);
    const max = Math.max(...absFrets);
    return `frets ${min}–${max}`;
  });
</script>

<div
  class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
  aria-label="{shape.shape} shape, {fretRange}"
>
  <div class="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
    {shape.shape} shape
  </div>
  <div class="mb-2 text-xs text-gray-500 dark:text-gray-400">
    {fretRange}
  </div>
  <div class="max-w-[180px] sm:max-w-[200px]">
    <Fretboard {shape} {labelMode} />
  </div>
</div>
