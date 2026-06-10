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
   * For open shapes (baseFret === 1): frets are absolute positions.
   * For barre shapes (baseFret > 1): frets are relative to baseFret.
   */
  let isBarre = $derived(shape.baseFret > 1);

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

<div class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
  <div class="mb-1 text-sm font-semibold text-gray-800">
    {shape.shape} shape
  </div>
  <div class="mb-2 text-xs text-gray-500">
    {fretRange}
  </div>
  <div class="max-w-[180px]">
    <Fretboard {shape} {labelMode} />
  </div>
</div>
