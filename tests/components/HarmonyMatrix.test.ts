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

// ---------------------------------------------------------------------------
// Quality-aware degree labels (data-cell-degree) — Change 3
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — quality-aware cell degree labels (C major)', () => {
  // Row ii = Dm (min): third="♭3", fifth="5"
  it('row ii (Dm) third cell has data-cell-degree="♭3"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14); // row index 1
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell).toBeTruthy();
    expect(thirdCell!.getAttribute('data-cell-degree')).toBe('♭3');
  });

  it('row ii (Dm) fifth cell has data-cell-degree="5"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell).toBeTruthy();
    expect(fifthCell!.getAttribute('data-cell-degree')).toBe('5');
  });

  // Row I = C (maj): third="3", fifth="5"
  it('row I (C) third cell has data-cell-degree="3"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(0, 7); // row index 0
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell).toBeTruthy();
    expect(thirdCell!.getAttribute('data-cell-degree')).toBe('3');
  });

  it('row I (C) fifth cell has data-cell-degree="5"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(0, 7);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell).toBeTruthy();
    expect(fifthCell!.getAttribute('data-cell-degree')).toBe('5');
  });

  // Row vii° = B° (dim): third="♭3", fifth="♭5"
  it('row vii° (B°) third cell has data-cell-degree="♭3"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(42, 49); // row index 6
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell).toBeTruthy();
    expect(thirdCell!.getAttribute('data-cell-degree')).toBe('♭3');
  });

  it('row vii° (B°) fifth cell has data-cell-degree="♭5"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(42, 49);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell).toBeTruthy();
    expect(fifthCell!.getAttribute('data-cell-degree')).toBe('♭5');
  });
});

// ---------------------------------------------------------------------------
// Axis labels and grouping — scale-type caption, axis column headers
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — scale-type caption', () => {
  it('renders a data-scale-type element with text "C Major scale" for root C', () => {
    const { container } = renderMatrix('C');
    const el = container.querySelector('[data-scale-type]');
    expect(el).not.toBeNull();
    expect(el!.textContent?.trim()).toBe('C Major scale');
  });

  it('renders a data-scale-type element with text "G Major scale" for root G', () => {
    const { container } = renderMatrix('G');
    const el = container.querySelector('[data-scale-type]');
    expect(el).not.toBeNull();
    expect(el!.textContent?.trim()).toBe('G Major scale');
  });
});

describe('HarmonyMatrix — axis labels', () => {
  it('renders a data-axis-label="scale-notes" element with text "Scale notes"', () => {
    const { container } = renderMatrix('C');
    const el = container.querySelector('[data-axis-label="scale-notes"]');
    expect(el).not.toBeNull();
    expect(el!.textContent?.trim()).toBe('Scale notes');
  });

  it('renders a data-axis-label="degree" element with text "Degree"', () => {
    const { container } = renderMatrix('C');
    const el = container.querySelector('[data-axis-label="degree"]');
    expect(el).not.toBeNull();
    expect(el!.textContent?.trim()).toBe('Degree');
  });

  it('renders a data-axis-label="chord" element with text "Chord"', () => {
    const { container } = renderMatrix('C');
    const el = container.querySelector('[data-axis-label="chord"]');
    expect(el).not.toBeNull();
    expect(el!.textContent?.trim()).toBe('Chord');
  });
});

// ---------------------------------------------------------------------------
// Per-cell distance captions (data-cell-tones) — Change 3
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — per-cell tones captions (C major)', () => {
  // Row ii = Dm (min): gaps 3,4 → "1½","2"
  it('row ii (Dm) third cell has data-cell-tones="1½"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14);
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell!.getAttribute('data-cell-tones')).toBe('1½');
  });

  it('row ii (Dm) fifth cell has data-cell-tones="2"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(7, 14);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell!.getAttribute('data-cell-tones')).toBe('2');
  });

  // Row I = C (maj): gaps 4,3 → "2","1½"
  it('row I (C) third cell has data-cell-tones="2"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(0, 7);
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell!.getAttribute('data-cell-tones')).toBe('2');
  });

  it('row I (C) fifth cell has data-cell-tones="1½"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(0, 7);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell!.getAttribute('data-cell-tones')).toBe('1½');
  });

  // Row vii° = B° (dim): gaps 3,3 → "1½","1½"
  it('row vii° (B°) third cell has data-cell-tones="1½"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(42, 49);
    const thirdCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'third');
    expect(thirdCell!.getAttribute('data-cell-tones')).toBe('1½');
  });

  it('row vii° (B°) fifth cell has data-cell-tones="1½"', () => {
    const { container } = renderMatrix('C');
    const allCells = container.querySelectorAll('[data-cell-role]');
    const rowCells = Array.from(allCells).slice(42, 49);
    const fifthCell = rowCells.find((c) => c.getAttribute('data-cell-role') === 'fifth');
    expect(fifthCell!.getAttribute('data-cell-tones')).toBe('1½');
  });
});

// ---------------------------------------------------------------------------
// Role-based colors — visual refinement pass
// Third cells must use note-third token; fifth cells must use note-tone token.
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — role-based marker colors', () => {
  it('third cells carry the note-third CSS token class', () => {
    const { container } = renderMatrix('C');
    const thirdCells = container.querySelectorAll('[data-cell-role="third"]');
    expect(thirdCells.length).toBeGreaterThan(0);
    thirdCells.forEach((cell) => {
      const span = cell.querySelector('span, [class]');
      // The colored dot span inside the third cell must reference note-third
      expect(cell.innerHTML).toMatch(/note-third/);
    });
  });

  it('fifth cells carry the note-tone CSS token class', () => {
    const { container } = renderMatrix('C');
    const fifthCells = container.querySelectorAll('[data-cell-role="fifth"]');
    expect(fifthCells.length).toBeGreaterThan(0);
    fifthCells.forEach((cell) => {
      expect(cell.innerHTML).toMatch(/note-tone/);
    });
  });

  it('root cells carry the note-root CSS token class', () => {
    const { container } = renderMatrix('C');
    const rootCells = container.querySelectorAll('[data-cell-role="root"]');
    expect(rootCells.length).toBeGreaterThan(0);
    rootCells.forEach((cell) => {
      expect(cell.innerHTML).toMatch(/note-root/);
    });
  });
});

// ---------------------------------------------------------------------------
// Quality sub-label in Degree column — data-degree-quality attribute
// ---------------------------------------------------------------------------

describe('HarmonyMatrix — degree quality sub-label', () => {
  it('row I (C) has data-degree-quality="maj"', () => {
    const { container } = renderMatrix('C');
    const rows = container.querySelectorAll('[data-degree-quality]');
    const rowI = Array.from(rows)[0];
    expect(rowI).toBeTruthy();
    expect(rowI.getAttribute('data-degree-quality')).toBe('maj');
    expect(rowI.textContent?.trim()).toBe('maj');
  });

  it('row ii (Dm) has data-degree-quality="min"', () => {
    const { container } = renderMatrix('C');
    const rows = container.querySelectorAll('[data-degree-quality]');
    const rowII = Array.from(rows)[1];
    expect(rowII).toBeTruthy();
    expect(rowII.getAttribute('data-degree-quality')).toBe('min');
    expect(rowII.textContent?.trim()).toBe('min');
  });

  it('row vii° (B°) has data-degree-quality="dim"', () => {
    const { container } = renderMatrix('C');
    const rows = container.querySelectorAll('[data-degree-quality]');
    const rowVII = Array.from(rows)[6];
    expect(rowVII).toBeTruthy();
    expect(rowVII.getAttribute('data-degree-quality')).toBe('dim');
    expect(rowVII.textContent?.trim()).toBe('dim');
  });

  it('renders exactly 7 degree-quality sub-labels', () => {
    const { container } = renderMatrix('C');
    const rows = container.querySelectorAll('[data-degree-quality]');
    expect(rows.length).toBe(7);
  });
});
