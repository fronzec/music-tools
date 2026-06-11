# Proposal: Note Trainer

## Intent

Guitarists struggle to memorize note names for each string+fret combination. This tool provides interactive exploration with octave/unison visual overlays and a quiz mode with scoring — building fretboard fluency through repetition and spatial pattern recognition.

## Scope

### In Scope
- `NoteTrainer.svelte`: top-level view with Explore/Quiz mode tabs
- Explore: 6×12 SVG fretboard grid with note labels at intersections
- Note filter bar: 12 chromatic toggle buttons highlighting matching positions
- Octave lines: connect same-note octaves across strings (2-up+2-fwd, 3-fwd for G→B)
- Unison lines: connect identical-pitch positions on different strings
- Quiz: random (string, fret) highlight, 4-option multiple choice via note filter buttons reused
- Scoring: correct/total, streak, best streak
- Difficulty: Easy (frets 0-5), Medium (0-9), Hard (0-12)
- Route `'note-trainer'`, ViewName extension, HomePage nav card
- Responsive: single-column on mobile, wider grid on desktop

### Out of Scope
- Scales, intervals, audio playback, left-handed mode, custom tunings

## Capabilities

### New Capabilities
- `note-trainer`: interactive note learning with Explore mode (fretboard grid, filter bar, octave/unison overlays) and Quiz mode (random-position multiple choice with scoring and difficulty levels)

### Modified Capabilities
- `home-page`: Tool Card Content gains a Note Trainer card after Progression Builder in the active card grid

## Approach

Single `NoteTrainer.svelte` component using Svelte 5 runes. Two internal tabs (`explore`/`quiz`) toggle via `$state`. SVG fretboard built with `stringY()`, `fretLineX()`, `noteX()` from `layout.ts`. Note-to-position lookups derived from `semitoneToNoteName()` and `STANDARD_TUNING` offsets — pure math, no new data.

Explore mode renders a 6×12 grid of `<text>` nodes. Filter bar mutates `selectedNote: NoteName | null`; matching positions render highlighted. Octave and unison lines are `<line>` elements drawn between computed positions.

Quiz mode picks random `(string, fret)` within difficulty range, highlights it, and repurposes the filter bar buttons (showing only 4 wrong options) as answer choices. Score state: 3 `$state` counters.

Component tree:
```
App.svelte
└── 'note-trainer' → NoteTrainer.svelte
    ├── explore tab: fretboard SVG + filter bar
    └── quiz tab: fretboard SVG (quiz mode) + filter bar (as answer buttons)
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/NoteTrainer.svelte` | New | Full component with tabs, SVG, quiz logic |
| `src/lib/types/chord.ts` | Modified | Extend `ViewName` with `'note-trainer'` |
| `src/App.svelte` | Modified | Add `'note-trainer'` route branch |
| `src/lib/components/HomePage.svelte` | Modified | Add Note Trainer card after Progression Builder |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Octave/unison line rendering clutters fretboard | Medium | Toggle per overlay type; only render when note selected |
| Quiz answer button reuse confuses users | Low | Clear visual mode switch (button styling changes between modes) |
| 6×12 grid text labels illegible on small screens | Medium | Min font size on mobile; horizontal scroll on narrow viewports |

## Rollback Plan

Remove `'note-trainer'` from ViewName, delete `NoteTrainer.svelte`, remove HomePage card. No data migrations.

## Dependencies

- None. Reuses `stringY`, `fretLineX`, `noteX` from `layout.ts` and `semitoneToNoteName` from `notes.ts`. `STANDARD_TUNING` from `chord.ts`.

## Success Criteria

- [ ] Note Trainer accessible from home page card
- [ ] Explore mode renders 6×12 note grid with readable labels
- [ ] Filter bar highlights all positions of selected note across the grid
- [ ] Octave and unison lines render when a note is selected (toggleable)
- [ ] Quiz mode presents random position with 4 answer options
- [ ] Scoring tracks correct/total, streak, and best streak
- [ ] Difficulty selector constrains fret range
- [ ] Responsive layout works on mobile and desktop
