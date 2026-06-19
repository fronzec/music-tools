<script lang="ts">
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { TRIAD_OFFSETS, TRIAD_DEGREES } from '$lib/theory/chords';
  import { diatonicTriads } from '$lib/theory/diatonics';
  import type { DiatonicTriad } from '$lib/theory/diatonics';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import ChordFretboard from '$lib/components/ChordFretboard.svelte';

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

  <!-- 7-chord grid -->
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each triads as t (t.degree)}
      <article class="rounded-lg border border-hairline bg-surface-raised p-4">
        <header class="mb-2 flex items-baseline justify-between">
          <span class="font-display text-lg font-bold text-ink">{chordDisplayName(t)}</span>
          <span class="font-technical text-sm text-muted">{t.roman}</span>
        </header>
        <div class="mb-1 font-technical text-xs text-muted">{t.quality}</div>
        <div class="mb-3 font-technical text-sm text-muted">{t.notes.join(' – ')}</div>
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
