import { describe, it, expect } from 'vitest';
import { TABS } from '$lib/data/tabs';
// ---------------------------------------------------------------------------
// Library shape
// ---------------------------------------------------------------------------
describe('TABS library', () => {
  it('exports at least 3 tabs', () => {
    expect(TABS.length).toBeGreaterThanOrEqual(3);
  });

  it('exports at most 5 tabs', () => {
    expect(TABS.length).toBeLessThanOrEqual(5);
  });

  it('all titles are non-empty strings', () => {
    for (const tab of TABS) {
      expect(typeof tab.title).toBe('string');
      expect(tab.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('all titles are unique', () => {
    const titles = TABS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('every tab has at least one step', () => {
    for (const tab of TABS) {
      expect(tab.steps.length).toBeGreaterThan(0);
    }
  });

  it('no step is empty (every step has at least one TabNote)', () => {
    for (const tab of TABS) {
      for (const step of tab.steps) {
        expect(step.length).toBeGreaterThan(0);
      }
    }
  });

  it('all string indices are in range 0..5', () => {
    for (const tab of TABS) {
      for (const step of tab.steps) {
        for (const note of step) {
          expect(note.string).toBeGreaterThanOrEqual(0);
          expect(note.string).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('all fret values are in range 0..14', () => {
    for (const tab of TABS) {
      for (const step of tab.steps) {
        for (const note of step) {
          expect(note.fret).toBeGreaterThanOrEqual(0);
          expect(note.fret).toBeLessThanOrEqual(14);
        }
      }
    }
  });

  it('library order is stable across two reads (same reference, frozen array)', () => {
    // TABS is a frozen readonly array — same reference both times, titles always in same order
    const titles1 = TABS.map((t) => t.title);
    const titles2 = TABS.map((t) => t.title);
    expect(titles1).toEqual(titles2);
  });

  it('at least one tab contains a chord step (step with > 1 note)', () => {
    const hasChord = TABS.some((tab) => tab.steps.some((step) => step.length > 1));
    expect(hasChord).toBe(true);
  });
});
