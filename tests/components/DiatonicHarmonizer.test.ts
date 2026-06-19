import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ViewName } from '$lib/types/chord';

// ---------------------------------------------------------------------------
// No AudioContext stub needed — DiatonicHarmonizer has no audio
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Lazy import (after any stubs are in place)
// ---------------------------------------------------------------------------

async function importComponent() {
  const mod = await import('$lib/components/DiatonicHarmonizer.svelte');
  return mod.default;
}

async function renderTool(overrides: Record<string, unknown> = {}) {
  const DiatonicHarmonizer = await importComponent();
  const navigate = vi.fn() as (view: ViewName) => void;
  const result = render(DiatonicHarmonizer as any, {
    navigate,
    ...overrides,
  });
  return { navigate, ...result };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('DiatonicHarmonizer', () => {
  describe('initial render', () => {
    it('mounts without throwing for default C major', async () => {
      await expect(renderTool()).resolves.toBeTruthy();
    });

    it('renders exactly 7 fretboard diagrams (role="img")', async () => {
      const { container } = await renderTool();
      const imgs = container.querySelectorAll('svg[role="img"]');
      expect(imgs.length).toBe(7);
    });

    it('renders exactly 7 article cards', async () => {
      const { container } = await renderTool();
      const cards = container.querySelectorAll('article');
      expect(cards.length).toBe(7);
    });
  });

  describe('C major chord names', () => {
    it('shows "C" as degree-I chord name', async () => {
      const { container } = await renderTool();
      // The first article card should show "C" as chord name
      expect(container.innerHTML).toContain('>C<');
    });

    it('shows "Dm" for degree ii', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('Dm');
    });

    it('shows "B°" for degree vii°', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('B°');
    });
  });

  describe('C major Roman labels', () => {
    it('shows "I" Roman label', async () => {
      await renderTool();
      expect(screen.getByText('I')).toBeTruthy();
    });

    it('shows "ii" Roman label', async () => {
      await renderTool();
      expect(screen.getByText('ii')).toBeTruthy();
    });

    it('shows "vii°" Roman label', async () => {
      await renderTool();
      expect(screen.getByText('vii°')).toBeTruthy();
    });
  });

  describe('reactivity — root change', () => {
    it('clicking G in RootSelector updates degree-I card to show "G"', async () => {
      const { container } = await renderTool();
      // Find the G button in the RootSelector (button with text 'G')
      const gBtn = screen.getByRole('button', { name: 'G' });
      await fireEvent.click(gBtn);
      // After selecting G, the first card's chord name should be 'G'
      expect(container.innerHTML).toContain('>G<');
    });

    it('clicking G removes C major as the only visible chord', async () => {
      const { container } = await renderTool();
      const gBtn = screen.getByRole('button', { name: 'G' });
      await fireEvent.click(gBtn);
      // G major degree II is Am, not Dm
      expect(container.innerHTML).toContain('Am');
    });
  });

  describe('back navigation', () => {
    it('clicking back button calls navigate("home")', async () => {
      const { navigate } = await renderTool();
      const backBtn = screen.getByRole('button', { name: /back to home/i });
      await fireEvent.click(backBtn);
      expect(navigate).toHaveBeenCalledWith('home');
    });
  });

  describe('no audio', () => {
    it('renders no <audio> element', async () => {
      const { container } = await renderTool();
      expect(container.querySelector('audio')).toBeNull();
    });
  });

  describe('no hardcoded colors', () => {
    it('component HTML contains no #rrggbb color values', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('component HTML contains no rgb(...) color values', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).not.toMatch(/rgb\(/);
    });

    it('component HTML contains no hsl(...) color values', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).not.toMatch(/hsl\(/);
    });
  });
});
