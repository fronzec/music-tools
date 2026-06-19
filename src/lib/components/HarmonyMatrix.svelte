<script lang="ts">
  import type { NoteName } from '$lib/types/chord';
  import { majorScaleNotes, diatonicTriads } from '$lib/theory/diatonics';
  import type { DiatonicTriad } from '$lib/theory/diatonics';

  interface Props {
    root: NoteName;
  }

  let { root }: Props = $props();

  const scale = $derived(majorScaleNotes(root));
  const triads = $derived(diatonicTriads(root));

  /**
   * Short display name for a triad, e.g. 'Dm', 'B°', 'G'.
   * Mirrors the chordDisplayName helper in DiatonicHarmonizer.svelte.
   */
  function chordDisplayName(t: DiatonicTriad): string {
    return (
      t.rootName +
      (t.quality === 'min' ? 'm' : t.quality === 'dim' ? '°' : '')
    );
  }

  /**
   * Returns the cell role for row `i` (0-based degree index) and column `j`
   * (0-based scale-note index). Every chord picks every-other scale note:
   * root at j===i, third at j===(i+2)%7, fifth at j===(i+4)%7.
   */
  function cellRole(i: number, j: number): 'root' | 'third' | 'fifth' | 'empty' {
    if (j === i % 7) return 'root';
    if (j === (i + 2) % 7) return 'third';
    if (j === (i + 4) % 7) return 'fifth';
    return 'empty';
  }

  /** Cell content marker — visible symbol inside the cell. */
  const ROLE_MARKER: Record<'root' | 'third' | 'fifth' | 'empty', string> = {
    root: 'R',
    third: '3',
    fifth: '5',
    empty: '',
  };
</script>

<!--
  Scale Harmonization Matrix.
  Columns = 7 notes of the selected major scale.
  Rows = 7 diatonic triads (I through vii°).
  Each row lights up alternating columns showing the stacked-thirds structure.
-->
<div data-matrix class="overflow-x-auto">
  <table class="w-full min-w-[28rem] border-collapse font-technical text-xs">
    <!-- Header row: scale note names -->
    <thead>
      <tr>
        <!-- Empty cell for the Roman numeral column -->
        <th class="w-8 pb-1 text-right text-muted"></th>
        {#each scale as note (note)}
          <th
            data-matrix-header-note
            class="pb-1 text-center font-semibold text-muted"
          >
            {note}
          </th>
        {/each}
        <!-- Empty cell for the chord-name column -->
        <th class="w-12 pb-1 text-left text-muted"></th>
      </tr>
    </thead>
    <!-- Body: one row per triad, degree I through vii° -->
    <tbody>
      {#each triads as triad, i (triad.degree)}
        <tr class="border-t border-hairline/40">
          <!-- Roman numeral label -->
          <td class="py-1 pr-2 text-right font-semibold text-muted">
            {triad.roman}
          </td>
          <!-- 7 matrix cells -->
          {#each { length: 7 } as _, j (j)}
            {@const role = cellRole(i, j)}
            <td
              data-cell-role={role}
              class="py-1 text-center"
            >
              {#if role === 'root'}
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-root text-[10px] font-bold text-surface"
                >
                  {ROLE_MARKER.root}
                </span>
              {:else if role === 'third'}
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-tone text-[10px] font-bold text-surface"
                >
                  {ROLE_MARKER.third}
                </span>
              {:else if role === 'fifth'}
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-tone/70 text-[10px] font-bold text-surface"
                >
                  {ROLE_MARKER.fifth}
                </span>
              {:else}
                <span class="inline-flex h-6 w-6 items-center justify-center text-hairline">·</span>
              {/if}
            </td>
          {/each}
          <!-- Chord name label -->
          <td
            data-matrix-row-chord
            class="py-1 pl-2 font-semibold text-ink"
          >
            {chordDisplayName(triad)}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
