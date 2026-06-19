<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import { viewToPath, pathToView } from '$lib/routing';
  import HomePage from '$lib/components/HomePage.svelte';
  import CagedTool from '$lib/components/CagedTool.svelte';
  import ProgressionBuilder from '$lib/components/ProgressionBuilder.svelte';
  import NoteTrainer from '$lib/components/NoteTrainer.svelte';
  import ToneGenerator from '$lib/components/ToneGenerator.svelte';
  import PentatonicTool from '$lib/components/PentatonicTool.svelte';
  import SignalLab from '$lib/components/SignalLab.svelte';
  import IntervalTrainer from '$lib/components/IntervalTrainer.svelte';
  import TabPlayer from '$lib/components/TabPlayer.svelte';
  import ChordBuilder from '$lib/components/ChordBuilder.svelte';
  import DiatonicHarmonizer from '$lib/components/DiatonicHarmonizer.svelte';

  let currentView: ViewName = $state(pathToView(location.pathname));

  function navigate(view: ViewName) {
    currentView = view;
    const path = viewToPath(view);
    if (location.pathname !== path) {
      history.pushState({}, '', path);
    }
  }

  $effect(() => {
    const onPopState = () => {
      currentView = pathToView(location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });
</script>

{#snippet errorFallback(err: Error)}
  <div class="mx-auto max-w-lg p-8 text-center font-display">
    <h1 class="mb-4 text-2xl font-bold text-error">Something went wrong</h1>
    <pre
      class="mb-6 overflow-auto rounded border border-hairline bg-surface-raised p-4 text-left text-sm text-muted">{err.message}</pre>
    <button
      class="rounded-md border border-accent/50 bg-accent/10 px-4 py-2 font-technical text-xs font-medium uppercase tracking-[0.15em] text-accent-soft transition-colors hover:bg-accent/20"
      onclick={() => navigate('home')}
    >
      Back to Home
    </button>
  </div>
{/snippet}

<main class="min-h-screen bg-surface font-display text-ink">
  {#if currentView === 'home'}
    <svelte:boundary failed={errorFallback}>
      <HomePage {navigate} />
    </svelte:boundary>
  {:else if currentView === 'caged'}
    <svelte:boundary failed={errorFallback}>
      <CagedTool {navigate} />
    </svelte:boundary>
  {:else if currentView === 'progression'}
    <svelte:boundary failed={errorFallback}>
      <ProgressionBuilder {navigate} />
    </svelte:boundary>
  {:else if currentView === 'note-trainer'}
    <svelte:boundary failed={errorFallback}>
      <NoteTrainer {navigate} />
    </svelte:boundary>
  {:else if currentView === 'tone-generator'}
    <svelte:boundary failed={errorFallback}>
      <ToneGenerator {navigate} />
    </svelte:boundary>
  {:else if currentView === 'pentatonic'}
    <svelte:boundary failed={errorFallback}>
      <PentatonicTool {navigate} />
    </svelte:boundary>
  {:else if currentView === 'signal-lab'}
    <svelte:boundary failed={errorFallback}>
      <SignalLab {navigate} />
    </svelte:boundary>
  {:else if currentView === 'interval-trainer'}
    <svelte:boundary failed={errorFallback}>
      <IntervalTrainer {navigate} />
    </svelte:boundary>
  {:else if currentView === 'tab-player'}
    <svelte:boundary failed={errorFallback}>
      <TabPlayer {navigate} />
    </svelte:boundary>
  {:else if currentView === 'chord-builder'}
    <svelte:boundary failed={errorFallback}>
      <ChordBuilder {navigate} />
    </svelte:boundary>
  {:else if currentView === 'diatonic-harmonizer'}
    <svelte:boundary failed={errorFallback}>
      <DiatonicHarmonizer {navigate} />
    </svelte:boundary>
  {/if}
</main>
