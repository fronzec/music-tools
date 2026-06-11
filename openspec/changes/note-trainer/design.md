# Design: Note Trainer

## Technical Approach

Single `NoteTrainer.svelte` component with internal `$state` tabs (`explore`/`quiz`). SVG fretboard built from `layout.ts` primitives (`stringY`, `fretLineX`, `noteX`). Note labels and octave/unison positions computed purely from `STANDARD_TUNING` and `semitoneToNoteName` — no data tables. Quiz mode reuses the filter bar as answer buttons, changing styling via mode context.

## Architecture Decisions

### Decision: Single Component vs. Split

**Choice**: One `NoteTrainer.svelte` with internal mode tabs.
**Alternatives**: Separate `NoteTrainerExplore.svelte` and `NoteTrainerQuiz.svelte`.
**Rationale**: Shared SVG fretboard, shared filter bar, and shared note-computation logic. Splitting would duplicate 60% of the template and state. Tabs are a simple UI toggle — not worth the overhead of two components.

### Decision: SVG Primitives for Overlays

**Choice**: Octave/unison overlays as SVG `<line>` and `<circle>` elements inside the same SVG as the fretboard.
**Alternatives**: HTML overlay with `position: absolute` on top of SVG.
**Rationale**: SVG coordinates are already available via `stringY`/`noteX`. HTML overlay would require coordinate projection, handling resize, and z-index management. Native SVG lines stay crisp at all scales and scroll with the fretboard.

### Decision: Filter Bar Reuse in Quiz Mode

**Choice**: Reuse the 12 chromatic buttons as answer choices, showing only 4 options (1 correct + 3 distractors) in quiz mode.
**Alternatives**: Dedicated answer buttons below the fretboard.
**Rationale**: Muscle memory — users already know the button layout from Explore mode. Reduces UI duplication. Distractors are selected from chromatic notes excluding the correct answer.

## Data Flow

    User clicks note button
           │
           ▼
    selectedNote (NoteName | null)
           │
    ┌──────┴──────┐
    ▼             ▼
 Filter bar   Fretboard SVG
 highlight    re-renders:
              • note labels (always)
              • highlighted cells (if selectedNote)
              • octave lines (if selectedNote && showOctaves)
              • unison dots (if selectedNote && showUnisons)

    User clicks "Quiz" tab
           │
           ▼
    generateQuestion(difficulty)
           │
           ▼
    question = { string, fret, correct, options[4] }
           │
           ▼
    Fretboard: one pulsing highlight
    Filter bar: 4 answer buttons (correct + 3 distractors)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/components/NoteTrainer.svelte` | Create | Full component with explore/quiz tabs, SVG fretboard, filter bar, quiz logic |
| `src/lib/types/chord.ts` | Modify | Extend `ViewName` union with `'note-trainer'` |
| `src/App.svelte` | Modify | Add `'note-trainer'` route branch with `<svelte:boundary>` |
| `src/lib/components/HomePage.svelte` | Modify | Add active Note Trainer card after Progression Builder |
| `tests/components/NoteTrainer.test.ts` | Create | Component tests for quiz scoring, difficulty ranges, note computation |

## Interfaces / Contracts

```typescript
// No new types needed — reuse existing NoteName, ViewName, CHROMATIC, STANDARD_TUNING

// Internal state (not exported)
let mode = $state<'explore' | 'quiz'>('explore');
let selectedNote = $state<NoteName | null>(null);
let showOctaves = $state(true);
let showUnisons = $state(true);
let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');
let score = $state({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
let question = $state<{ string: number; fret: number; correct: NoteName; options: NoteName[] } | null>(null);

// Pure computation
function noteAt(stringIndex: number, fret: number): NoteName {
  return semitoneToNoteName((STANDARD_TUNING[stringIndex] + fret) % 12);
}

function getOctavePositions(s: number, f: number): Array<{ s: number; f: number }> {
  const matches = [];
  for (let si = 0; si < 6; si++) {
    for (let fi = 0; fi <= 12; fi++) {
      if (si === s && fi === f) continue;
      if (noteAt(si, fi) === noteAt(s, f)) matches.push({ s: si, f: fi });
    }
  }
  return matches;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `noteAt(string, fret)` returns correct note | Vitest — test all 6×13 positions against known table |
| Unit | `getOctavePositions` correctness | Vitest — verify known octave pairs (e.g., open low E vs. 2nd fret D string) |
| Unit | Quiz question generation respects difficulty | Vitest — mock Math.random, assert fret range 0–5/0–9/0–12 |
| Unit | Score tracking (streak, bestStreak) | Vitest — simulate correct/wrong sequence |
| Integration | NoteTrainer renders in both modes | Vitest + `@testing-library/svelte` — mount, switch tabs, click buttons |
| E2E | Full quiz flow | Playwright — start quiz, answer correctly, verify score update |

## Migration / Rollout

No migration required. No persisted data, no feature flags. Rollback: remove `'note-trainer'` from `ViewName`, delete `NoteTrainer.svelte`, remove HomePage card.

## Open Questions

- [ ] Should quiz auto-advance on correct answer, or require explicit "Next Question" click? (Proposal implies auto-advance; UI may need debounce to prevent double-click.)
- [ ] Should octave lines use a specific color palette or a single accent color? (Recommend single accent for consistency.)
