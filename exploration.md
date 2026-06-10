# Exploration: CAGED Chord Visualizer

## 1. CAGED System Data Model

### Standard Tuning (EADGBE)

```
String 0 (high E): E4 — MIDI 64
String 1 (B):       B3 — MIDI 59
String 2 (G):       G3 — MIDI 55
String 3 (D):       D3 — MIDI 50
String 4 (A):       A2 — MIDI 45
String 5 (low E):   E2 — MIDI 40
```

The critical quirk: **all adjacent strings are 5 semitones apart EXCEPT G→B which is 4 semitones**. This means any fret calculation crossing the G→B boundary needs a +1 offset correction.

### Chromatic Scale (semitone index)

```
0=C, 1=C#/Db, 2=D, 3=D#/Eb, 4=E, 5=F, 6=F#/Gb, 7=G, 8=G#/Ab, 9=A, 10=A#/Bb, 11=B
```

### Major Chord Intervals: 1 - 3 - 5 (root, major third, perfect fifth)

### Minor Chord Intervals: 1 - b3 - 5 (root, minor third, perfect fifth)

In semitones from root:

- Major: `[0, 4, 7]`
- Minor: `[0, 3, 7]`

### The 5 CAGED Shapes (Major)

Each CAGED shape is a **movable barre chord pattern** derived from an open chord shape. The shape name tells you which open chord it looks like. The root note position differs per shape.

| Shape   | Root String(s)                | Root Fret Offset (from nut) | Typical Fret Span |
| ------- | ----------------------------- | --------------------------- | ----------------- |
| C-shape | A string (5th)                | +3 frets from root note     | ~5 frets          |
| A-shape | A string (5th) or low E (6th) | +0 frets from root note     | ~3 frets          |
| G-shape | low E (6th) or A string (5th) | +3 frets from root note     | ~4 frets          |
| E-shape | low E (6th) or A string (5th) | +0 frets from root note     | ~4 frets          |
| D-shape | D string (4th)                | +0 frets from root note     | ~3 frets          |

**Concrete example — C Major shapes:**

| Shape        | Frets (strings 6→1) | Notes per string |
| ------------ | ------------------- | ---------------- |
| C            | x-3-2-0-1-0         | x-C-E-G-C-E      |
| A (barre @3) | x-3-5-5-5-3         | x-C-E-G-C-E      |
| G (barre @5) | 3-5-5-4-3-3         | G-C-E-G-C-E      |
| E (barre @8) | 8-10-10-9-8-8       | G-C-E-G-C-E      |
| D (barre @5) | x-x-5-7-8-7         | x-x-G-C-E-G      |

### Clean Data Structure

```typescript
interface ChordShape {
  name: 'C' | 'A' | 'G' | 'E' | 'D';
  frets: (number | null)[]; // 6 elements, null = muted string (x)
  intervals: (string | null)[]; // 'R', '3', '5', 'b3', etc. — null for muted
  baseFret: number; // starting fret number (for barre chords)
  rootString: number; // which string the root is on (0-5, 0=high E)
}

interface ChordData {
  root: string; // 'C', 'C#', 'D', etc.
  quality: 'major' | 'minor';
  shapes: ChordShape[]; // 5 shapes
}
```

### Recommended Approach: **Pre-computed static data**

Don't compute CAGED positions from music theory at runtime. The shapes are **fixed interval patterns** — pre-compute all 12 roots × 2 qualities × 5 shapes = **120 shapes** as static JSON. This eliminates the risk of calculation bugs and is trivial to validate.

Compute the data once (offline script or manually), store as:

```
src/lib/data/caged-shapes.json
```

Each entry: `{ root, quality, shapeName, frets: [f5,f4,f3,f2,f1,f0], intervals: [...] }`

If you later want dynamic computation, derive from interval patterns:

```
For each shape, define the interval template relative to the root position.
Then shift all frets by the semitone distance from the reference root to the chosen root.
```

## 2. SVG Fretboard Layout

### Coordinate System

- **X-axis = frets** (left to right, fret 0 = nut)
- **Y-axis = strings** (top to bottom: high E → low E, or reversed for "looking down" view)

```
viewBox="0 0 900 220"
  fret spacing: ~60px per fret (12 frets = 720px + margins)
  string spacing: ~30px per string (6 strings = 180px + margins)
```

### SVG Structure

```svg
<svg viewBox="0 0 900 220">
  <!-- Fret lines (vertical) -->
  <line x1={fretX(i)} y1={0} x2={fretX(i)} y2={stringY(5)} />

  <!-- String lines (horizontal) */
  <line x1={fretX(0)} y1={stringY(s)} x2={fretX(12)} y2={stringY(s)} />

  <!-- Fret markers (dots at 3, 5, 7, 9, 12) */
  <circle cx={fretX(3)} cy={centerY} r={4} />

  <!-- Note dots (interactive) */
  <circle
    cx={fretX(fret)} cy={stringY(string)}
    r={isActive ? 14 : 10}
    fill={isActive ? '#3b82f6' : 'transparent'}
    stroke={isActive ? '#2563eb' : '#6b7280'}
    class="cursor-pointer hover:opacity-80"
  />

  <!-- Labels */
  <text x={fretX(fret)} y={stringY(string)} text-anchor="middle" dy="0.35em">
    {noteName}
  </text>
</svg>
```

### Responsive Approach

- **SVG viewBox** — the right choice. Scales proportionally, no fixed dimensions needed.
- Container: `<div class="w-full max-w-4xl">` wrapping the SVG with `width="100%" height="100%"`.
- On mobile: flip to vertical orientation (strings as columns, frets as rows) via CSS or alternate SVG.

### Fret Count

- **12 frets** is minimum (one octave, covers all CAGED positions for most chords).
- **15 frets** is safer — some CAGED positions (especially G-shape) extend past fret 12.
- **Recommendation: 15 frets** for the CAGED visualizer.

### Visual Indicators

- **Root notes**: larger circle, distinct color (e.g., blue with white text)
- **Chord tones (3, 5)**: medium circle, secondary color (e.g., green/teal)
- **Non-chord notes on fretboard**: small dots or no fill, just outlines
- **Muted strings**: "X" label at the nut position
- **Open strings**: "O" label at the nut position
- **Barre indicator**: horizontal line or bracket across strings at the barre fret

### Fret Spacing

Real guitars have **progressively narrower frets** (logarithmic spacing). For a learning tool, **uniform spacing** is actually better — easier to read and label. Use uniform 60px per fret.

## 3. User Interaction Flow

### Chord Selection

- **Row of note buttons** (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) — like muted.io
- This is faster than a dropdown (one click vs two)
- Show both sharp and flat names with a ♯/♭ toggle

### Major/Minor Toggle

- **Segmented control** (pill toggle): [ Major | Minor ]
- Clean, immediate, no dropdown

### Display All 5 Shapes or One at a Time?

- **Show all 5 simultaneously** as a row of mini fretboards (or 2 rows: 3+2)
- Each mini-fretboard is labeled with its shape name (C, A, G, E, D)
- This is the **educational value** — seeing how the shapes connect and overlap
- Clicking a shape could expand it to a full-size view
- On mobile: stack vertically or use horizontal scroll

### Fretboard Markers

- Standard dots at frets: 3, 5, 7, 9, 12 (double dot), 15
- Essential for orientation

### Note Labels

- **Default**: show interval labels (R, 3, 5) on active chord tones
- **Toggle**: show note names (C, E, G) instead
- **Toggle**: show both (interval + note name)
- Non-chord notes: show note name in lighter opacity

### Open Strings / Barre Indicators

- Nut line (thick) when shape starts at fret 0
- "X" or "O" above strings for muted/open
- Barre fret: draw a horizontal bar across the fretted strings

## 4. muted.io Reference

### What Makes muted.io Effective

1. **Single-purpose tools** — each page does ONE thing well
2. **Immediate visual feedback** — click a note, see it highlighted instantly
3. **No login, no friction** — open the URL, tool works
4. **Card-based home page** — grid of tool cards with emoji icons and short descriptions
5. **Consistent design language** — same header, footer, color scheme across all tools
6. **Mobile responsive** — tools reflow gracefully

### Navigation Pattern

- Home page = grid of cards
- Each card links to a dedicated tool page
- No complex routing — simple URL-per-tool
- Back navigation via home link or breadcrumb

### Home Page Card Design

```
┌─────────────────────────┐
│ 🎸                     │
│ CAGED Visualizer        │
│ Learn the 5 chord       │
│ positions across the    │
│ fretboard               │
│ [Open →]               │
└─────────────────────────┘
```

- Emoji/icon + title + 1-line description + link
- Grid: 3 columns desktop, 2 tablet, 1 mobile
- Hover: subtle lift/shadow

## 5. Architecture Considerations

### Component Tree

```
App.svelte
├── HomePage.svelte          (card grid)
│   └── ToolCard.svelte      (reusable card)
│
└── CagedTool.svelte         (the CAGED visualizer)
    ├── ChordSelector.svelte  (note buttons + major/minor toggle)
    ├── Fretboard.svelte      (main SVG fretboard)
    │   ├── FretLine.svelte
    │   ├── StringLine.svelte
    │   ├── NoteDot.svelte    (interactive note circle)
    │   └── FretMarker.svelte (position dots)
    └── ShapeCard.svelte      (mini fretboard per shape)
        └── MiniFretboard.svelte
```

### State Management (Svelte 5 Runes)

```typescript
// src/lib/state/caged-state.svelte.ts
export const cagedState = $state({
  selectedRoot: 'C',
  selectedQuality: 'major' as 'major' | 'minor',
  activeShape: null as number | null,  // null = show all
  showNoteNames: false,
  showIntervals: true,
});

// Derived data
const $derived currentChord = getChordData(cagedState.selectedRoot, cagedState.selectedQuality);
const $derived activeShapes = cagedState.activeShape !== null
  ? [currentChord.shapes[cagedState.activeShape]]
  : currentChord.shapes;
```

### Data Structure

- **Static JSON** for chord shapes (pre-computed, validated)
- Music theory utilities (note-to-semitone, semitone-to-note) as pure functions
- No runtime computation of shapes — just lookup and render

### Routing

- **State-based for MVP**: `currentView` state (`'home' | 'caged'`)
- No router dependency — just conditional rendering
- Later: add hash-based routing (`#/caged`) for bookmarkability

### Accessibility

- SVG: `role="img"` + `aria-label` on fretboard
- Note dots: `role="button"` + `aria-label="C note, root, string 3, fret 5"`
- Keyboard navigation: tab through note dots, Enter to select
- Color contrast: don't rely on color alone — use size + label
- Screen reader: announce selected chord and shape name on change

## 6. Technical Risks

### Risk 1: CAGED Position Computation Accuracy

- **Severity**: High if computing dynamically; Low if using pre-computed data
- **Mitigation**: Pre-compute all 120 shapes offline, validate against known chord charts
- **Validation**: Cross-reference with muted.io guitar-chords, chordie.com, or guitar teacher resources

### Risk 2: SVG Performance

- **Severity**: Low — 6 strings × 15 frets = 90 note dots max per fretboard
- 5 mini-fretboards = 450 elements total — trivial for modern SVG
- **Mitigation**: Use `<g>` grouping, avoid re-rendering unchanged elements

### Risk 3: Responsive Horizontal Fretboard

- **Severity**: Medium — horizontal fretboards are hard on narrow screens
- **Mitigation**:
  - Desktop: horizontal row of 5 mini-fretboards
  - Tablet: 2 rows (3 + 2)
  - Mobile: vertical stack or horizontal scroll with snap points
  - Consider vertical fretboard orientation on mobile (strings as columns)

### Risk 4: Sharp/Flat Enharmonic Handling

- **Severity**: Low
- **Mitigation**: Store notes internally as semitone indices (0-11), display names based on user preference (♯ or ♭)

### Risk 5: Future Tool Extensibility

- **Severity**: Low if architecture is clean
- **Mitigation**:
  - Shared music theory library (`src/lib/music/`)
  - Shared SVG fretboard component (reusable across tools)
  - Consistent state pattern for each tool

## Recommendation

**Build it in this order:**

1. Static chord shape data (JSON) — validate manually
2. Home page with card grid (muted.io style)
3. Single fretboard SVG component (reusable)
4. CAGED tool: chord selector + 5 shape mini-fretboards
5. Polish: responsive layout, accessibility, note name/interval toggle

**Start with pre-computed data, not runtime computation.** The music theory is well-understood but the G→B string offset and barre chord logic are easy to get wrong. Pre-compute, validate, then render.

## Ready for Proposal

**Yes.** The scope is well-defined, the data model is clear, and the technical approach is straightforward. The orchestrator should present this to the user and ask if they want to proceed with an SDD change proposal.
