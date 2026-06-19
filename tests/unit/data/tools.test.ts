import { describe, it, expect } from 'vitest';
import { TOOL_CATEGORIES, ALL_TOOLS } from '$lib/data/tools';
import type { ViewName } from '$lib/types/chord';

// Valid navigable views, excluding 'home' (the home page is not a tool card).
const VALID_VIEWS: ReadonlySet<ViewName> = new Set<ViewName>([
  'caged',
  'progression',
  'note-trainer',
  'tone-generator',
  'pentatonic',
  'signal-lab',
  'interval-trainer',
  'tab-player',
  'chord-builder',
  'diatonic-harmonizer',
]);

describe('tools registry', () => {
  it('exposes at least one category', () => {
    expect(TOOL_CATEGORIES.length).toBeGreaterThanOrEqual(1);
  });

  it('every category has a non-empty id and label', () => {
    for (const cat of TOOL_CATEGORIES) {
      expect(cat.id.length).toBeGreaterThan(0);
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it('category ids are unique', () => {
    const ids = TOOL_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ALL_TOOLS is the flattened view of every category, in order', () => {
    const flattened = TOOL_CATEGORIES.flatMap((c) => c.tools);
    expect(ALL_TOOLS).toEqual(flattened);
  });

  it('every tool has a non-empty title, description and icon', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.icon.length).toBeGreaterThan(0);
    }
  });

  it('has exactly 10 active tools', () => {
    const active = ALL_TOOLS.filter((t) => t.status === 'active');
    expect(active.length).toBe(10);
  });

  it('has at least one coming-soon tool', () => {
    const comingSoon = ALL_TOOLS.filter((t) => t.status === 'coming-soon');
    expect(comingSoon.length).toBeGreaterThanOrEqual(1);
  });

  it('every active tool maps to a valid, unique navigable view', () => {
    const views = ALL_TOOLS.flatMap((t) => (t.status === 'active' ? [t.view] : []));
    for (const v of views) {
      expect(VALID_VIEWS.has(v)).toBe(true);
    }
    expect(new Set(views).size).toBe(views.length);
  });

  it('every tool title is unique (safe to use as an {#each} key)', () => {
    const titles = ALL_TOOLS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('each tool carries its exact expected copy (guards against typos/truncation)', () => {
    const EXPECTED: Readonly<Record<string, string>> = {
      'CAGED Visualizer': 'Understand the CAGED system across the fretboard',
      'Scales Explorer': 'Explore scales across the fretboard',
      'Note Trainer': 'Learn every note on the fretboard with visual patterns and quizzes',
      'Tab Player': 'Play through curated guitar tabs with fretboard visualization',
      'Chord Builder': 'See how a root plus stacked thirds becomes a named chord',
      'Diatonic Harmonizer': "See a major key's 7 diatonic triads and the chords that belong to it",
      'Chord Library': 'Browse chord voicings and variations',
      'Tone Generator': 'Reference tones for tuning by ear',
      'Interval Trainer': 'Train your ear to recognize musical intervals by sound',
      'Signal Lab': "See a tone's waveform and spectrum, and how effects reshape them",
      'Progression Builder': 'Build chord progressions and practice transitions step by step',
    };
    // Every registry tool matches its expected description...
    for (const tool of ALL_TOOLS) {
      expect(tool.description).toBe(EXPECTED[tool.title]);
    }
    // ...and the registry holds exactly the expected set (no tool added/dropped silently).
    expect(ALL_TOOLS.length).toBe(Object.keys(EXPECTED).length);
  });

  it('covers all 10 navigable views exactly once', () => {
    const views = new Set(
      ALL_TOOLS.flatMap((t) => (t.status === 'active' ? [t.view] : [])),
    );
    expect(views).toEqual(VALID_VIEWS);
  });

  it('every tool icon is distinct (cards are visually distinguishable)', () => {
    const icons = ALL_TOOLS.map((t) => t.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
