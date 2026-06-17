import { describe, it, expect } from 'vitest';
import { viewToPath, pathToView, VIEW_NAMES } from '$lib/routing';

describe('routing', () => {
  describe('viewToPath', () => {
    it('maps home to root path', () => {
      expect(viewToPath('home')).toBe('/');
    });

    it('maps caged to /caged', () => {
      expect(viewToPath('caged')).toBe('/caged');
    });

    it('maps progression to /progression', () => {
      expect(viewToPath('progression')).toBe('/progression');
    });

    it('maps note-trainer to /note-trainer', () => {
      expect(viewToPath('note-trainer')).toBe('/note-trainer');
    });

    it('maps tone-generator to /tone-generator', () => {
      expect(viewToPath('tone-generator')).toBe('/tone-generator');
    });

    it('maps pentatonic to /pentatonic', () => {
      expect(viewToPath('pentatonic')).toBe('/pentatonic');
    });

    it('maps signal-lab to /signal-lab', () => {
      expect(viewToPath('signal-lab')).toBe('/signal-lab');
    });

    it('maps interval-trainer to /interval-trainer', () => {
      expect(viewToPath('interval-trainer')).toBe('/interval-trainer');
    });

    it('maps tab-player to /tab-player', () => {
      expect(viewToPath('tab-player')).toBe('/tab-player');
    });
  });

  describe('pathToView', () => {
    it('maps root path to home', () => {
      expect(pathToView('/')).toBe('home');
    });

    it('maps /caged to caged', () => {
      expect(pathToView('/caged')).toBe('caged');
    });

    it('maps /progression to progression', () => {
      expect(pathToView('/progression')).toBe('progression');
    });

    it('maps /note-trainer to note-trainer', () => {
      expect(pathToView('/note-trainer')).toBe('note-trainer');
    });

    it('maps /tone-generator to tone-generator', () => {
      expect(pathToView('/tone-generator')).toBe('tone-generator');
    });

    it('maps /pentatonic to pentatonic', () => {
      expect(pathToView('/pentatonic')).toBe('pentatonic');
    });

    it('maps /signal-lab to signal-lab', () => {
      expect(pathToView('/signal-lab')).toBe('signal-lab');
    });

    it('maps /interval-trainer to interval-trainer', () => {
      expect(pathToView('/interval-trainer')).toBe('interval-trainer');
    });

    it('maps /tab-player to tab-player', () => {
      expect(pathToView('/tab-player')).toBe('tab-player');
    });

    it('maps unknown path to home', () => {
      expect(pathToView('/not-a-tool')).toBe('home');
    });

    it('maps empty string to home', () => {
      expect(pathToView('')).toBe('home');
    });

    it('maps trailing slash /caged/ to caged', () => {
      expect(pathToView('/caged/')).toBe('caged');
    });

    it('maps double leading slash //caged to caged', () => {
      expect(pathToView('//caged')).toBe('caged');
    });
  });

  describe('round-trip correctness', () => {
    it('round-trips for every ViewName in VIEW_NAMES', () => {
      for (const view of VIEW_NAMES) {
        expect(pathToView(viewToPath(view))).toBe(view);
      }
    });
  });

  describe('VIEW_NAMES', () => {
    it('contains exactly 10 entries', () => {
      expect(VIEW_NAMES.length).toBe(10);
    });

    it('contains the expected set of view names', () => {
      const expected = new Set([
        'home',
        'caged',
        'progression',
        'note-trainer',
        'tone-generator',
        'pentatonic',
        'signal-lab',
        'interval-trainer',
        'tab-player',
        'chord-builder',
      ]);
      const actual = new Set(VIEW_NAMES);
      expect(actual).toEqual(expected);
    });

    it('maps chord-builder to /chord-builder', () => {
      expect(viewToPath('chord-builder')).toBe('/chord-builder');
    });

    it('maps /chord-builder to chord-builder', () => {
      expect(pathToView('/chord-builder')).toBe('chord-builder');
    });

    it('round-trips chord-builder', () => {
      expect(pathToView(viewToPath('chord-builder'))).toBe('chord-builder');
    });
  });
});
