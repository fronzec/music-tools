<script lang="ts">
  import { intervalPositions } from '$lib/theory/intervals';
  import { getNoteName } from '$lib/theory/notes';
  import {
    L,
    FL,
    stringY,
    fretLineX,
    noteX,
    viewBoxW,
    viewBoxH,
    FRET_MARKERS,
  } from '$lib/theory/layout';

  interface Props {
    rootPc: number;          // 0..11
    intervalSemitones: number; // 1..12
    rootName?: string;       // display label for aria; e.g. 'C'
    targetName?: string;     // e.g. 'G'
    width?: number;          // optional width override
  }

  let { rootPc, intervalSemitones, rootName, targetName, width }: Props = $props();

  // Pure derived position list — one algorithm, one test surface
  let marks = $derived(intervalPositions(rootPc, intervalSemitones));

  // Geometry constants (always full neck from nut, frets 0..14)
  const rangeStart = 0;
  const span = FL.MAX_FRET_SPAN; // 14

  let vbW = $derived(width ?? viewBoxW(span));
  let vbH = $derived(viewBoxH());

  // Fret numbers to render below the bottom string
  let fretNumbers = $derived.by(() => {
    const nums: number[] = [];
    for (let n = 1; n <= span; n++) {
      nums.push(n);
    }
    return nums;
  });

  // Accessibility label
  let ariaLabel = $derived(
    `${rootName ?? 'Root'} to ${targetName ?? 'Target'} interval — positions across the neck`,
  );
</script>

<svg
  viewBox="-24 0 {vbW + 24} {vbH + 18}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="w-full h-auto overflow-visible"
>
  <title>{rootName ?? 'Root'} to {targetName ?? 'Target'} interval fretboard</title>
  <desc>
    Fretboard diagram showing all positions of the {rootName ?? 'root'} note (yellow)
    and {targetName ?? 'target'} note (blue) across a 6-string standard-tuned guitar neck,
    frets 0 to {span}.
  </desc>

  <!-- Neck background -->
  <rect
    x="-24"
    y="0"
    width={vbW + 24}
    height={vbH + 18}
    rx="4"
    class="fill-surface-raised"
  />

  <!-- Fret lines (vertical) -->
  {#each [...Array(span + 1).keys()] as f (f)}
    <line
      x1={fretLineX(f)}
      y1={stringY(0)}
      x2={fretLineX(f)}
      y2={stringY(5)}
      class="stroke-hairline"
      stroke-width="1"
    />
  {/each}

  <!-- Marker fret backgrounds (before strings so lines show through) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= rangeStart && mf < rangeStart + span}
      <rect
        x={fretLineX(mf - rangeStart - 1)}
        y={stringY(5)}
        width={L.FRET_SP}
        height={stringY(0) - stringY(5)}
        class="fill-hairline"
      />
    {/if}
  {/each}

  <!-- String lines (horizontal, 6 strings in tablature order) -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={fretLineX(0)}
      y1={stringY(i)}
      x2={fretLineX(span)}
      y2={stringY(i)}
      class="stroke-hairline"
      stroke-width="1"
    />
  {/each}

  <!-- Fret marker dots at standard positions -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= rangeStart && mf < rangeStart + span}
      {@const mx = noteX(mf, rangeStart)}
      {@const my = stringY(2.5)}
      <circle cx={mx} cy={my} r={L.MARKER_R} class="fill-hairline" />
      {#if mf === 12}
        <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} class="fill-hairline" />
        <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} class="fill-hairline" />
      {/if}
    {/if}
  {/each}

  <!-- Nut line (always open position) -->
  <line
    x1={fretLineX(0)}
    y1={stringY(0)}
    x2={fretLineX(0)}
    y2={stringY(5)}
    class="stroke-muted"
    stroke-width="4"
  />

  <!-- Interval position marks (root = accent/yellow, target = note-root/blue) -->
  {#each marks as mark (`${mark.stringIndex}-${mark.fret}`)}
    {@const cx = noteX(mark.fret, rangeStart)}
    {@const cy = stringY(mark.stringIndex)}
    {@const noteName = getNoteName(mark.stringIndex, mark.fret)}
    {#if mark.role === 'root'}
      <circle
        cx={cx}
        cy={cy}
        r={L.ROOT_R}
        class="fill-accent"
        data-role="root"
      />
      <text
        x={cx}
        y={cy + 4}
        text-anchor="middle"
        font-size={L.LABEL_FS}
        fill="white"
        font-weight="bold"
        style="pointer-events:none"
      >{noteName}</text>
    {:else}
      <circle
        cx={cx}
        cy={cy}
        r={L.TONE_R}
        class="fill-note-root"
        data-role="target"
      />
      <text
        x={cx}
        y={cy + 3}
        text-anchor="middle"
        font-size={L.LABEL_FS - 1}
        fill="white"
        font-weight="bold"
        style="pointer-events:none"
      >{noteName}</text>
    {/if}
  {/each}

  <!-- Fret numbers below bottom string -->
  {#each fretNumbers as n (n)}
    {@const nx = noteX(n, rangeStart)}
    {@const ny = stringY(0) + FL.FRET_NUM_Y_OFFSET}
    <text
      x={nx}
      y={ny}
      text-anchor="middle"
      font-size={FL.FRET_NUM_FS}
      class="fill-muted"
    >{n}</text>
  {/each}
</svg>
