<script lang="ts">
  import { untrack } from 'svelte';
  import type { ViewName, NoteName } from '$lib/types/chord';
  import { CHROMATIC } from '$lib/types/chord';
  import { midiToFreq } from '$lib/theory/intervals';
  import {
    getTriad,
    chordMidi,
    TRIAD_FORMULA,
    type TriadQuality,
  } from '$lib/theory/chords';
  import { createNotePlayer, type NotePlayer } from '$lib/audio/playNote';
  import RootSelector from '$lib/components/RootSelector.svelte';
  import ChromaticRuler from '$lib/components/ChromaticRuler.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
    /** Injectable player for deterministic tests; defaults to createNotePlayer(). */
    player?: NotePlayer;
  }

  let { navigate, player }: Props = $props();

  // ---------------------------------------------------------------------------
  // State — root and quality
  // ---------------------------------------------------------------------------

  let root = $state<NoteName>('C');
  let quality = $state<TriadQuality>('maj');

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const triad = $derived(getTriad(root, quality));
  const rootPc = $derived(CHROMATIC.indexOf(root));

  // ---------------------------------------------------------------------------
  // Audio player — injectable or real; resolved once at construction.
  // untrack() prevents the Svelte 5 "state_referenced_locally" warning:
  // the prop is intentionally captured once (same pattern as IntervalTrainer's
  // `rng` — we want the injected player to persist across quality/root changes).
  // ---------------------------------------------------------------------------

  const _player: NotePlayer = untrack(() => player) ?? createNotePlayer();

  // ---------------------------------------------------------------------------
  // Reduced motion — read once on mount, jsdom-safe
  // ---------------------------------------------------------------------------

  let reducedMotion = $state(false);

  // ---------------------------------------------------------------------------
  // Block chord timer handle — cleared on unmount to prevent use-after-dispose
  // ---------------------------------------------------------------------------

  let blockTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Quality toggle options
  // ---------------------------------------------------------------------------

  const QUALITIES: readonly { id: TriadQuality; label: string }[] = [
    { id: 'maj', label: 'maj' },
    { id: 'min', label: 'min' },
    { id: 'dim', label: 'dim' },
    { id: 'aug', label: 'aug' },
  ];

  // Fixed reference MIDI for playback — C4 = 60 (mirrors IntervalTrainer)
  const ROOT_MIDI = 60;

  // ---------------------------------------------------------------------------
  // Play function — arpeggio then block chord
  // ---------------------------------------------------------------------------

  function play() {
    const midis = chordMidi(rootPc, triad.offsets as readonly number[]);
    const freqs = midis.map(midiToFreq);
    // 1) Arpeggio: ascending sequence (native playSequence behavior)
    _player.playSequence(freqs);
    // 2) Block chord: all notes simultaneously, after arpeggio completes
    const blockDelayMs = freqs.length * 700 + 150;
    blockTimer = setTimeout(() => _player.playChord(freqs), blockDelayMs);
  }

  // ---------------------------------------------------------------------------
  // Effect — reduced motion detection + player cleanup on unmount
  // ---------------------------------------------------------------------------

  $effect(() => {
    reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    return () => {
      if (blockTimer !== null) clearTimeout(blockTimer);
      _player.dispose();
    };
  });
</script>

<!-- Back navigation -->
<div class="mx-auto max-w-2xl px-4 py-6">
  <button
    type="button"
    class="mb-6 flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
    onclick={() => navigate('home')}
    aria-label="Back to home"
  >
    ← Back to Home
  </button>

  <!-- Header -->
  <header class="mb-6">
    <h1 class="font-display text-2xl font-bold text-ink">Chord Builder</h1>
    <p class="mt-1 text-sm text-muted">
      See how a root plus stacked thirds becomes a named chord.
    </p>
  </header>

  <!-- Root selection -->
  <section class="mb-6">
    <RootSelector
      notes={CHROMATIC}
      selected={root}
      onSelect={(n) => (root = n)}
      label="Select root note"
      buttonAriaLabel={(note) => `Select ${note} root`}
    />
  </section>

  <!-- Quality toggle -->
  <section class="mb-6 flex gap-2">
    {#each QUALITIES as q (q.id)}
      <button
        type="button"
        aria-pressed={quality === q.id}
        onclick={() => (quality = q.id)}
        class={[
          'rounded-md border px-3 py-1.5 font-technical text-sm font-medium transition-colors',
          quality === q.id
            ? 'border-accent/50 bg-accent/15 text-accent-soft'
            : 'border-transparent bg-surface text-muted hover:border-accent/40',
        ].join(' ')}
      >
        {q.label}
      </button>
    {/each}
  </section>

  <!-- Chromatic ruler -->
  <section class="mb-6">
    <ChromaticRuler {rootPc} {quality} {reducedMotion} />
  </section>

  <!-- Chord info -->
  <section class="mb-6 rounded-lg border border-hairline bg-surface-raised p-4">
    <div class="mb-2">
      <span class="font-display text-xl font-bold text-ink">{triad.name}</span>
    </div>
    <div class="mb-1 font-technical text-sm text-muted">
      Formula: <span class="text-ink">{TRIAD_FORMULA[quality]}</span>
    </div>
    <div class="font-technical text-sm text-muted">
      Notes:
      {#each triad.notes as note, i (i)}
        <span class="ml-1 font-semibold text-ink">{note}</span>
        {#if i < triad.notes.length - 1}<span class="text-muted"> –</span>{/if}
      {/each}
    </div>
  </section>

  <!-- Play button -->
  <section>
    <button
      type="button"
      aria-label="Play chord"
      onclick={play}
      class="rounded-md border border-accent/50 bg-accent/10 px-5 py-2.5 font-technical text-sm font-medium uppercase tracking-[0.12em] text-accent-soft transition-colors hover:bg-accent/20"
    >
      ▶ Play
    </button>
  </section>
</div>
