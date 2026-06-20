<script lang="ts">
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';
  import { diatonicTriads, tonesLabel } from '$lib/theory/diatonics';
  import type { DiatonicTriad } from '$lib/theory/diatonics';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import HarmonyMatrix from '$lib/components/HarmonyMatrix.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  // ---------------------------------------------------------------------------
  // State — exactly ONE $state: the selected major-key root
  // ---------------------------------------------------------------------------

  let root = $state<NoteName>('C');

  // ---------------------------------------------------------------------------
  // Derived — all 7 diatonic triads re-derived when root changes
  // ---------------------------------------------------------------------------

  const triads = $derived(diatonicTriads(root));

  // ---------------------------------------------------------------------------
  // Chord name helper — short display format (e.g. 'Dm', 'B°', 'C')
  // ---------------------------------------------------------------------------

  function chordDisplayName(t: DiatonicTriad): string {
    return (
      t.rootName +
      (t.quality === 'min' ? 'm' : t.quality === 'dim' ? '°' : '')
    );
  }

  // ---------------------------------------------------------------------------
  // Stacked-thirds diagram — rows in display order: fifth (top) → root (bottom)
  // degree indices: 0=root, 1=third, 2=fifth; displayed 2,1,0
  // ---------------------------------------------------------------------------

  const STACK_ORDER = [2, 1, 0] as const;
</script>

<!-- Back navigation -->
<div class="mx-auto max-w-6xl px-4 py-6">
  <button
    type="button"
    class="mb-6 flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
    onclick={() => navigate('home')}
    aria-label="Back to Home"
  >
    ← Back to Home
  </button>

  <!-- Header -->
  <header class="mb-6">
    <h1 class="font-display text-2xl font-bold text-ink">Diatonic Harmonizer</h1>
    <p class="mt-1 text-sm text-muted">
      See the 7 diatonic triads of any major key and how each one stacks from the scale.
    </p>
  </header>

  <!-- Root selection -->
  <section class="mb-4">
    <p class="mb-2 font-technical text-[10px] font-semibold uppercase tracking-wide text-muted/60">
      Select a key
    </p>
    <RootSelector
      notes={CHROMATIC}
      selected={root}
      onSelect={(n) => (root = n)}
      label="Select major key root"
    />
  </section>

  <!-- Legend strip -->
  <div
    data-legend
    class="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-hairline/40 bg-surface-raised px-4 py-3 font-technical text-xs text-muted"
  >
    <!-- Role chips -->
    <span class="flex items-center gap-1.5">
      <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-note-root text-[10px] font-bold text-surface">R</span>
      <span>Root</span>
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-note-third text-[10px] font-bold text-surface">3</span>
      <span>Third</span>
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-note-tone text-[10px] font-bold text-surface">5</span>
      <span>Fifth</span>
    </span>
    <!-- Jump explanations -->
    <span class="text-muted/60">·</span>
    <span class="flex items-center gap-1">
      <span class="font-bold text-ink">2T</span>
      <span class="text-muted">= whole-step jump (major 3rd)</span>
    </span>
    <span class="flex items-center gap-1">
      <span class="font-bold text-ink">1½T</span>
      <span class="text-muted">= minor 3rd jump</span>
    </span>
  </div>

  <!-- Scale harmonization matrix -->
  <section class="mb-6">
    <h2 class="mb-1 font-display text-base font-semibold text-ink">
      How each chord stacks in the scale
    </h2>
    <p class="mb-3 text-xs text-muted">
      Each row is a chord built by stacking two thirds. Read left-to-right: the coloured tones are the notes you play.
    </p>
    <HarmonyMatrix {root} />
  </section>

  <!-- 7-chord grid — chord cards with stacked-thirds construction (fretboards removed; new shape diagrams pending) -->
  <div class="grid gap-4 lg:grid-cols-2">
    {#each triads as t (t.degree)}
      {@const degrees = TRIAD_DEGREES[t.quality]}
      {@const offsets = TRIAD_OFFSETS[t.quality]}
      {@const g1 = offsets[1] - offsets[0]}
      {@const g2 = offsets[2] - offsets[1]}
      <article class="rounded-lg border border-hairline bg-surface-raised p-4">
        <header class="mb-2 flex items-baseline justify-between">
          <span data-chord-name class="font-display text-lg font-bold text-ink">{chordDisplayName(t)}</span>
          <span class="font-technical text-sm text-muted">{t.roman}</span>
        </header>
        <div class="mb-2 font-technical text-xs text-muted">{t.quality}</div>

        <!-- Stacked-thirds construction diagram: 5th (top) → 3rd → root (bottom) -->
        <!-- Gaps: g1 = root→third (offsets[1]-offsets[0]), g2 = third→fifth (offsets[2]-offsets[1]) -->
        <!-- Display order (STACK_ORDER=[2,1,0]): fifth, then gap(g2), then third, then gap(g1), then root -->
        <div data-construction-stack class="mb-3 space-y-0.5">
          {#each STACK_ORDER as idx, pos}
            {@const degree = degrees[idx]}
            {@const note = t.notes[idx]}
            {@const isAltered = degree.includes('♭')}
            <div
              data-stack-row
              data-altered={isAltered ? 'true' : 'false'}
              class="flex items-center gap-2 font-technical text-sm {isAltered ? 'font-semibold text-accent-soft' : 'text-muted'}"
            >
              <span class="w-5 text-right">{degree}</span>
              <span class="text-hairline">|</span>
              <span class="font-semibold {isAltered ? '' : 'text-ink'}">{note}</span>
            </div>
            {#if pos === 0}
              <!-- Gap between fifth (top) and third: g2 (third→fifth semitones) -->
              <div
                data-gap
                data-gap-small={g2 === 3 ? 'true' : 'false'}
                class="pl-7 font-technical text-xs font-semibold leading-none {g2 === 3 ? 'text-accent-soft' : 'text-muted'}"
              >
                {tonesLabel(g2)} tones
              </div>
            {:else if pos === 1}
              <!-- Gap between third and root: g1 (root→third semitones) -->
              <div
                data-gap
                data-gap-small={g1 === 3 ? 'true' : 'false'}
                class="pl-7 font-technical text-xs font-semibold leading-none {g1 === 3 ? 'text-accent-soft' : 'text-muted'}"
              >
                {tonesLabel(g1)} tones
              </div>
            {/if}
          {/each}
        </div>
      </article>
    {/each}
  </div>
</div>
