<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import { TOOL_CATEGORIES } from '$lib/data/tools';
  import ToolCard from '$lib/components/ToolCard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <!-- Header -->
  <header class="mb-8 text-center sm:mb-12">
    <h1 class="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
      🎸 Music Tools
    </h1>
    <p class="text-base text-gray-500 dark:text-gray-400 sm:text-lg">
      Interactive tools for learning music
    </p>
  </header>

  <!-- Tool sections, grouped by learning goal -->
  {#each TOOL_CATEGORIES as category (category.id)}
    <section class="mb-8 sm:mb-10">
      <h2
        class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:mb-4"
      >
        {category.label}
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each category.tools as tool (tool.title)}
          <ToolCard {tool} {navigate} />
        {/each}
      </div>
    </section>
  {/each}
</div>
