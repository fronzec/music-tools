<script lang="ts">
  import type { ViewName } from '$lib/types/chord';

  let { navigate: _navigate }: { navigate: (view: ViewName) => void } = $props();
</script>

<div class="p-8">
  <h2 class="text-2xl font-semibold">CAGED Chord Visualizer</h2>
</div>
