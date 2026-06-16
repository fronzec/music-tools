import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ViewName } from '$lib/types/chord';
import type { Rng } from '$lib/theory/intervals';

// ---------------------------------------------------------------------------
// AudioContext stub (same mock shape as ToneGenerator.test.ts)
// ---------------------------------------------------------------------------

let mockOscillator: {
  type: string;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

let mockGain: {
  gain: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    cancelScheduledValues: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
};

let mockCtx: {
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  destination: object;
  currentTime: number;
  close: ReturnType<typeof vi.fn>;
};

// ---------------------------------------------------------------------------
// Mocked playNote module — vi.mock is hoisted, factory runs before imports
// ---------------------------------------------------------------------------

let mockPlaySequence: ReturnType<typeof vi.fn>;
let mockDispose: ReturnType<typeof vi.fn>;

vi.mock('$lib/audio/playNote', () => {
  mockPlaySequence = vi.fn();
  mockDispose = vi.fn();
  return {
    createNotePlayer: vi.fn(() => ({
      playSequence: mockPlaySequence,
      dispose: mockDispose,
    })),
  };
});

// Lazy import so vi.mock hoisting has time to run
async function importComponent() {
  const mod = await import('$lib/components/IntervalTrainer.svelte');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderTool(rng?: Rng) {
  const IntervalTrainer = await importComponent();
  const navigate = vi.fn() as (view: ViewName) => void;
  const props: Record<string, unknown> = { navigate };
  if (rng) props.rng = rng;
  const result = render(IntervalTrainer as any, props);
  return { navigate, ...result };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('IntervalTrainer', () => {
  beforeEach(() => {
    mockOscillator = {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    mockGain = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
    };
    mockCtx = {
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
      currentTime: 0,
      close: vi.fn(),
    };
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function (this: unknown) {
        return mockCtx;
      }),
    );
    // Reset call counts for the mocked player methods
    mockPlaySequence = vi.fn();
    mockDispose = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // TASK 2.1 — render + back navigation
  // -------------------------------------------------------------------------

  describe('initial render', () => {
    it('renders without throwing', async () => {
      await expect(renderTool()).resolves.toBeTruthy();
    });

    it('renders title "Interval Trainer"', async () => {
      await renderTool();
      expect(screen.getByText('Interval Trainer')).toBeTruthy();
    });

    it('renders a back-to-home control', async () => {
      await renderTool();
      const backBtn = screen.getByText('← Back to Home');
      expect(backBtn).toBeTruthy();
    });
  });

  describe('back navigation', () => {
    it('clicking back-to-home calls navigate("home")', async () => {
      const { navigate } = await renderTool();
      const backBtn = screen.getByText('← Back to Home');
      await fireEvent.click(backBtn);
      expect(navigate).toHaveBeenCalledWith('home');
    });
  });

  // -------------------------------------------------------------------------
  // TASK 2.2 — 4 answer buttons + audio plays on mount
  // -------------------------------------------------------------------------

  describe('question panel', () => {
    it('renders exactly 4 answer buttons on mount', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      expect(answerBtns.length).toBe(4);
    });

    it('all 4 answer button labels are distinct', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      const labels = answerBtns.map((b) => b.getAttribute('aria-label'));
      const unique = new Set(labels);
      expect(unique.size).toBe(4);
    });

    it('does NOT play any audio on mount (no autoplay before a user gesture)', async () => {
      await renderTool();
      expect(mockPlaySequence).not.toHaveBeenCalled();
    });

    it('clicking Replay plays the interval (gesture-driven audio)', async () => {
      await renderTool();
      mockPlaySequence.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Replay interval' }));
      expect(mockPlaySequence).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // TASK 2.3 — correct answer flow
  // -------------------------------------------------------------------------

  describe('correct answer flow', () => {
    async function clickCorrectAnswer() {
      const result = await renderTool();
      // The correct interval name is in aria-label of a button that contains the answer.
      // We need to identify which button label is the correct answer.
      // The component exposes the question through the DOM — correct answer button label
      // includes the interval name. We find it by looking at a data attribute or
      // by trying each button. Per spec: after clicking correct button → score shows "1 / 1".
      // Strategy: try all answer buttons until one makes score show "1 / 1"
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      return { result, answerBtns };
    }

    it('score region has aria-live="polite"', async () => {
      const { container } = await renderTool();
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });

    it('answer buttons are disabled after selecting an answer', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      await fireEvent.click(answerBtns[0]!);
      // All answer buttons must be disabled after selection
      const updatedBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      for (const btn of updatedBtns) {
        expect(btn.hasAttribute('disabled')).toBe(true);
      }
    });

    it('clicking the correct answer scores "1 / 1" and shows positive feedback', async () => {
      // Deterministic rng: () => 0 always yields "Minor 2nd" as the correct interval.
      const { container } = await renderTool(() => 0);
      const correctBtn = screen.getByRole('button', { name: 'Answer Minor 2nd' });
      await fireEvent.click(correctBtn);
      expect(container.textContent ?? '').toMatch(/1 \/ 1/);
      expect(container.textContent ?? '').toContain('Correct!');
    });

    it('auto-advances and plays the next interval ~1500ms after a correct answer', async () => {
      vi.useFakeTimers();
      try {
        await renderTool(() => 0); // silent mount; rng=()=>0 → correct answer is "Minor 2nd"
        await fireEvent.click(screen.getByRole('button', { name: 'Answer Minor 2nd' })); // correct → schedules setTimeout(next, 1500)
        mockPlaySequence.mockClear(); // answering does not play; baseline is 0
        vi.advanceTimersByTime(1500); // auto-advance fires next() → must play the new interval
        expect(mockPlaySequence).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('clicking Next after a correct answer cancels the pending auto-advance (no ghost skip)', async () => {
      vi.useFakeTimers();
      try {
        await renderTool(() => 0); // mount is silent (no autoplay)
        await fireEvent.click(screen.getByRole('button', { name: 'Answer Minor 2nd' })); // correct → schedules 1500ms timer
        await fireEvent.click(screen.getByRole('button', { name: 'Next question' })); // manual advance → plays + cancels timer
        const callsAfterManualNext = mockPlaySequence.mock.calls.length;
        vi.advanceTimersByTime(3000); // a leftover timer would fire next() again
        expect(mockPlaySequence.mock.calls.length).toBe(callsAfterManualNext);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // -------------------------------------------------------------------------
  // TASK 2.4 — wrong answer flow + replay
  // -------------------------------------------------------------------------

  describe('wrong answer flow', () => {
    it('clicking a wrong answer scores "0 / 1" and reveals the correct interval', async () => {
      // rng = () => 0 → correct is "Minor 2nd"; "Major 2nd" is always a distractor.
      const { container } = await renderTool(() => 0);
      const wrongBtn = screen.getByRole('button', { name: 'Answer Major 2nd' });
      await fireEvent.click(wrongBtn);
      expect(container.textContent ?? '').toMatch(/0 \/ 1/);
      expect(container.textContent ?? '').toContain('The correct answer was');
      expect(container.textContent ?? '').toContain('Minor 2nd');
    });

    it('replay control exists with aria-label containing "Replay"', async () => {
      await renderTool();
      const replayBtn = screen.getByRole('button', { name: /Replay/i });
      expect(replayBtn).toBeTruthy();
    });

    it('replay button has aria-label "Replay interval"', async () => {
      await renderTool();
      const replayBtn = screen.getByRole('button', { name: 'Replay interval' });
      expect(replayBtn).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // TASK 2.5 — Next control
  // -------------------------------------------------------------------------

  describe('Next control', () => {
    it('"Next" control appears after answering', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      await fireEvent.click(answerBtns[0]!);
      const nextBtn = screen.getByRole('button', { name: 'Next question' });
      expect(nextBtn).toBeTruthy();
    });

    it('"Next" control has aria-label "Next question"', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      await fireEvent.click(answerBtns[0]!);
      const nextBtn = screen.getByRole('button', { name: 'Next question' });
      expect(nextBtn.getAttribute('aria-label')).toBe('Next question');
    });
  });

  // -------------------------------------------------------------------------
  // Mode toggle — Practice ↔ Explore
  // -------------------------------------------------------------------------

  describe('mode toggle', () => {
    it('default mode is Practice — role="img" (IntervalFretboard) is NOT in the DOM on mount', async () => {
      await renderTool();
      const fretboard = screen.queryByRole('img');
      expect(fretboard).toBeNull();
    });

    it('default mode is Practice — exactly 4 answer buttons on mount', async () => {
      await renderTool();
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      expect(answerBtns.length).toBe(4);
    });

    it('"Practice" toggle button exists and has aria-pressed="true" on mount', async () => {
      await renderTool();
      const practiceBtn = screen.getByRole('button', { name: 'Practice' });
      expect(practiceBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('"Explore" toggle button exists and has aria-pressed="false" on mount', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      expect(exploreBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('clicking "Explore" toggle shows role="img" (the fretboard)', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const fretboard = screen.queryByRole('img');
      expect(fretboard).toBeTruthy();
    });

    it('clicking "Explore" toggle shows a button with aria-label="Play interval"', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const playBtn = screen.queryByRole('button', { name: 'Play interval' });
      expect(playBtn).toBeTruthy();
    });

    it('clicking "Explore" toggle hides the 4 answer buttons', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const answerBtns = screen
        .queryAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      expect(answerBtns.length).toBe(0);
    });

    it('clicking "Explore" then "Practice" restores exactly 4 answer buttons', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const practiceBtn = screen.getByRole('button', { name: 'Practice' });
      await fireEvent.click(practiceBtn);
      const answerBtns = screen
        .getAllByRole('button')
        .filter((b) => /^Answer /.test(b.getAttribute('aria-label') ?? ''));
      expect(answerBtns.length).toBe(4);
    });

    it('clicking "Explore" then "Practice" re-establishes aria-pressed="true" on Practice button', async () => {
      await renderTool();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const practiceBtn = screen.getByRole('button', { name: 'Practice' });
      await fireEvent.click(practiceBtn);
      const practiceBtnAfter = screen.getByRole('button', { name: 'Practice' });
      expect(practiceBtnAfter.getAttribute('aria-pressed')).toBe('true');
    });

    it('(a11y) active toggle button has aria-pressed="true"', async () => {
      await renderTool();
      // Practice is active on mount
      const practiceBtn = screen.getByRole('button', { name: 'Practice' });
      expect(practiceBtn.getAttribute('aria-pressed')).toBe('true');
      // Switch to Explore — now Explore should be active
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      const exploreBtnAfter = screen.getByRole('button', { name: 'Explore' });
      expect(exploreBtnAfter.getAttribute('aria-pressed')).toBe('true');
    });

    it('switching to Explore cancels a pending Practice auto-advance (no late audio)', async () => {
      vi.useFakeTimers();
      try {
        await renderTool(() => 0); // mount is silent; rng=()=>0 → correct answer is "Minor 2nd"
        await fireEvent.click(screen.getByRole('button', { name: 'Answer Minor 2nd' })); // correct → schedules setTimeout(next, 1500)
        await fireEvent.click(screen.getByRole('button', { name: 'Explore' })); // setMode must cancel the pending timer
        const callsBefore = mockPlaySequence.mock.calls.length;
        vi.advanceTimersByTime(3000); // a leftover timer would fire next() → playSequence
        expect(mockPlaySequence.mock.calls.length).toBe(callsBefore);
      } finally {
        vi.useRealTimers();
      }
    });

    it('Explore controls are visible button radiogroups (not dropdowns)', async () => {
      await renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      // 12 chromatic root radios + 12 interval radios, all visible (no <select>).
      expect(screen.getAllByRole('radio').length).toBe(24);
    });

    it('clicking an interval button selects it and updates the displayed interval', async () => {
      const { container } = await renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      const m3Btn = screen.getByRole('radio', { name: 'Interval Major 3rd' });
      await fireEvent.click(m3Btn);
      expect(m3Btn.getAttribute('aria-checked')).toBe('true');
      expect(container.textContent ?? '').toContain('Major 3rd');
    });

    it('clicking a root note button selects it', async () => {
      await renderTool();
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      const rootD = screen.getByRole('radio', { name: 'Root D' });
      await fireEvent.click(rootD);
      expect(rootD.getAttribute('aria-checked')).toBe('true');
    });

    // T10 — Explore mode audio tests
    it('clicking "Explore" then "Play interval" calls mockPlaySequence', async () => {
      await renderTool();
      mockPlaySequence.mockClear();
      const exploreBtn = screen.getByRole('button', { name: 'Explore' });
      await fireEvent.click(exploreBtn);
      const playBtn = screen.getByRole('button', { name: 'Play interval' });
      await fireEvent.click(playBtn);
      expect(mockPlaySequence).toHaveBeenCalledTimes(1);
    });

    it('clicking "Play interval" in Explore calls mockPlaySequence with an array of exactly 2 numbers', async () => {
      await renderTool();
      mockPlaySequence.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Play interval' }));
      expect(mockPlaySequence).toHaveBeenCalledTimes(1);
      const [freqs] = mockPlaySequence.mock.calls[0] as [number[]];
      expect(Array.isArray(freqs)).toBe(true);
      expect(freqs.length).toBe(2);
    });

    it('default exploreRootPc=0, exploreSemitones=7: two frequencies match midiToFreq(60) and midiToFreq(67)', async () => {
      const { midiToFreq } = await import('$lib/theory/intervals');
      await renderTool();
      mockPlaySequence.mockClear();
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Play interval' }));
      const [freqs] = mockPlaySequence.mock.calls[0] as [number[]];
      expect(freqs[0]).toBeCloseTo(midiToFreq(60), 5);
      expect(freqs[1]).toBeCloseTo(midiToFreq(67), 5);
    });

    it('switching back to Practice after Explore does NOT call mockPlaySequence again', async () => {
      await renderTool();
      // Mount is silent (no autoplay)
      const callsAfterMount = mockPlaySequence.mock.calls.length;
      await fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Practice' }));
      // Switching back should not trigger audio
      expect(mockPlaySequence.mock.calls.length).toBe(callsAfterMount);
    });
  });
});
