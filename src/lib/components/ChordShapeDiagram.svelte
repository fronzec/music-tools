<script lang="ts">
  import { CHROMATIC, STANDARD_TUNING } from '$lib/types/chord';
  import { voicingRole } from '$lib/theory/openVoicings';
  import type { OpenVoicing, VoicingRole } from '$lib/theory/openVoicings';
  import {
    SL,
    slStringY,
    slFretLineX,
    slNoteX,
    slViewBoxW,
    slViewBoxH,
  } from '$lib/theory/shapeLayout';

  interface Props {
    voicing: OpenVoicing;   // the authored shape
    rootPc: number;         // triad root pitch class (from DiatonicTriad.rootPc) for role math
    chordName?: string;     // e.g. 'C major' for aria/title; falls back to voicing.name
  }

  let { voicing, rootPc, chordName }: Props = $props();

  // ---------------------------------------------------------------------------
  // Tailwind purge-safety (design-review finding #5):
  // Role→class map uses FULL STATIC LITERAL strings — NEVER template-literal interpolation.
  // Tailwind's content scanner only detects full class strings; `fill-note-${role}` is purged.
  // ---------------------------------------------------------------------------
  const ROLE_CLASS: Record<VoicingRole, string> = {
    root: 'fill-note-root',
    third: 'fill-note-third',
    fifth: 'fill-note-tone',
  } as const;

  // ---------------------------------------------------------------------------
  // Per-string derived data — single derivation used by dots, badges, and name column.
  // Design ADR-4: open strings (f === 0) have a role + note name just like fretted strings.
  // ---------------------------------------------------------------------------
  type StringData =
    | { i: number; kind: 'muted' }
    | { i: number; kind: 'open'; pc: number; role: VoicingRole | null; name: string }
    | { i: number; kind: 'fretted'; fret: number; pc: number; role: VoicingRole | null; name: string; finger: number | null };

  const perString = $derived(
    voicing.frets.map((f, i): StringData => {
      if (f === null) return { i, kind: 'muted' };
      const pc = (STANDARD_TUNING[i] + f) % 12;
      const role = voicingRole(pc, rootPc);
      const name = CHROMATIC[pc];
      if (f === 0) {
        return { i, kind: 'open', pc, role, name };
      }
      return { i, kind: 'fretted', fret: f, pc, role, name, finger: voicing.fingers[i] ?? null };
    }),
  );

  // Aria label
  const ariaLabel = $derived(`${chordName ?? voicing.name} chord diagram`);

  // Geometry
  const vbW = $derived(slViewBoxW());
  const vbH = $derived(slViewBoxH());
  const isOpen = $derived(voicing.baseFret === 1);

  // Gutter X for O and × badges (same as slNoteX(0, baseFret))
  const GUTTER_X = SL.LEFT_GUTTER / 2;

  // Right name-column X center
  const NAME_COL_X = slFretLineX(SL.WINDOW_FRETS) + SL.NAME_COL_W / 2;
</script>

<svg
  viewBox="0 0 {vbW} {vbH}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
  class="h-auto w-full overflow-visible"
>
  <title>{chordName ?? voicing.name}</title>
  <desc>
    Compact chord shape diagram for {chordName ?? voicing.name}.
    {voicing.baseFret === 1 ? 'Open position.' : `Position starting at fret ${voicing.baseFret}.`}
  </desc>

  <!-- =====================================================================
       1. Nut / baseFret indicator
       ===================================================================== -->
  {#if isOpen}
    <!-- Thick nut line when baseFret === 1 -->
    <line
      x1={slFretLineX(0)}
      y1={slStringY(5)}
      x2={slFretLineX(0)}
      y2={slStringY(0)}
      class="stroke-muted"
      stroke-width={SL.NUT_W}
      data-base-fret={voicing.baseFret}
    />
  {:else}
    <!-- Thin top line + fret-number label for baseFret > 1 -->
    <line
      x1={slFretLineX(0)}
      y1={slStringY(5)}
      x2={slFretLineX(0)}
      y2={slStringY(0)}
      class="stroke-hairline"
      stroke-width="1"
      data-base-fret={voicing.baseFret}
    />
    <text
      x={GUTTER_X}
      y={slStringY(5) - 4}
      text-anchor="middle"
      font-size={SL.LABEL_FS}
      class="fill-muted"
    >{voicing.baseFret}fr</text>
  {/if}

  <!-- =====================================================================
       2. String lines (horizontal, 6 strings)
       ===================================================================== -->
  {#each [0, 1, 2, 3, 4, 5] as i (i)}
    <line
      x1={slFretLineX(0)}
      y1={slStringY(i)}
      x2={slFretLineX(SL.WINDOW_FRETS)}
      y2={slStringY(i)}
      class="stroke-hairline"
      stroke-width="1"
    />
  {/each}

  <!-- =====================================================================
       3. Fret lines (vertical, WINDOW_FRETS + 1 lines)
       ===================================================================== -->
  {#each Array.from({ length: SL.WINDOW_FRETS + 1 }, (_, f) => f) as f (f)}
    {#if f > 0}
      <line
        x1={slFretLineX(f)}
        y1={slStringY(5)}
        x2={slFretLineX(f)}
        y2={slStringY(0)}
        class="stroke-hairline"
        stroke-width="1"
      />
    {/if}
  {/each}

  <!-- =====================================================================
       4. O / × gutter badges
       Open strings: O badge with data-open + data-role
       Muted strings: × badge with data-muted
       ===================================================================== -->
  {#each perString as s (s.i)}
    {#if s.kind === 'open'}
      <g data-open data-string={s.i} data-role={s.role ?? undefined}>
        <circle
          cx={GUTTER_X}
          cy={slStringY(s.i)}
          r={SL.DOT_R * 0.65}
          fill="none"
          class="stroke-muted"
          stroke-width="1.5"
        />
      </g>
    {:else if s.kind === 'muted'}
      <g data-muted data-string={s.i}>
        <text
          x={GUTTER_X}
          y={slStringY(s.i) + 4}
          text-anchor="middle"
          font-size={SL.LABEL_FS + 2}
          class="fill-muted"
        >×</text>
      </g>
    {/if}
  {/each}

  <!-- =====================================================================
       5. Barre rect (when voicing.barre is present)
       ===================================================================== -->
  {#if voicing.barre}
    {@const b = voicing.barre}
    {@const bX = slNoteX(b.fret, voicing.baseFret)}
    {@const bYTop = slStringY(b.toString)}
    {@const bYBot = slStringY(b.fromString)}
    <rect
      x={bX - SL.DOT_R * 0.9}
      y={bYTop - SL.DOT_R * 0.75}
      width={SL.DOT_R * 1.8}
      height={bYBot - bYTop + SL.DOT_R * 1.5}
      rx={SL.DOT_R * 0.75}
      ry={SL.DOT_R * 0.75}
      class="fill-note-root"
      opacity="0.75"
      data-barre
    />
  {/if}

  <!-- =====================================================================
       6. Finger dots (fretted strings only: frets[i] > 0)
       ===================================================================== -->
  {#each perString as s (s.i)}
    {#if s.kind === 'fretted'}
      {@const cx = slNoteX(s.fret, voicing.baseFret)}
      {@const cy = slStringY(s.i)}
      {@const roleClass = s.role ? ROLE_CLASS[s.role] : 'fill-muted'}
      <circle
        {cx}
        {cy}
        r={SL.DOT_R}
        class={roleClass}
        data-role={s.role ?? undefined}
        data-string={s.i}
      />
      {#if s.finger !== null}
        <text
          x={cx}
          y={cy + 4}
          text-anchor="middle"
          font-size={SL.LABEL_FS}
          class="fill-ink"
          style="pointer-events:none"
        >{s.finger}</text>
      {/if}
    {/if}
  {/each}

  <!-- =====================================================================
       7. Note-name column (right side) — all played strings (open + fretted)
       Note: data-role is on the primary element per string (dot or O badge),
       NOT repeated here, so [data-role] count === played-string count.
       ===================================================================== -->
  <g data-name-col>
    {#each perString as s (s.i)}
      {#if s.kind !== 'muted'}
        {@const roleClass = s.role ? ROLE_CLASS[s.role] : 'fill-muted'}
        <text
          x={NAME_COL_X}
          y={slStringY(s.i) + 4}
          text-anchor="middle"
          font-size={SL.LABEL_FS}
          class={roleClass}
        >{s.name}</text>
      {/if}
    {/each}
  </g>
</svg>
