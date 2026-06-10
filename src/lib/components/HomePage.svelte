<script lang="ts">
  import type { ViewName } from '$lib/types/chord';

  let { navigate: _navigate }: { navigate: (view: ViewName) => void } = $props();
</script>

<div class="p-8">
  <h1 class="text-3xl font-bold">Music Tools</h1>
</div>
