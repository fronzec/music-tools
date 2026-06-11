# Tasks: Note Trainer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation

- [x] 1.1 Extend `ViewName` in `src/lib/types/chord.ts` with `'note-trainer'`

## Phase 2: Create NoteTrainer component

- [x] 2.1 Create `src/lib/components/NoteTrainer.svelte` with explore/quiz modes, SVG fretboard, note filter bar, octave/unison overlays, quiz scoring, difficulty selector

## Phase 3: Wire routing

- [x] 3.1 Add `NoteTrainer` import and route branch in `src/App.svelte`
- [x] 3.2 Add Note Trainer active card in `src/lib/components/HomePage.svelte`

## Phase 4: Testing

- [x] 4.1 Create `tests/components/NoteTrainer.test.ts` — 21 tests covering explore render, note filter, quiz mode, difficulty, mode switching, back navigation
- [x] 4.2 Update `tests/components/HomePage.test.ts` with Note Trainer card assertions (4 new tests)

## Phase 5: Verification

- [x] 5.1 Build passes (`tsc --noEmit && vite build`)
- [x] 5.2 All 401 tests pass across 14 test files
