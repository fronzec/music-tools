export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ChordQuality = 'major' | 'minor';

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';

export type LabelMode = 'intervals' | 'notes' | 'both';

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

export type ViewName = 'home' | 'caged' | 'progression' | 'note-trainer';

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
