import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { getOpenVoicing } from '$lib/theory/openVoicings';
import type { OpenVoicing } from '$lib/theory/openVoicings';

// ---------------------------------------------------------------------------
// Module mock — follow house style (mirror ChordFretboard.test.ts)
// ---------------------------------------------------------------------------
vi.mock('$lib/audio/playNote', () => ({
  createNotePlayer: vi.fn(() => ({
    playSequence: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Lazy import so mock hoisting resolves first
async function importComponent() {
  const mod = await import('$lib/components/ChordShapeDiagram.svelte');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Test fixtures
// C major I: frets [null,3,2,0,1,0], rootPc=0, baseFret=1
//   played strings (non-null): 1,2,3,4,5 → 5 played
//   open strings (===0): str3(G→pc7=G=fifth), str5(e→pc4=E=third) → 2 open
//   muted strings (===null): str0 → 1 muted
//   fretted (>0): str1(pc0=C=root), str2(pc4=E=third), str4(pc0=C=root) → 3 fretted
// ---------------------------------------------------------------------------

const cMajorVoicing = getOpenVoicing('C', 1); // rootPc=0, baseFret=1

// Inline barre voicing for barre tests
const barreVoicing: OpenVoicing = {
  roman: 'V',
  name: 'A major',
  quality: 'maj',
  rootPc: 9,
  baseFret: 2,
  frets: [null, 2, 2, 2, 2, null],
  fingers: [null, 1, 1, 1, 1, null],
  barre: { fret: 2, fromString: 1, toString: 4 },
};

// Inline voicing with baseFret === 5 for fret label test
const highFretVoicing: OpenVoicing = {
  roman: 'I',
  name: 'A major',
  quality: 'maj',
  rootPc: 9,
  baseFret: 5,
  frets: [null, 5, 6, 6, 5, null],
  fingers: [null, 1, 3, 4, 2, null],
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChordShapeDiagram', () => {
  it('renders without throwing', async () => {
    const ChordShapeDiagram = await importComponent();
    const result = render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    expect(result).toBeTruthy();
  });

  it('renders role="img"', async () => {
    const ChordShapeDiagram = await importComponent();
    render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
  });

  it('aria-label is non-empty and contains the chord name when chordName is passed', async () => {
    const ChordShapeDiagram = await importComponent();
    render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
      chordName: 'C major',
    });
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
    expect(label).toContain('C major');
  });

  it('[data-role] count equals played-string count (5 for C major I)', async () => {
    const ChordShapeDiagram = await importComponent();
    const { container } = render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    // C major I: played = str1,2,3,4,5 → 5 strings
    const playedCount = cMajorVoicing.frets.filter((f) => f !== null).length;
    const roleEls = container.querySelectorAll('[data-role]');
    expect(roleEls.length).toBe(playedCount);
  });

  it('data-base-fret present and equals voicing.baseFret', async () => {
    const ChordShapeDiagram = await importComponent();
    const { container } = render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    const el = container.querySelector('[data-base-fret]');
    expect(el).not.toBeNull();
    expect(el!.getAttribute('data-base-fret')).toBe(String(cMajorVoicing.baseFret));
  });

  it('data-open count equals open-string count (2 for C major I)', async () => {
    const ChordShapeDiagram = await importComponent();
    const { container } = render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    const openCount = cMajorVoicing.frets.filter((f) => f === 0).length;
    const openEls = container.querySelectorAll('[data-open]');
    expect(openEls.length).toBe(openCount);
  });

  it('data-muted count equals muted-string count (1 for C major I)', async () => {
    const ChordShapeDiagram = await importComponent();
    const { container } = render(ChordShapeDiagram as any, {
      voicing: cMajorVoicing,
      rootPc: 0,
    });
    const mutedCount = cMajorVoicing.frets.filter((f) => f === null).length;
    const mutedEls = container.querySelectorAll('[data-muted]');
    expect(mutedEls.length).toBe(mutedCount);
  });

  describe('open-string data-role and name-column', () => {
    // For C major I (frets: [null,3,2,0,1,0]):
    // Open strings: str3 (G, pc=7), str5 (e, pc=4)
    // str3: pc=7, rootPc=0, semis=7 → role='fifth' → class='fill-note-tone'
    // str5: pc=4, rootPc=0, semis=4 → role='third' → class='fill-note-third' (but spec says 'fill-note-third')
    // The tasks spec comment says "String 3 (D string, frets[3]=0): pc = (7+0)%12 = 7, role = 'fifth'"
    // Note: string index 3 in STANDARD_TUNING is G (7), so pc = (7+0)%12 = 7 → role = fifth → fill-note-tone

    it('[data-open] elements also have data-role attribute', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const openEls = container.querySelectorAll('[data-open]');
      openEls.forEach((el) => {
        expect(el.hasAttribute('data-role')).toBe(true);
      });
    });

    it('name-column group (data-name-col) exists', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const nameColGroup = container.querySelector('[data-name-col]');
      expect(nameColGroup).not.toBeNull();
    });

    it('name-column contains an element with fill-note-tone class (open G string, role=fifth)', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      // str3 (G string, frets[3]=0): pc = (7+0)%12 = 7, role = 'fifth' → fill-note-tone
      const nameColGroup = container.querySelector('[data-name-col]');
      expect(nameColGroup).not.toBeNull();
      const noteWithFifthClass = nameColGroup!.querySelector('.fill-note-tone');
      expect(noteWithFifthClass, 'open G string note name should have fill-note-tone class').not.toBeNull();
    });
  });

  describe('nut and baseFret indicator', () => {
    it('thick nut element present when baseFret === 1 (data-base-fret="1" exists)', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const nutEl = container.querySelector('[data-base-fret="1"]');
      expect(nutEl).not.toBeNull();
      // Must have a stroke-width >= 3 to visually indicate a thick nut
      const sw = nutEl!.getAttribute('stroke-width');
      expect(sw).not.toBeNull();
      expect(Number(sw)).toBeGreaterThanOrEqual(3);
    });

    it('no barre element for open-position voicing (C major I)', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      expect(container.querySelector('[data-barre]')).toBeNull();
    });

    it('barre element present for barre voicing', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: barreVoicing,
        rootPc: 9,
      });
      expect(container.querySelector('[data-barre]')).not.toBeNull();
    });

    it('fret label "5fr" present when baseFret === 5', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: highFretVoicing,
        rootPc: 9,
      });
      const html = container.innerHTML;
      expect(html).toContain('5fr');
      const baseFretEl = container.querySelector('[data-base-fret="5"]');
      expect(baseFretEl).not.toBeNull();
    });
  });

  describe('token-only colors (no hardcoded values)', () => {
    it('no hex colors in rendered HTML', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const html = container.innerHTML;
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
      expect(html).not.toContain('rgb(');
      expect(html).not.toContain('hsl(');
      expect(html).not.toContain('fill="white"');
    });
  });

  describe('note-name column', () => {
    it('note-name column contains "C" (the root on string 1, fret 3)', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      // str1(A=9+3=0=C): root → name column should show 'C'
      const nameCol = container.querySelector('[data-name-col]');
      expect(nameCol).not.toBeNull();
      expect(nameCol!.textContent).toContain('C');
    });
  });

  describe('Tailwind purge-safety — full literal token strings in HTML', () => {
    it('fill-note-root class appears as a complete literal token', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const html = container.innerHTML;
      expect(html).toMatch(/fill-note-root/);
    });

    it('fill-note-third or fill-note-tone class appears as a complete literal token', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const html = container.innerHTML;
      expect(html).toMatch(/fill-note-third|fill-note-tone/);
    });

    it('no partial interpolation fragment "fill-note-" without a role suffix in any class', async () => {
      const ChordShapeDiagram = await importComponent();
      const { container } = render(ChordShapeDiagram as any, {
        voicing: cMajorVoicing,
        rootPc: 0,
      });
      const html = container.innerHTML;
      // Negative: no class attribute contains an interpolation fragment like 'fill-note-' alone
      expect(html).not.toMatch(/class="[^"]*fill-note-[^a-z][^"]*"/);
    });
  });
});
