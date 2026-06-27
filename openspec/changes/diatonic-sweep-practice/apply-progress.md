# Apply Progress: diatonic-sweep-practice — PR1 (theory/data/types)

## Status

PR1 complete. All 9 tasks (T-01 through T-09) implemented test-first (strict TDD) and green.
PR2 (UI wiring — T-10 through T-20) remains; must branch from main after PR1 merges.

---

## Branch

`feat/diatonic-sweep-practice-pr1` (branched from `main`)

---

## Commits (in order)

| Hash | Message |
|------|---------|
| `566d478` | feat(progression): add ArpeggioNote, PlaybackMode, ChordQuality dim, STRING_OPEN_MIDI |
| `53bef6d` | fix(chords): tolerate missing quality in getShapes; extend FRET_MARKERS for 24-fret |
| `7b4bc20` | feat(theory): add buildArpeggio pure function with Vitest tests |
| `4cccabe` | feat(theory): add advancePlayback pure function with Vitest tests |

---

## Files Created (new)

- `src/lib/theory/arpeggioShape.ts` — pure `buildArpeggio(root, quality): ArpeggioNote[]`
- `src/lib/theory/transport.ts` — pure `advancePlayback(state, opts): PlaybackState` + `PlaybackState` interface
- `tests/unit/types/chord.test.ts` — 10 tests for `STRING_OPEN_MIDI`
- `tests/unit/theory/arpeggioShape.test.ts` — 15 tests for `buildArpeggio`
- `tests/unit/theory/transport.test.ts` — 19 tests for `advancePlayback`

## Files Modified

- `src/lib/types/chord.ts` — `ChordQuality`: `'major'|'minor'` → `'major'|'minor'|'dim'`; add `STRING_OPEN_MIDI = [40,45,50,55,59,64]`
- `src/lib/types/progression.ts` — add `ArpeggioNote` interface + `PlaybackMode` type
- `src/lib/data/chords.ts` — `getShapes` returns `[]` instead of throwing for missing `(root,quality)`
- `src/lib/theory/layout.ts` — `FRET_MARKERS` extended `[3,5,7,9,12,15]` → `[3,5,7,9,12,15,17,19,21,24]`
- `tests/unit/data/chords.test.ts` — updated throw tests to expect `[]`; added 12-root dim test
- `tests/unit/theory/layout.test.ts` — updated marker test; added extended marker assertions

---

## Test Evidence

```
PR1 target files (npm test -- arpeggioShape transport chords layout):
  Test Files  4 passed (4)
       Tests  120 passed (120)

Full suite (npm test):
  Test Files  47 passed (47)
       Tests  1809 passed (1809)
    Duration  5.22s
```

`tsc --noEmit`: zero errors.

`npx svelte-check`: 13 errors, all pre-existing in `SignalLab.svelte` and `App.svelte`
(zero introduced by PR1 — verified by running svelte-check on main before our changes).

---

## R-6 Audit Result

No exhaustive `switch`/`never` on `ChordQuality` found anywhere.
The switch in `diatonics.ts:64` is on `TriadQuality` (`'maj'|'min'|'dim'`) — a
separate intentional vocabulary (ADR-2). ChordQuality widening is safe.

---

## Decisions / Gotchas

- `getShapes('H' as NoteName, 'major')` now also returns `[]` (not just missing quality).
  Updated the pre-existing "throws for invalid root" test to match tolerant behavior.
- `FRET_MARKERS` extension is additive; `FullFretboard` guards markers by
  `mf < minFret + displaySpan (14)` — the 14-fret CAGED view is byte-identical.
- `STRING_OPEN_MIDI[i] % 12 === STANDARD_TUNING[i]` verified in tests.
- All 12 roots × 3 qualities produce strictly ascending MIDI sequences (verified analytically
  and in 36 test permutations).

---

## What Remains (PR2)

- T-10: `SweepFretboard.svelte` — new presentational 24-fret SVG component
- T-11: `ProgressionBar.svelte` — add dim `°` quality button
- T-12: `ProgressionTimeline.svelte` — add loop toggle
- T-13..T-19: `ProgressionBuilder.svelte` — mode/loop `$state`, timer wiring, board swap, `$derived` arpeggio
- T-20: PR2 gate — vitest + tsc + svelte-check + dev smoke tests
