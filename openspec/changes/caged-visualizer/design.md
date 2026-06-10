# Design: CAGED Chord Visualizer

## Technical Approach

Bottom-up build: (1) static data + types, (2) SVG Fretboard component with coordinate math, (3) CAGED tool assembly with Svelte 5 runes state, (4) home page shell. All data is pre-computed — zero runtime music-theory computation. Svelte 5 runes (`$state`, `$derived`) for reactivity; no external state library. SVG fretboard uses uniform fret spacing with a calculated `viewBox` for responsive scaling.

## Architecture Decisions

| Decision               | Choice                               | Rejected                            | Rationale                                                                             |
| ---------------------- | ------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| State management       | Svelte 5 runes (`$state`/`$derived`) | Svelte stores, Zustand              | Runes are idiomatic Svelte 5; local state only, no cross-component complexity         |
| Routing                | State-based `currentView`            | SvelteKit file routing, hash router | MVP scope — one tool, no URL needed per spec                                          |
| Fret spacing           | Uniform (50px)                       | Logarithmic                         | Uniform is simpler, readable for CAGED shapes that span 4–5 frets                     |
| Data format            | Absolute fret positions in `frets[]` | Relative-to-base                    | Absolute matches chord diagram convention; `baseFret` is metadata for barre indicator |
| Fret range calculation | Derived from shape min/max           | Fixed 15-fret display               | Mini-fretboards only need 4–5 frets; avoids tiny notes on wide board                  |
| Tailwind version       | v3 with PostCSS                      | v4 (new engine)                     | v3 is battle-tested; v4 ecosystem is still stabilizing                                |

## Data Flow

```
caged-shapes.ts ──→ getShapesForChord(root, quality) ──→ ChordShape[5]
                                                              │
ChordSelector ──► $state: selectedRoot ─┐                     │
MajorMinorToggle ─► $state: selectedQuality ─┤                 │
LabelToggle ──► $state: labelMode ────────┘                  ▼
                                                     $derived: shapes
                                                         │
                                    ┌────────────────────┤
                                    │                     │
                              ShapeCard × 5          Fretboard (inside each card)
```

## SVG Fretboard Coordinate System

Orientation: horizontal — X=frets (left→right), Y=strings (top→bottom).

### Layout Constants

```typescript
const L = {
  TOP_PAD: 28, // Space for open/muted markers above strings
  BOTTOM_PAD: 16,
  LEFT_PAD: 12,
  RIGHT_PAD: 16,
  NUT_W: 6, // Nut or base-fret indicator thickness
  FRET_SP: 50, // Horizontal distance between fret lines
  STRING_SP: 26, // Vertical distance between strings
  ROOT_R: 11, // Root note circle radius
  TONE_R: 8, // Chord tone circle radius
  OTHER_R: 5, // Non-chord tone radius (outline only)
  BARRE_H: 5, // Barre indicator thickness
  FRET_NUM_OFFSET: 14, // Label offset below last string
  LABEL_FS: 10, // Font size for interval/note labels
  MARKER_R: 3, // Fret marker dot radius
} as const;
```

### Derived Dimensions

```typescript
// viewBox calculated from shape's fret span
// fretSpan = max(activeFrets) - min(activeFrets) + 1, padded by 1
viewBoxW = L.LEFT_PAD + L.NUT_W + fretSpan * L.FRET_SP + L.RIGHT_PAD;
viewBoxH = L.TOP_PAD + 5 * L.STRING_SP + L.BOTTOM_PAD;

// String Y (i = 0 is high E at top)
stringY(i) = L.TOP_PAD + i * L.STRING_SP;

// Fret line X (f = fret number relative to visible range start)
fretLineX(f) = L.LEFT_PAD + L.NUT_W + f * L.FRET_SP;

// Note center X (note on absolute fret `absFret`, range starts at `rangeStart`)
noteX(absFret, rangeStart) = fretLineX(absFret - rangeStart) - L.FRET_SP / 2;
// Open string (absFret=0): shown as "O" text above nut, not as a circle

// Barre Y spans from first to last barred string
barre_y_top = stringY(firstBarredString) - L.BARRE_H / 2;
barre_y_bottom = stringY(lastBarredString) + L.BARRE_H / 2;
```

### Special Handling

- **Nut (baseFret=0)**: Thick line at `x = L.LEFT_PAD`, full height between strings 0–5
- **Base indicator (baseFret>0)**: Thick line + fret number label (e.g., "5fr") replacing nut
- **Open strings** (fret=0): "O" text above the nut at `y = stringY(i) - L.ROOT_R - 4`
- **Muted strings** (fret=null): "×" text above the nut at same Y as open markers
- **Fret markers**: Dots at semitone positions for standard guitar (3, 5, 7, 9, 12=dual, 15) — only rendered if fret is in visible range
- **Note colors**: Root → fill `#3B82F6` (blue-500), Chord tone → fill `#22C55E` (green-500), Non-chord → stroke `#9CA3AF` (gray-400), no fill

## File Changes

| File                                                                                                             | Action | Description                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `package.json`, `vite.config.ts`, `svelte.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json` | Create | Project scaffold with Svelte 5, Tailwind v3, Vitest                                       |
| `src/main.ts`                                                                                                    | Create | App entry point                                                                           |
| `src/App.svelte`                                                                                                 | Create | Root shell — `currentView` state routing                                                  |
| `src/app.css`                                                                                                    | Create | Tailwind `@tailwind` directives + custom theme tokens                                     |
| `src/lib/types/chord.ts`                                                                                         | Create | `ChordShape`, `ChordQuality`, `CagedShape`, `NoteName`, `FretPosition`, `LabelMode` types |
| `src/lib/data/caged-shapes.ts`                                                                                   | Create | 120 pre-computed shape objects + `getShapesForChord()` lookup                             |
| `src/lib/theory/notes.ts`                                                                                        | Create | `semitoneToNoteName()`, `noteNameToSemitone()`, interval calc                             |
| `src/lib/theory/tuning.ts`                                                                                       | Create | `STANDARD_TUNING` constant                                                                |
| `src/lib/state/caged-state.svelte.ts`                                                                            | Create | Svelte 5 rune state: `selectedRoot`, `selectedQuality`, `labelMode`, derived `shapes`     |
| `src/lib/components/HomePage.svelte`                                                                             | Create | Card grid with responsive layout                                                          |
| `src/lib/components/ToolCard.svelte`                                                                             | Create | Clickable/inactive card with icon, title, description                                     |
| `src/lib/components/CagedTool.svelte`                                                                            | Create | Orchestrator — composes selector, toggle, shape cards                                     |
| `src/lib/components/ChordSelector.svelte`                                                                        | Create | 12 note buttons in a row                                                                  |
| `src/lib/components/MajorMinorToggle.svelte`                                                                     | Create | Segmented pill toggle for Major/Minor                                                     |
| `src/lib/components/Fretboard.svelte`                                                                            | Create | Reusable SVG fretboard with coordinate system                                             |
| `src/lib/components/ShapeCard.svelte`                                                                            | Create | Labeled card wrapping a mini-Fretboard                                                    |
| `tests/unit/theory/notes.test.ts`                                                                                | Create | Unit tests for note utilities                                                             |
| `tests/unit/data/caged-shapes.test.ts`                                                                           | Create | Dataset validation (120 shapes, lookup correctness)                                       |
| `tests/components/ChordSelector.test.ts`                                                                         | Create | Component render + interaction tests                                                      |
| `tests/components/Fretboard.test.ts`                                                                             | Create | SVG rendering assertions                                                                  |
| `tests/components/ShapeCard.test.ts`                                                                             | Create | Card renders label + fretboard                                                            |

## Interfaces / Contracts

### Core Types (`src/lib/types/chord.ts`)

```typescript
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ChordQuality = 'major' | 'minor';
export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';
export type LabelMode = 'intervals' | 'notes' | 'both';
export type FretPosition = number | null; // 0=open, null=muted, >0=fretted

export interface ChordShape {
  root: NoteName;
  quality: ChordQuality;
  shape: CagedShape;
  frets: [FretPosition, FretPosition, FretPosition, FretPosition, FretPosition, FretPosition];
  intervals: [
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
  ];
  baseFret: number; // 0 = open position, >0 = barre position
  rootString: number; // 0-indexed string that carries the root
}

export interface FretboardNote {
  string: number; // 0=high E, 5=low E
  fret: FretPosition;
  interval: string | null; // 'R', '3', '5', 'b3', null
  noteName: string | null; // 'C', 'E', 'G', etc.
}

export interface FretboardProps {
  shape: ChordShape;
  labelMode: LabelMode;
  showNotes?: boolean; // default true
  width?: number; // override viewBox width calculation
}

export type ViewName = 'home' | 'caged';

export const CAGED_ORDER: CagedShape[] = ['C', 'A', 'G', 'E', 'D'];
export const CHROMATIC: NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];
export const STANDARD_TUNING: number[] = [4, 11, 7, 2, 9, 4]; // E A D G B E (low→high semitone offsets)
```

### Data Lookup (`src/lib/data/caged-shapes.ts`)

```typescript
export const cagedShapes: ChordShape[]; // 120 entries
export function getShapesForChord(root: NoteName, quality: ChordQuality): ChordShape[];
export function getShape(root: NoteName, quality: ChordQuality, shape: CagedShape): ChordShape;
```

### State (`src/lib/state/caged-state.svelte.ts`)

```typescript
// Svelte 5 runes — .svelte.ts for $state support
let selectedRoot: NoteName = $state('C');
let selectedQuality: ChordQuality = $state('major');
let labelMode: LabelMode = $state('intervals');
let currentView: ViewName = $state('home');

let shapes: ChordShape[] = $derived(getShapesForChord(selectedRoot, selectedQuality));

// Export getters for non-reactive contexts
export function getCagedState() {
  return {
    get selectedRoot() {
      return selectedRoot;
    },
    get selectedQuality() {
      return selectedQuality;
    },
    get labelMode() {
      return labelMode;
    },
    get currentView() {
      return currentView;
    },
    get shapes() {
      return shapes;
    },
    setRoot(r: NoteName) {
      selectedRoot = r;
    },
    setQuality(q: ChordQuality) {
      selectedQuality = q;
    },
    setLabelMode(m: LabelMode) {
      labelMode = m;
    },
    navigate(view: ViewName) {
      currentView = view;
    },
  };
}
```

### Component Contracts

**App.svelte** — Root shell

- Props: none
- State: imports `getCagedState()`
- Behavior: conditionally renders `HomePage` or `CagedTool` based on `currentView`

**HomePage.svelte** — Card grid

- Props: `tools: ToolDef[]` (active + placeholders)
- Behavior: responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

**ToolCard.svelte** — Individual card

- Props: `{ icon: string; title: string; description: string; active: boolean; onClick?: () => void }`
- Behavior: `active ? cursor-pointer hover:scale-[1.02] : opacity-50 cursor-default`

**CagedTool.svelte** — Orchestrator

- Props: none (uses state module)
- Composes: `ChordSelector`, `MajorMinorToggle`, `ShapeCard` × 5, `LabelToggle`

**ChordSelector.svelte** — 12 note buttons

- Props: `{ selected: NoteName; onSelect: (n: NoteName) => void }`
- Renders: `CHROMATIC.map(n => button)`; selected button has `bg-blue-500 text-white`

**MajorMinorToggle.svelte** — Segmented toggle

- Props: `{ selected: ChordQuality; onSelect: (q: ChordQuality) => void }`
- Renders: two-button pill group with active indicator

**Fretboard.svelte** — SVG rendering engine

- Props: `FretboardProps`
- Internal `$derived`: fret range, viewBox, string/fret/note positions
- No events (display-only)
- Accessibility: `role="img"`, `aria-label` describing the chord shape

**ShapeCard.svelte** — Labeled mini-fretboard

- Props: `{ shape: ChordShape; labelMode: LabelMode }`
- Renders: shape name label ("C shape") + `Fretboard` component

## Testing Strategy

| Layer       | What                                     | Approach                                                                                     |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Unit        | Note utilities (`notes.ts`, `tuning.ts`) | Pure function tests: semitone↔name, intervals                                                |
| Unit        | Data integrity (`caged-shapes.ts`)       | 120 shapes, lookup by root+quality returns 5, CAGED order preserved                          |
| Unit        | SVG coordinate math                      | Extract to `src/lib/theory/layout.ts`, test `stringY()`, `fretLineX()`, `noteX()`, `viewBox` |
| Component   | Fretboard rendering                      | Mount with `@testing-library/svelte`; assert SVG elements, note circles, barre indicator     |
| Component   | ChordSelector interaction                | Click G# → expect `onSelect('G#')` callback                                                  |
| Integration | State reactivity                         | Change root → derived shapes update → UI re-renders                                          |

## Migration / Rollout

No migration required — greenfield project. Build order:

1. PR#1: Scaffold (Vite + Svelte 5 + Tailwind + Vitest + types + data)
2. PR#2: Fretboard SVG component
3. PR#3: CAGED tool + home page

## Open Questions

- [ ] Confirm fret data accuracy against a reference source before generating 120 shapes
- [ ] Decide: should `ShapeCard` also show the fret range label (e.g., "3rd fret") alongside shape name?
