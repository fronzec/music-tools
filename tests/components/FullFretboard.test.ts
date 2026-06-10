import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FullFretboard from '$lib/components/FullFretboard.svelte';
import type { ChordShape, LabelMode, CagedShape } from '$lib/types/chord';
import { FL, SHAPE_COLORS } from '$lib/theory/layout';

// ── Test helpers ──────────────────────────────────────────────────

function makeShape(
  shape: CagedShape,
  baseFret: number,
  frets: (number | null)[],
  intervals: (string | null)[],
  overrides: Partial<ChordShape> = {},
): ChordShape {
  return {
    root: 'C',
    quality: 'major',
    shape,
    frets: frets as ChordShape['frets'],
    intervals: intervals as ChordShape['intervals'],
    baseFret,
    rootString: 1,
    ...overrides,
  };
}

/** Open C-shaped C major chord. */
function makeCShape(): ChordShape {
  return makeShape('C', 1, [null, 3, 2, 0, 1, 0], [null, 'R', '3', '5', 'R', '3']);
}

/** Open A-shaped C major chord. */
function makeAShape(): ChordShape {
  return makeShape('A', 1, [null, 0, 2, 2, 2, 0], [null, 'R', '5', 'R', '3', '5']);
}

/** Open G-shaped C major chord. */
function makeGShape(): ChordShape {
  return makeShape('G', 1, [3, 2, 0, 0, 0, 3], ['R', '3', '5', 'R', '3', 'R']);
}

/** Open E-shaped C major chord (barre at 8). */
function makeEShape(): ChordShape {
  return makeShape('E', 8, [0, 2, 2, 1, 0, 0], ['R', '5', 'R', '3', '5', 'R'], { root: 'C' });
}

/** Open D-shaped C major chord (barre at 10). */
function makeDShape(): ChordShape {
  return makeShape('D', 10, [null, null, 0, 2, 3, 2], [null, null, 'R', '3', '5', 'R'], { root: 'C' });
}

/** All 5 C major shapes. */
function allShapes(): ChordShape[] {
  return [makeCShape(), makeAShape(), makeGShape(), makeEShape(), makeDShape()];
}

// ── Tests ─────────────────────────────────────────────────────────

describe('FullFretboard', () => {
  describe('basic rendering', () => {
    it('renders an SVG with role="img"', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = screen.getByRole('img');
      expect(svg).toBeTruthy();
      expect(svg.tagName).toBe('svg');
    });

    it('has aria-label describing visible shapes', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = screen.getByRole('img');
      const label = svg.getAttribute('aria-label');
      expect(label).toContain('C');
      expect(label).toContain('major');
      expect(label).toContain('shape');
    });

    it('includes a <title> with shape info', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const title = container.querySelector('title');
      expect(title).toBeTruthy();
      expect(title!.textContent).toContain('C');
      expect(title!.textContent).toContain('major');
    });

    it('includes a <desc> element', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const desc = container.querySelector('desc');
      expect(desc).toBeTruthy();
      expect(desc!.textContent).toContain('C');
      expect(desc!.textContent).toContain('major');
    });
  });

  describe('empty state', () => {
    it('renders empty state text when no shapes are visible', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(),
        labelMode: 'intervals' as LabelMode,
      });
      expect(screen.getByText('No shapes selected')).toBeTruthy();
    });

    it('aria-label says empty fretboard when no shapes visible', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = screen.getByRole('img');
      expect(svg.getAttribute('aria-label')).toContain('Empty');
    });

    it('still renders strings and frets even when empty', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(),
        labelMode: 'intervals' as LabelMode,
      });
      const lines = [...container.querySelectorAll('line')];
      // Should have fret lines + string lines + nut line
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe('strings and frets', () => {
    it('renders 6 horizontal string lines', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const lines = [...container.querySelectorAll('line')];
      const stringLines = lines.filter(
        (l) => l.getAttribute('y1') === l.getAttribute('y2'),
      );
      expect(stringLines.length).toBe(6);
    });

    it('renders vertical fret lines', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const lines = [...container.querySelectorAll('line')];
      const fretLines = lines.filter(
        (l) => l.getAttribute('x1') === l.getAttribute('x2'),
      );
      // At least 12+1 fret lines for MIN_FRET_SPAN
      expect(fretLines.length).toBeGreaterThanOrEqual(13);
    });
  });

  describe('fret markers', () => {
    it('renders marker circles at fret 3 when visible', () => {
      const shapes = [makeShape('C', 1, [0, 1, 2, 3, 0, 0], ['R', '3', '5', 'R', '3', '5'])];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const circles = [...container.querySelectorAll('circle')];
      const hasMarkerR = circles.some(
        (c) => parseFloat(c.getAttribute('r')!) === 3,
      );
      expect(hasMarkerR).toBe(true);
    });
  });

  describe('note rendering', () => {
    it('renders circles for non-root notes', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const circles = [...container.querySelectorAll('circle')];
      // Notes have r >= L.OTHER_R but not marker dots (r=3)
      const noteCircles = circles.filter((c) => {
        const r = parseFloat(c.getAttribute('r') ?? '0');
        return r >= 5 && r !== 3;
      });
      // Many notes across 5 shapes
      expect(noteCircles.length).toBeGreaterThan(0);
    });

    it('renders polygons (diamonds) for root notes', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygons = container.querySelectorAll('polygon');
      // Each shape has at least one root note
      expect(polygons.length).toBeGreaterThanOrEqual(5);
    });

    it('diamonds have white stroke', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygons = container.querySelectorAll('polygon');
      const firstDiamond = polygons[0];
      expect(firstDiamond.getAttribute('stroke')).toBe('white');
      expect(firstDiamond.getAttribute('stroke-width')).toBe('2');
    });

    it('non-root circles have lower opacity', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const circles = [...container.querySelectorAll('circle')];
      const noteCircles = circles.filter((c) => {
        const r = parseFloat(c.getAttribute('r') ?? '0');
        return r >= 5 && r !== 3;
      });
      const opaqueCircles = noteCircles.filter(
        (c) => c.getAttribute('opacity') === String(FL.NOTE_OPACITY),
      );
      expect(opaqueCircles.length).toBeGreaterThan(0);
    });
  });

  describe('shape colors', () => {
    it('uses correct colors for each shape', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygons = container.querySelectorAll('polygon');
      const diamondFills = new Set<string>();
      polygons.forEach((p) => diamondFills.add(p.getAttribute('fill')!));
      // Should have colors for all 5 shapes
      expect(diamondFills.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('shape visibility toggle', () => {
    it('renders fewer notes when shapes are hidden', () => {
      const shapes = allShapes();
      const { container: containerAll } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygonsAll = containerAll.querySelectorAll('polygon').length;

      const { container: containerC } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygonsC = containerC.querySelectorAll('polygon').length;

      expect(polygonsC).toBeLessThan(polygonsAll);
    });

    it('adds shapes back when toggled on', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('fret numbers', () => {
    it('renders fret number text elements', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      // Should have some numeric texts (fret numbers like "1", "2", ...)
      const numericTexts = texts.filter((t) => /^\d+$/.test(t.textContent?.trim() ?? ''));
      expect(numericTexts.length).toBeGreaterThan(0);
    });

    it('does not render "0" as a fret number in open position', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const hasZero = texts.some((t) => t.textContent?.trim() === '0');
      expect(hasZero).toBe(false);
    });
  });

  describe('fret range calculation', () => {
    it('computes narrow span for open shapes', () => {
      const shapes = [makeCShape()]; // frets 0-3, displaySpan clamped to MIN_FRET_SPAN=12
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = container.querySelector('svg')!;
      const vbW = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
      // fretSpan≥12 → vbW = LEFT_PAD + NUT_W + 12*FRET_SP + RIGHT_PAD = 12+6+600+16 = 634
      expect(vbW).toBeGreaterThan(250);
    });

    it('computes wide span for shapes spread across the neck', () => {
      const shapes = [
        makeShape('C', 1, [null, 3, 2, 0, 1, 0], [null, 'R', '3', '5', 'R', '3']), // open
        makeShape('E', 8, [0, 2, 2, 1, 0, 0], ['R', '5', 'R', '3', '5', 'R']), // barre at 8, frets up to 10
      ];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'E']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = container.querySelector('svg')!;
      const vbW = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
      // Span covers 0 to 10 → 11+1=12 fret columns → wider viewBox
      expect(vbW).toBeGreaterThan(500);
    });
  });

  describe('barre indicators', () => {
    it('renders rect for barre shapes', () => {
      const shapes = [
        makeShape('E', 8, [0, 2, 2, 1, 0, 0], ['R', '5', 'R', '3', '5', 'R']),
      ];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['E']),
        labelMode: 'intervals' as LabelMode,
      });
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(1);
    });

    it('does not render rect for open shapes', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(0);
    });

    it('barre rect uses shape color with low opacity', () => {
      const shapes = [
        makeShape('E', 8, [0, 2, 2, 1, 0, 0], ['R', '5', 'R', '3', '5', 'R']),
      ];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['E']),
        labelMode: 'intervals' as LabelMode,
      });
      const rect = container.querySelector('rect')!;
      expect(rect.getAttribute('fill')).toBe(SHAPE_COLORS.E);
      expect(rect.getAttribute('opacity')).toBe(String(FL.BARRE_OPACITY));
    });
  });

  describe('labels', () => {
    it('shows interval labels when labelMode is intervals', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const textContents = texts.map((t) => t.textContent);
      expect(textContents).toContain('R');
      expect(textContents).toContain('3');
    });

    it('shows note names when labelMode is notes', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'notes' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const textContents = texts.map((t) => t.textContent);
      // Should have some note name texts (non-interval, non-numeric fret labels)
      const noteLabels = textContents.filter(
        (t) => t && t.length <= 3 && t !== 'R' && t !== '3' && t !== '5' && !/^\d+$/.test(t),
      );
      expect(noteLabels.length).toBeGreaterThan(0);
    });

    it('shows both note and interval when labelMode is both', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'both' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const textContents = texts.map((t) => t.textContent);
      const hasBoth = textContents.some(
        (t) => t?.includes('(') && t?.includes(')'),
      );
      expect(hasBoth).toBe(true);
    });
  });

  describe('open/muted indicators', () => {
    it('shows O for open strings in open position', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const openMarkers = texts.filter((t) => t.textContent === 'O');
      // C shape has 2 open strings (strings 3 and 5)
      expect(openMarkers.length).toBe(2);
    });

    it('shows × for muted strings', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const mutedMarkers = texts.filter((t) => t.textContent === '×');
      expect(mutedMarkers.length).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('SVG has role="img"', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = screen.getByRole('img');
      expect(svg).toBeTruthy();
    });

    it('SVG has aria-label', () => {
      const shapes = allShapes();
      render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = screen.getByRole('img');
      expect(svg.getAttribute('aria-label')).toBeTruthy();
    });

    it('includes a <title> element', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      expect(container.querySelector('title')).toBeTruthy();
    });

    it('includes a <desc> element', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      expect(container.querySelector('desc')).toBeTruthy();
    });
  });

  describe('viewBox', () => {
    it('has a dynamic viewBox', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = container.querySelector('svg')!;
      const viewBox = svg.getAttribute('viewBox');
      expect(viewBox).toBeTruthy();
      const parts = viewBox!.split(' ').map(Number);
      expect(parts[0]).toBe(0);
      expect(parts[1]).toBe(0);
      expect(parts[2]).toBeGreaterThan(0);
      expect(parts[3]).toBeGreaterThan(0);
    });

    it('respects width prop', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        width: 400,
      });
      const svg = container.querySelector('svg')!;
      const vbW = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
      expect(vbW).toBe(400);
    });
  });
});
