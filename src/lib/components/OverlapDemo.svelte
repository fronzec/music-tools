<script lang="ts">
  import { SHAPE_COLORS } from '$lib/theory/layout';

  const color1 = SHAPE_COLORS['A']; // orange
  const color2 = SHAPE_COLORS['G']; // green
  const noteName = 'C';
  const r = 16;
  const cx = 24;
  const cy = 24;
</script>

<div class="mx-auto max-w-lg p-6">
  <h2 class="mb-6 text-lg font-semibold text-gray-700">Overlap — A + G on {noteName}</h2>

  <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">

    <!-- 1. Split circle — sin línea blanca -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">1. Split (no line)</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-20 h-20">
        <path d="M{cx},{cy - r} A{r},{r} 0 0,1 {cx},{cy + r} Z" fill={color1} opacity="0.8" />
        <path d="M{cx},{cy - r} A{r},{r} 0 0,0 {cx},{cy + r} Z" fill={color2} opacity="0.8" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 2. Merged dots — overlap zone + note -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">2. Merged dots</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-20 h-20">
        <circle cx={cx + 2} cy={cy - 1} r="12" fill={color1} opacity="0.75" />
        <circle cx={cx - 2} cy={cy + 1} r="12" fill={color2} opacity="0.75" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

    <!-- 3. Uniform horizontal gradient + note -->
    <div class="text-center">
      <p class="mb-2 text-xs font-medium text-gray-500">3. Uniform grad</p>
      <svg viewBox="0 0 48 48" class="mx-auto w-20 h-20">
        <defs>
          <linearGradient id="ug" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stop-color={color1} />
            <stop offset="100%" stop-color={color2} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#ug)" opacity="0.85" />
        <text x={cx} y={cy + 4} text-anchor="middle" font-size="9" fill="white" font-weight="bold">{noteName}</text>
      </svg>
    </div>

  </div>
</div>
