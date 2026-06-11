# Design: Progression Builder

## Technical Approach

Three new Svelte 5 components under `src/lib/components/` (flat, matching existing pattern) plus a new types file. `ProgressionBuilder` owns all progression state and delegates fretboard rendering to the existing `FullFretboard` via `getShapes()`. A shared quality toggle updates all chords simultaneously (MVP). Playback uses Svelte 5 `$effect` with `setInterval` and cleanup return. Route entry via `'progression'` ViewName extension and a new HomePage nav card.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| State ownership | Single-owner in `ProgressionBuilder` | Store (Svelte writable), per-component local | Matches CagedTool pattern; simplest for MVP; no cross-component sync needed |
| Quality scope | Shared across all chords | Per-chord quality override | Spec requires shared quality; per-chord is v2 scope |
| Playback timer | `$effect` + `setInterval` with cleanup return | `requestAnimationFrame`, Svelte `onMount`/`onDestroy` | Svelte 5 idiomatic; `$effect` cleanup guarantees no leaks on unmount |
| Chord identity | `id` string (UUID-style) | Array index as key | Stable keys for Svelte `#each`; avoids shift bugs on remove |
| Max chords cap | 32 with constant `MAX_CHORDS` | No cap / dynamic limit | Prevents bar overflow; matches spec scenario |
| Component file placement | `src/lib/components/` flat | Nested `progression/` directory | Matches existing project convention (all components flat) |

## Data Flow

```
App.svelte
 └─ currentView = 'progression'
     └─ ProgressionBuilder.svelte (state owner)
         ├─ progression: ProgressionChord[]
         ├─ activeIndex: number
         ├─ isPlaying: boolean
         ├─ playbackSpeed: PlaybackSpeed
         ├─ selectedQuality: ChordQuality
         │
         ├─ ProgressionBar.svelte
         │   ← { progression, activeIndex, quality, onSelect, onAdd, onRemove }
         │   → onSelect(index) / onAdd(root) / onRemove(index)
         │
         ├─ FullFretboard.svelte (existing, unchanged)
         │   ← shapes={getShapes(chord.root, chord.quality)}
         │   ← visibleShapes={all 5 CAGED shapes}
         │   ← labelMode="intervals"
         │
         └─ ProgressionTimeline.svelte
             ← { progression, activeIndex, isPlaying, playbackSpeed }
             → onPrev() / onNext() / onTogglePlay() / onSpeedChange()
             → $effect interval advances activeIndex
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types/progression.ts` | Create | `ProgressionChord`, `PlaybackSpeed`, `PLAYBACK_MS`, `MAX_CHORDS` |
| `src/lib/components/ProgressionBuilder.svelte` | Create | Orchestrator view: state, layout, back button, quality toggle, wires child components |
| `src/lib/components/ProgressionBar.svelte` | Create | Horizontal scrollable chord pills with add/remove |
| `src/lib/components/ProgressionTimeline.svelte` | Create | Step dots, prev/next, play/pause, speed selector; `$effect` interval logic |
| `src/lib/types/chord.ts` | Modify | Extend `ViewName` to `'home' \| 'caged' \| 'progression'` |
| `src/App.svelte` | Modify | Import `ProgressionBuilder`; add `{:else if currentView === 'progression'}` route |
| `src/lib/components/HomePage.svelte` | Modify | Add Progression Builder nav card after CAGED Visualizer |

## Interfaces / Contracts

### `src/lib/types/progression.ts`

```typescript
import type { NoteName, ChordQuality } from './chord';

export interface ProgressionChord {
  id: string;
  root: NoteName;
  quality: ChordQuality;
}

export type PlaybackSpeed = 'slow' | 'medium' | 'fast';

export const PLAYBACK_MS: Record<PlaybackSpeed, number> = {
  slow: 2500,
  medium: 1500,
  fast: 800,
};

export const MAX_CHORDS = 32;
```

### `src/lib/types/chord.ts` — ViewName extension

```typescript
export type ViewName = 'home' | 'caged' | 'progression';
```

### ProgressionBuilder.svelte — Props & State

```svelte
interface Props {
  navigate: (view: ViewName) => void;
}

// State (Svelte 5 runes)
let progression = $state<ProgressionChord[]>([
  { id: crypto.randomUUID(), root: 'C', quality: 'major' },
  { id: crypto.randomUUID(), root: 'F', quality: 'major' },
  { id: crypto.randomUUID(), root: 'G', quality: 'major' },
  { id: crypto.randomUUID(), root: 'C', quality: 'major' },
]);
let activeIndex = $state(0);
let isPlaying = $state(false);
let playbackSpeed = $state<PlaybackSpeed>('medium');
let selectedQuality = $state<ChordQuality>('major');
```

### ProgressionBar.svelte — Props

```svelte
interface Props {
  progression: ProgressionChord[];
  activeIndex: number;
  quality: ChordQuality;
  onSelect: (index: number) => void;
  onAdd: (root: NoteName) => void;
  onRemove: (index: number) => void;
}
```

### ProgressionTimeline.svelte — Props

```svelte
interface Props {
  progression: ProgressionChord[];
  activeIndex: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}
```

### Playback `$effect` (inside ProgressionBuilder)

```svelte
let timer: ReturnType<typeof setInterval> | undefined;

$effect(() => {
  if (isPlaying) {
    timer = setInterval(() => {
      if (activeIndex < progression.length - 1) {
        activeIndex++;
      } else {
        isPlaying = false; // stop at end, no loop
      }
    }, PLAYBACK_MS[playbackSpeed]);
  }
  return () => {
    if (timer) { clearInterval(timer); timer = undefined; }
  };
});
```

### FullFretboard wiring (inside ProgressionBuilder template)

```svelte
{#if progression.length > 0}
  {@const currentChord = progression[activeIndex]}
  {@const shapes = getShapes(currentChord.root, currentChord.quality)}
  {@const visibleShapes = new SvelteSet(CAGED_ORDER)}
  <FullFretboard {shapes} {visibleShapes} labelMode="intervals" />
{:else}
  <!-- Empty state message -->
  <p class="text-center text-gray-400 py-8">Add chords to see shapes</p>
{/if}
```

### App.svelte route addition

```svelte
{:else if currentView === 'progression'}
  <svelte:boundary failed={errorFallback}>
    <ProgressionBuilder {navigate} />
  </svelte:boundary>
```

### HomePage.svelte — new card

Pattern: existing CAGED card (button, rounded-xl, border, shadow) with emoji `🎸` → new card uses `🎵`, title "Progression Builder", description "Sequence chords and see CAGED shapes", `navigate('progression')`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `ProgressionChord` type, `PLAYBACK_MS` values, `MAX_CHORDS` | Vitest: import constants, assert values |
| Unit | Add chord (appends, quality inheritance, MAX_CHORDS cap) | Vitest: test `onAdd` logic by calling handler function |
| Unit | Remove chord (activeIndex adjustment, empty progression) | Vitest: test `onRemove` logic with index shift scenarios |
| Unit | Quality toggle updates all chords | Vitest: verify all chords update quality simultaneously |
| Unit | Playback timer (start, advance, stop at end, cleanup) | Vitest: mock `setInterval`/`clearInterval`, advance timer, assert `activeIndex` increments and stops |
| Component | ProgressionBar pills render, highlight active, add dropdown | Vitest + Svelte Testing Library: render with props, assert pill text, click add |
| Component | ProgressionTimeline dots, prev/next, speed toggle | Vitest + Svelte Testing Library: render, click prev/next, assert disabled states |
| Integration | Route from HomePage to ProgressionBuilder and back | E2E (Playwright): click card, assert view renders, click back |
| Integration | FullFretboard displays active chord shapes | E2E: add chords, select one, assert fretboard renders correct shapes |
| Build | Type-check passes with new ViewName | `pnpm tsc --noEmit` |

## Migration / Rollout

No migration required. ViewName extension is additive; new components are standalone. Rollback = remove route, delete 3 components + types file, remove HomePage card.

## Open Questions

- [ ] Should `crypto.randomUUID()` be polyfilled for older browsers, or is the target modern-only? (Current target is modern browsers with Svelte 5, so likely fine.)