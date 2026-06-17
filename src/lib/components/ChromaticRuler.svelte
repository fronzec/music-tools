<script lang="ts">
  import {
    TRIAD_OFFSETS,
    TRIAD_FORMULA,
    TRIAD_INTERVAL_JUMPS,
    TRIAD_DEGREES,
    chordTones,
    chordName,
  } from '$lib/theory/chords';
  import type { TriadQuality } from '$lib/theory/chords';
  import { CHROMATIC } from '$lib/types/chord';

  interface Props {
    rootPc: number;
    quality: TriadQuality;
    reducedMotion?: boolean;
  }

  let { rootPc, quality, reducedMotion = false }: Props = $props();

  // ---------------------------------------------------------------------------
  // Derived values — all display state computed from props
  // ---------------------------------------------------------------------------

  const offsets = $derived(TRIAD_OFFSETS[quality]);
  const formula = $derived(TRIAD_FORMULA[quality]);
  const jumps = $derived(TRIAD_INTERVAL_JUMPS[quality]);
  const degrees = $derived(TRIAD_DEGREES[quality]);
  const notes = $derived(chordTones(rootPc, offsets));
  const name = $derived(chordName(CHROMATIC[rootPc], quality));

  // Fixed 12 semitone slots (0..11) — evaluated once
  const SLOTS = Array.from({ length: 12 }, (_, i) => i);
</script>

<div class="flex flex-col gap-3">
  <!-- Chord name and formula -->
  <div class="flex items-baseline justify-between gap-2">
    <span class="font-display text-lg font-semibold text-ink">{name}</span>
    <span class="font-technical text-sm text-muted">{formula}</span>
  </div>

  <!-- Chromatic ruler track -->
  <div class="relative">
    <!-- 12 semitone slot cells -->
    <div class="flex">
      {#each SLOTS as s (s)}
        {@const isChordTone = (offsets as readonly number[]).includes(s)}
        {@const isRoot = s === 0}
        <div
          data-slot={s}
          class={[
            'relative flex h-10 flex-1 flex-col items-center justify-end border-r border-hairline pb-0.5 text-xs',
            isChordTone && isRoot
              ? 'bg-note-root/20 text-note-root'
              : isChordTone
                ? 'bg-note-tone/20 text-note-tone'
                : 'bg-surface-raised text-muted',
          ].join(' ')}
        >
          <span class="font-technical text-[10px] opacity-60">{s}</span>
        </div>
      {/each}
    </div>

    <!-- Absolutely-positioned chord tone markers -->
    {#each offsets as offset, i (i)}
      <span
        data-marker
        data-marker-index={i}
        class={[
          'pointer-events-none absolute bottom-full mb-1 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-ink shadow',
          i === 0 ? 'bg-note-root' : 'bg-note-tone',
          !reducedMotion ? 'transition-[left] duration-300 ease-out' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style="left: calc({(offset / 12) * 100}% + {(1 / 12) * 50}%)"
        aria-label="{notes[i]} ({degrees[i]})"
      >
        {degrees[i]}
      </span>
    {/each}
  </div>

  <!-- Note names at chord-tone positions -->
  <div class="relative flex">
    {#each SLOTS as s (s)}
      {@const offsetIdx = (offsets as readonly number[]).indexOf(s)}
      <div class="flex-1 text-center">
        {#if offsetIdx !== -1}
          <span class="font-technical text-xs font-semibold text-ink">
            {notes[offsetIdx]}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Interval jump annotations between adjacent markers -->
  <div class="flex items-center gap-1 text-center font-technical text-xs text-muted">
    {#each jumps as jump, i (i)}
      <span class="flex-1 text-accent">{jump}</span>
    {/each}
  </div>
</div>
