import { describe, it, expect } from 'vitest';
import { advancePlayback } from '$lib/theory/transport';
import type { PlaybackState } from '$lib/theory/transport';

// ─── helpers ────────────────────────────────────────────────────────────────

function state(
  activeIndex: number,
  activeNoteIndex: number,
  isPlaying: boolean,
): PlaybackState {
  return { activeIndex, activeNoteIndex, isPlaying };
}

// ─── caged mode ─────────────────────────────────────────────────────────────

describe('advancePlayback — caged mode', () => {
  const opts = { mode: 'caged' as const, progressionLength: 3, arpeggioLength: 5, loop: false };

  it('increments activeIndex on each tick', () => {
    const result = advancePlayback(state(0, 0, true), opts);
    expect(result.activeIndex).toBe(1);
    expect(result.isPlaying).toBe(true);
  });

  it('activeNoteIndex stays 0 in caged mode', () => {
    const result = advancePlayback(state(0, 0, true), opts);
    expect(result.activeNoteIndex).toBe(0);
  });

  it('stops at end of progression when loop=false', () => {
    const result = advancePlayback(state(2, 0, true), { ...opts, loop: false });
    expect(result.isPlaying).toBe(false);
  });

  it('clamps activeIndex to the last valid chord when stopping (loop=false)', () => {
    const result = advancePlayback(state(2, 0, true), { ...opts, loop: false });
    // activeIndex stays in bounds at the last chord (progressionLength-1), never one past the end
    expect(result.isPlaying).toBe(false);
    expect(result.activeIndex).toBe(2);
  });

  it('wraps activeIndex to 0 when loop=true and at end', () => {
    const result = advancePlayback(state(2, 0, true), { ...opts, loop: true });
    expect(result.activeIndex).toBe(0);
    expect(result.isPlaying).toBe(true);
  });

  it('wraps activeNoteIndex to 0 when loop=true and at end (caged)', () => {
    const result = advancePlayback(state(2, 0, true), { ...opts, loop: true });
    expect(result.activeNoteIndex).toBe(0);
  });

  it('continues playing when loop=true and not at end', () => {
    const result = advancePlayback(state(1, 0, true), { ...opts, loop: true });
    expect(result.isPlaying).toBe(true);
    expect(result.activeIndex).toBe(2);
  });
});

// ─── sweep mode — inner step (no chord boundary) ────────────────────────────

describe('advancePlayback — sweep mode inner step', () => {
  const opts = { mode: 'sweep' as const, progressionLength: 3, arpeggioLength: 5, loop: false };

  it('increments activeNoteIndex within a chord', () => {
    const result = advancePlayback(state(0, 2, true), opts);
    expect(result.activeNoteIndex).toBe(3);
    expect(result.activeIndex).toBe(0);
    expect(result.isPlaying).toBe(true);
  });

  it('activeIndex is unchanged when not at arpeggio boundary', () => {
    const result = advancePlayback(state(1, 1, true), opts);
    expect(result.activeIndex).toBe(1);
  });

  it('steps from note 0 to note 1 without touching activeIndex', () => {
    const result = advancePlayback(state(0, 0, true), opts);
    expect(result.activeNoteIndex).toBe(1);
    expect(result.activeIndex).toBe(0);
  });
});

// ─── sweep mode — chord carry (last note → next chord) ──────────────────────

describe('advancePlayback — sweep mode chord carry', () => {
  const opts = { mode: 'sweep' as const, progressionLength: 3, arpeggioLength: 5, loop: false };

  it('resets activeNoteIndex to 0 and increments activeIndex at last note of a chord', () => {
    const result = advancePlayback(state(0, 4, true), opts);
    expect(result.activeNoteIndex).toBe(0);
    expect(result.activeIndex).toBe(1);
    expect(result.isPlaying).toBe(true);
  });

  it('carry works for any chord in the progression', () => {
    const result = advancePlayback(state(1, 4, true), opts);
    expect(result.activeNoteIndex).toBe(0);
    expect(result.activeIndex).toBe(2);
    expect(result.isPlaying).toBe(true);
  });
});

// ─── sweep mode — end of progression ────────────────────────────────────────

describe('advancePlayback — sweep mode stop at end', () => {
  const opts = {
    mode: 'sweep' as const,
    progressionLength: 3,
    arpeggioLength: 5,
    loop: false,
  };

  it('stops (isPlaying=false) at last note of last chord when loop=false', () => {
    const result = advancePlayback(state(2, 4, true), opts);
    expect(result.isPlaying).toBe(false);
  });

  it('clamps to the last valid (chord, note) when stopping (loop=false)', () => {
    const result = advancePlayback(state(2, 4, true), opts);
    // stays in bounds on the final note of the final chord, never one past the end
    expect(result.activeIndex).toBe(2);
    expect(result.activeNoteIndex).toBe(4);
  });
});

// ─── edge case: empty progression ───────────────────────────────────────────

describe('advancePlayback — empty progression', () => {
  it('stops instead of looping forever when progressionLength=0 (loop=true)', () => {
    const result = advancePlayback(state(0, 0, true), {
      mode: 'sweep',
      progressionLength: 0,
      arpeggioLength: 5,
      loop: true,
    });
    expect(result.isPlaying).toBe(false);
  });
});

// ─── sweep mode — loop wrap ──────────────────────────────────────────────────

describe('advancePlayback — sweep mode loop wrap', () => {
  const opts = {
    mode: 'sweep' as const,
    progressionLength: 3,
    arpeggioLength: 5,
    loop: true,
  };

  it('wraps to (activeIndex=0, activeNoteIndex=0) at last note of last chord when loop=true', () => {
    const result = advancePlayback(state(2, 4, true), opts);
    expect(result.activeIndex).toBe(0);
    expect(result.activeNoteIndex).toBe(0);
    expect(result.isPlaying).toBe(true);
  });
});

// ─── already stopped ────────────────────────────────────────────────────────

describe('advancePlayback — already stopped', () => {
  it('returns state unchanged when isPlaying=false (caged)', () => {
    const s = state(1, 0, false);
    const result = advancePlayback(s, {
      mode: 'caged',
      progressionLength: 3,
      arpeggioLength: 5,
      loop: false,
    });
    expect(result).toEqual(s);
  });

  it('returns state unchanged when isPlaying=false (sweep)', () => {
    const s = state(1, 2, false);
    const result = advancePlayback(s, {
      mode: 'sweep',
      progressionLength: 3,
      arpeggioLength: 5,
      loop: false,
    });
    expect(result).toEqual(s);
  });
});

// ─── edge case: single chord, single note, loop=true ────────────────────────

describe('advancePlayback — single-chord single-note edge case', () => {
  it('loop=true with 1 chord and 1 note wraps cleanly without advancing', () => {
    // arpeggioLength=1 means note 0 is the last note. At (activeIndex=0, noteIndex=0)
    // → carry fires (noteIndex 0+1 >= 1), activeIndex becomes 1 which equals progressionLength=1
    // → loop wraps to (0, 0)
    const result = advancePlayback(state(0, 0, true), {
      mode: 'sweep',
      progressionLength: 1,
      arpeggioLength: 1,
      loop: true,
    });
    expect(result.activeIndex).toBe(0);
    expect(result.activeNoteIndex).toBe(0);
    expect(result.isPlaying).toBe(true);
  });

  it('loop=false with 1 chord and 1 note stops immediately', () => {
    const result = advancePlayback(state(0, 0, true), {
      mode: 'sweep',
      progressionLength: 1,
      arpeggioLength: 1,
      loop: false,
    });
    expect(result.isPlaying).toBe(false);
  });
});
