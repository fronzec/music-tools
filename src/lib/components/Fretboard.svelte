<script lang="ts">
  import type { ChordShape, LabelMode } from '$lib/types/chord';
  import { getNoteName, getLabel } from '$lib/theory/notes';
  import { absFret } from '$lib/theory/fretboard';
  import { prefersReducedMotion } from '$lib/utils/motion';
  import {
    L,
    FL,
    SHAPE_COLORS,
    stringY,
    fretLineX,
    indicatorX,
    noteX,
    viewBoxW,
    viewBoxH,
    FRET_MARKERS,
  } from '$lib/theory/layout';

  interface Props {
    shape: ChordShape;
    labelMode: LabelMode;
    showNotes?: boolean;
    width?: number;
  }

  let { shape, labelMode, showNotes = true, width }: Props = $props();

  // ── Reduced motion ─────────────────────────────────────────────
  // Evaluated via utility getter — no local $state needed.

  // ── Fret range calculation ──────────────────────────────────────
  // In open position (baseFret === 1): frets are absolute (0 = open, 1 = 1st fret, …)
  // In barre position (baseFret >  1): frets are relative (0 = barre at baseFret)
  let isBarre = $derived(shape.baseFret > 0);

  let nonNullFrets = $derived(shape.frets.filter((f): f is number => f !== null));
  let maxFret = $derived(nonNullFrets.length > 0 ? Math.max(...nonNullFrets) : 0);

  // rangeStart: first visible fret (0 for open, baseFret for barre)
  let rangeStart = $derived(isBarre ? shape.baseFret : 0);

  // fretSpan: number of visible fret columns (maxFret + 1 extra for padding)
  let displaySpan = $derived(maxFret + 2);

  // ── ViewBox ─────────────────────────────────────────────────────
  let vbW = $derived(width ?? viewBoxW(displaySpan));
  let vbH = $derived(viewBoxH());

  // ── Barre detection ────────────────────────────────────────────
  // In barre position, strings with fret === 0 are barred
  let barreIndices = $derived(
    isBarre
      ? shape.frets.reduce<number[]>((acc, f, i) => {
          if (f === 0) acc.push(i);
          return acc;
        }, [])
      : [],
  );
  let barreFirst = $derived(barreIndices.length > 0 ? Math.min(...barreIndices) : -1);
  let barreLast = $derived(barreIndices.length > 0 ? Math.max(...barreIndices) : -1);

  // ── Helpers ─────────────────────────────────────────────────────
  function classifyInterval(
    interval: string | null,
  ): 'root' | 'tone' | 'other' {
    if (interval === 'R') return 'root';
    if (interval === '3' || interval === 'b3' || interval === '5') return 'tone';
    return 'other';
  }

  // Compute aria-label once
  let ariaLabel = $derived(
    `${shape.root} ${shape.quality} chord — ${shape.shape} shape, base fret ${shape.baseFret}`,
  );
</script>

<svg
  viewBox="0 0 {vbW} {vbH}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="w-full h-auto overflow-visible"
>
  <title>{shape.root} {shape.quality} — {shape.shape} shape</title>
  <desc>
    Fretboard diagram showing the {shape.shape}-shape voicing of the {shape.root}
    {shape.quality} chord at base fret {shape.baseFret}.
  </desc>

  <!-- Nut / base-fret indicator -->
  {#if isBarre}
    <!-- Base fret label (e.g. "8fr") -->
    <text
      x={L.LEFT_PAD + L.NUT_W / 2}
      y={L.TOP_PAD - 6}
      text-anchor="middle"
      font-size={L.LABEL_FS + 1}
      class="fill-muted"
      font-weight="bold"
    >{shape.baseFret}fr</text>
    <!-- Thick line at left edge -->
    <line
      x1={L.LEFT_PAD}
      y1={stringY(0)}
      x2={L.LEFT_PAD}
      y2={stringY(5)}
      class="stroke-muted"
      stroke-width="4"
    />
  {:else}
    <!-- Nut: thick line -->
    <line
      x1={L.LEFT_PAD}
      y1={stringY(0)}
      x2={L.LEFT_PAD}
      y2={stringY(5)}
      class="stroke-muted"
      stroke-width="4"
    />
  {/if}

  <!-- Marker fret backgrounds (before strings so lines show through) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= rangeStart && mf < rangeStart + displaySpan}
      <rect x={fretLineX(mf - rangeStart - 1)} y={stringY(5)} width={L.FRET_SP} height={stringY(0) - stringY(5)} class="fret-marker-bg fill-hairline" />
    {/if}
  {/each}

  <!-- String lines -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={L.LEFT_PAD}
      y1={stringY(i)}
      x2={fretLineX(displaySpan)}
      y2={stringY(i)}
      class="stroke-hairline"
      stroke-width="1"
    />
  {/each}

  <!-- Fret lines -->
  {#each [...Array(displaySpan + 1).keys()] as f (f)}
    <line
      x1={fretLineX(f)}
      y1={stringY(0)}
      x2={fretLineX(f)}
      y2={stringY(5)}
      class="stroke-hairline"
      stroke-width={f === 0 && !isBarre ? 4 : 1}
    />
  {/each}

  <!-- Fret markers (dots at standard positions) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= rangeStart && mf < rangeStart + displaySpan}
      {@const mx = noteX(mf, rangeStart)}
      {@const my = stringY(2.5)}  <!-- centered vertically -->
      <circle cx={mx} cy={my} r={L.MARKER_R} class="fill-hairline" />
      {#if mf === 12}
        <!-- Double dot at fret 12 -->
        <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} class="fill-hairline" />
        <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} class="fill-hairline" />
      {/if}
    {/if}
  {/each}

  <!-- Open (O) / muted (×) indicators -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    {@const fret = shape.frets[i]!}
    {@const indicatorXPos = indicatorX(shape.baseFret, isBarre ? shape.baseFret : 0) - 8}

    {#if fret === 0 && !isBarre}
      <rect x={indicatorXPos - 8} y={stringY(i) - 7} width="16" height="14" rx="5" class="indicator-badge"
            fill={SHAPE_COLORS[shape.shape]} opacity={FL.INDICATOR_OPACITY}
            style={prefersReducedMotion() ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
      <text x={indicatorXPos} y={stringY(i)}
            text-anchor="middle" alignment-baseline="central" font-size="10"
            fill="white"
            font-weight="bold"
            style={prefersReducedMotion() ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}>O</text>
    {:else if fret === null}
      <rect x={indicatorXPos - 8} y={stringY(i) - 7} width="16" height="14" rx="5" class="indicator-badge"
            fill={SHAPE_COLORS[shape.shape]} opacity={FL.INDICATOR_OPACITY}
            style={prefersReducedMotion() ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
      <text x={indicatorXPos} y={stringY(i)}
            text-anchor="middle" alignment-baseline="central" font-size="10"
            fill="white"
            font-weight="bold"
            style={prefersReducedMotion() ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}>×</text>
    {/if}
  {/each}

  <!-- Barre indicator (only for barre positions) -->
  {#if isBarre && barreFirst >= 0 && barreLast >= 0}
    {@const bx = noteX(shape.baseFret, rangeStart) - L.FRET_SP / 4}
    {@const by = stringY(barreFirst) - L.BARRE_H / 2}
    {@const bh = stringY(barreLast) - stringY(barreFirst) + L.BARRE_H}
    <rect
      x={bx}
      y={by}
      width={L.FRET_SP / 2}
      height={bh}
      class="fill-note-root"
      opacity="0.75"
      rx="2"
      style={prefersReducedMotion() ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
    />
  {/if}

  <!-- Note positions -->
  {#if showNotes}
    {#each [0, 1, 2, 3, 4, 5] as i (i)}
      {@const fret = shape.frets[i]!}
      {@const interval = shape.intervals[i]!}
      <!-- Skip muted strings and open strings (shown as O above) -->
      {#if fret !== null && !(fret === 0 && !isBarre)}
        {@const absoluteFret = absFret(shape.baseFret, fret, isBarre)}
        {@const cx = noteX(absoluteFret, rangeStart)}
        {@const cy = stringY(i)}
        {@const cls = classifyInterval(interval)}
        {@const label = getLabel(i, absoluteFret, interval, labelMode)}

        {#if cls === 'root'}
          <circle cx={cx} cy={cy} r={L.ROOT_R} class="fill-note-root"
            style={prefersReducedMotion() ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {:else if cls === 'tone'}
          <circle cx={cx} cy={cy} r={L.TONE_R} class="fill-note-tone"
            style={prefersReducedMotion() ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {:else}
          <circle cx={cx} cy={cy} r={L.OTHER_R} fill="none" class="stroke-hairline" stroke-width="1.5"
            style={prefersReducedMotion() ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {/if}

        {#if label}
          <g
            transform="translate({cx + 7},{cy - 11})"
            style={prefersReducedMotion() ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
          >
            <text
              x="0"
              y="0"
              text-anchor="middle"
              font-size={L.LABEL_FS}
              class="fill-ink"
              font-weight="bold"
            >{label}</text>
          </g>
        {/if}
      {/if}
    {/each}
  {/if}
</svg>

<style>
  @media (prefers-reduced-motion: reduce) {
    circle[style*="transition"],
    rect[style*="transition"],
    g[style*="transition: transform"] {
      transition: none !important;
    }
  }
</style>
