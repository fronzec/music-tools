<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import HomePage from '$lib/components/HomePage.svelte';
  import CagedTool from '$lib/components/CagedTool.svelte';

  let currentView: ViewName = $state('home');
  let error: string | null = $state(null);

  function navigate(view: ViewName) {
    error = null;
    currentView = view;
  }
</script>

<main class="min-h-screen bg-white text-gray-900">
  {#if error}
    <div class="mx-auto max-w-lg p-8 text-center">
      <h1 class="mb-4 text-2xl font-bold text-gray-900">
        Something went wrong
      </h1>
      <p class="mb-6 text-gray-600">{error}</p>
      <button
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        onclick={() => {
          error = null;
          currentView = 'home';
        }}
      >
        Back to Home
      </button>
    </div>
  {:else if currentView === 'home'}
    <HomePage {navigate} />
  {:else if currentView === 'caged'}
    <CagedTool {navigate} />
  {/if}
</main>
