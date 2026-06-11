<script lang="ts">
  import type { ViewName } from '$lib/types/chord';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Header -->
  <header class="mb-8 text-center sm:mb-12">
    <h1 class="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
      🎸 Music Tools
    </h1>
    <p class="text-base text-gray-500 sm:text-lg">
      Interactive tools for learning music
    </p>
  </header>

  <!-- Tool card grid -->
  <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
    <!-- CAGED Visualizer — Active -->
    <button
      class="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 sm:p-6"
      aria-label="Open CAGED Visualizer tool"
      onclick={() => navigate('caged')}
    >
      <div class="mb-3 text-3xl">🎸</div>
      <h2 class="mb-1 text-lg font-semibold text-gray-900">CAGED Visualizer</h2>
      <p class="mb-4 text-sm text-gray-500">
        Understand the CAGED system across the fretboard
      </p>
      <span class="inline-block rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors">
        Open
      </span>
    </button>

    <!-- Progression Builder — Active -->
    <button
      class="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 sm:p-6"
      aria-label="Open Progression Builder tool"
      onclick={() => navigate('progression')}
    >
      <div class="mb-3 text-3xl">🧩</div>
      <h2 class="mb-1 text-lg font-semibold text-gray-900">Progression Builder</h2>
      <p class="mb-4 text-sm text-gray-500">
        Build chord progressions and practice transitions step by step
      </p>
      <span class="inline-block rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors">
        Open
      </span>
    </button>

    <!-- Placeholder: Scales Explorer -->
    <div class="rounded-xl border border-gray-100 bg-gray-50 p-5 text-left opacity-60 sm:p-6">
      <div class="mb-3 text-3xl">🎵</div>
      <h2 class="mb-1 text-lg font-semibold text-gray-700">Scales Explorer</h2>
      <p class="mb-4 text-sm text-gray-400">
        Explore scales across the fretboard
      </p>
      <span class="inline-block rounded-md bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-400">
        Coming soon
      </span>
    </div>

    <!-- Placeholder: Chord Library -->
    <div class="rounded-xl border border-gray-100 bg-gray-50 p-5 text-left opacity-60 sm:p-6">
      <div class="mb-3 text-3xl">🎹</div>
      <h2 class="mb-1 text-lg font-semibold text-gray-700">Chord Library</h2>
      <p class="mb-4 text-sm text-gray-400">
        Browse chord voicings and variations
      </p>
      <span class="inline-block rounded-md bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-400">
        Coming soon
      </span>
    </div>
  </div>
</div>
