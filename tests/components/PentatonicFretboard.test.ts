import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PentatonicFretboard from '$lib/components/PentatonicFretboard.svelte';
import { getPentatonicBoxes } from '$lib/theory/pentatonic';
import { BOX_ORDER } from '$lib/types/scale';
import type { BoxName, PentatonicBox } from '$lib/types/scale';

function makeBoxes(root: import('$lib/types/chord').NoteName = 'A', quality: import('$lib/types/scale').ScaleQuality = 'minor'): PentatonicBox[] {
  return getPentatonicBoxes(root, quality);
}

describe('PentatonicFretboard', () => {
  it('renders an SVG element', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(BOX_ORDER),
    });
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('SVG has role="img"', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(BOX_ORDER),
    });
    expect(container.querySelector('svg[role="img"]')).toBeTruthy();
  });

  it('aria-label describes the scale', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes('E', 'major'),
      visibleBoxes: new Set<BoxName>(BOX_ORDER),
      root: 'E',
      quality: 'major',
    });
    const label = container.querySelector('svg[role="img"]')!.getAttribute('aria-label');
    expect(label).toContain('E');
    expect(label).toContain('major');
  });

  it('shows empty state when no boxes visible', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(),
    });
    const label = container.querySelector('svg[role="img"]')!.getAttribute('aria-label');
    expect(label).toContain('no boxes');
  });

  it('renders note circles/diamonds in SVG', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(BOX_ORDER),
    });
    const circles = container.querySelectorAll('circle');
    const polygons = container.querySelectorAll('polygon');
    expect(circles.length + polygons.length).toBeGreaterThan(0);
  });

  it('renders one connector band per string for a visible box', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(['1']),
    });
    // A box has two notes on each of the 6 strings → 6 connector bands.
    expect(container.querySelectorAll('line.penta-band')).toHaveLength(6);
  });

  it('renders fewer notes when fewer boxes are visible', () => {
    const boxes = makeBoxes();
    const allVisible = new Set<BoxName>(BOX_ORDER);
    const oneVisible = new Set<BoxName>(['1']);

    const { container: allContainer } = render(PentatonicFretboard, {
      boxes,
      visibleBoxes: allVisible,
    });
    const { container: oneContainer } = render(PentatonicFretboard, {
      boxes,
      visibleBoxes: oneVisible,
    });

    const allShapes = allContainer.querySelectorAll('circle, polygon').length;
    const oneShapes = oneContainer.querySelectorAll('circle, polygon').length;
    expect(allShapes).toBeGreaterThan(oneShapes);
  });

  it('does not render notes for hidden boxes', () => {
    const { container } = render(PentatonicFretboard, {
      boxes: makeBoxes(),
      visibleBoxes: new Set<BoxName>(),
    });
    // fret marker circles and polygon dots from the background should still exist,
    // but note groups should be empty — check aria-label describes empty state
    const label = container.querySelector('svg[role="img"]')!.getAttribute('aria-label');
    expect(label).toMatch(/no boxes|empty/i);
  });
});
