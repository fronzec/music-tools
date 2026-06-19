import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import HarmonyMatrix from '$lib/components/HarmonyMatrix.svelte';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderMatrix(root = 'C') {
  return render(HarmonyMatrix as any, { root });
}

// ---------------------------------------------------------------------------
// Mounting
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — mounting', () => {
  it('mounts without throwing for root C', () => {
    expect(() => renderMatrix('C')).not.toThrow();
  });

  it('renders the data-matrix wrapper', () => {
    const { container } = renderMatrix('C');
    expect(container.querySelector('[data-matrix]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Header row — 7 scale notes in order
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — header row', () => {
  it('renders exactly 7 header note cells for C major', () => {
    const { container } = renderMatrix('C');
    const headers = container.querySelectorAll('[data-matrix-header-note]');
    expect(headers.length).toBe(7);
  });

  it('header notes for C major are C,D,E,F,G,A,B in order', () => {
    const { container } = renderMatrix('C');
    const headers = container.querySelectorAll('[data-matrix-header-note]');
    const texts = Array.from(headers).map((h) => h.textContent?.trim());
    expect(texts).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('header notes for G major are G,A,B,C,D,E,F# in order', () => {
    const { container } = renderMatrix('G');
    const headers = container.querySelectorAll('[data-matrix-header-note]');
    const texts = Array.from(headers).map((h) => h.textContent?.trim());
    expect(texts).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
  });
});

// ---------------------------------------------------------------------------
// Body rows — 7 rows, one per triad
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — body rows', () => {
  it('renders exactly 7 chord-name labels', () => {
    const { container } = renderMatrix('C');
    const labels = container.querySelectorAll('[data-matrix-row-chord]');
    expect(labels.length).toBe(7);
  });

  it('each body row has exactly 7 cells total', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-matrix]')!;
    // Each row is identified by containing data-cell-role attributes
    // We count the total cells and expect 7 rows × 7 cols = 49
    const cells = matrix.querySelectorAll('[data-cell-role]');
    expect(cells.length).toBe(49);
  });

  it('each row has exactly 3 non-empty cells (root + third + fifth)', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-matrix]')!;
    // Group cells by row: we can use the fact that we have 7 rows × 7 cols
    // and check that root+third+fifth cells total 3 per row (21 total)
    const nonEmpty = matrix.querySelectorAll('[data-cell-role="root"], [data-cell-role="third"], [data-cell-role="fifth"]');
    expect(nonEmpty.length).toBe(21); // 7 rows × 3 non-empty
  });

  it('each row has exactly 4 empty cells', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-matrix]')!;
    const empty = matrix.querySelectorAll('[data-cell-role="empty"]');
    expect(empty.length).toBe(28); // 7 rows × 4 empty
  });
});

// ---------------------------------------------------------------------------
// Specific row: ii (Dm) — root at D, third at F, fifth at A
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — row ii (Dm) in C major', () => {
  // Scale columns: C=0, D=1, E=2, F=3, G=4, A=5, B=6
  // ii is row index 1; root=i=1 (D), third=(1+2)%7=3 (F), fifth=(1+4)%7=5 (A)

  it('cell at column 1 (D) has role=root for row ii', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-matrix]')!;
    const allCells = matrix.querySelectorAll('[data-cell-role]');
    // Row ii is the 2nd group of 7 cells (index 7..13)
    const rowCells = Array.from(allCells).slice(7, 14);
    expect(rowCells[1].getAttribute('data-cell-role')).toBe('root');
  });

  it('cell at column 3 (F) has role=third for row ii', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-matrix]')!;
    const allCells = matrix.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14);
    expect(rowCells[3].getAttribute('data-cell-role')).toBe('third');
  });

  it('cell at column 5 (A) has role=fifth for row ii', () => {
    const { container } = renderMatrix('C');
    const matrix = container.querySelector('[data-cell-role]')!;
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14);
    expect(rowCells[5].getAttribute('data-cell-role')).toBe('fifth');
  });
});

// ---------------------------------------------------------------------------
// Specific row: IV (F) — wraparound: root=F(3), third=A(5), fifth=C(0)
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — row IV (F) in C major — wraparound', () => {
  // IV is row index 3; root=i=3 (F), third=(3+2)%7=5 (A), fifth=(3+4)%7=0 (C)
  // C wraps to column 0, which is to the LEFT of F — the key teaching moment

  it('cell at column 3 (F) has role=root for row IV', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(21, 28); // row index 3 → offset 3*7=21
    expect(rowCells[3].getAttribute('data-cell-role')).toBe('root');
  });

  it('cell at column 5 (A) has role=third for row IV', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(21, 28);
    expect(rowCells[5].getAttribute('data-cell-role')).toBe('third');
  });

  it('cell at column 0 (C) has role=fifth for row IV — the wraparound', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(21, 28);
    expect(rowCells[0].getAttribute('data-cell-role')).toBe('fifth');
  });
});

// ---------------------------------------------------------------------------
// Chord labels
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — chord name labels for C major', () => {
  it('shows chord name labels containing C,Dm,Em,F,G,Am,B°', () => {
    const { container } = renderMatrix('C');
    const labels = container.querySelectorAll('[data-matrix-row-chord]');
    const texts = Array.from(labels).map((l) => l.textContent?.trim());
    expect(texts).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  });
});

// ---------------------------------------------------------------------------
// No hardcoded colors
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — no hardcoded colors', () => {
  it('HTML contains no #rrggbb color values', () => {
    const { container } = renderMatrix('C');
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('HTML contains no rgb(...) color values', () => {
    const { container } = renderMatrix('C');
    expect(container.innerHTML).not.toMatch(/rgb\(/);
  });
});
