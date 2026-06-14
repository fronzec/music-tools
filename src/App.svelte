<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import HomePage from '$lib/components/HomePage.svelte';
  import CagedTool from '$lib/components/CagedTool.svelte';
  import ProgressionBuilder from '$lib/components/ProgressionBuilder.svelte';
  import NoteTrainer from '$lib/components/NoteTrainer.svelte';
  import ToneGenerator from '$lib/components/ToneGenerator.svelte';
  import PentatonicTool from '$lib/components/PentatonicTool.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let currentView: ViewName = $state('home');

  function navigate(view: ViewName) {
    currentView = view;
  }
</script>

{#snippet errorFallback(err: Error)}
  <div class="mx-auto max-w-lg p-8 text-center">
    <h1 class="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h1>
    <pre class="mb-6 text-left text-sm text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 p-4 rounded overflow-auto">{err.message}</pre>
    <button
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      onclick={() => navigate('home')}
    >
      Back to Home
    </button>
  </div>
{/snippet}

<main class="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
  <ThemeToggle />
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
  {/if}
</main>
