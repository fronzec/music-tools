/**
 * Note playback module for the Interval Ear Trainer.
 *
 * Creates fire-and-forget, fixed-duration, two-note sequential playback using
 * an anti-click gain envelope. The factory pattern keeps AudioContext
 * ownership explicit and avoids module-level singletons (which would leak
 * across tests and in SSR environments).
 *
 * ADR-1: No import from ToneGenerator.svelte or any Svelte file.
 * ADR-6: Factory function, lazy AudioContext, sine oscillator, anti-click envelope.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duration of each note in seconds. */
const NOTE_DUR = 0.6;

/** Silence gap between notes in seconds. */
const GAP = 0.1;

/** Total step per note: note duration + gap. */
const STEP = NOTE_DUR + GAP; // 0.7

/** Attack ramp duration in seconds (gain 0 → peak). */
const ATTACK = 0.015;

/** Release ramp duration in seconds (gain peak → 0). */
const RELEASE = 0.03;

/** Peak gain (matches ToneGenerator default volume). */
const PEAK = 0.3;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface NotePlayer {
  /** Play an ascending sequence of notes, one per frequency, fire-and-forget. */
  playSequence(freqs: number[]): void;

  /** Play all provided frequencies simultaneously (block chord) at the current time. */
  playChord(freqs: number[]): void;

  /** Release the underlying AudioContext. Safe to call before any playSequence. */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a NotePlayer that lazily initialises one AudioContext on first call.
 * The component that owns the player should call dispose() in its cleanup effect.
 */
export function createNotePlayer(): NotePlayer {
  let ctx: AudioContext | null = null;

  function playSequence(freqs: number[]): void {
    if (!ctx) {
      ctx = new AudioContext();
    }

    const now = ctx.currentTime;

    freqs.forEach((freq, i) => {
      const t = now + i * STEP;
      scheduleNote(ctx!, freq, t);
    });
  }

  function playChord(freqs: number[]): void {
    if (!ctx) {
      ctx = new AudioContext();
    }
    const t = ctx.currentTime;
    freqs.forEach((freq) => scheduleNote(ctx!, freq, t));
  }

  function dispose(): void {
    ctx?.close();
    ctx = null;
  }

  return { playSequence, playChord, dispose };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Schedules a single note with an anti-click amplitude envelope.
 *
 * Envelope (mirrors ToneGenerator.svelte):
 *   t               → gain = 0         (setValueAtTime — silence before attack)
 *   t + ATTACK      → gain = PEAK      (linearRamp — attack)
 *   t + NOTE_DUR - RELEASE → gain = 0  (linearRamp — release)
 *
 * Oscillator starts at t and stops at t + NOTE_DUR (after release is complete).
 */
function scheduleNote(ctx: AudioContext, freq: number, t: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Oscillator setup
  osc.type = 'sine';
  osc.frequency.value = freq;

  // Anti-click envelope
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(PEAK, t + ATTACK);
  gain.gain.linearRampToValueAtTime(0, t + NOTE_DUR - RELEASE);

  // Connect graph: oscillator → gain → destination
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Schedule playback
  osc.start(t);
  osc.stop(t + NOTE_DUR);
}
