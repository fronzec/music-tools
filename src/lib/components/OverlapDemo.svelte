<script lang="ts">
  import { SHAPE_COLORS } from '$lib/theory/layout';
  import type { CagedShape } from '$lib/types/chord';

  // Demo: A shape (orange) + G shape (green) overlapping at same position
  const color1 = SHAPE_COLORS['A']; // orange
  const color2 = SHAPE_COLORS['G']; // green
  const r = 18;
  const cx = 24;
  const cy = 24;

  let hoverReveal = $state(false);
</script>

<div class="mx-auto max-w-3xl p-6">
  <h2 class="mb-6 text-lg font-semibold text-gray-700">Overlap Style Demos — A (orange) + G (green)</h2>

  <div class="grid grid-cols-2 gap-6 sm:grid-cols-3">

    <!-- 1. Pie chart (split circle by slices) -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">1. Split circle</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <path d="M{cx},{cy - r} A{r},{r} 0 0,1 {cx},{cy + r} Z" fill={color1} opacity="0.75" />
        <path d="M{cx},{cy - r} A{r},{r} 0 0,0 {cx},{cy + r} Z" fill={color2} opacity="0.75" />
        <line x1={cx} y1={cy - r - 1} x2={cx} y2={cy + r + 1} stroke="white" stroke-width="1.5" />
      </svg>
    </div>

    <!-- 2. Side-by-side small dots -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">2. Side-by-side dots</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx - 5} cy={cy} r="7" fill={color1} opacity="0.75" />
        <circle cx={cx + 5} cy={cy} r="7" fill={color2} opacity="0.75" />
        <text x={cx - 5} y={cy + 3} text-anchor="middle" font-size="8" fill="white" font-weight="bold">A</text>
        <text x={cx + 5} y={cy + 3} text-anchor="middle" font-size="8" fill="white" font-weight="bold">G</text>
      </svg>
    </div>

    <!-- 3. Gradient left→right -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">3. Gradient</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <defs>
          <linearGradient id="overlap-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color={color1} stop-opacity="0.85" />
            <stop offset="100%" stop-color={color2} stop-opacity="0.85" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#overlap-grad)" />
      </svg>
    </div>

    <!-- 4. Dashed ring -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">4. Dashed ring</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx} cy={cy} r={r - 5} fill={color1} opacity="0.75" />
        <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke={color2} stroke-width="4" opacity="0.75"
                stroke-dasharray="8 4" />
      </svg>
    </div>

    <!-- 5. Shape letter inside -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">5. Letters inside</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx} cy={cy} r={r} fill="#9CA3AF" opacity="0.5" />
        <text x={cx - 3} y={cy + 3} text-anchor="end" font-size="9" fill={color1} font-weight="bold">A</text>
        <text x={cx + 3} y={cy + 3} text-anchor="start" font-size="9" fill={color2} font-weight="bold">G</text>
      </svg>
    </div>

    <!-- 6. Hover reveal -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">6. Hover reveal</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16 cursor-pointer"
           onmouseenter={() => hoverReveal = true}
           onmouseleave={() => hoverReveal = false}>
        {#if hoverReveal}
          <circle cx={cx - 4} cy={cy} r="10" fill={color1} opacity="0.75" />
          <circle cx={cx + 4} cy={cy} r="10" fill={color2} opacity="0.75" />
        {:else}
          <circle cx={cx} cy={cy} r={r} fill={color1} opacity="0.75" />
          <text x={cx} y={cy + 3} text-anchor="middle" font-size="7" fill="white" font-weight="bold">2</text>
        {/if}
      </svg>
    </div>

  </div>
</div>
