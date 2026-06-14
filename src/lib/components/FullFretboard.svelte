<script lang="ts">
  import type { ChordShape, LabelMode, CagedShape, OverlapStyle } from '$lib/types/chord';
  import { CAGED_ORDER } from '$lib/types/chord';
  import { buildPositionMap, absFret, type NoteEntry, type DiffEntry } from '$lib/theory/fretboard';
  import { getNoteName, getLabel } from '$lib/theory/notes';
  import { prefersReducedMotion } from '$lib/utils/motion';
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
    overlapStyle?: OverlapStyle;
  }

  let { shapes, visibleShapes, labelMode, width, highlightPositions, overlapStyle = 'split' }: Props = $props();

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

  // Flat list for stable-keyed rendering (enables CSS transitions)
  let flatIndicators = $derived.by(() => {
    const result: Array<{
      key: string;
      cx: number;
      cy: number;
      color: string;
      type: 'open' | 'muted';
    }> = [];
    for (const group of positionIndicators) {
      group.indicators.forEach((indicator, j) => {
        result.push({
          key: indicator.shape + '-' + group.stringIndex,
          cx: indicatorX(group.baseFret, minFret) - 8 + j * 20,
          cy: stringY(group.stringIndex),
          color: indicator.color,
          type: indicator.type,
        });
      });
    }
    return result;
  });

  // ── ViewBox ─────────────────────────────────────────────────────

  let vbW = $derived(width ?? viewBoxW(displaySpan));
  let vbH = $derived(viewBoxH());

  // ── Helpers ─────────────────────────────────────────────────────

  function diamondPoints(cx: number, cy: number, r: number): string {
    return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
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
          absFret: absFret(shape.baseFret, fret, isBarre),
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
    // Sort each group in circular CAGED order (C→A→G→E→D→C)
    for (const notes of groups.values()) {
      if (notes.length < 2) continue;
      notes.sort((a, b) => CAGED_ORDER.indexOf(a.shape) - CAGED_ORDER.indexOf(b.shape));
      // If the gap between first and last > 2 (half the circle), rotate so first is the wrap start
      const firstIdx = CAGED_ORDER.indexOf(notes[0]!.shape);
      const lastIdx = CAGED_ORDER.indexOf(notes[notes.length - 1]!.shape);
      if (lastIdx - firstIdx > 2) {
        // The circular wrap should be between these — shift the array
        const split = notes.findIndex((n) => CAGED_ORDER.indexOf(n.shape) - firstIdx > 2);
        if (split > 0) {
          const rotated = notes.splice(0, split);
          notes.push(...rotated);
        }
      }
    }
    return groups;
  });

  /**
   * Unique color pairs for gradient-style overlap rendering.
   * Each entry maps a position key to the colors of shapes that overlap there.
   */
  let gradientDefs = $derived.by(() => {
    if (overlapStyle !== 'gradient') return [];
    const defs: Array<{ posKey: string; color1: string; color2: string }> = [];
    for (const [posKey, notes] of overlapGroups) {
      if (notes.length < 2) continue;
      // Deduplicate colors while preserving order (first two distinct colors)
      const colors: string[] = [];
      for (const n of notes) {
        if (!colors.includes(n.color)) colors.push(n.color);
        if (colors.length >= 2) break;
      }
      if (colors.length >= 2) {
        defs.push({ posKey, color1: colors[0], color2: colors[1] });
      }
    }
    return defs;
  });

  // ── Reduced motion ───────────────────────────────────────────────
  // Evaluated via utility getter — no local $state needed.

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

  <!-- Dark neck background -->
  <rect x="0" y="0" width={vbW} height={vbH} fill="#1F2937" rx="4" class="fretboard-bg" />

  <!-- Gradient definitions for overlap styles -->
  {#if gradientDefs.length > 0}
    <defs>
      {#each gradientDefs as def (def.posKey)}
        <linearGradient id="grad-{def.posKey}" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color={def.color1} />
          <stop offset="30%" stop-color={def.color1} />
          <stop offset="70%" stop-color={def.color2} />
          <stop offset="100%" stop-color={def.color2} />
        </linearGradient>
      {/each}
    </defs>
  {/if}

  <!-- Empty state message -->
  {#if isEmpty}
    <text
      x={vbW / 2}
      y={vbH / 2}
      text-anchor="middle"
      font-size="14"
      fill="#6B7280"
      class="fill-gray-500"
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
      stroke="#374151"
      class="stroke-gray-700"
      stroke-width="1"
    />
  {/each}

  <!-- Marker fret backgrounds (before strings so lines show through) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= minFret && mf < minFret + displaySpan}
      <rect x={fretLineX(mf - minFret - 1)} y={stringY(5)} width={L.FRET_SP} height={stringY(0) - stringY(5)} fill="#111827" class="fret-marker-bg fill-gray-900" />
    {/if}
  {/each}

  <!-- String lines (horizontal, 6 strings in tablature order) -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={fretLineX(0)}
      y1={stringY(i)}
      x2={fretLineX(displaySpan)}
      y2={stringY(i)}
      stroke="#9CA3AF"
      class="stroke-gray-400"
      stroke-width="1"
    />
  {/each}

  <!-- Fret markers (dots at standard positions) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf >= minFret && mf < minFret + displaySpan}
      {@const mx = noteX(mf, minFret)}
      {@const my = stringY(2.5)}
      <circle cx={mx} cy={my} r={L.MARKER_R} fill="#4B5563" class="fill-gray-600" />
      {#if mf === 12}
        <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} fill="#4B5563" class="fill-gray-600" />
        <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} fill="#4B5563" class="fill-gray-600" />
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
      stroke="#D1D5DB"
      class="stroke-gray-300"
      stroke-width="4"
    />
  {:else}
    <!-- Base fret label (e.g. "5fr") above top -->
    <text
      x={L.LEFT_PAD + L.NUT_W / 2}
      y={L.TOP_PAD - 6}
      text-anchor="middle"
      font-size={L.LABEL_FS + 1}
      fill="#9CA3AF"
      class="fill-gray-400"
      font-weight="bold"
    >{minFret}fr</text>
    <!-- Thick line at left edge -->
    <line
      x1={fretLineX(0)}
      y1={stringY(0)}
      x2={fretLineX(0)}
      y2={stringY(5)}
      stroke="#D1D5DB"
      class="stroke-gray-300"
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
            style={prefersReducedMotion() ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
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

  <!-- Open/Muted indicators — flat list with stable shape-string keys -->
  {#each flatIndicators as indicator (indicator.key)}
    <g
      style={prefersReducedMotion() ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
      transform="translate({indicator.cx}, {indicator.cy})"
    >
      <rect x="-8" y="-8" width="16" height="14" rx="5" class="indicator-badge"
            fill={indicator.color}
            opacity={FL.INDICATOR_OPACITY} />
      <text x="0" y="0" text-anchor="middle" alignment-baseline="central"
            font-size="10" fill="white"
            font-weight="bold">
        {indicator.type === 'open' ? 'O' : '×'}
      </text>
    </g>
  {/each}

  <!-- Snippet: single note (no overlap) -->
  {#snippet renderSingle(note: typeof allNotes[number], posKey: string)}
    {@const baseR = note.isRoot ? FL.ROOT_DIAMOND_R : L.TONE_R}
    {#if note.isRoot}
      <polygon
        points={diamondPoints(0, 0, baseR)}
        fill={note.color}
      />
      <text
        x="0" y="4"
        text-anchor="middle"
        font-size="9"
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
      />
      <text
        x="0" y="3"
        text-anchor="middle"
        font-size="8"
        fill="white"
        font-weight="bold"
        style="pointer-events:none"
      >{getNoteName(note.stringIndex, note.absFret)}</text>
    {/if}
  {/snippet}

  <!-- Snippet: overlapping notes — dispatches by overlapStyle -->
  {#snippet renderOverlap(overlaps: typeof allNotes, posKey: string, isRootPos: boolean, baseR: number)}
    {@const note1 = overlaps[0]}
    {@const note2 = overlaps[1]}
    {#if overlapStyle === 'split'}
      {#if isRootPos}
        <!-- Split diamond: left half + right half -->
        <polygon points="0,-{baseR} 0,{baseR} -{baseR},0" fill={note1.color} opacity={FL.OVERLAP_SPLIT_OPACITY} />
        <polygon points="0,-{baseR} 0,{baseR} {baseR},0" fill={note2.color} opacity={FL.OVERLAP_SPLIT_OPACITY} />
      {:else}
        <!-- Split circle -->
        <path d="M0,-{baseR} A{baseR},{baseR} 0 0,0 0,{baseR} Z" fill={note1.color} opacity={FL.OVERLAP_SPLIT_OPACITY} />
        <path d="M0,-{baseR} A{baseR},{baseR} 0 0,1 0,{baseR} Z" fill={note2.color} opacity={FL.OVERLAP_SPLIT_OPACITY} />
      {/if}
    {:else if overlapStyle === 'dots'}
      <!-- Merged dots — handle N shapes by chaining horizontally -->
      {#each overlaps as n, j}
        {@const off = (j - (overlaps.length - 1) / 2) * (n.isRoot ? FL.OVERLAP_ROOT_DOT_OFFSET : FL.OVERLAP_DOT_OFFSET)}
        {#if n.isRoot}
          <polygon points={diamondPoints(off, 0, baseR)} fill={n.color} opacity={FL.OVERLAP_DOTS_OPACITY} />
        {:else}
          <circle cx={off} cy="0" r={baseR} fill={n.color} opacity={FL.OVERLAP_DOTS_OPACITY} />
        {/if}
      {/each}
    {:else if overlapStyle === 'gradient'}
      {#if isRootPos}
        <polygon points={diamondPoints(0, 0, baseR)} fill="url(#grad-{posKey})" opacity={FL.OVERLAP_GRADIENT_OPACITY} />
      {:else}
        <circle cx="0" cy="0" r={baseR} fill="url(#grad-{posKey})" opacity={FL.OVERLAP_GRADIENT_OPACITY} />
      {/if}
    {/if}
    <!-- Note name label on top of overlap -->
    <text x="0" y="4" text-anchor="middle" font-size="9" fill="white" font-weight="bold" style="pointer-events:none">
      {getNoteName(overlaps[0].stringIndex, overlaps[0].absFret)}
    </text>
  {/snippet}

  <!-- Snippet: diff highlight ring -->
  {#snippet renderDiffRing(posKey: string, isRootPos: boolean, baseR: number)}
    {#if highlightPositions?.has(posKey)}
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
  {/snippet}

  <!-- Note rendering with shape-keyed animation -->
  {#each allNotes as note (note.stableKey)}
    {@const cx = noteX(note.absFret, minFret)}
    {@const cy = stringY(note.stringIndex)}
    {@const posKey = `${note.absFret},${note.stringIndex}`}
    {@const overlaps = overlapGroups.get(posKey) ?? []}
    {@const overlapIndex = overlaps.findIndex(o => o.stableKey === note.stableKey)}
    {@const label = getLabel(note.stringIndex, note.absFret, note.interval, labelMode)}
    {@const isRootPos = overlaps.length > 1 ? (overlaps[0]?.isRoot ?? note.isRoot) : note.isRoot}
    {@const baseR = isRootPos ? FL.ROOT_DIAMOND_R : L.TONE_R}

    <g
      class="fretboard-note-group"
      style={prefersReducedMotion() ? '' : `transition: transform ${FL.ANIM_DURATION} ${FL.ANIM_EASING}`}
      transform="translate({cx}, {cy})"
    >
      {#if overlaps.length === 1}
        {@render renderSingle(note, posKey)}
      {:else if overlapIndex === 0 && overlaps.length > 1}
        {@render renderOverlap(overlaps, posKey, isRootPos, baseR)}
      {/if}

      <!-- Highlight diff ring (only on first note of a position to avoid duplicates) -->
      {#if overlapIndex === 0}
        {@render renderDiffRing(posKey, isRootPos, baseR)}
      {/if}

      <!-- Label (only on first note of a position to avoid duplicates) -->
      {#if (overlaps.length === 1 || overlapIndex === 0) && label}
        <text
          x="7"
          y="-11"
          text-anchor="start"
          font-size={L.LABEL_FS}
          fill="#E5E7EB"
          class="fill-gray-200"
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
      class="fill-gray-500"
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
