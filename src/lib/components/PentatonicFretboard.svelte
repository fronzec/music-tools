<script lang="ts">
  import type { NoteName } from '$lib/types/chord';
  import type { BoxName, PentatonicBox, ScaleQuality } from '$lib/types/scale';
  import { getNoteName } from '$lib/theory/notes';
  import {
    L,
    FL,
    BOX_COLORS,
    ROOT_COLOR,
    stringY,
    fretLineX,
    noteX,
    viewBoxW,
    viewBoxH,
    FRET_MARKERS,
  } from '$lib/theory/layout';

  interface Props {
    boxes: PentatonicBox[];
    visibleBoxes: Set<BoxName>;
    root?: NoteName;
    quality?: ScaleQuality;
  }

  let { boxes, visibleBoxes, root, quality }: Props = $props();

  // Non-root note circle radius — slightly larger than the shared TONE_R so a
  // two-character note name (C#, A#) fits inside the figure.
  const NOTE_R = 9.5;

  // ── Derived: visible box data ────────────────────────────────────

  let visibleBoxData = $derived(boxes.filter((b) => visibleBoxes.has(b.name)));

  // ── Fret range calculation ────────────────────────────────────────

  let rangeStart = $derived.by(() => {
    if (visibleBoxData.length === 0) return 0;
    const allFrets = visibleBoxData.flatMap((b) => b.positions.map((p) => p.fret));
    return Math.max(0, Math.min(...allFrets) - 1);
  });

  // A single box spans ~4 frets; don't force the full neck width or it gets
  // lost on the left. Adapt the window to the visible boxes with a small floor.
  const MIN_SPAN = 6;

  let displaySpan = $derived.by(() => {
    if (visibleBoxData.length === 0) return MIN_SPAN;
    const allFrets = visibleBoxData.flatMap((b) => b.positions.map((p) => p.fret));
    const maxFret = Math.max(...allFrets);
    const needed = maxFret - rangeStart + 1;
    return Math.max(MIN_SPAN, needed);
  });

  let isNutVisible = $derived(rangeStart === 0);

  // ── Flat note list for stable-keyed rendering ─────────────────────

  let allNotes = $derived.by(() => {
    const result: Array<{
      stableKey: string;
      isRoot: boolean;
      interval: string;
      absFret: number;
      stringIndex: number;
    }> = [];

    for (const box of visibleBoxData) {
      for (const pos of box.positions) {
        result.push({
          stableKey: `${box.name}-${pos.stringIndex}-${pos.fret}`,
          isRoot: pos.isRoot,
          interval: pos.interval,
          absFret: pos.fret,
          stringIndex: pos.stringIndex,
        });
      }
    }

    return result;
  });

  // ── Connector bands ───────────────────────────────────────────────
  // Each box is shown by colored bands joining its two notes on every string
  // (the notes themselves are monochrome). This carries box identity without
  // coloring the notes, so shared notes between boxes never conflict.

  let bands = $derived.by(() => {
    const result: Array<{
      stableKey: string;
      color: string;
      stringIndex: number;
      fromFret: number;
      toFret: number;
    }> = [];

    for (const box of visibleBoxData) {
      for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const frets = box.positions
          .filter((p) => p.stringIndex === stringIndex)
          .map((p) => p.fret)
          .sort((a, b) => a - b);
        if (frets.length < 2) continue;
        result.push({
          stableKey: `band-${box.name}-${stringIndex}`,
          color: BOX_COLORS[box.name],
          stringIndex,
          fromFret: frets[0],
          toFret: frets[frets.length - 1],
        });
      }
    }

    return result;
  });

  // ── Accessibility ─────────────────────────────────────────────────

  let isEmpty = $derived(visibleBoxData.length === 0);

  let ariaLabel = $derived.by(() => {
    if (isEmpty) return 'Empty fretboard — no boxes selected';
    const boxNames = visibleBoxData.map((b) => b.name).join(', ');
    if (root && quality) {
      return `${root} ${quality} pentatonic — Boxes ${boxNames}`;
    }
    return `Pentatonic scale — Boxes ${boxNames}`;
  });

  // ── ViewBox ───────────────────────────────────────────────────────

  let vbW = $derived(viewBoxW(displaySpan));
  let vbH = $derived(viewBoxH());

  // ── Helpers ───────────────────────────────────────────────────────

  function diamondPoints(cx: number, cy: number, r: number): string {
    return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  }

  // Horizontal center for a note/band endpoint. Open-string notes (fret 0, at
  // the nut, when the window starts at the nut) have no fret column, so pin them
  // just left of the nut instead of letting noteX push them into the far margin.
  function nx(absFret: number): number {
    if (absFret <= rangeStart) return fretLineX(0) - L.NUT_W - 6;
    return noteX(absFret, rangeStart);
  }

  // ── Fret numbers data ─────────────────────────────────────────────

  let fretNumbers = $derived.by(() => {
    const nums: number[] = [];
    const start = rangeStart === 0 ? 1 : rangeStart + 1;
    const end = rangeStart + displaySpan - 1;
    for (let n = start; n <= end; n++) {
      nums.push(n);
    }
    return nums;
  });
</script>

<svg
  viewBox="-24 0 {vbW + 24} {vbH + 18}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="w-full h-auto overflow-visible"
>
  <title>
    {#if isEmpty}
      Empty fretboard — no boxes selected
    {:else if root && quality}
      {root} {quality} pentatonic — Boxes {visibleBoxData.map((b) => b.name).join(', ')}
    {:else}
      Pentatonic scale — Boxes {visibleBoxData.map((b) => b.name).join(', ')}
    {/if}
  </title>

  <!-- Empty state message -->
  {#if isEmpty}
    <text
      x={vbW / 2 - 12}
      y={vbH / 2}
      text-anchor="middle"
      font-size="14"
      fill="#6B7280"
      font-weight="500"
    >
      No boxes selected
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
      class="stroke-gray-300 dark:stroke-gray-600"
      stroke-width="1"
    />
  {/each}

  <!-- Marker fret backgrounds -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf > rangeStart && mf < rangeStart + displaySpan}
      <rect
        x={fretLineX(mf - rangeStart - 1)}
        y={stringY(5)}
        width={L.FRET_SP}
        height={stringY(0) - stringY(5)}
        fill="#111827"
        class="fill-gray-100 dark:fill-gray-800"
      />
    {/if}
  {/each}

  <!-- String lines (horizontal, 6 strings) -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={fretLineX(0)}
      y1={stringY(i)}
      x2={fretLineX(displaySpan)}
      y2={stringY(i)}
      stroke="#9CA3AF"
      class="stroke-gray-300 dark:stroke-gray-700"
      stroke-width="1"
    />
  {/each}

  <!-- Fret markers (dots at standard positions) -->
  {#each FRET_MARKERS as mf (mf)}
    {#if mf > rangeStart && mf < rangeStart + displaySpan}
      {@const mx = noteX(mf, rangeStart)}
      {@const my = stringY(2.5)}
      <circle
        cx={mx}
        cy={my}
        r={L.MARKER_R}
        fill="#4B5563"
        class="fill-gray-400 dark:fill-gray-600"
      />
      {#if mf === 12}
        <circle
          cx={mx}
          cy={stringY(1.5)}
          r={L.MARKER_R}
          fill="#4B5563"
          class="fill-gray-400 dark:fill-gray-600"
        />
        <circle
          cx={mx}
          cy={stringY(3.5)}
          r={L.MARKER_R}
          fill="#4B5563"
          class="fill-gray-400 dark:fill-gray-600"
        />
      {/if}
    {/if}
  {/each}

  <!-- Nut / base-fret indicator -->
  {#if isNutVisible}
    <line
      x1={fretLineX(0)}
      y1={stringY(0)}
      x2={fretLineX(0)}
      y2={stringY(5)}
      stroke="#D1D5DB"
      class="stroke-gray-800 dark:stroke-gray-400"
      stroke-width="4"
    />
  {:else}
    <text
      x={L.LEFT_PAD + L.NUT_W / 2}
      y={L.TOP_PAD - 6}
      text-anchor="middle"
      font-size={L.LABEL_FS + 1}
      fill="#9CA3AF"
      class="fill-gray-500 dark:fill-gray-400"
      font-weight="bold">{rangeStart + 1}fr</text
    >
    <line
      x1={fretLineX(0)}
      y1={stringY(0)}
      x2={fretLineX(0)}
      y2={stringY(5)}
      stroke="#D1D5DB"
      class="stroke-gray-800 dark:stroke-gray-400"
      stroke-width="4"
    />
  {/if}

  <!-- Box connector bands: per string, join the box's two notes (drawn under
       the notes so the notes sit on top). Box color lives here, not on notes. -->
  {#each bands as band (band.stableKey)}
    <line
      class="penta-band"
      x1={nx(band.fromFret)}
      y1={stringY(band.stringIndex)}
      x2={nx(band.toFret)}
      y2={stringY(band.stringIndex)}
      stroke={band.color}
      stroke-width="7"
      stroke-linecap="round"
      opacity="0.55"
    />
  {/each}

  <!-- Note rendering (stable-keyed for CSS transitions). Notes are monochrome;
       box identity is carried by the colored bands above. -->
  {#each allNotes as note (note.stableKey)}
    {@const cx = nx(note.absFret)}
    {@const cy = stringY(note.stringIndex)}
    {@const noteName = getNoteName(note.stringIndex, note.absFret)}

    <g
      class="penta-note-group"
      style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}"
      transform="translate({cx}, {cy})"
    >
      {#if note.isRoot}
        <!-- Root: gold diamond — shape AND a dedicated accent color make the
             root unmistakable, without clashing with the box band colors. -->
        <polygon
          points={diamondPoints(0, 0, FL.ROOT_DIAMOND_R)}
          fill={ROOT_COLOR}
          stroke="#111827"
          stroke-width="1.5"
        />
      {:else}
        <!-- Non-root: light filled circle with a subtle border so it reads on
             both the light and dark fretboard. -->
        <circle
          cx="0"
          cy="0"
          r={NOTE_R}
          fill="white"
          stroke="#9CA3AF"
          stroke-width="1"
          class="fill-white stroke-gray-400 dark:stroke-gray-500"
        />
      {/if}

      <!-- Note name inside the figure -->
      <text
        x="0"
        y="0"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="8.5"
        font-weight="bold"
        fill="#111827"
        style="pointer-events:none">{noteName}</text
      >

      <!-- Interval label above-right of the figure -->
      <text
        x="9"
        y="-10"
        text-anchor="start"
        font-size={L.LABEL_FS}
        fill="#E5E7EB"
        class="fill-gray-600 dark:fill-gray-300"
        font-weight="bold"
        style="pointer-events:none">{note.interval}</text
      >
    </g>
  {/each}

  <!-- Fret numbers (below bottom string) -->
  {#each fretNumbers as n (n)}
    {@const nx = noteX(n, rangeStart)}
    {@const ny = stringY(0) + FL.FRET_NUM_Y_OFFSET}
    <text
      x={nx}
      y={ny}
      text-anchor="middle"
      font-size={FL.FRET_NUM_FS}
      fill="#6B7280"
      class="fill-gray-500 dark:fill-gray-400">{n}</text
    >
  {/each}
</svg>

<style>
  @media (prefers-reduced-motion: reduce) {
    .penta-note-group {
      transition: none !important;
    }
  }
</style>
