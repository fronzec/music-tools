# Proposal: Fretboard Legend

## Intent

First-time users see colored shapes and symbols with zero explanation. Add a toggleable legend panel so anyone can decode the fretboard symbology without leaving the tool.

## Scope

### In Scope
- `LegendPanel.svelte` — standalone component rendering color/symbol/indicator keys
- "Legend" toggle button in CagedTool controls bar (matches existing radio-group pattern)
- Collapsible panel between controls and fretboard content
- Visible in all 3 view modes (Full Neck, Shape Grid, Dual Compare)
- Default state: **closed** (toggleable open)

### Out of Scope
- HomePage integration, persistence, i18n, animations beyond show/hide
- Dynamic legend that changes per chord — static reference content only

## Capabilities

### New Capabilities
- `fretboard-legend`: standalone legend panel explaining color coding and symbols; default closed

### Modified Capabilities
- `caged-visualizer`: Legend toggle button added to controls bar; LegendPanel rendered below controls

## Approach

1. **LegendPanel.svelte**: New component reading `SHAPE_COLORS` from `layout.ts`. Renders in 3 sections:
   - *Shape Colors*: 5 colored dots with C/A/G/E/D labels and hex codes
   - *Symbols*: ◆ Root note, ● Chord tone, ○ Non-root (hollow ring)
   - *Indicators*: O open string, × muted; 🟢 same interval / 🟠 different interval (dual mode only)
2. **CagedTool.svelte**: `legendOpen` state variable + toggle button in controls bar. LegendPanel placed between controls and content area. Dual-mode highlight keys shown conditionally.
3. **Collapse behavior**: CSS `max-height` + `overflow: hidden` transition. Zero animation dependency.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/LegendPanel.svelte` | New | Legend content, toggle state, conditional diff section |
| `src/lib/components/CagedTool.svelte` | Modified | Add `legendOpen` state, toggle button, `<LegendPanel>` mount |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legend panel pushes fretboard below fold on mobile | Low | Collapsible + default closed; user controls visibility |
| Diff legend row visible in non-dual mode | Low | Guard: `{#if viewMode === 'dual'}` wrapping diff section |

## Rollback Plan

Remove `<LegendPanel>` mount and toggle button from CagedTool. Delete LegendPanel.svelte. Zero data or state migration.

## Dependencies

- `SHAPE_COLORS` in `layout.ts` (already defined)
- Existing control bar toggle pattern in CagedTool (Quality, Labels, View)

## Success Criteria

- [ ] Click "Legend" → panel opens showing shape colors, symbols, indicators
- [ ] Click "Legend" again or tap outside → panel closes
- [ ] Diff highlight keys visible in Dual Compare mode, hidden in Full Neck / Grid
- [ ] Legend panel scrolls with page, no z-index conflicts with fretboard SVG
- [ ] All existing tests pass
