/**
 * Returns whether the user has requested reduced motion via the OS/browser preference.
 *
 * Guards against SSR / non-browser environments where `window` is not available.
 * Read at the point of use — not reactive, but re-evaluated on every render cycle
 * naturally because it is called from reactive derived expressions.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
