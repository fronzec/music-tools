import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RootSelector from '$lib/components/RootSelector.svelte';
import { CHROMATIC } from '$lib/types/chord';
import type { NoteName } from '$lib/types/chord';

describe('RootSelector', () => {
  it('renders all 12 chromatic note buttons when given CHROMATIC', () => {
    render(RootSelector, {
      notes: CHROMATIC,
      selected: 'C' as NoteName,
      onSelect: vi.fn(),
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
  });

  it('only the selected note button has aria-pressed="true"', () => {
    render(RootSelector, {
      notes: CHROMATIC,
      selected: 'G' as NoteName,
      onSelect: vi.fn(),
    });

    const buttons = screen.getAllByRole('button');
    const pressedButtons = buttons.filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressedButtons).toHaveLength(1);
    expect(pressedButtons[0]!.textContent?.trim()).toBe('G');

    const unpressedButtons = buttons.filter((b) => b.getAttribute('aria-pressed') === 'false');
    expect(unpressedButtons).toHaveLength(11);
  });

  it('calls onSelect with the clicked note', async () => {
    const onSelect = vi.fn();
    render(RootSelector, {
      notes: CHROMATIC,
      selected: 'C' as NoteName,
      onSelect,
    });

    const aButton = screen.getByText('A');
    await aButton.click();

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith('A');
  });
});
