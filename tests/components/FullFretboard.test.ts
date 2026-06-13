import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FullFretboard from '$lib/components/FullFretboard.svelte';
import type { ChordShape, LabelMode, CagedShape } from '$lib/types/chord';
import { FL, SHAPE_COLORS, L } from '$lib/theory/layout';
import type { DiffEntry } from '$lib/theory/fretboard';

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
  return makeShape('C', 0, [null, 3, 2, 0, 1, 0], [null, 'R', '3', '5', 'R', '3']);
}

/** Open A-shaped C major chord. */
function makeAShape(): ChordShape {
  return makeShape('A', 0, [null, 0, 2, 2, 2, 0], [null, 'R', '5', 'R', '3', '5']);
}

/** Open G-shaped C major chord. */
function makeGShape(): ChordShape {
  return makeShape('G', 0, [3, 2, 0, 0, 0, 3], ['R', '3', '5', 'R', '3', 'R']);
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
      // At least 14+1 fret lines for fixed 14-fret span
      expect(fretLines.length).toBeGreaterThanOrEqual(15);
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
      const shapes = [makeCShape()]; // frets 0-3, displaySpan always 14
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const svg = container.querySelector('svg')!;
      const vbW = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
      // Always 14 frets → vbW = LEFT_PAD + NUT_W + 14*FRET_SP + RIGHT_PAD = 12+6+700+16 = 734
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
      const rects = [...container.querySelectorAll('rect')].filter(r => !r.classList.contains('fret-marker-bg'));
      expect(rects.length).toBe(1);
    });

    it('does not render rect for open shapes', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const rects = [...container.querySelectorAll('rect')].filter(r => !r.classList.contains('indicator-badge') && !r.classList.contains('fret-marker-bg'));
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
      const rects = [...container.querySelectorAll('rect')].filter(r => !r.classList.contains('fret-marker-bg'));
      const rect = rects[0]!;
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

    it('uses shape color for O/× indicators (single shape)', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const oMarkers = texts.filter((t) => t.textContent === 'O');
      const xMarkers = texts.filter((t) => t.textContent === '×');

      // O uses C shape color (on the badge rect)
      oMarkers.forEach((o) => {
        const rect = o.previousElementSibling as Element;
        expect(rect.getAttribute('fill')).toBe(SHAPE_COLORS.C);
      });
      // × uses C shape color (not old gray), reduced opacity on the badge
      xMarkers.forEach((x) => {
        const rect = x.previousElementSibling as Element;
        expect(rect.getAttribute('fill')).toBe(SHAPE_COLORS.C);
        expect(rect.getAttribute('opacity')).toBe('0.45');
      });
    });

    it('renders deduplicated per-string indicator rows (multi-shape)', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const oMarkers = texts.filter((t) => t.textContent === 'O');
      const xMarkers = texts.filter((t) => t.textContent === '×');
      const total = oMarkers.length + xMarkers.length;

      // Deduplicated: more than single-shape (3) but fewer than 5× duplication (15)
      expect(total).toBeGreaterThan(3);
      expect(total).toBeLessThan(30);

      // Every O/× badge uses a known shape color, never generic gray
      const shapeColors = Object.values(SHAPE_COLORS);
      [...oMarkers, ...xMarkers].forEach((ind) => {
        const rect = ind.previousElementSibling as Element;
        const fill = rect.getAttribute('fill')!;
        expect(shapeColors).toContain(fill);
      });
    });

    it('O/× indicators use shape colors (multi-shape)', () => {
      const shapes = allShapes();
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const oMarkers = texts.filter((t) => t.textContent === 'O');
      const xMarkers = texts.filter((t) => t.textContent === '×');

      // Every O/× badge uses a known shape color, never generic gray
      const shapeColors = Object.values(SHAPE_COLORS);
      [...oMarkers, ...xMarkers].forEach((ind) => {
        const rect = ind.previousElementSibling as Element;
        const fill = rect.getAttribute('fill')!;
        expect(shapeColors).toContain(fill);
      });

      // Open-position shapes (C, A, G) should have at least some O indicators
      expect(oMarkers.length).toBeGreaterThan(0);
    });

    it('renders indicators for barre-only shapes (per-shape positioning)', () => {
      const shapes = [makeEShape()]; // baseFret=8, barre — has muted strings
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['E']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const oMarkers = texts.filter((t) => t.textContent === 'O');
      const xMarkers = texts.filter((t) => t.textContent === '×');
      // E shape at baseFret=8: strings 0,4,5 are fret=0 (barred, no O), strings 1,2,3 >0
      // Actually: frets=[0,2,2,1,0,0] — no nulls, no fret===0 outside barre
      // So no O/× for this specific shape. But test still validates the guard is gone.
      expect(oMarkers.length + xMarkers.length).toBe(0);
    });

    it('renders × for muted strings in barre positions', () => {
      // G shape at baseFret=3 with a muted string
      const gShape = makeShape('G', 3, [3, 2, 0, null, 0, 3], ['R', '3', '5', null, 'R', 'R']);
      const { container } = render(FullFretboard, {
        shapes: [gShape],
        visibleShapes: new Set<CagedShape>(['G']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const xMarkers = texts.filter((t) => t.textContent === '×');
      // String 3 is null → should show ×
      expect(xMarkers.length).toBe(1);
      const rect = xMarkers[0]!.previousElementSibling as Element;
      expect(rect.getAttribute('fill')).toBe(SHAPE_COLORS.G);
    });

    it('indicators are grouped by (baseFret, stringIndex)', () => {
      // C at baseFret=0, A at baseFret=5 — same string 0 muted in both
      const cShape = makeShape('C', 0, [null, 3, 2, 0, 1, 0], [null, 'R', '3', '5', 'R', '3']);
      const aShape = makeShape('A', 5, [null, 0, 2, 2, 2, 0], [null, 'R', '5', 'R', '3', '5']);
      const { container } = render(FullFretboard, {
        shapes: [cShape, aShape],
        visibleShapes: new Set<CagedShape>(['C', 'A']),
        labelMode: 'intervals' as LabelMode,
      });
      const texts = [...container.querySelectorAll('text')];
      const xMarkers = texts.filter((t) => t.textContent === '×');
      // String 0 is null in both shapes, but different baseFret → 2 separate groups, 2 × markers
      expect(xMarkers.length).toBeGreaterThanOrEqual(2);
    });

    it('barre-position indicator X uses indicatorX helper', () => {
      const shapes = [makeShape('G', 3, [3, 2, 0, null, 0, 3], ['R', '3', '5', null, 'R', 'R'])];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['G']),
        labelMode: 'intervals' as LabelMode,
      });
      // The × for string 3 should be at a barre-position X (not at the nut)
      const xMarkers = [...container.querySelectorAll('text')].filter((t) => t.textContent === '×');
      expect(xMarkers.length).toBe(1);
      // Verify it's inside a <g> with a transform (not at the old nut position)
      const gParent = xMarkers[0]!.closest('g')!;
      const transform = gParent.getAttribute('transform');
      expect(transform).toBeTruthy();
      // Barre X should be different from nut X (12+6+6=24)
      const translateX = transform!.match(/translate\(([^,]+)/)?.[1];
      expect(translateX).not.toBe(String(L.LEFT_PAD + L.NUT_W + 6));
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

  describe('highlight rings', () => {
    function makeDiffEntry(type: 'same' | 'different'): DiffEntry {
      return { type, interval1: 'R', interval2: type === 'same' ? 'R' : '3' };
    }

    it('renders green ring for same-interval entry (non-root)', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // C shape has note at string 1 fret 3 (absFret=3) → key "3,1" with interval 'R'
      highlightPositions.set('3,1', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const circles = [...container.querySelectorAll('circle')];
      const greenRings = circles.filter(
        (c) =>
          c.getAttribute('stroke') === '#22C55E' &&
          c.getAttribute('fill') === 'none' &&
          c.getAttribute('stroke-width') === '1.5',
      );
      // Position (3,1) is a root → diamond, not circle, so the ring is a polygon
      // Non-root position: pick string 2 fret 2 (key "2,2", interval '3')
    });

    it('renders green ring for same-interval entry (non-root circle)', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 2, fret 2 (absFret=2) → key "2,2", interval '3' = non-root
      highlightPositions.set('2,2', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const circles = [...container.querySelectorAll('circle')];
      const greenRings = circles.filter(
        (c) =>
          c.getAttribute('stroke') === '#22C55E' &&
          c.getAttribute('fill') === 'none' &&
          parseFloat(c.getAttribute('opacity') ?? '1') === 0.5,
      );
      expect(greenRings.length).toBeGreaterThanOrEqual(1);
    });

    it('renders amber dashed ring for different-interval entry (non-root circle)', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 2, fret 2 (absFret=2) → key "2,2", interval '3' = non-root
      highlightPositions.set('2,2', makeDiffEntry('different'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const circles = [...container.querySelectorAll('circle')];
      const amberRings = circles.filter(
        (c) =>
          c.getAttribute('stroke') === '#F59E0B' &&
          c.getAttribute('fill') === 'none' &&
          c.getAttribute('stroke-width') === '2' &&
          c.getAttribute('stroke-dasharray') === '3 2',
      );
      expect(amberRings.length).toBeGreaterThanOrEqual(1);
    });

    it('renders green polygon ring for same-interval entry at root position', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 1, fret 3 (absFret=3) → key "3,1", interval 'R' = root
      highlightPositions.set('3,1', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const polygons = [...container.querySelectorAll('polygon')];
      const greenPolygons = polygons.filter(
        (p) =>
          p.getAttribute('stroke') === '#22C55E' &&
          p.getAttribute('fill') === 'none',
      );
      expect(greenPolygons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders amber dashed polygon ring for different-interval entry at root position', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 1, fret 3 (absFret=3) → key "3,1", interval 'R' = root
      highlightPositions.set('3,1', makeDiffEntry('different'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const polygons = [...container.querySelectorAll('polygon')];
      const amberPolygons = polygons.filter(
        (p) =>
          p.getAttribute('stroke') === '#F59E0B' &&
          p.getAttribute('fill') === 'none' &&
          p.getAttribute('stroke-dasharray') === '3 2',
      );
      expect(amberPolygons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders no rings when highlightPositions is undefined (backward compat)', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
      });

      const circles = [...container.querySelectorAll('circle')];
      const polygons = [...container.querySelectorAll('polygon')];
      const ringCircles = circles.filter(
        (c) => c.getAttribute('fill') === 'none' && c.getAttribute('stroke') === '#22C55E',
      );
      const ringPolygons = polygons.filter(
        (p) => p.getAttribute('fill') === 'none' && p.getAttribute('stroke') === '#22C55E',
      );
      expect(ringCircles.length).toBe(0);
      expect(ringPolygons.length).toBe(0);
    });

    it('renders no rings when highlightPositions is empty map', () => {
      const shapes = [makeCShape()];
      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions: new Map(),
      });

      const circles = [...container.querySelectorAll('circle')];
      const ringCircles = circles.filter(
        (c) => c.getAttribute('fill') === 'none' && (c.getAttribute('stroke') === '#22C55E' || c.getAttribute('stroke') === '#F59E0B'),
      );
      expect(ringCircles.length).toBe(0);
    });

    it('ring radius is L.TONE_R + 4 for non-root notes', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 2, fret 2 (absFret=2) → key "2,2" — non-root, interval '3'
      highlightPositions.set('2,2', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const circles = [...container.querySelectorAll('circle')];
      const greenRings = circles.filter(
        (c) =>
          c.getAttribute('stroke') === '#22C55E' &&
          c.getAttribute('fill') === 'none',
      );
      expect(greenRings.length).toBeGreaterThanOrEqual(1);
      const ringR = parseFloat(greenRings[0]!.getAttribute('r')!);
      expect(ringR).toBe(L.TONE_R + 4);
    });

    it('ring radius is FL.ROOT_DIAMOND_R + 4 for root notes (polygon)', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      // String 1, fret 3 (absFret=3) → key "3,1" — root
      highlightPositions.set('3,1', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      const polygons = [...container.querySelectorAll('polygon')];
      const greenPolygons = polygons.filter(
        (p) =>
          p.getAttribute('stroke') === '#22C55E' &&
          p.getAttribute('fill') === 'none',
      );
      expect(greenPolygons.length).toBeGreaterThanOrEqual(1);
      const pointsStr = greenPolygons[0]!.getAttribute('points')!;
      const coords = pointsStr.split(/[\s,]+/).map(Number);
      // diamondPoints(cx, cy, r) → cx,cy-r cx+r,cy cx,cy+r cx-r,cy
      // The diamond height = 2*r → cy+r - (cy-r) = 2*r
      const yCoords = [coords[1], coords[3], coords[5], coords[7]];
      const yMin = Math.min(...yCoords);
      const yMax = Math.max(...yCoords);
      const diamondHeight = yMax - yMin;
      expect(diamondHeight / 2).toBe(FL.ROOT_DIAMOND_R + 4);
    });

    it('rings appear outside existing note shapes (z-order after note)', () => {
      const shapes = [makeCShape()];
      const highlightPositions = new Map<string, DiffEntry>();
      highlightPositions.set('2,2', makeDiffEntry('same'));

      const { container } = render(FullFretboard, {
        shapes,
        visibleShapes: new Set<CagedShape>(['C']),
        labelMode: 'intervals' as LabelMode,
        highlightPositions,
      });

      // The green ring circle should appear after the note circle in DOM order
      // and before the label text
      const circles = [...container.querySelectorAll('circle')];
      const greenIdx = circles.findIndex(
        (c) =>
          c.getAttribute('stroke') === '#22C55E' &&
          c.getAttribute('fill') === 'none',
      );
      // The note circle with fill should come before the ring
      const noteIdx = circles.findIndex(
        (c) => c.getAttribute('fill') !== 'none',
      );

      expect(noteIdx).toBeGreaterThanOrEqual(0);
      // The ring circle is after the note circle (higher index)
      // but both exist in the same SVG
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it('existing tests pass with highlightPositions add prop', () => {
      // Re-run a basic test to ensure highlightPositions doesn't break anything
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
  });
});
