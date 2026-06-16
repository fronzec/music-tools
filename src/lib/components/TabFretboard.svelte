<script lang="ts">
  import type { TabStep } from '$lib/theory/tab';
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
    step: TabStep;   // current playhead step — positions to highlight
    width?: number;  // optional width override
  }

  let { step, width }: Props = $props();

  // Geometry constants — same as IntervalFretboard (full neck, frets 0..14)
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

  // Active marks derived from the current step — pure, no DOM
  // Build a Set string for O(1) lookup
  let activeSet = $derived(
    new Set(step.map((n) => `${n.string}-${n.fret}`))
  );

  // Accessibility label describing current positions
  let ariaLabel = $derived.by(() => {
    if (step.length === 0) {
      return 'Guitar fretboard — no active positions';
    }
    const desc = step
      .map((n) => `string ${n.string} fret ${n.fret}`)
      .join(', ');
    return `Guitar fretboard — active positions: ${desc}`;
  });
</script>

<svg
  viewBox="-24 0 {vbW + 24} {vbH + 18}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="w-full h-auto overflow-visible"
>
  <title>Guitar fretboard tab view</title>
  <desc>
    Fretboard diagram highlighting the current step positions on a 6-string
    standard-tuned guitar neck, frets 0 to {span}.
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

  <!-- String lines (horizontal, 6 strings) -->
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

  <!-- Nut line -->
  <line
    x1={fretLineX(0)}
    y1={stringY(0)}
    x2={fretLineX(0)}
    y2={stringY(5)}
    class="stroke-muted"
    stroke-width="4"
  />

  <!-- Active position marks for the current step -->
  {#each step as note (`${note.string}-${note.fret}`)}
    {@const cx = noteX(note.fret, rangeStart)}
    {@const cy = stringY(note.string)}
    <circle
      cx={cx}
      cy={cy}
      r={L.ROOT_R}
      class="fill-accent"
      data-role="active"
      data-testid="mark-{note.string}-{note.fret}"
    />
    <text
      x={cx}
      y={cy + 4}
      text-anchor="middle"
      font-size={L.LABEL_FS}
      fill="white"
      font-weight="bold"
      style="pointer-events:none"
    >{note.fret}</text>
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
