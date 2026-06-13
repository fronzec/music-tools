<script lang="ts">
  import { SHAPE_COLORS } from '$lib/theory/layout';

  const color1 = SHAPE_COLORS['A']; // orange
  const color2 = SHAPE_COLORS['G']; // green
  const noteName = 'C'; // example note name inside
  const r = 18;
  const cx = 24;
  const cy = 24;

  let hoverReveal = $state(false);
</script>

<div class="mx-auto max-w-4xl p-6">
  <h2 class="mb-6 text-lg font-semibold text-gray-700">Overlap Style Demos — A (orange) + G (green) on C</h2>

  <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">

    <!-- 1. Split circle + note inside -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">1. Split + note</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <path d="M{cx},{cy - r} A{r},{r} 0 0,1 {cx},{cy + r} Z" fill={color1} opacity="0.75" />
        <path d="M{cx},{cy - r} A{r},{r} 0 0,0 {cx},{cy + r} Z" fill={color2} opacity="0.75" />
        <line x1={cx} y1={cy - r - 1} x2={cx} y2={cy + r + 1} stroke="white" stroke-width="1.5" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 2. Side-by-side dots + centered letter -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">2. Dots + centered</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx - 6} cy={cy} r="8" fill={color1} opacity="0.75" />
        <circle cx={cx + 6} cy={cy} r="8" fill={color2} opacity="0.75" />
        <text x={cx - 6} y={cy - 4} text-anchor="middle" font-size="7" fill="white" font-weight="bold">A</text>
        <text x={cx + 6} y={cy - 4} text-anchor="middle" font-size="7" fill="white" font-weight="bold">G</text>
        <text x={cx} y={cy + 3} text-anchor="middle" font-size="8" fill="#374151" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 3. Gradient + note inside -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">3. Gradient + note</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color={color1} stop-opacity="0.85" />
            <stop offset="100%" stop-color={color2} stop-opacity="0.85" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#grad1)" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 4. Dashed ring + note -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">4. Dashed ring</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx} cy={cy} r={r - 5} fill={color1} opacity="0.75" />
        <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke={color2} stroke-width="4" opacity="0.75"
                stroke-dasharray="8 4" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="8" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 5. Letters inside neutral circle -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">5. Letters inside</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx} cy={cy} r={r} fill="#9CA3AF" opacity="0.4" />
        <text x={cx - 4} y={cy + 3} text-anchor="end" font-size="9" fill={color1} font-weight="bold">A</text>
        <text x={cx + 4} y={cy + 3} text-anchor="start" font-size="9" fill={color2} font-weight="bold">G</text>
      </svg>
    </div>

    <!-- 6. Hover reveal -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">6. Hover reveal</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16 cursor-pointer"
           onmouseenter={() => hoverReveal = true}
           onmouseleave={() => hoverReveal = false}>
        {#if hoverReveal}
          <circle cx={cx - 5} cy={cy - 3} r="10" fill={color1} opacity="0.75" />
          <circle cx={cx + 5} cy={cy + 3} r="10" fill={color2} opacity="0.75" />
          <text x={cx - 5} y={cy - 3} text-anchor="middle" font-size="7" fill="white">A</text>
          <text x={cx + 5} y={cy + 3} text-anchor="middle" font-size="7" fill="white">G</text>
        {:else}
          <circle cx={cx} cy={cy} r={r} fill={color1} opacity="0.75" />
          <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
          <text x={cx} y={cy + r + 8} text-anchor="middle" font-size="6" fill="#9CA3AF">hover</text>
        {/if}
      </svg>
    </div>

    <!-- 7. Diagonal slices (3+ shapes) -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">7. Diagonal split</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <polygon points="{cx},{cy - r} {cx + r},{cy} {cx},{cy}" fill={color1} opacity="0.75" />
        <polygon points="{cx + r},{cy} {cx},{cy + r} {cx},{cy}" fill={color2} opacity="0.75" />
        <line x1={cx + r} y1={cy} x2={cx - r} y2={cy} stroke="white" stroke-width="1.5" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 8. Inner colored ring + note -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">8. Inner ring</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-16 h-16">
        <circle cx={cx} cy={cy} r={r} fill={color1} opacity="0.75" />
        <circle cx={cx} cy={cy} r={r - 5} fill="#1F2937" opacity="0.6" />
        <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={color2} stroke-width="2" opacity="0.9" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

  </div>
</div>
