# Archive Report: chord-fretboard-mirror

**Change**: chord-fretboard-mirror  
**Branch**: feat/chord-fretboard-mirror  
**Artifact Store**: openspec (files)  
**Date**: 2026-06-16  
**PR**: #63 (merged to main)  
**Verdict**: ARCHIVED — PASS WITH WARNINGS

---

## Executive Summary

The chord-fretboard-mirror change (Chord Builder Phase 2) is complete, verified, and merged to main as PR #63. The change adds a full-neck fretboard mirror below the chromatic ruler in Chord Builder: a pure theory helper (`chordPositions` function) that maps triads to neck positions, and a presentational component that renders degree-labeled, role-colored dots across a 6×15 fretboard. The mirror reacts live to root and quality selection using only existing derived state (no new `$state`). All 950 tests pass, build succeeds, and zero new svelte-check errors introduced.

---

## Artifacts Created

### Canonical Specifications

1. **`openspec/specs/chord-fretboard/spec.md`** — NEW  
   Canonical spec for the chord-fretboard capability: pure theory helper interface and function, presentational component contract, accessibility, reactivity, and constraint invariants. Replaces the delta spec in the change folder.

2. **`openspec/specs/chord-builder/spec.md`** — MODIFIED  
   Added "Requirement: Chord Fretboard Mirror Below Ruler (Phase 2 Delta)" section with four scenarios documenting the modified capability: fretboard renders, updates on root/quality change, uses ruler-matched colors.

### Archived Change Folder

3. **`openspec/changes/archive/2026-06-16-chord-fretboard-mirror/`** — NEW DIRECTORY  
   Contains:
   - `proposal.md` — Original scope, business problem, capabilities, risks, rollback plan
   - `spec.md` — Phase 2 delta specification (all requirements, scenarios, sections 1–4)
   - `design.md` — Architecture decisions (ADR-1, ADR-2, ADR-3), integration points, testing strategy
   - `tasks.md` — Review workload forecast, locked design decisions, implementation order, 10 task groups

---

## Verification Evidence

| Command | Result | Status |
|---------|--------|--------|
| `npm test -- --run` | 950 tests pass (910 pre-existing + 40 new) | ✓ PASS |
| `npm run build` | tsc clean; Vite bundle 207.83 kB | ✓ PASS |
| `npx svelte-check` | 12 pre-existing errors; zero new | ✓ PASS |

### Test Coverage
- **Unit tests** (`tests/unit/theory/chordFretboard.test.ts`): 20 tests covering all 4 qualities × 12 roots, edge cases, determinism
- **Component tests** (`tests/components/ChordFretboard.test.ts`): 15 tests covering rendering, role colors, degree labels, reactivity, accessibility
- **Wrapper tests** (`tests/components/ChordBuilder.test.ts` extended): 5 new assertions on fretboard presence, root/quality reactivity

### Code Changes Summary

| Artifact | Type | Lines | Status |
|----------|------|-------|--------|
| `src/lib/theory/chordFretboard.ts` | New | ~45 | ✓ Complete |
| `src/lib/components/ChordFretboard.svelte` | New | ~95 | ✓ Complete |
| `src/lib/components/ChordBuilder.svelte` | Modified | +9 (1 import, 1 `<section>`) | ✓ Complete |
| Tests (3 files) | New/Extended | ~185 | ✓ Complete |
| **Total changed lines** | — | **~334** | Under 400-line budget ✓ |

---

## Specification Compliance

### Section 1 — chordFretboard.ts
- [x] `ChordFretboardPosition` interface with `degreeIndex` field (per ADR-1)
- [x] `chordPositions(rootPc, offsets)` pure function — normalizes root, iterates 6×15 grid, returns positions with role
- [x] All 4 triads × all 12 roots produce correct results
- [x] Edge cases: negative root, overflow, duplicate-offset tie discipline
- [x] Unit tests written and passing before component implementation

### Section 2 — ChordFretboard.svelte
- [x] Props API: `rootPc`, `offsets`, `degrees`, `rootName`, `chordName`, `width`
- [x] Full neck rendering (0–14 frets), reusing `layout.ts` helpers
- [x] One `<circle>` per position; root → `fill-note-root`, tone → `fill-note-tone` (ruler colors, not IntervalFretboard's `fill-accent`)
- [x] `data-role` on every dot; degree labels via `degrees[degreeIndex]`; `text-anchor="middle"`
- [x] `role="img"`, non-empty `aria-label`, `<title>`
- [x] Reactivity: re-renders on `rootPc` or `offsets` change
- [x] Svelte 5 runes only (`$props()`, `$derived`, no `$state`, no `on:*`)
- [x] Token-only colors: no hardcoded hex/rgb/hsl on chord-tone circles

### Section 3 — ChordBuilder.svelte Wiring
- [x] `<ChordFretboard>` rendered below ruler/info card
- [x] `rootPc`, `offsets`, `degrees`, `rootName`, `chordName` wired from existing derived state
- [x] Zero new `$state` declarations (all 3 pre-existing: `root`, `quality`, `reducedMotion`)
- [x] Mirror updates when root changes (existing RootSelector handler)
- [x] Mirror updates when quality changes (existing quality toggle handler)
- [x] No `<svelte:boundary>` wrapping component

### Section 4 — Quality & Constraint Invariants
- [x] Token-only SVG colors; no hardcoded colors on chord-tone elements
- [x] No 7th/9th chord support; no drag mode; no enharmonic spelling; no voicing selection
- [x] Existing suite stays green (950 total, zero regressions)
- [x] No new svelte-check errors
- [x] Additive only; full rollback possible (delete theory helper, component, tests; remove wiring element)

---

## Design Decisions Encoded

| ADR | Decision | Encoding | Status |
|-----|----------|----------|--------|
| ADR-1 | Use `degreeIndex` (not raw `offset`) for label alignment | Interface field + component render | ✓ Implemented |
| ADR-2 | Role colors match ruler (`fill-note-root`/`fill-note-tone`), NOT IntervalFretboard's `fill-accent` | CSS class assignments + test assertions | ✓ Implemented |
| ADR-3 | One additive `<section>` below info card; no new state owner | Single wiring element; binding to existing derived state | ✓ Implemented |

---

## Issues and Notes

### WARNINGS (1)

**WARNING — spec.md "B string open" scenario has documentation errors**

- **File**: `openspec/changes/chord-fretboard-mirror/spec.md:129–135`
- **Error 1**: Scenario header says "string index 1 (B string)" — INCORRECT. STANDARD_TUNING = [E,A,D,G,B,E] = [4,9,2,7,11,4], so string index 1 is A, not B. B string is stringIndex 4.
- **Error 2**: Scenario uses field `offset` — SUPERSEDED by design ADR-1 which replaces it with `degreeIndex`.
- **Impact**: Cosmetic documentation error. Implementation correctly uses `stringIndex: 4` for B string and `degreeIndex` for all positions. All tests pass.
- **Resolution**: Archive spec and canonical specs do not repeat these errors. Noted in spec for future correction if delta is re-referenced.

### SUGGESTIONS (2)

**SUGGESTION — Token color table mentions `fill-white` Tailwind class as preferred fallback**

- **File**: `openspec/changes/chord-fretboard-mirror/spec.md:484`
- **Context**: Spec says `fill="white"` on `<text>` is acceptable, but "if `fill-white` exists, SHOULD use it instead."
- **Reality**: `fill-white` does NOT exist in `tailwind.config.js`. Implementation correctly uses `fill="white"` literal.
- **Impact**: No action needed; implementation follows the spec's fallback path correctly.

**SUGGESTION — Component does not import TRIAD_DEGREES or TriadQuality directly**

- **File**: `ChordFretboard.svelte`
- **Context**: Design ADR-2 mentions these imports "only for typing/fallback." Implementation receives `degrees` as a prop, does not hardcode labels.
- **Impact**: Cleaner; component is decoupled from label vocabulary. This is the intended design.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation | Status |
|------|------------|-----------|--------|
| CSS vars don't resolve in SVG presentation attributes | Med | Use Tailwind `fill-*`/`stroke-*` classes only; no `fill="rgb(var(...))"`; tests assert classes | ✓ MITIGATED |
| Color drift from ruler | Med | Lock `fill-note-root` (root), `fill-note-tone` (tone); test assertions match ruler colors; design doc explains divergence from IntervalFretboard | ✓ MITIGATED |
| Degree labels misaligned | Low | Carry `degreeIndex` on positions; component resolves `degrees[degreeIndex]` (index-based, not render-order); test asserts known-cell label | ✓ AVOIDED |
| Scope creep (7ths, drag, enharmonics) | Med | All explicitly out-of-scope; design locked; no UI in this phase | ✓ LOCKED |
| Suite regression | Low | 950 tests pass; zero regressions on 910 pre-existing | ✓ PASS |

---

## Rollback Path

Fully additive. To revert:

1. Delete `src/lib/theory/chordFretboard.ts`
2. Delete `src/lib/components/ChordFretboard.svelte`
3. Delete `tests/unit/theory/chordFretboard.test.ts`
4. Delete `tests/components/ChordFretboard.test.ts`
5. Remove `import ChordFretboard` and the `<ChordFretboard>` `<section>` from `ChordBuilder.svelte`
6. Remove new assertions from `ChordBuilder.test.ts`

No shared modules mutated; Phase 1 Chord Builder restored exactly.

---

## Session Info

- **Session ID**: ses_1407e174dffeQhZmzhP4pHhiKc
- **Project**: music-tools
- **Artifact Store Mode**: openspec (files) + engram (verify report)
- **Verified**: 2026-06-16 19:54:44
- **Merged**: PR #63 to main

---

## Final Checklist

- [x] All tasks complete (10/10)
- [x] All tests green (950 pass)
- [x] Build clean (tsc + vite)
- [x] No new svelte-check errors
- [x] Spec requirements met (50+ scenarios)
- [x] Design decisions encoded
- [x] Additive only, fully reversible
- [x] Canonical specs created/updated
- [x] Change folder copied to archive
- [x] Ready for permanent storage

**Status: READY FOR ARCHIVE**
