<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import HomePage from '$lib/components/HomePage.svelte';
  import CagedTool from '$lib/components/CagedTool.svelte';

  let currentView: ViewName = $state('home');

  function navigate(view: ViewName) {
    currentView = view;
  }
</script>

<main class="min-h-screen bg-white text-gray-900">
  {#if currentView === 'home'}
    <HomePage {navigate} />
  {:else if currentView === 'caged'}
    <CagedTool {navigate} />
  {/if}
</main>
