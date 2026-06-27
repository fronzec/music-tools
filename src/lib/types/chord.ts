export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ChordQuality = 'major' | 'minor' | 'dim';

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';

export type LabelMode = 'intervals' | 'notes' | 'both';

export type OverlapStyle = 'split' | 'dots' | 'gradient';

export type FretPosition = number | null;

export interface ChordShape {
  root: NoteName;
  quality: ChordQuality;
  shape: CagedShape;
  frets: [FretPosition, FretPosition, FretPosition, FretPosition, FretPosition, FretPosition];
  intervals: [
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
  ];
  baseFret: number;
  rootString: number;
}

export interface FretboardProps {
  shape: ChordShape;
  labelMode: LabelMode;
  showNotes?: boolean;
  width?: number;
}

export type ViewName =
  | 'home'
  | 'caged'
  | 'progression'
  | 'note-trainer'
  | 'tone-generator'
  | 'pentatonic'
  | 'signal-lab'
  | 'interval-trainer'
  | 'tab-player'
  | 'chord-builder'
  | 'diatonic-harmonizer';

export const CAGED_ORDER: CagedShape[] = ['C', 'A', 'G', 'E', 'D'];

export const CHROMATIC: NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Semitone offsets in the same order as frets[]: low E, A, D, G, B, high E */
export const STANDARD_TUNING: number[] = [4, 9, 2, 7, 11, 4];

/**
 * Absolute MIDI note number for each open string, tablature order (low E → high E).
 * E2=40, A2=45, D3=50, G3=55, B3=59, E4=64.
 * Consistency: STRING_OPEN_MIDI[i] % 12 === STANDARD_TUNING[i] for all i.
 */
export const STRING_OPEN_MIDI: number[] = [40, 45, 50, 55, 59, 64];
