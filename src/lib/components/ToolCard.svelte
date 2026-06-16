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
    class="group relative block h-full w-full rounded-lg border border-studio-rule bg-studio-raised p-5 text-left shadow-panel-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-studio-led/60 sm:p-6"
    aria-label="Open {tool.title} tool"
    onclick={() => navigate(tool.view)}
  >
    <div class="mb-3 flex items-start justify-between">
      <span class="text-3xl">{tool.icon}</span>
      <!-- per-unit status LED — unlit until hover -->
      <span
        class="mt-1.5 h-2 w-2 rounded-full bg-studio-led/25 transition-all duration-200 group-hover:bg-studio-led group-hover:shadow-led-sm"
        aria-hidden="true"
      ></span>
    </div>
    <h3 class="mb-1 text-lg font-semibold text-studio-ink">{tool.title}</h3>
    <p class="mb-4 text-sm leading-relaxed text-studio-dim">{tool.description}</p>
    <span
      class="inline-block rounded-md border border-studio-led/50 bg-studio-led/10 px-3 py-1.5 font-plex-mono text-xs font-medium uppercase tracking-[0.15em] text-studio-led-soft transition-all duration-200 group-hover:bg-studio-led/20 group-hover:shadow-led-sm"
    >
      Open
    </span>
  </button>
{:else}
  <div
    class="relative block h-full rounded-lg border border-studio-rule/60 bg-studio-panel p-5 text-left opacity-60 sm:p-6"
    aria-disabled="true"
  >
    <div class="mb-3 flex items-start justify-between">
      <span class="text-3xl grayscale">{tool.icon}</span>
      <!-- dark, unlit LED -->
      <span class="mt-1.5 h-2 w-2 rounded-full bg-studio-rule" aria-hidden="true"></span>
    </div>
    <h3 class="mb-1 text-lg font-semibold text-studio-dim">{tool.title}</h3>
    <p class="mb-4 text-sm leading-relaxed text-studio-dim/70">{tool.description}</p>
    <span
      class="inline-block rounded-md border border-studio-rule px-3 py-1.5 font-plex-mono text-xs font-medium uppercase tracking-[0.15em] text-studio-dim"
    >
      Coming soon
    </span>
  </div>
{/if}
