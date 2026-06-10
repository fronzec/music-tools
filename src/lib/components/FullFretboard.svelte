<script lang="ts">
  import type { ChordShape, LabelMode, CagedShape } from '$lib/types/chord';
  import { STANDARD_TUNING, CAGED_ORDER } from '$lib/types/chord';
  import { buildPositionMap, type NoteEntry, type DiffEntry } from '$lib/theory/fretboard';
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
    indicatorX,
  } from '$lib/theory/layout';

  interface Props {
    shapes: ChordShape[];
    visibleShapes: Set<CagedShape>;
    labelMode: LabelMode;
    width?: number;
    highlightPositions?: Map<string, DiffEntry>;
  }

  let { shapes, visibleShapes, labelMode, width, highlightPositions }: Props = $props();

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
   * True if at least one visible shape is at/near the nut.
   * Controls nut vs. barre-label rendering.
   */
  let isOpenPosition = $derived(
    visibleShapeData.some((s) => s.baseFret === 0),
  );

  // ── Open/Muted indicator pre-computation ────────────────────────

  /**
   * Groups O/× indicators by (baseFret, stringIndex) across all visible shapes.
   * Each group is positioned at its shape's base position and animates with it.
   */
  let positionIndicators = $derived.by(() => {
    const groups = new Map<string, {
      baseFret: number;
      stringIndex: number;
      indicators: Array<{ shape: CagedShape; type: 'open' | 'muted'; color: string }>;
    }>();

    for (const shapeType of CAGED_ORDER) {
      const shape = shapes.find((s) => s.shape === shapeType);
      if (!shape || !visibleShapes.has(shapeType)) continue;

      const isBarre = shape.baseFret > 0;
      for (let i = 0; i < 6; i++) {
        const fret = shape.frets[i];
        // barre strings (fret=0 in barre position): barre rect renders, skip O indicator
        if (fret === null || (fret === 0 && !isBarre)) {
          const key = `${shape.baseFret}-${i}`;
          if (!groups.has(key)) {
            groups.set(key, { baseFret: shape.baseFret, stringIndex: i, indicators: [] });
          }
          groups.get(key)!.indicators.push({
            shape: shapeType,
            type: fret === 0 ? 'open' : 'muted',
            color: SHAPE_COLORS[shapeType],
          });
        }
      }
    }

    return [...groups.values()];
  });

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

  /**
   * Groups notes by (absFret, stringIndex). Positions with 2+ shapes
   * overlapping are rendered as split halves so both colors are visible.
   */
  let positionMap = $derived(buildPositionMap(shapes, visibleShapes));

  // ── Animated rendering ───────────────────────────────────────────

  /**
   * Flat note list keyed by `${shape}-${stringIndex}` for stable DOM keys.
   * Iterates CAGED_ORDER × string indices, producing one entry per note.
   */
  let allNotes = $derived.by(() => {
    const result: Array<{
      stableKey: string;
      shape: CagedShape;
      color: string;
      isRoot: boolean;
      interval: string | null;
      absFret: number;
      stringIndex: number;
    }> = [];

    for (const shapeType of CAGED_ORDER) {
      const shape = shapes.find((s) => s.shape === shapeType);
      if (!shape || !visibleShapes.has(shapeType)) continue;

      const isBarre = shape.baseFret > 0;
      for (let i = 0; i < 6; i++) {
        const fret = shape.frets[i];
        if (fret === null) continue;
        result.push({
          stableKey: `${shapeType}-${i}`,
          shape: shapeType,
          color: SHAPE_COLORS[shapeType],
          isRoot: shape.intervals[i] === 'R',
          interval: shape.intervals[i],
          absFret: isBarre ? shape.baseFret + fret : fret,
          stringIndex: i,
        });
      }
    }

    return result;
  });

  /**
   * Groups notes by `absFret,stringIndex` for overlap detection.
   * Used to render concentric rings when 2+ shapes share a position.
   */
  let overlapGroups = $derived.by(() => {
    type AnimatedNote = typeof allNotes extends (infer T)[] ? T : never;
    const groups = new Map<string, AnimatedNote[]>();
    for (const note of allNotes) {
      const key = `${note.absFret},${note.stringIndex}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(note);
    }
    return groups;
  });

  // ── Reduced motion ───────────────────────────────────────────────
  let reducedMotion = $state(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
      {@const isBarre = shape.baseFret > 0}

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
          <g
            style={reducedMotion ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
            transform="translate({bx}, {by})"
          >
            <rect
              x="0"
              y="0"
              width={L.FRET_SP / 2}
              height={bh}
              fill={color}
              opacity={FL.BARRE_OPACITY}
              rx="2"
            />
          </g>
        {/if}
      {/if}

    {/if}
  {/each}

  <!-- Open/Muted indicators — per-(baseFret, stringIndex) groups -->
  {#each positionIndicators as group (group.baseFret + '-' + group.stringIndex)}
    {@const cx = indicatorX(group.baseFret, minFret)}
    {@const cy = stringY(group.stringIndex) - L.ROOT_R - 4}

    <g
      style={reducedMotion ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
      transform="translate({cx}, {cy})"
    >
      {#each group.indicators as indicator, j}
        <text
          x={j * FL.INDICATOR_SP}
          y="0"
          text-anchor="middle"
          font-size={FL.INDICATOR_FS}
          fill={indicator.color}
          font-weight="bold"
          opacity={indicator.type === 'muted' ? 0.65 : 0.85}
        >{indicator.type === 'open' ? 'O' : '×'}</text>
      {/each}
    </g>
  {/each}

  <!-- Note rendering with shape-keyed animation -->
  {#each allNotes as note (note.stableKey)}
    {@const cx = noteX(note.absFret, minFret)}
    {@const cy = stringY(note.stringIndex)}
    {@const posKey = `${note.absFret},${note.stringIndex}`}
    {@const overlaps = overlapGroups.get(posKey) ?? []}
    {@const overlapIndex = overlaps.findIndex(o => o.stableKey === note.stableKey)}
    {@const label = getLabel(note.stringIndex, note.absFret, note.interval)}
    {@const isRootPos = overlaps.length > 1 ? (overlaps[0]?.isRoot ?? note.isRoot) : note.isRoot}
    {@const baseR = isRootPos ? FL.ROOT_DIAMOND_R : L.TONE_R}

    <g
      class="fretboard-note-group"
      style={reducedMotion ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
      transform="translate({cx}, {cy})"
    >
      {#if overlaps.length === 1}
        <!-- Single note -->
        {#if note.isRoot}
          <polygon
            points={diamondPoints(0, 0, baseR)}
            fill={note.color}
            stroke="white"
            stroke-width="2"
          />
          <text
            x="0" y="4"
            text-anchor="middle"
            font-size="8"
            fill="white"
            font-weight="bold"
            style="pointer-events:none"
          >{getNoteName(note.stringIndex, note.absFret)}</text>
        {:else}
          <circle
            cx="0" cy="0"
            r={L.TONE_R}
            fill={note.color}
            opacity={FL.NOTE_OPACITY}
            stroke="white"
            stroke-width="1.5"
          />
        {/if}
      {:else if overlapIndex === 0}
        <!-- Innermost of overlapping notes -->
        {#if note.isRoot}
          <polygon
            points={diamondPoints(0, 0, baseR - 3)}
            fill={note.color}
            stroke="white"
            stroke-width="1"
          />
        {:else}
          <circle
            cx="0" cy="0"
            r={baseR - 3}
            fill={note.color}
            opacity={FL.NOTE_OPACITY}
          />
        {/if}
        <!-- Note name if any note in overlaps is root -->
        {#if overlaps.some((n) => n.isRoot)}
          <text
            x="0" y="4"
            text-anchor="middle"
            font-size="8"
            fill="white"
            font-weight="bold"
            style="pointer-events:none"
          >{getNoteName(note.stringIndex, note.absFret)}</text>
        {/if}
      {:else}
        <!-- Concentric ring for overlapping shapes -->
        {@const ringR = baseR - 1 + (overlapIndex - 1) * 2}
        {#if note.isRoot}
          <polygon
            points={diamondPoints(0, 0, ringR)}
            fill="none"
            stroke={note.color}
            stroke-width="3"
            opacity={0.9}
          />
        {:else}
          <circle
            cx="0" cy="0"
            r={ringR}
            fill="none"
            stroke={note.color}
            stroke-width="3"
            opacity={FL.NOTE_OPACITY}
          />
        {/if}
      {/if}

      <!-- Highlight diff ring (only on first note of a position to avoid duplicates) -->
      {#if overlapIndex === 0 && highlightPositions?.has(posKey)}
        {@const diff = highlightPositions.get(posKey)!}
        {@const ringR = baseR + 4}
        {#if diff.type === 'different'}
          {#if isRootPos}
            <polygon
              points={diamondPoints(0, 0, ringR)}
              fill="none"
              stroke="#F59E0B"
              stroke-width="2"
              stroke-dasharray="3 2"
              opacity="0.6"
            />
          {:else}
            <circle
              cx="0" cy="0" r={ringR}
              fill="none"
              stroke="#F59E0B"
              stroke-width="2"
              stroke-dasharray="3 2"
              opacity="0.6"
            />
          {/if}
        {:else if diff.type === 'same'}
          {#if isRootPos}
            <polygon
              points={diamondPoints(0, 0, ringR)}
              fill="none"
              stroke="#22C55E"
              stroke-width="1.5"
              opacity="0.5"
            />
          {:else}
            <circle
              cx="0" cy="0" r={ringR}
              fill="none"
              stroke="#22C55E"
              stroke-width="1.5"
              opacity="0.5"
            />
          {/if}
        {/if}
      {/if}

      <!-- Label (only on first note of a position to avoid duplicates) -->
      {#if (overlaps.length === 1 || overlapIndex === 0) && label}
        <text
          x="0"
          y={-(FL.ROOT_DIAMOND_R + 4)}
          text-anchor="middle"
          font-size={L.LABEL_FS}
          fill="#374151"
          font-weight="bold"
        >{label}</text>
      {/if}
    </g>
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

<style>
  @media (prefers-reduced-motion: reduce) {
    .fretboard-note-group {
      transition: none !important;
    }
  }
</style>
