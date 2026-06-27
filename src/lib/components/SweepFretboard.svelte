<script lang="ts">
  import type { ArpeggioNote } from '$lib/types/progression';
  import {
    L,
    FRET_MARKERS,
    stringY,
    fretLineX,
    noteX,
    viewBoxW,
    viewBoxH,
  } from '$lib/theory/layout';

  interface Props {
    notes: ArpeggioNote[];
    activeNoteIndex: number;
    fretSpan?: number;
  }

  let { notes, activeNoteIndex, fretSpan = 24 }: Props = $props();

  const RANGE_START = 0;

  // Extend viewBox left to accommodate open-string notes (fret 0 → noteX = -7)
  const LEFT_EXT = L.LEFT_PAD;

  let W = $derived(viewBoxW(fretSpan));
  let H = $derived(viewBoxH());

  const ACCENT_COLOR = '#FACC15'; // yellow-400 (matches ROOT_COLOR)
  const DIMMED_COLOR = '#64748B'; // slate-500
  const DIMMED_OPACITY = 0.4;
  const STRING_COLOR = '#475569'; // slate-600
  const FRET_COLOR = '#334155'; // slate-700
  const MARKER_COLOR = '#374151'; // gray-700
  const MARKER_OPACITY = 0.45;

  // Interval label derived from MIDI delta relative to root (notes[0])
  const SEMITONE_LABELS: Record<number, string> = {
    0: 'R',
    3: 'b3',
    4: '3',
    6: 'b5',
    7: '5',
  };

  function intervalLabel(note: ArpeggioNote, rootMidi: number): string {
    const semitone = ((note.midi - rootMidi) % 12 + 12) % 12;
    return SEMITONE_LABELS[semitone] ?? '';
  }

  let rootMidi = $derived(notes.length > 0 ? notes[0]!.midi : 0);

  // Center Y for single-dot markers
  let centerY = $derived((stringY(0) + stringY(5)) / 2);
</script>

<svg
  viewBox="{-LEFT_EXT} 0 {W + LEFT_EXT} {H}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Sweep arpeggio fretboard — 24 frets"
  class="w-full h-auto"
>
  <!-- Strings (6 strings: index 0 = low E at bottom, 5 = high E at top) -->
  {#each Array(6) as _, i (i)}
    <line
      x1={fretLineX(0)}
      y1={stringY(i)}
      x2={fretLineX(fretSpan)}
      y2={stringY(i)}
      stroke={STRING_COLOR}
      stroke-width={i === 0 || i === 5 ? 1.5 : 1}
    />
  {/each}

  <!-- Fret lines -->
  {#each Array(fretSpan + 1) as _, f (f)}
    <line
      x1={fretLineX(f)}
      y1={stringY(0)}
      x2={fretLineX(f)}
      y2={stringY(5)}
      stroke={FRET_COLOR}
      stroke-width={f === 0 ? 5 : 0.75}
    />
  {/each}

  <!-- Fret markers -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf <= fretSpan}
      {#if mf === 12 || mf === 24}
        <!-- Double dot at 12 and 24 -->
        <circle
          cx={noteX(mf, RANGE_START)}
          cy={stringY(3) - L.STRING_SP * 0.25}
          r={L.MARKER_R}
          fill={MARKER_COLOR}
          opacity={MARKER_OPACITY}
        />
        <circle
          cx={noteX(mf, RANGE_START)}
          cy={stringY(2) + L.STRING_SP * 0.25}
          r={L.MARKER_R}
          fill={MARKER_COLOR}
          opacity={MARKER_OPACITY}
        />
      {:else}
        <!-- Single dot -->
        <circle
          cx={noteX(mf, RANGE_START)}
          cy={centerY}
          r={L.MARKER_R}
          fill={MARKER_COLOR}
          opacity={MARKER_OPACITY}
        />
      {/if}
    {/if}
  {/each}

  <!-- Fret numbers at marker positions -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf <= fretSpan && mf > 0}
      <text
        x={noteX(mf, RANGE_START)}
        y={stringY(0) + 14}
        text-anchor="middle"
        font-size="8"
        fill={FRET_COLOR}
        opacity="0.7"
      >{mf}</text>
    {/if}
  {/each}

  <!-- Arpeggio note circles -->
  {#each notes as note (note.stepIndex)}
    {@const isActive = note.stepIndex === activeNoteIndex}
    {@const cx = noteX(note.fret, RANGE_START)}
    {@const cy = stringY(note.string)}
    {@const label = intervalLabel(note, rootMidi)}
    <circle
      {cx}
      {cy}
      r={L.TONE_R}
      fill={isActive ? ACCENT_COLOR : DIMMED_COLOR}
      opacity={isActive ? 1 : DIMMED_OPACITY}
      data-testid="sweep-note"
      data-active={isActive ? 'true' : 'false'}
    />
    {#if label}
      <text
        x={cx}
        y={cy + 3.5}
        text-anchor="middle"
        font-size={L.LABEL_FS - 1}
        font-weight="bold"
        fill={isActive ? '#1e293b' : '#f8fafc'}
        opacity={isActive ? 1 : 0.7}
        pointer-events="none"
      >{label}</text>
    {/if}
  {/each}
</svg>
