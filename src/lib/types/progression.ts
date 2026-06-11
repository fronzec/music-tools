import type { NoteName, ChordQuality } from './chord';

export interface ProgressionChord {
  id: string;
  root: NoteName;
  quality: ChordQuality;
}

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
