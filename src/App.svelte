<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import HomePage from '$lib/components/HomePage.svelte';
  import CagedTool from '$lib/components/CagedTool.svelte';
  import ProgressionBuilder from '$lib/components/ProgressionBuilder.svelte';
  import NoteTrainer from '$lib/components/NoteTrainer.svelte';

  let currentView: ViewName = $state('home');

  function navigate(view: ViewName) {
    currentView = view;
  }
</script>

{#snippet errorFallback(err: Error)}
  <div class="mx-auto max-w-lg p-8 text-center">
    <h1 class="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
    <pre class="mb-6 text-left text-sm text-gray-600 bg-gray-100 p-4 rounded overflow-auto">{err.message}</pre>
    <button
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      onclick={() => navigate('home')}
    >
      Back to Home
    </button>
  </div>
{/snippet}

<main class="min-h-screen bg-white text-gray-900">
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
  {/if}
</main>
