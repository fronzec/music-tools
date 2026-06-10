<script lang="ts">
  import type { ChordShape, LabelMode } from '$lib/types/chord';
  import { STANDARD_TUNING } from '$lib/types/chord';
  import { semitoneToNoteName } from '$lib/theory/notes';
  import {
    L,
    FL,
    SHAPE_COLORS,
    stringY,
    fretLineX,
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
  let reducedMotion = $state(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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

  function getNoteName(stringIndex: number, absoluteFret: number): string {
    const openSemitone = STANDARD_TUNING[stringIndex];
    const frettedSemitone = openSemitone + absoluteFret;
    return semitoneToNoteName(frettedSemitone);
  }

  function getLabel(
    stringIndex: number,
    absoluteFret: number,
    interval: string | null,
  ): string | null {
    if (interval === null) return null;
    const noteName = getNoteName(stringIndex, absoluteFret);

    switch (labelMode) {
      case 'intervals':
        return interval;
      case 'notes':
        return noteName;
      case 'both':
        return `${noteName} (${interval})`;
      default:
        return interval;
    }
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
      fill="#6B7280"
      font-weight="bold"
    >{shape.baseFret}fr</text>
    <!-- Thick line at left edge -->
    <line
      x1={L.LEFT_PAD}
      y1={stringY(0)}
      x2={L.LEFT_PAD}
      y2={stringY(5)}
      stroke="#374151"
      stroke-width="4"
    />
  {:else}
    <!-- Nut: thick line -->
    <line
      x1={L.LEFT_PAD}
      y1={stringY(0)}
      x2={L.LEFT_PAD}
      y2={stringY(5)}
      stroke="#1F2937"
      stroke-width="4"
    />
  {/if}

  <!-- String lines -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={L.LEFT_PAD}
      y1={stringY(i)}
      x2={fretLineX(displaySpan)}
      y2={stringY(i)}
      stroke="#D1D5DB"
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
      stroke="#9CA3AF"
      stroke-width={f === 0 && !isBarre ? 4 : 1}
    />
  {/each}

  <!-- Fret markers (dots at standard positions) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= rangeStart && mf < rangeStart + displaySpan}
      {@const mx = noteX(mf, rangeStart)}
      {@const my = stringY(2.5)}  <!-- centered vertically -->
      <circle cx={mx} cy={my} r={L.MARKER_R} fill="#9CA3AF" />
      {#if mf === 12}
        <!-- Double dot at fret 12 -->
        <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} fill="#9CA3AF" />
        <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} fill="#9CA3AF" />
      {/if}
    {/if}
  {/each}

  <!-- Open (O) / muted (×) indicators -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    {@const fret = shape.frets[i]!}
    {@const indicatorXPos = isBarre
      ? fretLineX(0) - L.FRET_SP / 2 - 8
      : L.LEFT_PAD + L.NUT_W / 2}

    {#if fret === 0 && !isBarre}
      <text
        x={indicatorXPos}
        y={stringY(i) + 2}
        text-anchor="middle"
        font-size={L.LABEL_FS + 2}
        fill={SHAPE_COLORS[shape.shape]}
        font-weight="bold"
      >O</text>
    {:else if fret === null}
      <text
        x={indicatorXPos}
        y={stringY(i) + 2}
        text-anchor="middle"
        font-size={L.LABEL_FS + 2}
        fill={SHAPE_COLORS[shape.shape]}
        opacity="0.6"
        font-weight="bold"
      >×</text>
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
      fill="#3B82F6"
      opacity="0.75"
      rx="2"
      style={reducedMotion ? '' : `transition: x ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, y ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
    />
  {/if}

  <!-- Note positions -->
  {#if showNotes}
    {#each [0, 1, 2, 3, 4, 5] as i (i)}
      {@const fret = shape.frets[i]!}
      {@const interval = shape.intervals[i]!}
      <!-- Skip muted strings and open strings (shown as O above) -->
      {#if fret !== null && !(fret === 0 && !isBarre)}
        {@const absFret = isBarre ? shape.baseFret + fret : fret}
        {@const cx = noteX(absFret, rangeStart)}
        {@const cy = stringY(i)}
        {@const cls = classifyInterval(interval)}
        {@const label = getLabel(i, absFret, interval)}

        {#if cls === 'root'}
          <circle cx={cx} cy={cy} r={L.ROOT_R} fill="#3B82F6" stroke="#2563EB" stroke-width="1"
            style={reducedMotion ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {:else if cls === 'tone'}
          <circle cx={cx} cy={cy} r={L.TONE_R} fill="#22C55E" stroke="#16A34A" stroke-width="1"
            style={reducedMotion ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {:else}
          <circle cx={cx} cy={cy} r={L.OTHER_R} fill="none" stroke="#9CA3AF" stroke-width="1.5"
            style={reducedMotion ? '' : `transition: cx ${FL.ANIM_DURATION} ${FL.ANIM_EASING}, cy ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`} />
        {/if}

        {#if label}
          <g
            transform="translate({cx},{cy - L.ROOT_R - 4})"
            style={reducedMotion ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
          >
            <text
              x="0"
              y="0"
              text-anchor="middle"
              font-size={L.LABEL_FS}
              fill="#374151"
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
