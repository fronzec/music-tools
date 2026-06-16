<script lang="ts">
  import type { ViewName } from '$lib/types/chord';
  import { TOOL_CATEGORIES } from '$lib/data/tools';
  import ToolCard from '$lib/components/ToolCard.svelte';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();
</script>

<!--
  Studio / pedalboard skin: the home reads as the front panel of a piece of
  audio gear. Dark chassis, amber indicator LEDs, monospace engraved labels,
  cards as "rack units". Self-contained dark surface (independent of the app's
  light/dark theme) — this aesthetic only makes sense dark.
-->
<div
  class="studio-grain relative min-h-screen overflow-hidden bg-studio-panel font-plex text-studio-ink"
>
  <!-- top edge highlight, like a chassis bevel -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-studio-led/30 to-transparent"
  ></div>

  <!-- ambient amber glow bleeding from the top, as if the panel is lit from within -->
  <div
    class="pointer-events-none absolute inset-0"
    aria-hidden="true"
    style="background: radial-gradient(125% 55% at 50% -8%, rgba(255, 158, 44, 0.11), transparent 55%);"
  ></div>

  <!-- edge vignette for depth — darkens the corners so the center feels focused -->
  <div
    class="pointer-events-none absolute inset-0"
    aria-hidden="true"
    style="background: radial-gradient(115% 85% at 50% 28%, transparent 52%, rgba(0, 0, 0, 0.55));"
  ></div>

  <div class="relative mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
    <!-- Device header -->
    <header class="mb-10 flex items-end justify-between border-b border-studio-rule pb-5 sm:mb-12">
      <div>
        <div class="mb-2 flex items-center gap-2.5">
          <span class="studio-led animate-led-pulse inline-block h-2.5 w-2.5" aria-hidden="true"
          ></span>
          <span
            class="font-plex-mono text-[0.65rem] uppercase tracking-[0.35em] text-studio-dim"
          >
            Power
          </span>
        </div>
        <h1
          class="text-3xl font-semibold uppercase tracking-tight text-studio-ink sm:text-4xl"
        >
          Music Tools
        </h1>
        <p class="mt-1 font-plex-mono text-xs tracking-wide text-studio-dim sm:text-sm">
          Interactive tools for learning music
        </p>
      </div>

      <!-- decorative level meter -->
      <div class="hidden items-end gap-1 sm:flex" aria-hidden="true">
        {#each [5, 8, 12, 9, 14, 7] as h, i (i)}
          <span
            class="w-1 rounded-sm"
            class:bg-studio-led={i > 2}
            class:bg-studio-rule={i <= 2}
            style="height: {h * 2}px"
          ></span>
        {/each}
      </div>
    </header>

    <!-- Tool sections, grouped by learning goal -->
    {#each TOOL_CATEGORIES as category (category.id)}
      <section class="mb-10 sm:mb-12">
        <div class="mb-4 flex items-center gap-3">
          <h2
            class="font-plex-mono text-xs font-medium uppercase tracking-[0.25em] text-studio-dim"
          >
            {category.label}
          </h2>
          <span class="h-px flex-1 bg-studio-rule"></span>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {#each category.tools as tool, i (tool.title)}
            <div class="animate-rack-in" style="animation-delay: {i * 60}ms">
              <ToolCard {tool} {navigate} />
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
