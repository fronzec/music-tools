/** Number of harmonics in the additive synthesis bank. */
export const N = 8;

/** Default harmonic amplitudes: pure sine (only fundamental). */
export const DEFAULT_HARMONIC_AMPS: number[] = [1, 0, 0, 0, 0, 0, 0, 0];

/**
 * L1-normalize an amplitude array so the sum of absolute values equals 1.
 * A near-zero sum returns an all-zero array: this avoids both division by zero
 * and amplifying numerical noise above MAX_GAIN when the input is ~silent.
 */
export function normalizeAmps(amps: number[]): number[] {
  const sum = amps.reduce((acc, v) => acc + Math.abs(v), 0);
  if (sum < 1e-12) return amps.map(() => 0);
  return amps.map((v) => v / sum);
}

/**
 * Builds a PeriodicWave from the given raw harmonic amplitudes.
 * - Normalizes amps with L1 normalization before building.
 * - real array is all zeros (cosine terms / phase not used).
 * - imag[0] is always 0 (DC offset).
 * - imag[k] = normalized amplitude of the k-th harmonic (k=1..N).
 * - Uses disableNormalization: true so MAX_GAIN remains the only ceiling.
 */
export function buildPeriodicWave(ctx: AudioContext, amps: number[]): PeriodicWave {
  const normalized = normalizeAmps(amps);
  const real = new Float32Array(N + 1); // all zeros
  const imag = new Float32Array(N + 1);
  imag[0] = 0; // DC term always zero
  for (let k = 1; k <= N; k++) {
    imag[k] = normalized[k - 1] ?? 0;
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

/**
 * Returns raw (unnormalized) length-8 harmonic amplitudes for a named preset.
 * - sine:     fundamental only.
 * - sawtooth: 1/k for all k.
 * - square:   1/k for odd k, 0 for even k.
 */
export function presetAmps(name: 'sine' | 'sawtooth' | 'square'): number[] {
  switch (name) {
    case 'sine':
      return [1, 0, 0, 0, 0, 0, 0, 0];
    case 'sawtooth':
      return Array.from({ length: N }, (_, i) => 1 / (i + 1));
    case 'square':
      return Array.from({ length: N }, (_, i) => {
        const k = i + 1;
        return k % 2 === 1 ? 1 / k : 0;
      });
  }
}
