import type { PlaybackMode } from '$lib/types/progression';

/** Snapshot of the playback cursor within a progression. */
export interface PlaybackState {
  /** Index of the currently active chord (0-based). */
  activeIndex: number;
  /** Index of the currently highlighted arpeggio note (0-based, sweep mode only). */
  activeNoteIndex: number;
  /** Whether playback is running. */
  isPlaying: boolean;
}

interface AdvanceOpts {
  mode: PlaybackMode;
  /** Number of chords in the progression. */
  progressionLength: number;
  /** Number of notes in the current arpeggio (always 5 for the 5th-string shape). */
  arpeggioLength: number;
  /** Whether to loop back to the start after the last note. */
  loop: boolean;
}

/**
 * Pure function — computes the next playback state for a single timer tick.
 *
 * - **caged mode**: advances `activeIndex` by 1 per tick; at the end of the
 *   progression, either wraps (loop=true) or stops (loop=false).
 * - **sweep mode**: advances `activeNoteIndex` by 1; when it reaches the end of
 *   the arpeggio, it carries into the next chord (`activeIndex++`, `activeNoteIndex=0`);
 *   at the progression end, wraps (loop=true) or stops (loop=false).
 *
 * A stopped state (`isPlaying=false`) is returned unchanged.
 * No timer side effects.
 */
export function advancePlayback(s: PlaybackState, opts: AdvanceOpts): PlaybackState {
  if (!s.isPlaying) return s;

  const { mode, progressionLength, arpeggioLength, loop } = opts;

  if (mode === 'caged') {
    const nextIndex = s.activeIndex + 1;
    if (nextIndex >= progressionLength) {
      return loop
        ? { activeIndex: 0, activeNoteIndex: 0, isPlaying: true }
        : { ...s, activeIndex: nextIndex, isPlaying: false };
    }
    return { ...s, activeIndex: nextIndex, activeNoteIndex: 0 };
  }

  // sweep mode: advance note-by-note
  const nextNoteIndex = s.activeNoteIndex + 1;

  if (nextNoteIndex >= arpeggioLength) {
    // last note of the current chord — carry to next chord
    const nextChordIndex = s.activeIndex + 1;
    if (nextChordIndex >= progressionLength) {
      // end of progression
      return loop
        ? { activeIndex: 0, activeNoteIndex: 0, isPlaying: true }
        : { ...s, activeIndex: nextChordIndex, activeNoteIndex: 0, isPlaying: false };
    }
    return { ...s, activeIndex: nextChordIndex, activeNoteIndex: 0 };
  }

  return { ...s, activeNoteIndex: nextNoteIndex };
}
