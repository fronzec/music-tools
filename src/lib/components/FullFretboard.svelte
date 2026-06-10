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

  /**
   * Always start from the nut (fret 0) — fretboard never shifts.
   * Shapes at higher positions just appear further right.
   */
  let minFret = $derived(0);

  let displaySpan = $derived(FL.MIN_FRET_SPAN); // always 14

  /**
   * Open position only if at least one visible shape is at/near the nut.
   * Determines whether to show O/X indicators.
   */
  let isOpenPosition = $derived(
    visibleShapeData.some((s) => s.baseFret <= 1),
  );

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

  // ── Overlap detection ────────────────────────────────────────────

  type NoteEntry = {
    shape: CagedShape;
    color: string;
    isRoot: boolean;
    interval: string | null;
    absFret: number;
    stringIndex: number;
  };

  /**
   * Groups notes by (absFret, stringIndex). Positions with 2+ shapes
   * overlapping are rendered as split halves so both colors are visible.
   */
  let positionMap = $derived.by(() => {
    const map = new Map<string, NoteEntry[]>();

    for (const shapeType of CAGED_ORDER) {
      const shape = shapes.find((s) => s.shape === shapeType);
      if (!shape || !visibleShapes.has(shapeType)) continue;

      const isBarre = shape.baseFret > 1;
      for (let i = 0; i < 6; i++) {
        const fret = shape.frets[i];
        if (fret === null) continue;
        const absFret = isBarre ? shape.baseFret + fret : fret;
        const key = `${absFret},${i}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          shape: shapeType,
          color: SHAPE_COLORS[shapeType],
          isRoot: shape.intervals[i] === 'R',
          interval: shape.intervals[i],
          absFret,
          stringIndex: i,
        });
      }
    }

    return map;
  });

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

  <!-- Note rendering with overlap detection -->
  {#each [...positionMap.entries()] as [_key, notes] (_key)}
    {@const entry = notes[0]!}
    {@const cx = noteX(entry.absFret, minFret)}
    {@const cy = stringY(entry.stringIndex)}
    {@const label = getLabel(entry.stringIndex, entry.absFret, entry.interval)}

    {#if notes.length === 1}
      <!-- Single note: normal rendering -->
      {#if entry.isRoot}
        <polygon
          points={diamondPoints(cx, cy, FL.ROOT_DIAMOND_R)}
          fill={entry.color}
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
        >{getNoteName(entry.stringIndex, entry.absFret)}</text>
      {:else}
        <circle
          cx={cx}
          cy={cy}
          r={L.TONE_R}
          fill={entry.color}
          opacity={FL.NOTE_OPACITY}
          stroke="white"
          stroke-width="1.5"
        />
      {/if}
    {:else}
      <!-- Overlapping notes: split rendering (left/right halves) -->
      {@const r = entry.isRoot ? FL.ROOT_DIAMOND_R : L.TONE_R}
      {@const c1 = notes[0]!.color}
      {@const c2 = notes[1]!.color}
      {#if entry.isRoot}
        <!-- Split diamond: left half = c1, right half = c2 -->
        <polygon
          points={`${cx},${cy - r} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={c1}
          stroke="white"
          stroke-width="1"
        />
        <polygon
          points={`${cx},${cy - r} ${cx},${cy + r} ${cx + r},${cy}`}
          fill={c2}
          stroke="white"
          stroke-width="1"
        />
        <!-- Vertical divider -->
        <line x1={cx} y1={cy - r + 2} x2={cx} y2={cy + r - 2} stroke="white" stroke-width="2" />
      {:else}
        <!-- Split circle: left half = c1, right half = c2 -->
        <path
          d={`M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r} Z`}
          fill={c1}
          opacity={FL.NOTE_OPACITY}
        />
        <path
          d={`M ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx},${cy + r} Z`}
          fill={c2}
          opacity={FL.NOTE_OPACITY}
        />
        <!-- Vertical divider -->
        <line x1={cx} y1={cy - r - 1} x2={cx} y2={cy + r + 1} stroke="white" stroke-width="2" />
      {/if}
      <!-- Show note name if any entry is root -->
      {#if notes.some((n) => n.isRoot)}
        <text
          x={cx}
          y={cy + 4}
          text-anchor="middle"
          font-size="8"
          fill="white"
          font-weight="bold"
          style="pointer-events:none"
        >{getNoteName(entry.stringIndex, entry.absFret)}</text>
      {/if}
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
