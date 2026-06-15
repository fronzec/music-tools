import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { Tab } from '$lib/theory/tab';
import type { ViewName } from '$lib/types/chord';

// ---------------------------------------------------------------------------
// AudioContext stub — mirrors playNote.test.ts pattern
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

class MockAudioContext {
  destination = { _dest: true };
  currentTime = 0;
  close = vi.fn();

  createOscillator() {
    return makeMockOscillator();
  }
  createGain() {
    return makeMockGain();
  }
}

// ---------------------------------------------------------------------------
// Mock createNotePlayer — track playSequence + dispose calls
// ---------------------------------------------------------------------------

const mockPlaySequence = vi.fn();
const mockDispose = vi.fn();

vi.mock('$lib/audio/playNote', () => ({
  createNotePlayer: vi.fn(() => ({
    playSequence: mockPlaySequence,
    dispose: mockDispose,
  })),
}));

// Lazy component import so mock hoisting resolves first
async function importComponent() {
  const mod = await import('$lib/components/TabPlayer.svelte');
  return mod.default;
}

// Minimal tab stubs used across tests
const tabA: Tab = {
  title: 'Tab A',
  steps: [
    [{ string: 5, fret: 0 }],
    [{ string: 5, fret: 2 }],
    [{ string: 4, fret: 0 }],
  ],
};

const tabB: Tab = {
  title: 'Tab B',
  steps: [
    [{ string: 0, fret: 0 }],
    [{ string: 0, fret: 2 }],
  ],
};

function makeNavigate() {
  return vi.fn() as (view: ViewName) => void;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('AudioContext', MockAudioContext);
  mockPlaySequence.mockClear();
  mockDispose.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Group A — basic render + play advances steps
// ---------------------------------------------------------------------------

describe('TabPlayer — Group A: basic render + play', () => {
  it('renders without throwing', async () => {
    const TabPlayer = await importComponent();
    const result = render(TabPlayer as any, { navigate: makeNavigate() });
    expect(result).toBeTruthy();
  });

  it('renders a Back to Home button', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    expect(screen.getByRole('button', { name: /back to home/i })).toBeTruthy();
  });

  it('renders a Play button', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    expect(screen.getByRole('button', { name: /play/i })).toBeTruthy();
  });

  it('renders a Stop button', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy();
  });

  it('renders a tempo control', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    // Tempo input (range or number)
    const tempoInput = screen.getByRole('spinbutton', { name: /tempo/i })
      ?? screen.getByRole('slider', { name: /tempo/i });
    expect(tempoInput).toBeTruthy();
  });

  it('calls navigate("home") when Back to Home is clicked', async () => {
    const TabPlayer = await importComponent();
    const navigate = makeNavigate();
    render(TabPlayer as any, { navigate });
    const btn = screen.getByRole('button', { name: /back to home/i });
    await btn.click();
    expect(navigate).toHaveBeenCalledWith('home');
  });

  it('plays the first step immediately when Play is clicked (playSequence called once)', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    // playSequence called for step 0
    expect(mockPlaySequence).toHaveBeenCalledTimes(1);
  });

  it('advances to step 1 after one stepMs interval elapses', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    // Default tempo 80 BPM → stepMs = 60000/80 = 750ms
    const stepMs = Math.round(60000 / 80);

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    expect(mockPlaySequence).toHaveBeenCalledTimes(1); // step 0

    vi.advanceTimersByTime(stepMs);
    // step 1 played
    expect(mockPlaySequence).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Group B (CRITICAL) — Stop cancels timer
// ---------------------------------------------------------------------------

describe('TabPlayer — Group B: Stop cancels timer', () => {
  it('Stop while playing → vi.getTimerCount() === 0', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    // Timer is scheduled
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    const stopBtn = screen.getByRole('button', { name: /^stop$/i });
    await stopBtn.click();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Stop while playing → advancing time does not call playSequence again', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    const stepMs = Math.round(60000 / 80);
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    const countAfterPlay = mockPlaySequence.mock.calls.length;

    const stopBtn = screen.getByRole('button', { name: /^stop$/i });
    await stopBtn.click();

    vi.advanceTimersByTime(stepMs * 5);
    expect(mockPlaySequence).toHaveBeenCalledTimes(countAfterPlay);
  });

  it('Stop while already stopped → does not throw', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const stopBtn = screen.getByRole('button', { name: /^stop$/i });
    expect(() => stopBtn.click()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Stop resets the playhead to step 0', async () => {
    const TabPlayer = await importComponent();
    const { container } = render(TabPlayer as any, { navigate: makeNavigate() });
    const stepMs = Math.round(60000 / 80);
    await fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
    await vi.advanceTimersByTimeAsync(stepMs * 2); // advance past step 0, flushing DOM updates
    expect(container.textContent ?? '').toContain('Step 3/'); // now on a later step
    await fireEvent.click(screen.getByRole('button', { name: /^stop$/i }));
    expect(container.textContent ?? '').toContain('Step 1/'); // parked back at step 0
  });
});

// ---------------------------------------------------------------------------
// Group C (CRITICAL) — end of tab auto-stops
// ---------------------------------------------------------------------------

describe('TabPlayer — Group C: end-of-tab auto-stops', () => {
  it('reaches end → no pending timers (getTimerCount === 0)', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    // Default tempo 80 BPM → stepMs = 750ms
    const stepMs = Math.round(60000 / 80);

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();

    // The default tab is TABS[0] (E Minor Pentatonic — 12 steps).
    // Advance enough time to exhaust all 12 steps: 12 inter-step intervals covers
    // step-0 (played immediately) plus 12 more timer fires (after step 11 fires
    // and guard condition stops). Use 20 steps worth to be safe.
    vi.advanceTimersByTime(stepMs * 20);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('playSequence is called exactly steps.length times from start to end', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    const stepMs = Math.round(60000 / 80);
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();

    // Advance past all steps of the default tab.
    vi.advanceTimersByTime(stepMs * 40);

    // Should have played exactly one playSequence per step of the default tab
    // (derive the count from the data, not a magic number).
    const { TABS } = await import('$lib/data/tabs');
    expect(mockPlaySequence.mock.calls.length).toBe(TABS[0].steps.length);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starting playback schedules exactly one timer (no duplicate/concurrent timers)', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    // The exact failure mode of the prior incident: a second timer must never
    // coexist. Exactly one is pending while playing.
    expect(vi.getTimerCount()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Group D (CRITICAL) — unmount cancels timer
// ---------------------------------------------------------------------------

describe('TabPlayer — Group D: unmount cancels timer', () => {
  it('unmount while playing → vi.getTimerCount() === 0', async () => {
    const TabPlayer = await importComponent();
    const { unmount } = render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmount while playing → dispose() is called', async () => {
    const TabPlayer = await importComponent();
    const { unmount } = render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();

    unmount();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('advancing time after unmount → no additional playSequence calls', async () => {
    const TabPlayer = await importComponent();
    const stepMs = Math.round(60000 / 80);
    const { unmount } = render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    const countBeforeUnmount = mockPlaySequence.mock.calls.length;

    unmount();
    vi.advanceTimersByTime(stepMs * 10);
    expect(mockPlaySequence).toHaveBeenCalledTimes(countBeforeUnmount);
  });
});

// ---------------------------------------------------------------------------
// Group E (CRITICAL) — tab switch cancels timer + resets step
// ---------------------------------------------------------------------------

describe('TabPlayer — Group E: tab switch cancels timer', () => {
  it('switching tab while playing → vi.getTimerCount() === 0', async () => {
    const TabPlayer = await importComponent();
    const { container } = render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    // Tab selector buttons have role="radio" and data-tab-selector attribute.
    // Click the second one (index 1) to switch tabs while playing.
    const tabRadios = container.querySelectorAll('[data-tab-selector]');
    expect(tabRadios.length).toBeGreaterThan(1);
    (tabRadios[1] as HTMLElement).click();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('re-selecting the same tab while stopped → getTimerCount stays 0', async () => {
    const TabPlayer = await importComponent();
    const { container } = render(TabPlayer as any, { navigate: makeNavigate() });

    // No playback started — click the first tab selector
    const tabRadios = container.querySelectorAll('[data-tab-selector]');
    expect(tabRadios.length).toBeGreaterThan(0);
    (tabRadios[0] as HTMLElement).click();

    expect(vi.getTimerCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Group F — tempo control
// ---------------------------------------------------------------------------

describe('TabPlayer — Group F: tempo control', () => {
  it('default tempo is between 60 and 120 BPM', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    // Find tempo input by aria-label
    let tempoEl: HTMLElement | null = null;
    try {
      tempoEl = screen.getByRole('spinbutton', { name: /tempo/i });
    } catch {
      tempoEl = screen.getByRole('slider', { name: /tempo/i });
    }
    const val = Number((tempoEl as HTMLInputElement).value);
    expect(val).toBeGreaterThanOrEqual(60);
    expect(val).toBeLessThanOrEqual(120);
  });

  it('tempo above MAX (200) is clamped: timer fires at 300ms, not the raw 250-BPM interval', async () => {
    const TabPlayer = await importComponent();
    const { container } = render(TabPlayer as any, { navigate: makeNavigate() });

    let tempoEl =
      (container.querySelector('#tempo-input') as HTMLInputElement | null) ??
      (container.querySelector('input[type="number"], input[type="range"]') as HTMLInputElement | null);
    expect(tempoEl).toBeTruthy();
    // 250 BPM → clamped to 200 → stepMs = 60000/200 = 300ms (raw would be 240ms).
    await fireEvent.input(tempoEl!, { target: { value: '250' } });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    expect(mockPlaySequence.mock.calls.length).toBe(1); // step 0 plays immediately

    // At 290ms the clamped 300ms interval has NOT elapsed; an unclamped 240ms would have.
    vi.advanceTimersByTime(290);
    expect(mockPlaySequence.mock.calls.length).toBe(1);
    // Past 300ms → the next step fires, proving the interval was clamped to 300.
    vi.advanceTimersByTime(20);
    expect(mockPlaySequence.mock.calls.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Group G — step navigation while stopped
// ---------------------------------------------------------------------------

describe('TabPlayer — Group G: Next/Prev while stopped', () => {
  it('renders a Next button', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
  });

  it('renders a Previous button', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    expect(screen.getByRole('button', { name: /prev/i })).toBeTruthy();
  });

  it('clicking Next while stopped advances the step (playSequence called)', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    // First, play step 0 via Play, then Stop to get into state where step is tracked
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();
    const stopBtn = screen.getByRole('button', { name: /^stop$/i });
    await stopBtn.click();
    const callsAfterStop = mockPlaySequence.mock.calls.length;

    const nextBtn = screen.getByRole('button', { name: /next/i });
    await nextBtn.click();
    expect(mockPlaySequence.mock.calls.length).toBe(callsAfterStop + 1);
    // Next does not start playback timer
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Next/Prev buttons are disabled while playing', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    await playBtn.click();

    const nextBtn = screen.getByRole('button', { name: /next/i });
    const prevBtn = screen.getByRole('button', { name: /prev/i });
    expect(nextBtn).toHaveProperty('disabled', true);
    expect(prevBtn).toHaveProperty('disabled', true);
  });
});

// ---------------------------------------------------------------------------
// Group H — aria labels on key controls
// ---------------------------------------------------------------------------

describe('TabPlayer — Group H: accessibility', () => {
  it('Play button has aria-label', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const btn = screen.getByRole('button', { name: /^play$/i });
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('Stop button has aria-label', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const btn = screen.getByRole('button', { name: /^stop$/i });
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('Tempo control has aria-label', async () => {
    const TabPlayer = await importComponent();
    const { container } = render(TabPlayer as any, { navigate: makeNavigate() });
    const tempoEl = container.querySelector('[aria-label*="empo"]');
    expect(tempoEl).not.toBeNull();
  });

  it('Back to Home button has aria-label', async () => {
    const TabPlayer = await importComponent();
    render(TabPlayer as any, { navigate: makeNavigate() });
    const btn = screen.getByRole('button', { name: /back to home/i });
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });
});
