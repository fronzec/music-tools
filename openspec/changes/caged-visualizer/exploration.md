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

**Critical quirk**: All adjacent strings are 5 semitones apart EXCEPT G→B which is 4 semitones. Any fret calculation crossing the G→B boundary needs a +1 offset correction.

### Chord Intervals

- **Major**: 1 - 3 - 5 = `[0, 4, 7]` semitones from root
- **Minor**: 1 - b3 - 5 = `[0, 3, 7]` semitones from root

### The 5 CAGED Shapes

Each CAGED shape is a movable barre chord pattern derived from an open chord shape. The shape name tells you which open chord it looks like.

| Shape   | Root String(s)                | Root Fret Offset   | Typical Fret Span |
| ------- | ----------------------------- | ------------------ | ----------------- |
| C-shape | A string (5th)                | +3 frets from root | ~5 frets          |
| A-shape | A string (5th) or low E (6th) | +0 frets from root | ~3 frets          |
| G-shape | low E (6th) or A string (5th) | +3 frets from root | ~4 frets          |
| E-shape | low E (6th) or A string (5th) | +0 frets from root | ~4 frets          |
| D-shape | D string (4th)                | +0 frets from root | ~3 frets          |

### Recommended Data Structure

```typescript
interface ChordShape {
  name: 'C' | 'A' | 'G' | 'E' | 'D';
  frets: (number | null)[]; // 6 elements, null = muted string (x)
  intervals: (string | null)[]; // 'R', '3', '5', 'b3', etc.
  baseFret: number; // starting fret number
  rootString: number; // which string the root is on (0-5)
}
```

### Approach: Pre-computed Static Data

Don't compute CAGED positions from music theory at runtime. Pre-compute all 12 roots × 2 qualities × 5 shapes = **120 shapes** as static JSON. Store in `src/lib/data/caged-shapes.json`. This eliminates calculation bugs and is trivial to validate.

## 2. SVG Fretboard Layout

### Coordinate System

- **X-axis = frets** (left to right, fret 0 = nut)
- **Y-axis = strings** (top to bottom: high E → low E)

### SVG Structure

```
viewBox="0 0 900 220"
  fret spacing: ~60px per fret (15 frets = 900px)
  string spacing: ~30px per string (6 strings = 180px + margins)
```

### Responsive Approach

- **SVG viewBox** — scales proportionally, no fixed dimensions
- Container: `<div class="w-full max-w-4xl">` wrapping SVG with `width="100%" height="100%"`
- On mobile: flip to vertical orientation or stack

### Fret Count

- **15 frets** recommended — covers all CAGED positions including G-shape which extends past fret 12

### Visual Indicators

- **Root notes**: larger circle, distinct color (blue with white text)
- **Chord tones (3, 5)**: medium circle, secondary color (green/teal)
- **Non-chord notes**: small dots or outlines only
- **Muted strings**: "X" label at nut
- **Open strings**: "O" label at nut
- **Barre indicator**: horizontal line across fretted strings

### Fret Spacing

Use **uniform spacing** (60px per fret) rather than logarithmic — easier to read and label for a learning tool.

## 3. User Interaction Flow

### Chord Selection

- **Row of note buttons** (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) — one click like muted.io
- Sharp/flat toggle (♯/♭)

### Major/Minor Toggle

- **Segmented control** (pill toggle): [ Major | Minor ]

### Display Mode

- **Show all 5 shapes simultaneously** as mini-fretboards (educational value — seeing how shapes connect)
- Clicking a shape could expand to full-size view
- Mobile: stack vertically or horizontal scroll with snap points

### Fretboard Markers

- Standard dots at frets: 3, 5, 7, 9, 12 (double dot), 15

### Note Labels

- **Default**: interval labels (R, 3, 5) on active chord tones
- **Toggle**: note names (C, E, G) or both

## 4. muted.io Reference

### What Makes muted.io Effective

1. **Single-purpose tools** — each page does ONE thing well
2. **Immediate visual feedback** — click a note, see it highlighted instantly
3. **No login, no friction** — open URL, tool works
4. **Card-based home page** — grid of tool cards with emoji icons and short descriptions
5. **Consistent design language** — same header, footer, color scheme
6. **Mobile responsive** — tools reflow gracefully

### Navigation Pattern

- Home page = grid of cards
- Each card links to a dedicated tool page
- Simple URL-per-tool, no complex routing

## 5. Architecture Considerations

### Component Tree

```
App.svelte
├── HomePage.svelte
│   └── ToolCard.svelte
└── CagedTool.svelte
    ├── ChordSelector.svelte
    ├── Fretboard.svelte
    │   ├── FretLine.svelte
    │   ├── StringLine.svelte
    │   ├── NoteDot.svelte
    │   └── FretMarker.svelte
    └── ShapeCard.svelte
        └── MiniFretboard.svelte
```

### State Management (Svelte 5 Runes)

```typescript
export const cagedState = $state({
  selectedRoot: 'C',
  selectedQuality: 'major' as 'major' | 'minor',
  activeShape: null as number | null,
  showNoteNames: false,
  showIntervals: true,
});
```

### Routing

- **State-based for MVP**: `currentView` state (`'home' | 'caged'`)
- No router dependency needed
- Later: add hash-based routing for bookmarkability

### Accessibility

- SVG: `role="img"` + `aria-label`
- Note dots: `role="button"` + descriptive `aria-label`
- Keyboard navigation: tab through dots, Enter to select
- Don't rely on color alone — use size + label
- Announce selected chord on change

## 6. Technical Risks

| Risk                                | Severity          | Mitigation                                            |
| ----------------------------------- | ----------------- | ----------------------------------------------------- |
| CAGED position computation accuracy | High (if dynamic) | Pre-compute static data, validate manually            |
| SVG performance                     | Low               | 450 elements max — trivial for modern SVG             |
| Responsive horizontal fretboard     | Medium            | Mobile: vertical stack or horizontal scroll           |
| Sharp/flat enharmonic handling      | Low               | Store as semitone indices, display by preference      |
| Future tool extensibility           | Low               | Shared music theory lib, reusable fretboard component |

## Recommendation

**Build order:**

1. Static chord shape data (JSON) — validate manually
2. Home page with card grid (muted.io style)
3. Single fretboard SVG component (reusable)
4. CAGED tool: chord selector + 5 shape mini-fretboards
5. Polish: responsive layout, accessibility, note name/interval toggle

**Start with pre-computed data, not runtime computation.** The music theory is well-understood but the G→B string offset and barre chord logic are easy to get wrong.

## Ready for Proposal

**Yes.** Scope is well-defined, data model is clear, technical approach is straightforward. The orchestrator should present this to the user and ask if they want to proceed with an SDD change proposal.
