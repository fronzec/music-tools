<script lang="ts">
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';
  import { diatonicTriads } from '$lib/theory/diatonics';
  import type { DiatonicTriad } from '$lib/theory/diatonics';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import ChordFretboard from '$lib/components/ChordFretboard.svelte';
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
      See the 7 diatonic triads of any major key and their positions on the fretboard.
    </p>
  </header>

  <!-- Root selection -->
  <section class="mb-6">
    <RootSelector
      notes={CHROMATIC}
      selected={root}
      onSelect={(n) => (root = n)}
      label="Select major key root"
    />
  </section>

  <!-- Scale harmonization matrix -->
  <section class="mb-6">
    <h2 class="mb-3 font-display text-base font-semibold text-ink">
      How each chord stacks in the scale
    </h2>
    <HarmonyMatrix {root} />
  </section>

  <!-- 7-chord grid — max 2 columns so each fretboard renders larger -->
  <div class="grid gap-4 lg:grid-cols-2">
    {#each triads as t (t.degree)}
      {@const degrees = TRIAD_DEGREES[t.quality]}
      <article class="rounded-lg border border-hairline bg-surface-raised p-4">
        <header class="mb-2 flex items-baseline justify-between">
          <span data-chord-name class="font-display text-lg font-bold text-ink">{chordDisplayName(t)}</span>
          <span class="font-technical text-sm text-muted">{t.roman}</span>
        </header>
        <div class="mb-2 font-technical text-xs text-muted">{t.quality}</div>

        <!-- Stacked-thirds construction diagram: 5th (top) → 3rd → root (bottom) -->
        <div data-construction-stack class="mb-3 space-y-0.5">
          {#each STACK_ORDER as idx}
            {@const degree = degrees[idx]}
            {@const note = t.notes[idx]}
            {@const isAltered = degree.includes('♭')}
            <div
              data-stack-row
              data-altered={isAltered ? 'true' : 'false'}
              class="flex items-center gap-2 font-technical text-xs {isAltered ? 'font-semibold text-accent-soft' : 'text-muted'}"
            >
              <span class="w-5 text-right">{degree}</span>
              <span class="text-hairline">|</span>
              <span>{note}</span>
            </div>
          {/each}
        </div>

        <ChordFretboard
          rootPc={t.rootPc}
          offsets={TRIAD_OFFSETS[t.quality]}
          degrees={TRIAD_DEGREES[t.quality]}
          rootName={t.rootName}
          chordName={chordDisplayName(t)}
        />
      </article>
    {/each}
  </div>
</div>
