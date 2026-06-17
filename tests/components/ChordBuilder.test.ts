import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ViewName } from '$lib/types/chord';
import { chordMidi } from '$lib/theory/chords';
import { midiToFreq } from '$lib/theory/intervals';

// ---------------------------------------------------------------------------
// Fake player — injectable via the `player` prop seam
// ---------------------------------------------------------------------------

function makeFakePlayer() {
  return {
    playSequence: vi.fn(),
    playChord: vi.fn(),
    dispose: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// AudioContext stub (jsdom has no real AudioContext)
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('AudioContext', class {
    currentTime = 0;
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    }
    createGain() {
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
    destination = {};
    close = vi.fn();
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Lazy import (after stubs are in place)
// ---------------------------------------------------------------------------

async function importComponent() {
  const mod = await import('$lib/components/ChordBuilder.svelte');
  return mod.default;
}

async function renderTool(overrides: Record<string, unknown> = {}) {
  const ChordBuilder = await importComponent();
  const navigate = vi.fn() as (view: ViewName) => void;
  const fakePlayer = makeFakePlayer();
  const result = render(ChordBuilder as any, {
    navigate,
    player: fakePlayer,
    ...overrides,
  });
  return { navigate, fakePlayer, ...result };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChordBuilder', () => {
  describe('initial state', () => {
    it('renders with root=C and quality=maj by default', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('C major');
    });

    it('formula shows "1 - 3 - 5" for C major', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('1 - 3 - 5');
    });

    it('note names contain C, E, G', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('C');
      expect(container.innerHTML).toContain('E');
      expect(container.innerHTML).toContain('G');
    });
  });

  describe('quality toggle', () => {
    it('renders exactly 4 quality toggle controls', async () => {
      await renderTool();
      // There should be buttons for maj, min, dim, aug
      const maj = screen.getAllByText('maj');
      const min = screen.getAllByText('min');
      const dim = screen.getAllByText('dim');
      const aug = screen.getAllByText('aug');
      expect(maj.length).toBeGreaterThanOrEqual(1);
      expect(min.length).toBeGreaterThanOrEqual(1);
      expect(dim.length).toBeGreaterThanOrEqual(1);
      expect(aug.length).toBeGreaterThanOrEqual(1);
    });

    it('exactly one quality button has aria-pressed=true initially', async () => {
      const { container } = await renderTool();
      // Scope to the quality toggles (maj/min/dim/aug) so the assertion is not
      // affected by any other aria-pressed controls; exactly one must be active.
      const qualityButtons = Array.from(
        container.querySelectorAll('button[aria-pressed]'),
      ).filter((b) => ['maj', 'min', 'dim', 'aug'].includes(b.textContent?.trim() ?? ''));
      const pressed = qualityButtons.filter(
        (b) => b.getAttribute('aria-pressed') === 'true',
      );
      expect(qualityButtons.length).toBe(4);
      expect(pressed.length).toBe(1);
    });

    it('clicking dim toggle shows C diminished chord name', async () => {
      const { container } = await renderTool();
      const dimBtn = screen.getAllByText('dim').find(
        (el) => el.tagName === 'BUTTON' || el.closest('button'),
      )!;
      const btn = dimBtn.tagName === 'BUTTON' ? dimBtn : dimBtn.closest('button')!;
      await btn.click();
      expect(container.innerHTML).toContain('C diminished');
    });

    it('clicking dim shows formula "1 - ♭3 - ♭5"', async () => {
      const { container } = await renderTool();
      const dimBtn = screen.getAllByText('dim').find(
        (el) => el.tagName === 'BUTTON' || el.closest('button'),
      )!;
      const btn = dimBtn.tagName === 'BUTTON' ? dimBtn : dimBtn.closest('button')!;
      await btn.click();
      expect(container.innerHTML).toContain('1 - ♭3 - ♭5');
    });

    it('toggling maj → min → maj restores C major', async () => {
      const { container } = await renderTool();

      const minBtn = screen.getAllByText('min').find(
        (el) => el.tagName === 'BUTTON' || el.closest('button'),
      )!;
      const minBtnEl = minBtn.tagName === 'BUTTON' ? minBtn : minBtn.closest('button')!;
      await minBtnEl.click();
      expect(container.innerHTML).toContain('C minor');

      const majBtn = screen.getAllByText('maj').find(
        (el) => el.tagName === 'BUTTON' || el.closest('button'),
      )!;
      const majBtnEl = majBtn.tagName === 'BUTTON' ? majBtn : majBtn.closest('button')!;
      await majBtnEl.click();
      expect(container.innerHTML).toContain('C major');
      expect(container.innerHTML).toContain('1 - 3 - 5');
    });
  });

  describe('root selection via RootSelector', () => {
    it('clicking G updates chord name to G major', async () => {
      const { container } = await renderTool();
      const gBtn = screen.getByRole('button', { name: /Select G root/i });
      await gBtn.click();
      expect(container.innerHTML).toContain('G major');
    });

    it('selecting G root shows notes G, B, D', async () => {
      const { container } = await renderTool();
      const gBtn = screen.getByRole('button', { name: /Select G root/i });
      await gBtn.click();
      const html = container.innerHTML;
      expect(html).toContain('G');
      expect(html).toContain('B');
      expect(html).toContain('D');
    });
  });

  describe('play button', () => {
    it('play control is present and has an aria-label', async () => {
      await renderTool();
      const playBtn = screen.getByRole('button', { name: /play chord/i });
      expect(playBtn).toBeTruthy();
      expect(playBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('play button does not trigger audio on mount (no autoplay)', async () => {
      const { fakePlayer } = await renderTool();
      expect(fakePlayer.playSequence).not.toHaveBeenCalled();
      expect(fakePlayer.playChord).not.toHaveBeenCalled();
    });

    it('activating play calls playSequence with C major arpeggio frequencies', async () => {
      const { fakePlayer } = await renderTool();
      const playBtn = screen.getByRole('button', { name: /play chord/i });
      await playBtn.click();

      expect(fakePlayer.playSequence).toHaveBeenCalledTimes(1);
      const midis = chordMidi(0, [0, 4, 7]);
      const expectedFreqs = midis.map(midiToFreq);
      expect(fakePlayer.playSequence).toHaveBeenCalledWith(expectedFreqs);
    });

    it('activating play schedules playChord via setTimeout after arpeggio', async () => {
      const { fakePlayer } = await renderTool();
      const playBtn = screen.getByRole('button', { name: /play chord/i });
      await playBtn.click();

      // Advance timers past the arpeggio delay (3 notes * 700ms + 150ms = 2250ms)
      vi.advanceTimersByTime(3000);

      expect(fakePlayer.playChord).toHaveBeenCalledTimes(1);
    });

    it('clicking play twice cancels the first pending block chord (no double-strike)', async () => {
      const { fakePlayer } = await renderTool();
      const playBtn = screen.getByRole('button', { name: /play chord/i });
      // Two rapid clicks before the first block strike fires.
      await playBtn.click();
      await playBtn.click();
      vi.advanceTimersByTime(3000);
      // The first pending block timer is cancelled by the second click, so the
      // block chord sounds exactly once (not twice).
      expect(fakePlayer.playChord).toHaveBeenCalledTimes(1);
    });

    it('play with F# minor sends correct frequencies', async () => {
      const { fakePlayer } = await renderTool();

      // Select F# root
      const fSharpBtn = screen.getByRole('button', { name: /Select F# root/i });
      await fSharpBtn.click();

      // Select min quality
      const minBtn = screen.getAllByText('min').find(
        (el) => el.tagName === 'BUTTON' || el.closest('button'),
      )!;
      const minBtnEl = minBtn.tagName === 'BUTTON' ? minBtn : minBtn.closest('button')!;
      await minBtnEl.click();

      const playBtn = screen.getByRole('button', { name: /play chord/i });
      await playBtn.click();

      const midis = chordMidi(6, [0, 3, 7]);
      const expectedFreqs = midis.map(midiToFreq);
      expect(fakePlayer.playSequence).toHaveBeenCalledWith(expectedFreqs);
    });
  });

  describe('back navigation', () => {
    it('activating back button calls navigate("home")', async () => {
      const { navigate } = await renderTool();
      const backBtn = screen.getByRole('button', { name: /back to home/i });
      await backBtn.click();
      expect(navigate).toHaveBeenCalledWith('home');
    });
  });
});
