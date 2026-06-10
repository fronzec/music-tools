<script lang="ts">
  import type { ChordShape, LabelMode, CagedShape } from '$lib/types/chord';
  import { STANDARD_TUNING, CAGED_ORDER } from '$lib/types/chord';
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
    shapes: ChordShape[];
    visibleShapes: Set<CagedShape>;
    labelMode: LabelMode;
    width?: number;
  }

  let { shapes, visibleShapes, labelMode, width }: Props = $props();

  // ── Fret range calculation ──────────────────────────────────────

  let visibleShapeData = $derived(
    shapes.filter((s) => visibleShapes.has(s.shape)),
  );

  let minFret = $derived.by(() => {
    if (visibleShapeData.length === 0) return 0;
    return Math.min(
      ...visibleShapeData.map((s) => {
        if (s.baseFret <= 1) return 0;
        return s.baseFret;
      }),
    );
  });

  let maxFret = $derived.by(() => {
    if (visibleShapeData.length === 0) return FL.MIN_FRET_SPAN - 1;
    return Math.max(
      ...visibleShapeData.map((s) => {
        const absFrets = s.frets.filter((f): f is number => f !== null);
        if (absFrets.length === 0) {
          return s.baseFret > 1 ? s.baseFret : 0;
        }
        return s.baseFret > 1
          ? s.baseFret + Math.max(...absFrets)
          : Math.max(...absFrets);
      }),
    );
  });

  let displaySpan = $derived.by(() => {
    const span = maxFret - minFret + 1 + FL.FRET_PAD;
    return Math.max(FL.MIN_FRET_SPAN, Math.min(FL.MAX_FRET_SPAN, span));
  });

  let isOpenPosition = $derived(minFret === 0);

  // ── ViewBox ─────────────────────────────────────────────────────

  let vbW = $derived(width ?? viewBoxW(displaySpan));
  let vbH = $derived(viewBoxH());

  // ── Helpers ─────────────────────────────────────────────────────

  function diamondPoints(cx: number, cy: number, r: number): string {
    return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
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

  // ── Accessibility ───────────────────────────────────────────────

  let ariaLabel = $derived.by(() => {
    if (visibleShapeData.length === 0)
      return 'Empty fretboard — no shapes selected';
    const shapeNames = visibleShapeData.map((s) => s.shape).join(', ');
    const root = visibleShapeData[0]?.root ?? '';
    const quality = visibleShapeData[0]?.quality ?? '';
    return `${root} ${quality} chord — ${shapeNames} shapes`;
  });

  let isEmpty = $derived(visibleShapeData.length === 0);

  // ── Fret numbers data ───────────────────────────────────────────

  /**
   * Fret numbers to render below the fretboard.
   * Start from minFret+1 (skip 0/nut for open position).
   */
  let fretNumbers = $derived.by(() => {
    const nums: number[] = [];
    const start = minFret === 0 ? 1 : minFret + 1;
    const end = minFret + displaySpan - 1;
    for (let n = start; n <= end; n++) {
      nums.push(n);
    }
    return nums;
  });
</script>

<svg
  viewBox="0 0 {vbW} {vbH}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="w-full h-auto overflow-visible"
>
  <title>
    {#if isEmpty}
      Empty fretboard
    {:else}
      {visibleShapeData[0].root} {visibleShapeData[0].quality} — {visibleShapeData.map(s => s.shape).join(', ')} shapes
    {/if}
  </title>
  <desc>
    {#if isEmpty}
      Full fretboard with no shapes selected. Select one or more shapes to overlay.
    {:else}
      Full fretboard overlay showing {visibleShapeData.length} CAGED shape{visibleShapeData.length !== 1 ? 's' : ''}
      ({visibleShapeData.map(s => s.shape).join(', ')}) of the {visibleShapeData[0].root} {visibleShapeData[0].quality} chord.
    {/if}
  </desc>

  <!-- Empty state message -->
  {#if isEmpty}
    <text
      x={vbW / 2}
      y={vbH / 2}
      text-anchor="middle"
      font-size="14"
      fill="#9CA3AF"
      font-weight="500"
    >
      No shapes selected
    </text>
  {/if}

  <!-- Fret lines (vertical) -->
  {#each [...Array(displaySpan + 1).keys()] as f (f)}
    <line
      x1={fretLineX(f)}
      y1={stringY(0)}
      x2={fretLineX(f)}
      y2={stringY(5)}
      stroke="#9CA3AF"
      stroke-width="1"
    />
  {/each}

  <!-- String lines (horizontal, 6 strings in tablature order) -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={fretLineX(0)}
      y1={stringY(i)}
      x2={fretLineX(displaySpan)}
      y2={stringY(i)}
      stroke="#D1D5DB"
      stroke-width="1"
    />
  {/each}

  <!-- Fret markers (dots at standard positions) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= minFret && mf < minFret + displaySpan}
      {@const mx = noteX(mf, minFret)}
      {@const my = stringY(2.5)}
      <circle cx={mx} cy={my} r={L.MARKER_R} fill="#9CA3AF" />
      {#if mf === 12}
        <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} fill="#9CA3AF" />
        <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} fill="#9CA3AF" />
      {/if}
    {/if}
  {/each}

  <!-- Nut / base-fret indicator -->
  {#if isOpenPosition}
    <!-- Nut: thick black line -->
    <line
      x1={fretLineX(0)}
      y1={stringY(0)}
      x2={fretLineX(0)}
      y2={stringY(5)}
      stroke="#374151"
      stroke-width="4"
    />
  {:else}
    <!-- Base fret label (e.g. "5fr") above top -->
    <text
      x={L.LEFT_PAD + L.NUT_W / 2}
      y={L.TOP_PAD - 6}
      text-anchor="middle"
      font-size={L.LABEL_FS + 1}
      fill="#6B7280"
      font-weight="bold"
    >{minFret}fr</text>
    <!-- Thick line at left edge -->
    <line
      x1={fretLineX(0)}
      y1={stringY(0)}
      x2={fretLineX(0)}
      y2={stringY(5)}
      stroke="#374151"
      stroke-width="4"
    />
  {/if}

  <!-- Shape rendering (CAGED order: C first, D last on top) -->
  {#each CAGED_ORDER as shapeType (shapeType)}
    {@const shape = shapes.find((s) => s.shape === shapeType)}
    {#if shape && visibleShapes.has(shapeType)}
      {@const color = SHAPE_COLORS[shapeType]}
      {@const isBarre = shape.baseFret > 1}

      <!-- Barre indicator -->
      {#if isBarre}
        {@const barreIndices = shape.frets.reduce<number[]>((acc, f, i) => {
          if (f === 0) acc.push(i);
          return acc;
        }, [])}
        {#if barreIndices.length >= 2}
          {@const barreFirst = Math.min(...barreIndices)}
          {@const barreLast = Math.max(...barreIndices)}
          {@const bx = noteX(shape.baseFret, minFret) - L.FRET_SP / 4}
          {@const by = stringY(barreFirst) - L.BARRE_H / 2}
          {@const bh = stringY(barreLast) - stringY(barreFirst) + L.BARRE_H}
          <rect
            x={bx}
            y={by}
            width={L.FRET_SP / 2}
            height={bh}
            fill={color}
            opacity={FL.BARRE_OPACITY}
            rx="2"
          />
        {/if}
      {/if}

      <!-- Notes per string -->
      {#each [0, 1, 2, 3, 4, 5] as i (i)}
        {@const fret = shape.frets[i]}
        {@const interval = shape.intervals[i]}

        {#if fret !== null}
          {@const absFret = isBarre ? shape.baseFret + fret : fret}
          {@const cx = noteX(absFret, minFret)}
          {@const cy = stringY(i)}
          {@const isRoot = interval === 'R'}
          {@const label = getLabel(i, absFret, interval)}

          <!-- Root: diamond with note name inside -->
          {#if isRoot}
            <polygon
              points={diamondPoints(cx, cy, FL.ROOT_DIAMOND_R)}
              fill={color}
              stroke="white"
              stroke-width="2"
            />
            <text
              x={cx}
              y={cy + 4}
              text-anchor="middle"
              font-size="8"
              fill="white"
              font-weight="bold"
              style="pointer-events:none"
            >{getNoteName(i, absFret)}</text>
          {:else}
            <!-- Non-root: circle with white border for overlap contrast -->
            <circle
              cx={cx}
              cy={cy}
              r={L.TONE_R}
              fill={color}
              opacity={FL.NOTE_OPACITY}
              stroke="white"
              stroke-width="1.5"
            />
          {/if}

          <!-- Label -->
          {#if label}
            <text
              x={cx}
              y={cy - FL.ROOT_DIAMOND_R - 4}
              text-anchor="middle"
              font-size={L.LABEL_FS}
              fill="#374151"
              font-weight="bold"
            >{label}</text>
          {/if}
        {/if}
      {/each}

      <!-- Open (O) / muted (×) indicators at nut -->
      {#if isOpenPosition}
        {#each [0, 1, 2, 3, 4, 5] as i (i)}
          {@const fret = shape.frets[i]}
          {#if fret === 0}
            <text
              x={L.LEFT_PAD + L.NUT_W / 2}
              y={stringY(i) - L.ROOT_R - 2}
              text-anchor="middle"
              font-size={L.LABEL_FS + 2}
              fill={color}
              font-weight="bold"
            >O</text>
          {:else if fret === null}
            <text
              x={L.LEFT_PAD + L.NUT_W / 2}
              y={stringY(i) - L.ROOT_R - 2}
              text-anchor="middle"
              font-size={L.LABEL_FS + 2}
              fill="#9CA3AF"
              font-weight="bold"
            >×</text>
          {/if}
        {/each}
      {/if}
    {/if}
  {/each}

  <!-- Fret numbers (below bottom string) -->
  {#each fretNumbers as n (n)}
    {@const nx = noteX(n, minFret)}
    {@const ny = stringY(0) + FL.FRET_NUM_Y_OFFSET}
    <text
      x={nx}
      y={ny}
      text-anchor="middle"
      font-size={FL.FRET_NUM_FS}
      fill="#6B7280"
    >{n}</text>
  {/each}
</svg>
