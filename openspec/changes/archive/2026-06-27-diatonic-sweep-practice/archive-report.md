# Archive Report: diatonic-sweep-practice

**Change**: diatonic-sweep-practice — Arpeggio Sweep Mode in Progression Builder
**Archived at**: 2026-06-27
**Archive path**: `openspec/changes/archive/2026-06-27-diatonic-sweep-practice/`
**Status**: CLOSED — merged to main via PR #74 (theory/data/types) + PR #75 (UI wiring)

---

## Verification Status

- **Verify report**: PASS — 1848 tests passed, 0 new svelte-check errors, build clean
- **CRITICAL issues**: None
- **WARNING issues**: None
- **Task gate**: All 20 implementation tasks (T-01..T-20) complete per apply-progress (#492) and verify-report (#513)

> **Stale-checkbox reconciliation note**: `tasks.md` in the openspec folder retains unchecked `- [ ]` markers because `sdd-apply` operated in engram mode and never patched the filesystem artifact. The orchestrator explicitly approved archive-time reconciliation. Proof: engram observations `sdd/diatonic-sweep-practice/apply-progress` (#492) documents all 20 tasks implemented and test-first green; `sdd/diatonic-sweep-practice/verify-report` (#513) independently validates all 20 tasks against spec. No implementation task was skipped.

---

## What Shipped

**Arpeggio sweep mode in Progression Builder (v1, no audio)**

### Theory layer (PR #74)
- `ChordQuality` extended from `'major' | 'minor'` to `'major' | 'minor' | 'dim'`
- `STRING_OPEN_MIDI` constant added (`[40, 45, 50, 55, 59, 64]`)
- `ArpeggioNote` interface and `PlaybackMode` type added to `src/lib/types/`
- `buildArpeggio(root, quality): ArpeggioNote[]` — pure function, 5 events per chord, ascending string order, MIDI precomputed (no audio in v1)
- `advancePlayback(state, opts): PlaybackState` — pure transport function; drives per-note stepping in sweep mode and chord stepping in CAGED mode; handles loop
- `getShapes` tolerant of missing `(root, quality)` pairs — returns `[]` instead of throwing (covers dim in CAGED view)
- `FRET_MARKERS` extended to `[3,5,7,9,12,15,17,19,21,24]` (additive; 14-fret CAGED view byte-identical)

### UI layer (PR #75)
- `SweepFretboard.svelte` — new presentational SVG component, 24-fret neck, 5 note circles with dimmed/accent styles and diamond indicator for active note
- `ProgressionBar.svelte` — third quality button `°` (dim) added to inline quality radiogroup
- `ProgressionTimeline.svelte` — loop toggle button added, `aria-pressed` wired to `loop` prop
- `ProgressionBuilder.svelte` — mode state (`'caged' | 'sweep'`), loop state, `activeNoteIndex` state; `$derived` arpeggio from current chord; timer wired to `advancePlayback`; mode toggle control (CAGED / Sweep segmented control); board swap (`FullFretboard` ↔ `SweepFretboard`); loop props forwarded to `ProgressionTimeline`

### Deferred follow-ups (not in v1)
- **Audio playback**: `ArpeggioNote.midi` is precomputed and ready; no audio emitted in v1
- **Multi-position arpeggios**: v1 shows one fixed 5th-string-root barre shape per chord
- **Descending sweep**: v1 is ascending only (string 1 → string 5)

---

## Delivery

2-PR stacked-to-main chain:

| PR | Branch | Description | Merge |
|----|--------|-------------|-------|
| #74 | `feat/diatonic-sweep-practice-pr1` | Theory/data/types — zero UI, full test coverage | Merged to main |
| #75 | `feat/diatonic-sweep-practice-pr2` | UI wiring — SweepFretboard, dim button, loop toggle, ProgressionBuilder | Merged to main |

---

## Capability Added

| Capability | Spec location |
|------------|---------------|
| `arpeggio-sweep-mode` | `openspec/specs/arpeggio-sweep-mode/spec.md` (promoted from `PROMOTED-spec.md`) |

---

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| arpeggio-sweep-mode | Created | New standalone capability spec (6 requirements, 12 scenarios) |

---

## Archive Contents

- proposal.md — Sweep practice proposal; arpeggio sweep in Progression Builder
- spec.md — Delta spec (6 requirements: Mode Toggle, Arpeggio Note-Event Model, Note-by-Note Playback Animation, Loop Toggle, 24-Fret Sweep Fretboard, ChordQuality dim Extension)
- design.md — Technical design: `buildArpeggio`, `advancePlayback`, `SweepFretboard`, `ProgressionBuilder` wiring, risk audit
- tasks.md — 20 tasks across 2 PRs (stale unchecked markers — see reconciliation note above)
- apply-progress.md — PR1 + PR2 complete; all 20 tasks implemented test-first
- PROMOTED-spec.md — Clean standalone capability spec; moved to `openspec/specs/arpeggio-sweep-mode/spec.md`
- archive-report.md — This file

---

## Engram Traceability

| Artifact | Observation ID |
|----------|---------------|
| sdd/diatonic-sweep-practice/proposal | #483 |
| sdd/diatonic-sweep-practice/spec | #485 |
| sdd/diatonic-sweep-practice/design | #486 |
| sdd/diatonic-sweep-practice/tasks | #487 |
| sdd/diatonic-sweep-practice/apply-progress | #492 |
| sdd/diatonic-sweep-practice/verify-report | #513 |
| sdd/diatonic-sweep-practice/archive-report | (saved after this file — see engram topic_key) |

---

## SDD Cycle Complete

The diatonic-sweep-practice change has been fully planned, proposed, spec'd, designed, implemented (2-PR stacked-to-main), verified, and archived. 1848 tests pass, 0 new svelte-check errors. Arpeggio sweep mode is live in Progression Builder.
