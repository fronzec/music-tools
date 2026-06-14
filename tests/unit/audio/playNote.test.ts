import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNotePlayer } from '$lib/audio/playNote';

// ---------------------------------------------------------------------------
// MockAudioContext — mirrors the stub shape used in ToneGenerator.test.ts
// ---------------------------------------------------------------------------

function makeMockOscillator() {
  return {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeMockGain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
  };
}

// Tracks created nodes and AudioContext instances so tests can inspect them
let createdOscillators: ReturnType<typeof makeMockOscillator>[];
let createdGains: ReturnType<typeof makeMockGain>[];
let createdContexts: { close: ReturnType<typeof vi.fn> }[];

class MockAudioContext {
  destination = { _dest: true };
  currentTime = 0;
  close: ReturnType<typeof vi.fn>;

  constructor() {
    this.close = vi.fn();
    // Track this instance so tests can inspect it
    createdContexts.push(this);
  }

  createOscillator() {
    const osc = makeMockOscillator();
    createdOscillators.push(osc);
    return osc;
  }

  createGain() {
    const gain = makeMockGain();
    createdGains.push(gain);
    return gain;
  }
}

beforeEach(() => {
  createdOscillators = [];
  createdGains = [];
  createdContexts = [];
  vi.stubGlobal('AudioContext', MockAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Module isolation
// ---------------------------------------------------------------------------

describe('module isolation', () => {
  it('imports createNotePlayer with no side effects (no ctx at import time)', () => {
    // If AudioContext were constructed at import time, the stub wouldn't be in
    // place (imports happen before test setup). The fact that import succeeds
    // and no AudioContext is called during beforeEach confirms lazy init.
    // We verify by checking no oscillators were created before calling playSequence.
    expect(createdOscillators.length).toBe(0);
    expect(typeof createNotePlayer).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Basic playSequence — no throw
// ---------------------------------------------------------------------------

describe('playSequence basic', () => {
  it('does not throw when called with two frequencies', () => {
    const player = createNotePlayer();
    expect(() => player.playSequence([440, 880])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Oscillator and gain node counts
// ---------------------------------------------------------------------------

describe('playSequence node creation', () => {
  it('creates exactly two oscillators for two frequencies', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    expect(createdOscillators.length).toBe(2);
  });

  it('creates exactly two gain nodes for two frequencies', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    expect(createdGains.length).toBe(2);
  });

  it('first oscillator frequency.value is 440', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    expect(createdOscillators[0].frequency.value).toBe(440);
  });

  it('second oscillator frequency.value is 880', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    expect(createdOscillators[1].frequency.value).toBe(880);
  });
});

// ---------------------------------------------------------------------------
// Anti-click envelope: ramps, not steps
// ---------------------------------------------------------------------------

describe('gain envelope', () => {
  it('calls setValueAtTime(0, startTime) for the attack ramp start', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    // First note's gain should have started at 0
    expect(createdGains[0].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it('uses linearRampToValueAtTime for attack (not an immediate step)', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    expect(createdGains[0].gain.linearRampToValueAtTime).toHaveBeenCalled();
  });

  it('applies a release ramp back to 0 before note end', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    // linearRampToValueAtTime called at least twice: once for attack (to peak), once for release (to 0)
    const calls = createdGains[0].gain.linearRampToValueAtTime.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    // One of the calls must ramp to 0 (release)
    const hasRelease = calls.some((call: unknown[]) => call[0] === 0);
    expect(hasRelease).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sequential scheduling — second note offset by STEP = 0.7s
// ---------------------------------------------------------------------------

describe('sequential scheduling', () => {
  it('second note starts 0.7s after the first', () => {
    const player = createNotePlayer();
    player.playSequence([440, 880]);
    // start(t) calls: first at currentTime + 0*STEP, second at currentTime + 1*STEP
    const firstStart = createdOscillators[0].start.mock.calls[0][0] as number;
    const secondStart = createdOscillators[1].start.mock.calls[0][0] as number;
    expect(secondStart - firstStart).toBeCloseTo(0.7, 5);
  });
});

// ---------------------------------------------------------------------------
// dispose
// ---------------------------------------------------------------------------

describe('dispose', () => {
  it('calls close() on the AudioContext after playSequence', () => {
    const player = createNotePlayer();
    player.playSequence([440]); // lazy-initialises ctx
    expect(createdContexts.length).toBe(1);
    player.dispose();
    expect(createdContexts[0].close).toHaveBeenCalledTimes(1);
  });

  it('calling dispose without prior playSequence does not throw', () => {
    const player = createNotePlayer();
    expect(() => player.dispose()).not.toThrow();
  });
});
