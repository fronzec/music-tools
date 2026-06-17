<script lang="ts">
  import {
    TRIAD_OFFSETS,
    TRIAD_INTERVAL_JUMPS,
    TRIAD_DEGREES,
    chordTones,
  } from '$lib/theory/chords';
  import type { TriadQuality } from '$lib/theory/chords';
  import { semitoneToNoteName } from '$lib/theory/notes';

  interface Props {
    rootPc: number;
    quality: TriadQuality;
    reducedMotion?: boolean;
  }

  let { rootPc, quality, reducedMotion = false }: Props = $props();

  // ---------------------------------------------------------------------------
  // Derived values — all display state computed from props.
  // The chord name + formula live in the parent's info card (single source),
  // so this component is purely the visual ruler.
  // ---------------------------------------------------------------------------

  const offsets = $derived(TRIAD_OFFSETS[quality]);
  const jumps = $derived(TRIAD_INTERVAL_JUMPS[quality]);
  const degrees = $derived(TRIAD_DEGREES[quality]);
  const notes = $derived(chordTones(rootPc, offsets));

  // Fixed 12 semitone slots (0..11).
  const SLOTS = Array.from({ length: 12 }, (_, i) => i);
  // Note name for EVERY chromatic slot relative to the root (wraps mod-12),
  // so non-chord tones are shown faintly alongside the chord tones.
  const slotNotes = $derived(SLOTS.map((s) => semitoneToNoteName(rootPc + s)));
</script>

<div class="flex flex-col gap-3">
  <!-- Chromatic ruler track. The top padding reserves clearance for the
       absolutely-positioned chord-tone markers, so they never overlap the
       quality toggle or any surrounding content. -->
  <div class="relative pt-10">
    <!-- Chord tone markers (sit in the reserved top padding) -->
    {#each offsets as offset, i (i)}
      <span
        data-marker
        data-marker-index={i}
        class={[
          'pointer-events-none absolute top-1 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-ink shadow',
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
  </div>

  <!-- Note name under every slot: chord tones emphasized, the rest small + faint. -->
  <div class="flex">
    {#each SLOTS as s (s)}
      {@const isChordTone = (offsets as readonly number[]).includes(s)}
      <div class="flex-1 text-center" data-note-slot={s}>
        <span
          class={isChordTone
            ? 'font-technical text-xs font-semibold text-ink'
            : 'font-technical text-[10px] text-muted/50'}
        >
          {slotNotes[s]}
        </span>
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
