import type { NoteName, ChordQuality } from './chord';

export interface ProgressionChord {
  id: string;
  root: NoteName;
  quality: ChordQuality;
}

/**
 * A single note event in an arpeggio sweep.
 * Produced by buildArpeggio(); consumed by SweepFretboard and advancePlayback().
 */
export interface ArpeggioNote {
  /** String index 0..5 (0 = low E). The 5th-string arpeggio uses strings 1..5. */
  string: number;
  /** Absolute fret on the 24-fret neck. */
  fret: number;
  /** Precomputed MIDI: STRING_OPEN_MIDI[string] + fret. Reserved for future audio. */
  midi: number;
  /** 0-based sweep order index, ascending low→high string. */
  stepIndex: number;
}

/** Display/playback mode for Progression Builder. */
export type PlaybackMode = 'caged' | 'sweep';

export type PlaybackSpeed = 'slow' | 'medium' | 'fast';

export const PLAYBACK_MS: Record<PlaybackSpeed, number> = {
  slow: 2500,
  medium: 1500,
  fast: 800,
};

export const MAX_CHORDS = 32;

export function createChordId(): string {
  return crypto.randomUUID();
}
