<script lang="ts">
  /**
   * Renders a live oscilloscope (time-domain waveform) or spectrum (frequency
   * bars) from a Web Audio AnalyserNode onto a canvas. Kept analyser-agnostic so
   * it can be instantiated more than once (e.g. clean vs processed side by side).
   */
  interface Props {
    analyser: AnalyserNode | null;
    mode: 'scope' | 'spectrum';
    /** Whether a tone is currently playing — drives the animation loop. */
    active: boolean;
    /** Accent color for the trace/bars (works on light and dark backgrounds). */
    color?: string;
    label: string;
  }

  let { analyser, mode, active, color = '#3B82F6', label }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  const WIDTH = 640;
  const HEIGHT = 200;

  function drawIdle(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (mode === 'scope') {
      // Flat center line when idle — reads --muted-rgb token for rebrand safety.
      // Falls back to a literal so jsdom (no CSS vars) still produces a valid color.
      const muted =
        (canvas ? getComputedStyle(canvas).getPropertyValue('--muted-rgb').trim() : '') ||
        '141 138 132';
      ctx.strokeStyle = `rgb(${muted} / 0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT / 2);
      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.stroke();
    }
  }

  function drawScope(ctx: CanvasRenderingContext2D, data: Uint8Array) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    const slice = WIDTH / data.length;
    for (let i = 0; i < data.length; i++) {
      // 0..255 maps to the full canvas height (byte 128 ≈ vertical center).
      const y = (data[i] / 255) * HEIGHT;
      const x = i * slice;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawSpectrum(ctx: CanvasRenderingContext2D, data: Uint8Array) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Only the lower ~half of bins carries musically useful content; spread it.
    const bins = Math.floor(data.length * 0.5);
    const barW = WIDTH / bins;
    for (let i = 0; i < bins; i++) {
      const h = (data[i] / 255) * HEIGHT;
      ctx.fillStyle = color;
      ctx.fillRect(i * barW, HEIGHT - h, Math.max(1, barW - 1), h);
    }
  }

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!active || !analyser) {
      drawIdle(ctx);
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (mode === 'scope') {
        analyser.getByteTimeDomainData(data);
        drawScope(ctx, data);
      } else {
        analyser.getByteFrequencyData(data);
        drawSpectrum(ctx, data);
      }
    };
    loop();

    return () => cancelAnimationFrame(raf);
  });
</script>

<figure class="m-0">
  <figcaption
    class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted"
  >
    {label}
  </figcaption>
  <canvas
    bind:this={canvas}
    width={WIDTH}
    height={HEIGHT}
    class="h-auto w-full rounded-lg bg-surface"
    aria-label="{label} visualization"
  ></canvas>
</figure>
