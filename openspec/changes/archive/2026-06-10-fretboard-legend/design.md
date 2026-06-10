# Design: Fretboard Legend

## 1. Technical Approach

- **Purely presentational**: `LegendPanel.svelte` reads `SHAPE_COLORS` from `src/lib/theory/layout.ts` and renders static legend content. No reactive data flows beyond the `viewMode` prop controlling diff-section visibility.
- **Zero dependency**: No external animation libraries. Collapse uses CSS `max-height` + `overflow: hidden` transition on a container wrapping the panel.
- **Accessibility**: `aria-expanded` on toggle, `aria-label` on panel container, semantic HTML.
- **Consistent pattern**: Toggle button matches existing radiogroup toggle styling in `CagedTool.svelte` (Quality, Labels, View).

## 2. Component Architecture

### `LegendPanel.svelte`

```
Props:
  viewMode?: 'full' | 'grid' | 'dual'   (default: 'full')
  open: boolean                         (controlled by parent)

Responsibilities:
  - Render 3 sections: Shape Colors, Symbols, Indicators
  - Conditionally render Diff section based on viewMode === 'dual'
  - Handle CSS transition for open/close
  - No internal state; fully controlled component

Data source:
  - Import SHAPE_COLORS from '$lib/theory/layout'
  - Static symbol/icon definitions inline
```

### `CagedTool.svelte` modifications

```
New state:
  let legendOpen = $state<boolean>(false);

New UI:
  - "Legend" toggle button adjacent to View Mode radiogroup
  - Conditional render: {#if legendOpen}<LegendPanel viewMode={viewMode} />{/if}

Placement:
  - Between controls bar and fretboard content area
```

## 3. Legend Content Specification

### Shape Colors Section

Two-column layout for desktop, single column for mobile.

| Shape | Color (dot) | Hex Code |
|-------|-------------|----------|
| C     | `#2563EB` (blue-600) | `#2563EB` |
| A     | `#F97316` (orange-500) | `#F97316` |
| G     | `#16A34A` (green-600) | `#16A34A` |
| E     | `#EF4444` (red-500) | `#EF4444` |
| D     | `#9333EA` (purple-600) | `#9333EA` |

### Symbols Section

| Icon | Meaning |
|------|---------|
| ◆ | Root note |
| ● | Chord tone |
| ○ | Non-root / overlap |

### Indicators Section

| Icon | Meaning |
|------|---------|
| O | Open string |
| × | Muted string |

### Diff Section (dual mode only)

| Icon | Meaning |
|------|---------|
| 🟢 | Same interval |
| 🟠 | Different interval |

## 4. UI Placement and Styling

### Toggle Button

- Positioned in the same flex row as the View Mode radiogroup, or in a new row if horizontal space is insufficient.
- Uses the same styling as the View Mode radiogroup buttons (rounded-lg, border, bg-gray-50, p-0.5).
- Active state: `bg-white text-gray-900 shadow-sm` when `legendOpen === true`.
- Inactive state: `text-gray-500 hover:text-gray-700` when `legendOpen === false`.
- `aria-pressed` reflects `legendOpen`.

### Panel Container

- CSS class: `mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 ease-in-out`
- `max-height` transition: `0` → `500px` (or computed height) on open, `500px` → `0` on close.
- Inner padding: `p-4 sm:p-6`.
- Sections separated by `border-b border-gray-100` (except last section).

### Section Layout

- **Shape Colors**: `grid grid-cols-2 sm:grid-cols-3 gap-3` — each item is a flex row with `h-4 w-4 rounded-full` dot, shape label, and hex code in `text-xs text-gray-500`.
- **Symbols & Indicators**: `space-y-2` single column. Each item is a flex row with the icon and label.
- **Diff Section**: Same single-column layout as Symbols, rendered conditionally.

## 5. File Inventory

| File | Action | Description |
|------|--------|-------------|
| `src/lib/components/LegendPanel.svelte` | **New** | Legend content, toggle state, conditional diff section |
| `src/lib/components/CagedTool.svelte` | **Modified** | Add `legendOpen` state, toggle button, `<LegendPanel>` mount |

### Rollback

Remove `<LegendPanel>` mount and toggle button from `CagedTool.svelte`. Delete `LegendPanel.svelte`. Zero data or state migration.
