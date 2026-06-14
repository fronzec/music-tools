import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ShapeToggleBar from '$lib/components/ShapeToggleBar.svelte';
import type { CagedShape } from '$lib/types/chord';

describe('ShapeToggleBar', () => {
  it('renders 5 shape buttons, one per CAGED shape in order', () => {
    render(ShapeToggleBar, {
      visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
      onToggle: vi.fn(),
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['C', 'A', 'G', 'E', 'D']);
  });

  it('shapes in visibleShapes have aria-pressed="true", others have aria-pressed="false"', () => {
    render(ShapeToggleBar, {
      visibleShapes: new Set<CagedShape>(['C', 'G']),
      onToggle: vi.fn(),
    });

    const buttons = screen.getAllByRole('button');
    const byLabel = Object.fromEntries(
      buttons.map((b) => [b.textContent?.trim(), b.getAttribute('aria-pressed')]),
    );

    expect(byLabel['C']).toBe('true');
    expect(byLabel['G']).toBe('true');
    expect(byLabel['A']).toBe('false');
    expect(byLabel['E']).toBe('false');
    expect(byLabel['D']).toBe('false');
  });

  it('calls onToggle with the clicked shape', async () => {
    const onToggle = vi.fn();
    render(ShapeToggleBar, {
      visibleShapes: new Set<CagedShape>(['C', 'A', 'G', 'E', 'D']),
      onToggle,
    });

    const gButton = screen.getByText('G');
    await gButton.click();

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith('G');
  });
});
