<script lang="ts">
  import type { NoteName } from '$lib/types/chord';
  import { majorScaleNotes, diatonicTriads, tonesLabel } from '$lib/theory/diatonics';
  import type { DiatonicTriad } from '$lib/theory/diatonics';
  import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';

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
  <!-- Scale-type caption -->
  <p data-scale-type class="mb-2 text-xs text-muted">{root} Major scale</p>

  <table class="w-full min-w-[28rem] border-collapse rounded-lg border border-hairline/40 font-technical text-xs">
    <!-- Header rows: axis labels then scale note names -->
    <thead>
      <!-- Axis label row: "Degree" | "Scale notes" span | "Chord" -->
      <tr>
        <th
          data-axis-label="degree"
          rowspan="2"
          class="w-8 text-center align-middle text-[10px] font-semibold uppercase tracking-wide text-muted/60"
        >
          Degree
        </th>
        <th
          data-axis-label="scale-notes"
          colspan="7"
          class="border-x border-hairline/40 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted/60"
        >
          Scale notes
        </th>
        <th
          data-axis-label="chord"
          rowspan="2"
          class="w-12 text-center align-middle text-[10px] font-semibold uppercase tracking-wide text-muted/60"
        >
          Chord
        </th>
      </tr>
      <!-- Note letter header row (Degree & Chord span both rows via rowspan) -->
      <tr>
        {#each scale as note (note)}
          <th
            data-matrix-header-note
            class="border-x border-hairline/40 pb-1 text-center text-sm font-bold text-ink first:border-l last:border-r"
          >
            {note}
          </th>
        {/each}
      </tr>
    </thead>
    <!-- Body: one row per triad, degree I through vii° -->
    <tbody>
      {#each triads as triad, i (triad.degree)}
        {@const triadOffsets = TRIAD_OFFSETS[triad.quality]}
        {@const triadDegrees = TRIAD_DEGREES[triad.quality]}
        {@const g1 = triadOffsets[1] - triadOffsets[0]}
        {@const g2 = triadOffsets[2] - triadOffsets[1]}
        <tr class="border-t border-hairline/40">
          <!-- Roman numeral label with quality sub-label -->
          <td class="border-r border-hairline/40 py-1 pr-2 text-right">
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-semibold text-muted">{triad.roman}</span>
              <span
                data-degree-quality={triad.quality}
                class="text-xs leading-none text-muted"
              >{triad.quality}</span>
            </div>
          </td>
          <!-- 7 matrix cells -->
          {#each { length: 7 } as _, j (j)}
            {@const role = cellRole(i, j)}
            <td
              data-cell-role={role}
              data-cell-degree={role === 'third' ? triadDegrees[1] : role === 'fifth' ? triadDegrees[2] : undefined}
              data-cell-tones={role === 'third' ? tonesLabel(g1) : role === 'fifth' ? tonesLabel(g2) : undefined}
              class="py-1 text-center"
            >
              {#if role === 'root'}
                <span
                  class="dot-glow-root inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-root text-xs font-bold text-surface"
                >
                  {ROLE_MARKER.root}
                </span>
              {:else if role === 'third'}
                <div class="flex flex-col items-center gap-0.5">
                  <span
                    class="dot-glow-third inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-third text-xs font-bold text-surface"
                  >
                    {triadDegrees[1]}
                  </span>
                  <span class="text-xs font-semibold leading-none {g1 === 3 ? 'text-accent-soft' : 'text-muted'}">
                    {tonesLabel(g1)}T
                  </span>
                </div>
              {:else if role === 'fifth'}
                <div class="flex flex-col items-center gap-0.5">
                  <span
                    class="dot-glow-fifth inline-flex h-6 w-6 items-center justify-center rounded-full bg-note-tone text-xs font-bold text-surface"
                  >
                    {triadDegrees[2]}
                  </span>
                  <span class="text-xs font-semibold leading-none {g2 === 3 ? 'text-accent-soft' : 'text-muted'}">
                    {tonesLabel(g2)}T
                  </span>
                </div>
              {:else}
                <span class="inline-flex h-6 w-6 items-center justify-center text-hairline">·</span>
              {/if}
            </td>
          {/each}
          <!-- Chord name label -->
          <td
            data-matrix-row-chord
            class="border-l border-hairline/40 py-1 pl-2 font-semibold text-ink"
          >
            {chordDisplayName(triad)}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
