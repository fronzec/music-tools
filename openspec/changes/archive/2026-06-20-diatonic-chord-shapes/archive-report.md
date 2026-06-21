# Archive Report — diatonic-chord-shapes

**Archived**: 2026-06-20
**Status**: CLOSED — fully merged to main, 1762 tests pass, 0 skipped
**Artifact store**: hybrid (Engram + OpenSpec)

---

## Summary

The `diatonic-chord-shapes` change adds open-position chord shape diagrams to every triad card in the Diatonic Harmonizer. Each of the 12 major keys now shows 7 compact SVG chord diagrams with role-colored dots, open/muted gutter badges, barre bars, and a note-name column. The full-neck `ChordFretboard` that was removed in PR #66 is replaced by a purpose-built `ChordShapeDiagram` component driven by a 84-entry voicing data module.

---

## What Shipped

### Voicing Data
- **84 voicings** across all 12 major keys × 7 scale degrees
- All voicings pass 7 correctness invariants: subset membership, root presence, ≥3 strings played, finger coverage, barre coverage, metadata agreement, and role totality

### New Modules (3)
| File | Description |
|------|-------------|
| `src/lib/theory/openVoicings.ts` | `OpenVoicing` type, `OPEN_VOICINGS` data map, `voicingRole` helper, `getOpenVoicing` lookup |
| `src/lib/theory/shapeLayout.ts` | Pure SVG geometry: `SL` constants, `slStringY`, `slFretLineX`, `slNoteX`, `slViewBoxW`, `slViewBoxH` — independent of `layout.ts` |
| `src/lib/components/ChordShapeDiagram.svelte` | Compact shape diagram SVG component; role-colored dots via static `ROLE_CLASS` const (Tailwind purge-safe); `data-*` attribute hooks for testing |

### Wiring (1 additive edit)
- `src/lib/components/DiatonicHarmonizer.svelte`: added `getOpenVoicing` import and `<ChordShapeDiagram>` per chord card; no new `$state`

### New Tests
- `tests/unit/theory/shapeLayout.test.ts`
- `tests/unit/theory/openVoicings.test.ts` (correctness invariants + sharp-key no-open-strings block)
- `tests/components/ChordShapeDiagram.test.ts`

### Existing files untouched
`ChordFretboard.svelte`, `ChordBuilder.svelte`, `layout.ts`, `chords.ts`, `diatonics.ts` — byte-for-byte identical throughout.

---

## Delivery — Chained PR Chain (#67–#73)

The change used `stacked-to-main` chain strategy across 6 PRs.

| PR | Scope |
|----|-------|
| #67 (PR1) | Infrastructure vertical slice: `shapeLayout.ts`, `openVoicings.ts` skeleton + C major (7 voicings), `ChordShapeDiagram.svelte`, DiatonicHarmonizer wiring |
| #68 (PR2) | Natural keys: G, D, A, E, F (35 voicings) |
| #69 (PR3) | Flat-spelled keys: A#, D#, G# + B (28 voicings) |
| #70 (PR4) | Sharp keys: C#, F# (14 voicings); sharp-key test block activated; final 84-voicing correctness gate |
| #71 | Style pass (readability) |
| #72 | (see #73 below) |

### Merge Incident and Recovery (PR #73)

**What happened**: The original plan used `feature-branch-chain` bases for PRs 2–5. After PR1 merged to `main`, PRs 2–5 were not retargeted to point to the previous PR's head. When PR2 was merged, PRs 3–5 still targeted `feat/diatonic-chord-shapes-pr1`, causing their diffs to include commits from earlier slices. The cumulative diff appeared on `main` but some intermediate commits were effectively missing from the linear history as individual PRs.

**Recovery**: Recovered from the PR5 tip commit. All code was present on `main`. A cleanup PR (#73) was raised to close the open base-targeting issues and confirm `main` reflected all 84 voicings. Post-recovery `vitest run` confirmed 1762 tests passing.

**Lesson captured**: When using `stacked-to-main`, each PR must retarget its base to `main` (or the immediately preceding PR's merge commit) after each merge. Do not leave child PRs targeting feature-branch heads of earlier slices after those heads have been merged.

---

## Final Verification

| Check | Result |
|-------|--------|
| `npx vitest run` | 44 files, **1762 tests passed**, 0 failed, 0 skipped |
| `npx svelte-check --threshold error` | 13 ERRORS — all pre-existing in App.svelte; 0 new errors |
| OPEN_VOICINGS coverage | 12 keys × 7 degrees = 84 voicings confirmed |
| Sharp-key Block E (35 tests) | Active, all passing |
| Existing tests (ChordFretboard, ChordBuilder, layout) | No new failures |

**Verify-report verdict**: PASS_WITH_WARNINGS (0 CRITICAL, 1 WARNING, 1 SUGGESTION)

WARNING: `C# IV` shape (`frets=[null,9,11,11,11,9]`, baseFret=9) is musically correct but sits high on the neck (9th–11th fret). `F# vii°` is a non-standard diagonal shape. Both are flagged for guitarist review in a future quality pass; neither is a spec violation.

---

## Spec Reconciliation

The delta spec (Requirement: Voicing Data Contract, scenario "Sharp-key voicing uses baseFret > 1") described a stale invariant. The as-built and as-tested invariant is:

> **Sharp-spelled keys (C#, F#, G#, D#, A#) use barre or movable shapes with no open strings.**

`A# degree I` is a valid A-shape barre at fret 1 (`baseFret=1`, barre `{fret:1, fromString:0, toString:5}`). It has `baseFret=1` but zero open strings — the actual musical property of sharp-key shapes. The test suite asserts `no played fret === 0` (Block E), not `baseFret > 1`.

The canonical spec at `openspec/specs/diatonic-chord-shapes/spec.md` has been written with the correct as-built wording. The stale scenario in the delta spec is superseded.

---

## Engram Artifact Observation IDs

| Artifact | Observation ID |
|----------|---------------|
| proposal | #418 |
| spec | #420 |
| design | #421 |
| tasks | #422 |
| verify-report | #424 |
| archive-report | (this document — saved to Engram as `sdd/diatonic-chord-shapes/archive-report`) |

---

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
The canonical spec lives at `openspec/specs/diatonic-chord-shapes/spec.md`.
The change folder will be moved by the orchestrator to `openspec/changes/archive/2026-06-20-diatonic-chord-shapes/`.
