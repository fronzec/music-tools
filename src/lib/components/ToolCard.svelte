<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import type { ToolEntry } from '$lib/data/tools';

  interface Props {
    tool: ToolEntry;
    navigate: (view: ViewName) => void;
  }

  let { tool, navigate }: Props = $props();
</script>

{#if tool.status === 'active'}
  <button
    class="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700 sm:p-6"
    aria-label="Open {tool.title} tool"
    onclick={() => navigate(tool.view)}
  >
    <div class="mb-3 text-3xl">{tool.icon}</div>
    <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{tool.title}</h3>
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
    <span class="inline-block rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors">
      Open
    </span>
  </button>
{:else}
  <div
    class="rounded-xl border border-gray-100 bg-gray-50 p-5 text-left opacity-60 dark:border-gray-800 dark:bg-gray-800 sm:p-6"
    aria-disabled="true"
  >
    <div class="mb-3 text-3xl">{tool.icon}</div>
    <h3 class="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">{tool.title}</h3>
    <p class="mb-4 text-sm text-gray-400 dark:text-gray-500">{tool.description}</p>
    <span class="inline-block rounded-md bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-400 dark:bg-gray-700 dark:text-gray-500">
      Coming soon
    </span>
  </div>
{/if}
