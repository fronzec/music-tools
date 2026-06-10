import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { SvelteSet } from 'svelte/reactivity';
import DualFretboard from '$lib/components/DualFretboard.svelte';
import type { NoteName, CagedShape } from '$lib/types/chord';

function allShapes(): SvelteSet<CagedShape> {
  return new SvelteSet<CagedShape>(['C', 'A', 'G', 'E', 'D']);
}

function emptyShapes(): SvelteSet<CagedShape> {
  return new SvelteSet<CagedShape>();
}

interface DefaultProps {
  root1: NoteName;
  root2: NoteName;
  quality: 'major' | 'minor';
  labelMode: 'intervals' | 'notes' | 'both';
  visibleShapes1: SvelteSet<CagedShape>;
  visibleShapes2: SvelteSet<CagedShape>;
  onRoot1Change: (root: NoteName) => void;
  onRoot2Change: (root: NoteName) => void;
  width?: number;
}

function renderDefault(overrides: Partial<DefaultProps> = {}) {
  const props: DefaultProps = {
    root1: 'C',
    root2: 'G',
    quality: 'major',
    labelMode: 'intervals',
    visibleShapes1: allShapes(),
    visibleShapes2: allShapes(),
    onRoot1Change: vi.fn(),
    onRoot2Change: vi.fn(),
    ...overrides,
  };
  return render(DualFretboard, props);
}

/** Find a shape toggle button by shape name and fretboard position. */
function getShapeToggle(shape: string, position: 'top' | 'bottom'): HTMLElement {
  return screen.getByRole('button', { name: `Toggle ${shape} shape on ${position} fretboard` });
}

/** Find a root selector button by note name and position. */
function getRootBtn(note: string, position: 'top' | 'bottom'): HTMLElement {
  return screen.getByRole('button', { name: `Select ${note} as ${position} root` });
}

describe('DualFretboard', () => {
  describe('basic rendering', () => {
    it('renders two FullFretboard SVGs', () => {
      const { container } = renderDefault();
      const svgs = container.querySelectorAll('svg[role="img"]');
      expect(svgs.length).toBe(2);
    });

    it('renders two section wrappers with distinct aria-labels', () => {
      const { container } = renderDefault();
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(2);
      const sectionLabels = [...sections].map((s) => s.getAttribute('aria-label'));
      expect(sectionLabels.some((l) => l?.includes('top fretboard'))).toBe(true);
      expect(sectionLabels.some((l) => l?.includes('bottom fretboard'))).toBe(true);
    });

    it('renders root labels with "{root} {quality}" text', () => {
      const { container } = renderDefault();
      const sections = container.querySelectorAll('section');
      const topLabel = sections[0]?.querySelector('div');
      const bottomLabel = sections[1]?.querySelector('div');
      expect(topLabel?.textContent).toBe('C major');
      expect(bottomLabel?.textContent).toBe('G major');
    });

    it('renders both root selectors with "From:" and "To:" labels', () => {
      renderDefault();
      expect(screen.getByText('From:')).toBeTruthy();
      expect(screen.getByText('To:')).toBeTruthy();
    });

    it('renders 12 chromatic buttons in each root selector', () => {
      renderDefault();
      const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      for (const note of chromatic) {
        expect(getRootBtn(note, 'top')).toBeTruthy();
        expect(getRootBtn(note, 'bottom')).toBeTruthy();
      }
    });
  });

  describe('shape toggle bars', () => {
    it('renders 5 pill buttons per fretboard', () => {
      renderDefault();
      const shapes = ['C', 'A', 'G', 'E', 'D'];
      for (const shape of shapes) {
        expect(getShapeToggle(shape, 'top')).toBeTruthy();
        expect(getShapeToggle(shape, 'bottom')).toBeTruthy();
      }
    });

    it('all shape buttons have aria-pressed="true" by default', () => {
      renderDefault();
      const shapes = ['C', 'A', 'G', 'E', 'D'];
      for (const shape of shapes) {
        expect(getShapeToggle(shape, 'top').getAttribute('aria-pressed')).toBe('true');
        expect(getShapeToggle(shape, 'bottom').getAttribute('aria-pressed')).toBe('true');
      }
    });

    it('reflects current visibleShapes state', () => {
      const vs1 = allShapes();
      vs1.delete('C');
      vs1.delete('A');
      renderDefault({ visibleShapes1: vs1 });

      expect(getShapeToggle('C', 'top').getAttribute('aria-pressed')).toBe('false');
      expect(getShapeToggle('A', 'top').getAttribute('aria-pressed')).toBe('false');
      expect(getShapeToggle('G', 'top').getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('independent shape toggles', () => {
    it('toggling a shape on top fretboard does NOT affect bottom fretboard', async () => {
      const vs1 = allShapes();
      const vs2 = allShapes();
      renderDefault({ visibleShapes1: vs1, visibleShapes2: vs2 });

      const topC = getShapeToggle('C', 'top');
      const bottomC = getShapeToggle('C', 'bottom');

      await topC.click();

      expect(topC.getAttribute('aria-pressed')).toBe('false');
      expect(bottomC.getAttribute('aria-pressed')).toBe('true');
    });

    it('toggling a shape on bottom fretboard does NOT affect top fretboard', async () => {
      const vs1 = allShapes();
      const vs2 = allShapes();
      renderDefault({ visibleShapes1: vs1, visibleShapes2: vs2 });

      const topA = getShapeToggle('A', 'top');
      const bottomA = getShapeToggle('A', 'bottom');

      await bottomA.click();

      expect(bottomA.getAttribute('aria-pressed')).toBe('false');
      expect(topA.getAttribute('aria-pressed')).toBe('true');
    });

    it('toggling a shape toggles it back on', async () => {
      const vs1 = allShapes();
      renderDefault({ visibleShapes1: vs1 });

      const topC = getShapeToggle('C', 'top');

      await topC.click();
      expect(topC.getAttribute('aria-pressed')).toBe('false');

      await topC.click();
      expect(topC.getAttribute('aria-pressed')).toBe('true');
    });

    it('mutates the Set directly when toggling off', async () => {
      const vs1 = allShapes();
      renderDefault({ visibleShapes1: vs1 });

      const topC = getShapeToggle('C', 'top');
      await topC.click();

      expect(vs1.has('C')).toBe(false);
      expect(vs1.has('A')).toBe(true);
    });
  });

  describe('empty state', () => {
    it('shows empty fretboard when no visible shapes on one side', () => {
      const vs1 = emptyShapes();
      renderDefault({ visibleShapes1: vs1 });

      const topC = getShapeToggle('C', 'top');
      expect(topC.getAttribute('aria-pressed')).toBe('false');

      const svgs = document.querySelectorAll('svg[role="img"]');
      const topSvg = svgs[0];
      expect(topSvg.getAttribute('aria-label')).toContain('Empty');
    });

    it('shows empty state on both fretboards when both empty', () => {
      const vs1 = emptyShapes();
      const vs2 = emptyShapes();
      renderDefault({ visibleShapes1: vs1, visibleShapes2: vs2 });

      const svgs = document.querySelectorAll('svg[role="img"]');
      expect(svgs[0].getAttribute('aria-label')).toContain('Empty');
      expect(svgs[1].getAttribute('aria-label')).toContain('Empty');
    });

    it('all toggle pills show as inactive when empty', () => {
      const vs1 = emptyShapes();
      renderDefault({ visibleShapes1: vs1 });

      const shapes = ['C', 'A', 'G', 'E', 'D'];
      for (const shape of shapes) {
        expect(getShapeToggle(shape, 'top').getAttribute('aria-pressed')).toBe('false');
      }
    });

    it('toggling all shapes off bottom leaves top unchanged', async () => {
      const vs1 = allShapes();
      const vs2 = allShapes();
      renderDefault({ visibleShapes1: vs1, visibleShapes2: vs2 });

      // Toggle off all shapes on bottom
      for (const shape of ['C', 'A', 'G', 'E', 'D']) {
        await getShapeToggle(shape, 'bottom').click();
      }

      // Bottom SVG should be empty
      const svgs = document.querySelectorAll('svg[role="img"]');
      expect(svgs[1].getAttribute('aria-label')).toContain('Empty');

      // Top should still have shapes
      expect(svgs[0].getAttribute('aria-label')).not.toContain('Empty');
      expect(getShapeToggle('C', 'top').getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('independent root selectors', () => {
    it('changing root1 via selector calls onRoot1Change', async () => {
      const onRoot1Change = vi.fn();
      renderDefault({ onRoot1Change });

      const dBtn = getRootBtn('D', 'top');
      await dBtn.click();

      expect(onRoot1Change).toHaveBeenCalledWith('D');
      expect(onRoot1Change).toHaveBeenCalledTimes(1);
    });

    it('changing root2 via selector calls onRoot2Change', async () => {
      const onRoot2Change = vi.fn();
      renderDefault({ onRoot2Change });

      const aBtn = getRootBtn('A', 'bottom');
      await aBtn.click();

      expect(onRoot2Change).toHaveBeenCalledWith('A');
      expect(onRoot2Change).toHaveBeenCalledTimes(1);
    });

    it('changing root1 does NOT call onRoot2Change', async () => {
      const onRoot1Change = vi.fn();
      const onRoot2Change = vi.fn();
      renderDefault({ onRoot1Change, onRoot2Change });

      const eBtn = getRootBtn('E', 'top');
      await eBtn.click();

      expect(onRoot1Change).toHaveBeenCalledTimes(1);
      expect(onRoot2Change).not.toHaveBeenCalled();
    });

    it('changing root2 does NOT call onRoot1Change', async () => {
      const onRoot1Change = vi.fn();
      const onRoot2Change = vi.fn();
      renderDefault({ onRoot1Change, onRoot2Change });

      const fBtn = getRootBtn('F', 'bottom');
      await fBtn.click();

      expect(onRoot2Change).toHaveBeenCalledTimes(1);
      expect(onRoot1Change).not.toHaveBeenCalled();
    });

    it('shows correct active state for root buttons', () => {
      renderDefault();

      expect(getRootBtn('C', 'top').getAttribute('aria-pressed')).toBe('true');
      expect(getRootBtn('G', 'bottom').getAttribute('aria-pressed')).toBe('true');
      expect(getRootBtn('D', 'top').getAttribute('aria-pressed')).toBe('false');
    });

    it('top root selector has correct aria-label on role group', () => {
      const { container } = renderDefault();
      const groups = container.querySelectorAll('[role="group"]');
      const labels = [...groups].map((g) => g.getAttribute('aria-label'));
      expect(labels.some((l) => l === 'Top root selector')).toBe(true);
      expect(labels.some((l) => l === 'Bottom root selector')).toBe(true);
    });
  });

  describe('different roots rendered correctly', () => {
    it('both fretboards render with different roots (C major and G major)', () => {
      const { container } = renderDefault({ root1: 'C', root2: 'G' });
      const svgs = container.querySelectorAll('svg[role="img"]');
      expect(svgs.length).toBe(2);

      const topLabel = svgs[0].getAttribute('aria-label');
      const bottomLabel = svgs[1].getAttribute('aria-label');
      expect(topLabel).toContain('C');
      expect(bottomLabel).toContain('G');
    });

    it('root labels display correct "{root} {quality}" text', () => {
      renderDefault({ root1: 'D', root2: 'A', quality: 'minor' });
      const sections = document.querySelectorAll('section');
      const topLabelDiv = sections[0]?.querySelector('div');
      const bottomLabelDiv = sections[1]?.querySelector('div');
      expect(topLabelDiv?.textContent).toBe('D minor');
      expect(bottomLabelDiv?.textContent).toBe('A minor');
    });

    it('same root on both sides is allowed', () => {
      renderDefault({ root1: 'C', root2: 'C' });
      const svgs = document.querySelectorAll('svg[role="img"]');
      expect(svgs.length).toBe(2);
      expect(svgs[0].getAttribute('aria-label')).toContain('C');
      expect(svgs[1].getAttribute('aria-label')).toContain('C');
    });
  });

  describe('section aria-labels', () => {
    it('top section aria-label includes root, quality, and "top fretboard"', () => {
      const { container } = renderDefault({ root1: 'C', root2: 'G', quality: 'major' });
      const sections = container.querySelectorAll('section');
      expect(sections[0].getAttribute('aria-label')).toBe('C major — top fretboard');
    });

    it('bottom section aria-label includes root, quality, and "bottom fretboard"', () => {
      const { container } = renderDefault({ root1: 'C', root2: 'G', quality: 'major' });
      const sections = container.querySelectorAll('section');
      expect(sections[1].getAttribute('aria-label')).toBe('G major — bottom fretboard');
    });

    it('section aria-labels are distinct between fretboards', () => {
      const { container } = renderDefault();
      const sections = container.querySelectorAll('section');
      const topLabel = sections[0].getAttribute('aria-label');
      const bottomLabel = sections[1].getAttribute('aria-label');
      expect(topLabel).not.toBe(bottomLabel);
    });
  });

  describe('shape toggle aria-labels', () => {
    it('shape toggle buttons have distinct aria-labels per fretboard', () => {
      renderDefault();
      const topToggle = getShapeToggle('E', 'top');
      const bottomToggle = getShapeToggle('E', 'bottom');

      expect(topToggle.getAttribute('aria-label')).toContain('top fretboard');
      expect(bottomToggle.getAttribute('aria-label')).toContain('bottom fretboard');
    });

    it('shape toggle groups have distinct aria-labels', () => {
      const { container } = renderDefault();
      const groups = container.querySelectorAll('[role="group"]');
      const groupLabels = [...groups].map((g) => g.getAttribute('aria-label'));
      expect(groupLabels).toContain('Top fretboard shape toggles');
      expect(groupLabels).toContain('Bottom fretboard shape toggles');
    });
  });

  describe('labelMode and quality props', () => {
    it('passes quality to both fretboard SVGs', () => {
      renderDefault({ quality: 'minor' });
      const svgs = document.querySelectorAll('svg[role="img"]');
      expect(svgs[0].getAttribute('aria-label')).toContain('minor');
      expect(svgs[1].getAttribute('aria-label')).toContain('minor');
    });

    it('passes labelMode to both fretboards', () => {
      // Rendering with 'notes' mode should produce note names in SVGs
      const { container } = renderDefault({ labelMode: 'notes', quality: 'major' });
      const svgs = container.querySelectorAll('svg[role="img"]');
      expect(svgs.length).toBe(2);
      // Both SVGs render without error
      expect(svgs[0].getAttribute('viewBox')).toBeTruthy();
      expect(svgs[1].getAttribute('viewBox')).toBeTruthy();
    });
  });

  describe('visual layout', () => {
    it('wrapper has overflow-auto for viewport handling', () => {
      const { container } = renderDefault();
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('overflow-auto');
    });

    it('sections are stacked with gap-3', () => {
      const { container } = renderDefault();
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('gap-3');
      expect(wrapper?.className).toContain('flex-col');
    });
  });
});
