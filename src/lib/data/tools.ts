/**
 * Tool registry for the home page.
 *
 * Single source of truth for the tool cards: their copy, icons, navigation
 * target, and grouping. The home page renders straight from this data, so
 * adding, reordering, or recategorizing a tool is a data edit — not markup
 * surgery across copy-pasted cards.
 *
 * A discriminated union on `status` keeps the model honest: an `active` tool
 * MUST carry a `view` (its navigation target); a `coming-soon` tool MUST NOT.
 */
import type { ViewName } from '$lib/types/chord';

export type ToolStatus = 'active' | 'coming-soon';

/** A live tool — has a navigable view. */
export interface ActiveTool {
  readonly status: 'active';
  readonly view: ViewName;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

/** A planned tool — rendered as a muted placeholder, not navigable. */
export interface ComingSoonTool {
  readonly status: 'coming-soon';
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export type ToolEntry = ActiveTool | ComingSoonTool;

/** A labelled group of tools, rendered as a section on the home page. */
export interface ToolCategory {
  readonly id: string;
  readonly label: string;
  readonly tools: readonly ToolEntry[];
}

/**
 * The grouped tool registry. Category order and within-category order are the
 * exact render order on the home page.
 */
export const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    id: 'fretboard-theory',
    label: 'Fretboard & Theory',
    tools: [
      {
        status: 'active',
        view: 'caged',
        title: 'CAGED Visualizer',
        description: 'Understand the CAGED system across the fretboard',
        icon: '🎸',
      },
      {
        status: 'active',
        view: 'pentatonic',
        title: 'Scales Explorer',
        description: 'Explore scales across the fretboard',
        icon: '🎼',
      },
      {
        status: 'active',
        view: 'note-trainer',
        title: 'Note Trainer',
        description: 'Learn every note on the fretboard with visual patterns and quizzes',
        icon: '📝',
      },
      {
        status: 'active',
        view: 'tab-player',
        title: 'Tab Player',
        description: 'Play through curated guitar tabs with fretboard visualization',
        icon: '🎶',
      },
      {
        status: 'coming-soon',
        title: 'Chord Library',
        description: 'Browse chord voicings and variations',
        icon: '🎹',
      },
    ],
  },
  {
    id: 'ear-sound',
    label: 'Ear & Sound',
    tools: [
      {
        status: 'active',
        view: 'tone-generator',
        title: 'Tone Generator',
        description: 'Reference tones for tuning by ear',
        icon: '🎵',
      },
      {
        status: 'active',
        view: 'interval-trainer',
        title: 'Interval Trainer',
        description: 'Train your ear to recognize musical intervals by sound',
        icon: '👂',
      },
      {
        status: 'active',
        view: 'signal-lab',
        title: 'Signal Lab',
        description: "See a tone's waveform and spectrum, and how effects reshape them",
        icon: '📊',
      },
    ],
  },
  {
    id: 'composition',
    label: 'Composition',
    tools: [
      {
        status: 'active',
        view: 'progression',
        title: 'Progression Builder',
        description: 'Build chord progressions and practice transitions step by step',
        icon: '🧩',
      },
    ],
  },
];

/**
 * Flattened view of every tool across all categories, preserving order.
 * Convenient for counts, integrity checks, and (later) analytics enumeration.
 */
export const ALL_TOOLS: readonly ToolEntry[] = TOOL_CATEGORIES.flatMap((c) => c.tools);
