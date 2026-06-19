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

  describe('stacked-thirds construction diagram', () => {
    // ---------------------------------------------------------------------------
    // Helper: find the article card for a given chord display name.
    // ---------------------------------------------------------------------------
    function findCardByChordName(container: HTMLElement, name: string): HTMLElement | null {
      const articles = container.querySelectorAll('article');
      for (const article of articles) {
        const header = article.querySelector('[data-chord-name]');
        if (header && header.textContent?.trim() === name) return article as HTMLElement;
      }
      return null;
    }

    it('Dm card shows a ♭3 degree label in the construction stack', async () => {
      const { container } = await renderTool();
      const dm = findCardByChordName(container, 'Dm');
      expect(dm).not.toBeNull();
      expect(dm!.querySelector('[data-construction-stack]')).not.toBeNull();
      expect(dm!.innerHTML).toContain('♭3');
    });

    it('Dm card ♭3 row is marked as altered (data-altered="true")', async () => {
      const { container } = await renderTool();
      const dm = findCardByChordName(container, 'Dm');
      expect(dm).not.toBeNull();
      const alteredRows = dm!.querySelectorAll('[data-altered="true"]');
      // Dm has one altered degree: ♭3
      expect(alteredRows.length).toBe(1);
      expect(alteredRows[0].textContent).toContain('♭3');
    });

    it('B° card shows both ♭3 and ♭5 degree labels in the construction stack', async () => {
      const { container } = await renderTool();
      const bdim = findCardByChordName(container, 'B°');
      expect(bdim).not.toBeNull();
      expect(bdim!.innerHTML).toContain('♭3');
      expect(bdim!.innerHTML).toContain('♭5');
    });

    it('B° card has exactly 2 altered rows (♭3 and ♭5)', async () => {
      const { container } = await renderTool();
      const bdim = findCardByChordName(container, 'B°');
      expect(bdim).not.toBeNull();
      const alteredRows = bdim!.querySelectorAll('[data-altered="true"]');
      expect(alteredRows.length).toBe(2);
    });

    it('C card (I) has NO altered rows (no flat degrees)', async () => {
      const { container } = await renderTool();
      const cMaj = findCardByChordName(container, 'C');
      expect(cMaj).not.toBeNull();
      const alteredRows = cMaj!.querySelectorAll('[data-altered="true"]');
      expect(alteredRows.length).toBe(0);
    });

    it('Dm construction stack shows notes D, F, A in stacked order (5th top, root bottom)', async () => {
      const { container } = await renderTool();
      const dm = findCardByChordName(container, 'Dm');
      expect(dm).not.toBeNull();
      const stack = dm!.querySelector('[data-construction-stack]');
      expect(stack).not.toBeNull();
      // Top row is fifth (A), middle is third (F), bottom is root (D)
      const rows = stack!.querySelectorAll('[data-stack-row]');
      expect(rows.length).toBe(3);
      expect(rows[0].textContent).toContain('A'); // fifth
      expect(rows[1].textContent).toContain('F'); // third
      expect(rows[2].textContent).toContain('D'); // root
    });

    it('altered rows use the accent-soft highlight token class', async () => {
      const { container } = await renderTool();
      const dm = findCardByChordName(container, 'Dm');
      expect(dm).not.toBeNull();
      const alteredRows = dm!.querySelectorAll('[data-altered="true"]');
      expect(alteredRows.length).toBeGreaterThan(0);
      // Each altered row must carry the accent-soft text token
      alteredRows.forEach((row) => {
        expect(row.className).toMatch(/text-accent/);
      });
    });
  });

  describe('grid layout', () => {
    it('chord grid does not use xl:grid-cols-3 class (max 2 columns)', async () => {
      const { container } = await renderTool();
      // The grid wrapper must not contain the 3-column breakpoint class
      expect(container.innerHTML).not.toContain('xl:grid-cols-3');
    });

    it('chord grid contains lg:grid-cols-2 class for 2-column max layout', async () => {
      const { container } = await renderTool();
      expect(container.innerHTML).toContain('lg:grid-cols-2');
    });
  });
});
