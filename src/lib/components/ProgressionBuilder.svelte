<script lang="ts">
  import type { ViewName } from '$lib/types/chord';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();
</script>

<div class="mx-auto max-w-5xl p-4">
  <button onclick={() => navigate('home')}>← Back to Home</button>
  <h1>Progression Builder</h1>
</div>
