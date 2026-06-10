# Design: Dual Fretboard Comparison

## Technical Approach

Add a `DualFretboard.svelte` presentational wrapper that stacks two `FullFretboard` instances vertically, each with its own root selector row and per-fretboard shape toggle bar. CagedTool owns all state (`secondRoot`, `secondVisibleShapes`, extended `viewMode`), derives two shape arrays via `getShapes()`, and conditionally renders `<DualFretboard>` when `viewMode === 'dual'`. Zero changes to `FullFretboard`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| State ownership | CagedTool owns all dual state | DualFretboard owns second state | Keeps single source of truth; view transitions preserve state; consistent with existing pattern where CagedTool owns `visibleShapes` |
| FullFretboard changes | None | Add dual-mode prop to FullFretboard | Proposal explicitly scopes FullFretboard as unchanged; all flexibility comes from wrapping |
| Shape toggle location | Inside DualFretboard | In CagedTool conditionally | Spec requires per-fretboard toggle bars; co-locating with their fretboard is clearer |
| Root change communication | Callback props | `$bindable` two-way binding | Explicit data flow; easier to test; matches Svelte 5 one-way-down pattern for events |
| visibleShapes mutation | SvelteSet direct mutation | Callback props for each toggle | SvelteSet mutations are reactive; follows existing `toggleShape` pattern in CagedTool; avoids 5 callback props per set |
| viewMode type | Inline union `'full' \| 'grid' \| 'dual'` | Extend `ViewName` type | `ViewName` is for navigation (`'home' \| 'caged'`); viewMode is a different concern — keep inline as current code does |

## Data Flow

```
CagedTool.svelte (state owner)
│  selectedRoot, selectedQuality, labelMode, viewMode
│  secondRoot, secondVisibleShapes
│  shapes = $derived(getShapes(selectedRoot, selectedQuality))
│  secondShapes = $derived(getShapes(secondRoot, selectedQuality))
│
├── viewMode !== 'dual'
│   ├── Full Neck: <FullFretboard shapes={shapes} ... />
│   └── Grid: {#each shapes as shape} <ShapeCard />
│
└── viewMode === 'dual'
    └── <DualFretboard
           root1={selectedRoot}
           root2={secondRoot}
           quality={selectedQuality}
           labelMode={labelMode}
           visibleShapes1={visibleShapes}
           visibleShapes2={secondVisibleShapes}
           onRoot1Change={(r) => selectedRoot = r}
           onRoot2Change={(r) => secondRoot = r}
         />

        DualFretboard.svelte
        ├── shapes1 = $derived(getShapes(root1, quality))
        ├── shapes2 = $derived(getShapes(root2, quality))
        ├── Root selector row 1 (From: C → onRoot1Change)
        ├── Toggle bar 1 (mutates visibleShapes1 directly)
        ├── <FullFretboard shapes={shapes1} visibleShapes={visibleShapes1} ... />
        ├── Root selector row 2 (To: G → onRoot2Change)
        ├── Toggle bar 2 (mutates visibleShapes2 directly)
        └── <FullFretboard shapes={shapes2} visibleShapes={visibleShapes2} ... />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/components/DualFretboard.svelte` | Create | Wrapper: two root selectors, two toggle bars, two FullFretboards |
| `src/lib/components/CagedTool.svelte` | Modify | Add `secondRoot`, `secondVisibleShapes` state; extend `viewMode`; add third view segment; conditional `<DualFretboard>` render; add `$effect` to reset second shapes on dual entry |
| `src/lib/types/chord.ts` | Unchanged | No new types needed; `CagedShape`, `NoteName`, `ChordQuality` reused as-is |
| `src/lib/components/FullFretboard.svelte` | Unchanged | Zero modifications per proposal scope |
| `src/lib/data/chords.ts` | Unchanged | `getShapes()` called twice by DualFretboard |
| `tests/components/DualFretboard.test.ts` | Create | Component unit tests for dual rendering, independent toggles, aria-labels |
| `tests/components/CagedTool.test.ts` | Modify | Add test blocks for dual view mode, second root, second shapes, view transitions |

## Interfaces / Contracts

```typescript
// DualFretboard.svelte Props
interface DualFretboardProps {
  root1: NoteName;
  root2: NoteName;
  quality: ChordQuality;
  labelMode: LabelMode;
  visibleShapes1: Set<CagedShape>;  // SvelteSet passed from CagedTool
  visibleShapes2: Set<CagedShape>;  // SvelteSet passed from CagedTool
  onRoot1Change: (root: NoteName) => void;
  onRoot2Change: (root: NoteName) => void;
  width?: number;
}
```

```typescript
// CagedTool.svelte — new/changed state
let viewMode = $state<'full' | 'grid' | 'dual'>('full');
let secondRoot = $state<NoteName>('G');
let secondVisibleShapes = new SvelteSet<CagedShape>(CAGED_ORDER);
let secondShapes = $derived(getShapes(secondRoot, selectedQuality));

// Effect: reset second shapes when entering dual mode
$effect(() => {
  if (viewMode === 'dual') {
    secondVisibleShapes.clear();
    for (const s of CAGED_ORDER) secondVisibleShapes.add(s);
  }
});
```

## State Management

| State | Rune | Owner | Reactivity |
|-------|------|-------|------------|
| `viewMode` | `$state` | CagedTool | Drives conditional render; third segment "Dual" added to toggle |
| `secondRoot` | `$state` | CagedTool | Defaults to `'G'`; updated via `onRoot2Change` callback |
| `secondVisibleShapes` | `$state SvelteSet` | CagedTool | Mutated directly by DualFretboard toggle bars; SvelteSet mutations are reactive |
| `secondShapes` | `$derived` | CagedTool | `getShapes(secondRoot, selectedQuality)` — auto-updates when root or quality change |
| `shapes1` / `shapes2` | `$derived` | DualFretboard | `getShapes(root1/2, quality)` — arguable redundancy with CagedTool but keeps DualFretboard self-contained and testable |

Note: When `selectedQuality` changes, both fretboards auto-update. `secondVisibleShapes` does NOT auto-reset on quality change (spec: "secondVisibleShapes remains unchanged").

## Layout Dimensions

- Container: `flex flex-col gap-3 w-full overflow-auto`
- Each fretboard wrapper: `w-full` (FullFretboard SVG scales via `viewBox` + `w-full h-auto`)
- Two FullFretboard SVGs stack ~186px tall each (TOP_PAD + 5×STRING_SP + BOTTOM_PAD), plus gap-3 (12px), plus root/toggle UI (~60px per row × 2 sets)
- Total estimated height: ~500px — fits viewport with `overflow-auto` fallback
- Root selectors: compact 12-note rows, styled identically to existing chord selector but with "From" / "To" labels

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit: DualFretboard | Renders two FullFretboard SVGs | Render with both roots, assert 2 SVGs with distinct aria-labels |
| Unit: DualFretboard | Independent shape toggles | Toggle shape on fretboard 1, assert only its SVG updates |
| Unit: DualFretboard | Independent root selectors | Click "From: D", assert top SVG shows D shapes; bottom unchanged |
| Unit: DualFretboard | Empty state handling | Toggle all shapes off on one side, assert "No shapes selected" in that SVG only |
| Unit: CagedTool | Dual mode render | Click "Dual Compare", assert DualFretboard shown; 3 SVGs not shown |
| Unit: CagedTool | State reset on dual entry | Enter dual, assert `secondVisibleShapes` has all 5 shapes |
| Unit: CagedTool | View transitions | Switch dual→grid, assert state retained but not rendered; switch back, assert dual renders correctly |
| Unit: CagedTool | Shared quality | In dual mode change quality, assert both fretboards update |

## Migration / Rollout

No migration required. All changes are additive: new component, extended state, conditional render. Rollback per proposal: remove `secondRoot`/`secondVisibleShapes` state, revert `viewMode` union, delete `DualFretboard.svelte`.

## Open Questions

- [ ] Should the dual mode root selectors collapse to a more compact format on narrow screens? (mobile layout optimization is out of scope per proposal, but worth noting)