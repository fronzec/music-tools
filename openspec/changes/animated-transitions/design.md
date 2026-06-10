# Design: Animated CAGED Shape Transitions

## Technical Approach

Restructure FullFretboard's note rendering from position-keyed (`absFret,stringIndex`) iteration to shape-keyed (`shape,stringIndex`) iteration with `<g transform>` wrappers. When root changes, each note's `<g>` persists — only its `transform` attribute changes, enabling CSS `transition` on `transform`. Fretboard (grid mode) already has stable string-index keys, so only needs CSS `transition` added to existing circles. Both components respect `prefers-reduced-motion`.

## Architecture Decisions

### Decision: Stable key strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `${absFret},${stringIndex}` (current) | DOM dies on root change → no animation | Rejected |
| `${shape}-${stringIndex}` | DOM persists; shape+string identity stable across root changes | **Chosen** |
| UUID per note element | Stable but no semantic meaning; harder debugging | Rejected |

**Rationale**: `shape` (C/A/G/E/D) + `stringIndex` (0–5) uniquely identifies a finger position within a CAGED shape. When root changes, the same shape moves to a different fret — the key stays identical, the transform coordinates change. This is the minimal structural change that enables CSS transitions.

### Decision: `<g transform>` positioning vs `cx`/`cy` animation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Animate `cx`/`cy` attributes on `<circle>` | SVG SMIL deprecated; attribute animation inconsistent across browsers | Rejected |
| `<g transform="translate(cx,cy)">` wrapper | GPU-accelerated; CSS `transition: transform` well-supported; groups note + label + ring | **Chosen** |
| CSS `motion-path` | Overkill; browser support concerns | Rejected |

**Rationale**: `<g>` wrappers position all child elements (note shape, label, highlight ring) at origin `(0,0)`. The group's `transform` handles absolute positioning. When root changes, Svelte updates the `transform` attribute; CSS transition smoothly animates the group from old position to new. This is the standard SVG animation technique.

### Decision: Overlap handling post-restructure

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Drop positionMap, render each note independently | Overlaps would stack visually without concentric rings | Rejected |
| Build flat list, then compute positionMap separately for overlap info | Keeps concentric rings; `positionMap` still used but only for overlap detection, not iteration | **Chosen** |
| Merge overlapping notes into single DOM element | Loses per-shape color identity | Rejected |

**Rationale**: `buildPositionMap()` stays. It computes overlap groups (`absFret,stringIndex` → `NoteEntry[]`). The iteration loop uses the flat `allNotes` list (keyed by `shape-stringIndex`), but looks up `overlapGroups` for rendering concentric rings. Each note in the flat list renders its own `<g>` — overlaps just affect visual radius/opacity.

### Decision: Barre rendering with animation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep barres in separate shape loop (current) | Simple; barres already keyed by `shapeType` | **Chosen** (extended with `<g>` + transition) |
| Merge barres into `allNotes` loop | Barres are rectangles spanning strings, not single notes — different semantics | Rejected |

**Rationale**: Barres are visually distinct (rectangular, spanning multiple strings). They stay in the CAGED_ORDER shape loop with `<g transform>` wrapper keyed `${shapeType}-barre`. The `transform` transition animates horizontal sliding; height rarely changes.

## Data Flow

```
shapes + visibleShapes
        │
        ├─► allNotes ($derived) ─── flat list keyed by shape-stringIndex
        │     [{ stableKey: "C-1", shape: "C", color: "#2563EB",
        │        isRoot: true, interval: "R", absFret: 3, stringIndex: 1 }, ...]
        │
        ├─► overlapGroups ($derived) ─ Map<"absFret,stringIndex", NoteEntry[]>
        │     Used for concentric ring rendering inside each note's <g>
        │
        └─► buildPositionMap() ─ kept for backward compat + overlap detection
              (consumed by overlapGroups derivation above)

SVG rendering:
  {#each allNotes as note (note.stableKey)}
    <g transform="translate({noteX(note.absFret, minFret)}, {stringY(note.stringIndex)})"
       style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}">
      <!-- note shape at (0,0) -->
      <!-- overlap rings (if applicable) at (0,0) -->
      <!-- label above at (0, -R-4) -->
      <!-- highlight diff ring (if applicable) at (0,0) -->
    </g>
  {/each}

Fretboard (grid mode):
  {#each strings as i (i)}
    <circle cx={cx} cy={cy} r={r}
            style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}" />
  {/each}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/theory/layout.ts` | Modify | Add `ANIM_DURATION` and `ANIM_EASING` to `FL` constants |
| `src/lib/components/FullFretboard.svelte` | Modify | Restructure note rendering: replace `positionMap` iteration with `allNotes` flat list; add `<g transform>` wrappers with transition style; restructure overlap detection; move barre rects into `<g>` wrappers with stable keys |
| `src/lib/components/Fretboard.svelte` | Modify | Add `transition: transform` CSS to note circles and root circles; add `<g>` wrappers for labels; add `prefers-reduced-motion` style |
| `src/lib/components/FullFretboard.svelte` (style) | Modify | Add `.fretboard-note-group` CSS class with `prefers-reduced-motion` media query |

## Interfaces / Contracts

### New constants in `FL` (layout.ts)

```typescript
ANIM_DURATION: '0.3s',   // CSS transition duration
ANIM_EASING: 'ease-out',  // CSS transition timing function
```

### New derived state in FullFretboard.svelte

```typescript
interface AnimatedNote {
  stableKey: string;    // "${shape}-${stringIndex}"
  shape: CagedShape;
  color: string;
  isRoot: boolean;
  interval: string | null;
  absFret: number;
  stringIndex: number;
}

// Flat list for {#each} iteration
let allNotes: AnimatedNote[] = $derived.by(() => { ... });

// Overlap groups for concentric ring rendering
let overlapGroups: Map<string, AnimatedNote[]> = $derived.by(() => { ... });
```

### CSS transition pattern

```svelte
<!-- FullFretboard: group wrapper -->
<g class="fretboard-note-group"
   transform="translate({cx}, {cy})"
   style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}">

<!-- Fretboard: inline on circle -->
<circle ... style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}" />
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .fretboard-note-group,
  .fretboard-note-circle {
    transition: none !important;
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `allNotes` derived list has correct stable keys | Build shapes, verify `stableKey` format matches `${shape}-${stringIndex}` |
| Unit | `overlapGroups` derived map groups correctly | Overlapping shapes, verify position groups |
| Unit | Existing FullFretboard tests (46) still pass | Run unchanged — tests query render output, not iteration structure |
| Unit | Existing Fretboard tests still pass | Run unchanged — only CSS additions |
| Unit | `FL.ANIM_DURATION` and `FL.ANIM_EASING` exist | Import and assert values |
| Unit | Transition style applied to note groups | Query `<g>` elements, verify `style` contains `transition: transform` |
| Unit | `prefers-reduced-motion` disables transitions | CSS-based; manual visual check or JS test injecting `prefers-reduced-motion` |
| Visual | C→G→D→A root sequence animation | Manual: smooth slide within 300ms, no flicker |
| Visual | Overlapping CAGED shapes animate correctly | Manual: concentric rings move together |

## Migration / Rollout

No migration required. This is a pure rendering restructure — no data format changes, no API changes, no persisted state. Rollback: revert to `positionMap` iteration, remove `<g>` wrappers and transition styles, drop animation constants from `FL`.

## Open Questions

- [ ] Confirm `0.3s` / `ease-out` as animation defaults (may need UX testing)
- [ ] Decide: should labels also transition, or snap to new position? (Currently designed to transition with parent `<g>`)