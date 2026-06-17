# Proposal: Chord Fretboard Mirror (Chord Builder Phase 2)

## Intent

Chord Builder already teaches chord **construction** in the abstract: a chromatic ruler lights the chord tones at their semitone offsets, so a learner sees that a chord is intervals stacked from a root. What it does NOT do yet is connect that abstraction to the **instrument** — where those tones actually live under the fingers. This change adds a **fretboard mirror** below the ruler / info card: a full guitar neck that lights every position of the current chord's tones (root + 3rd + 5th), reacting live to the same root + quality selection the ruler already uses. The neck closes the loop: ruler shows *what the chord is*, the mirror shows *where it is on the guitar*.

## Business Problem

This is a teaching app, and Phase 1 left an obvious gap between "I understand C major = C-E-G" and "I can find C major on the neck." A learner who grasps the formula on the ruler still has to mentally project those three pitch classes onto six strings and fourteen frets — exactly the cognitive jump the app exists to remove. The Interval Trainer already does this projection for two notes (root + target) with its Explore fretboard; Chord Builder should do the same for three. Reusing that proven visual makes the construction lesson land on the instrument instead of staying theoretical, and keeps the whole tool family visually consistent.

## Scope

### In Scope

- A **new pure theory helper** `src/lib/theory/chordFretboard.ts` exporting `chordPositions(rootPc, offsets)`, modeled exactly on `intervalPositions()` in `src/lib/theory/intervals.ts`. It walks every string (0–5) × fret (0–`MAX_FRET`) on the standard-tuned neck, and for each cell whose pitch class matches a chord offset, emits a `ChordFretboardPosition` carrying `stringIndex`, `fret`, `pitchClass`, the matched `offset`, and a `role` (`'root'` for offset 0, else `'tone'`). Unit-tested first (strict TDD).
- A **new presentational component** `src/lib/components/ChordFretboard.svelte`, modeled on `src/lib/components/IntervalFretboard.svelte`: full neck, frets 0–14 via `FL.MAX_FRET_SPAN`, reusing the layout helpers from `src/lib/theory/layout.ts` (`L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW/H`, `FRET_MARKERS`) and the existing SVG token classes.
- **Degree labels on each dot** (`1` / `♭3` / `5` / `♯5`), sourced from `TRIAD_DEGREES` in `src/lib/theory/chords.ts`, aligned to each tone by its offset — matching the ruler markers.
- **Wiring into `src/lib/components/ChordBuilder.svelte`**: render `<ChordFretboard rootPc={rootPc} offsets={triad.offsets} ... />` below the chromatic ruler / info card, driven by the existing root + quality `$state`/`$derived` already present in the wrapper. No new state owner.

### Out of Scope (other Phase 2 items — separate changes)

- **7th chords / extensions** (maj7, 7, dim7, m7♭5, 9, …). Mirror renders triads only.
- **Exploratory drag mode** — dragging markers and naming whatever is built. Separate change.
- **Enharmonic spelling** on the neck (deciding D♯ vs E♭ per context). Out.
- **Jump-label alignment** refinements on the ruler. Out.
- **Chord voicings / playable shapes** — this mirror shows ALL chord-tone positions across the neck, NOT a single fingering. Picking a fingerable shape is a different feature, deferred.

## Capabilities

### New Capabilities

- `chord-fretboard-mirror`: a full-neck guitar diagram inside Chord Builder that lights every position of the current chord's tones, each dot labeled with its degree, colored by role (root vs other tone), reacting live to the root + quality selection.
- `chord-fretboard-theory`: a pure helper (`src/lib/theory/chordFretboard.ts`) mapping `(rootPc, offsets)` → all matching neck positions with role + offset. Reusable by future Phase 2 features (extensions, voicings).

### Modified Capabilities

- `chord-builder`: gains the fretboard mirror beneath the ruler/info card. No behavioral change to root selection, quality toggle, ruler, or Play — purely additive rendering bound to existing derived state.

## Approach

1. **Theory first (strict TDD).** Add `src/lib/theory/chordFretboard.ts`:
   - `interface ChordFretboardPosition { stringIndex: number; fret: number; pitchClass: number; offset: number; role: 'root' | 'tone' }`
   - `chordPositions(rootPc: number, offsets: readonly number[]): ChordFretboardPosition[]` — bounded double `for` loop over `STANDARD_TUNING` × frets `0..MAX_FRET`; normalize `rootPc` mod-12; for each cell, find the matching offset (if any) and push a position. Offset 0 → `role: 'root'`; any other matched offset → `role: 'tone'`. Pure, no DOM, no audio. Unit-tested for all four qualities across all 12 roots before any UI exists, plus edge cases (duplicate pitch classes across strings, octave wrap).
2. **Presentational component.** Add `ChordFretboard.svelte` taking `rootPc`, `offsets`, optional `degrees`, optional `rootName`/`width`. Derive `marks = chordPositions(rootPc, offsets)`. Render the same neck scaffold as `IntervalFretboard.svelte` (background, fret lines, string lines, fret-marker dots, nut), then map `marks` to dots: `role === 'root'` → `fill-note-root`; otherwise → `fill-note-tone`; degree label centered in each dot via the offset→`TRIAD_DEGREES` lookup. Each dot carries `data-role` for testability.
3. **Wire into Chord Builder.** In `ChordBuilder.svelte`, render `<ChordFretboard>` below the ruler/info card, passing `rootPc` and `triad.offsets` (and `triad.degrees`) from the existing derived `triad`. No new `$state`.
4. **Tokens, not colors.** Use Tailwind `fill-*`/`stroke-*` CLASSES only — never `fill="rgb(var(--x))"`, since CSS variables do not resolve in SVG presentation attributes.

Rationale for reusing the IntervalFretboard pattern over a bespoke diagram: the Explore-mode fretboard is already the project's canonical "all positions of these pitch classes" visual, already token-driven, already tested via `data-role` + class assertions. Mirroring it for three tones instead of two keeps the tool family visually and behaviorally consistent and reuses the layout math wholesale.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/chordFretboard.ts` | New | Pure `chordPositions(rootPc, offsets)` + `ChordFretboardPosition`; unit-tested first |
| `src/lib/components/ChordFretboard.svelte` | New | Presentational full-neck mirror; role-colored dots, degree labels, `data-role`, tokens only |
| `src/lib/components/ChordBuilder.svelte` | Modified | Render `<ChordFretboard rootPc offsets degrees />` below the ruler/info card; no new state |
| `src/lib/theory/intervals.ts` | Reuse (reference) | `intervalPositions` is the model; `MAX_FRET`, `STANDARD_TUNING` reused |
| `src/lib/theory/layout.ts` | Reuse | `L`, `FL`, `stringY`, `fretLineX`, `noteX`, `viewBoxW/H`, `FRET_MARKERS` |
| `src/lib/theory/chords.ts` | Reuse | `getTriad` / `TRIAD_OFFSETS` / `TRIAD_DEGREES` for offsets + degree labels |
| `src/lib/components/IntervalFretboard.svelte` | Reuse (reference) | Scaffold + `data-role` test pattern to mirror |
| `tests/unit/` | New | Unit tests for `chordPositions` (all qualities × roots, edge cases) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSS variables don't resolve in SVG presentation attributes | Med | Known gotcha: use Tailwind `fill-*`/`stroke-*` classes only, never `fill="rgb(var(--x))"` |
| Color drift from the ruler | Med | Lock root = `fill-note-root`, other tones = `fill-note-tone` to match the ruler markers; reviewed before merge |
| Degree labels misaligned to the wrong tone | Low | Carry the matched `offset` on each position and resolve the label via `TRIAD_DEGREES` by offset, not by render order |
| Note: IntervalFretboard uses `fill-accent`/`fill-note-root`; mirror uses `fill-note-root`/`fill-note-tone` | Low | Intentional — the mirror matches the RULER's role colors, not the Interval Trainer's; documented here so it is not "fixed" toward IntervalFretboard |
| Dense neck (many lit positions) looks cluttered | Low | Full neck is the decided behavior; consistent with Interval Trainer Explore mode |
| Scope creep toward voicings / 7ths / drag / enharmonics | Med | All explicitly out; helper designed to extend without committing UI now |
| Change exceeds line budget | Low | ~120–150 new lines + tests; helper pure, component presentational, wiring is one element — single PR expected |

## Rollback Plan

Fully additive. Revert by deleting `chordFretboard.ts`, `ChordFretboard.svelte`, and their tests, then removing the single `<ChordFretboard>` element from `ChordBuilder.svelte`. No shared module is mutated, no state owner changes, no routing/registry touched — reverting restores the Phase 1 Chord Builder exactly.

## Dependencies

- None new. `chords.ts` (`getTriad`/`TRIAD_OFFSETS`/`TRIAD_DEGREES`), `layout.ts`, `intervals.ts` (`MAX_FRET`, `STANDARD_TUNING`), and `IntervalFretboard.svelte` are all already merged.

## Constraints

- **Strict TDD active.** Vitest IS installed and green (910 tests pass). The stale `strict_tdd: false` / `installed: false` in `openspec/config.yaml` is wrong for this change and MUST be ignored — `chordPositions` is unit-tested before any UI.
- **Rebrand-ready / token-based** — tokens only, NO hardcoded colors; respect the design-token system. SVG gotcha applies (use `fill-*`/`stroke-*` classes).
- **Conventional commits**, no AI attribution.
- Existing suite stays green; **no new svelte-check errors**.
- Minimal and idiomatic: pure helper isolated from the component, presentational/stateful split, flat `$derived`.

## Success Criteria

- [ ] `chordPositions(rootPc, offsets)` returns every neck position (frets 0–14, strings 0–5) whose pitch class matches a chord offset, with `role: 'root'` for offset 0 and `role: 'tone'` otherwise, and the matched `offset` on each position.
- [ ] `chordPositions` is pure and unit-tested for all four triads across all 12 roots, plus edge cases, **written before** the component.
- [ ] `ChordFretboard.svelte` renders the full neck (frets 0–14) and lights all chord-tone positions, modeled on `IntervalFretboard.svelte`, reusing the `layout.ts` helpers.
- [ ] Root dots use `fill-note-root`; other tone dots use `fill-note-tone` — matching the ruler markers.
- [ ] Each dot is labeled with its degree (`1` / `♭3` / `5` / `♯5`) via `TRIAD_DEGREES`, aligned by offset.
- [ ] Every dot carries `data-role` (`'root'` | `'tone'`); tests assert role + class as in the IntervalFretboard pattern.
- [ ] The mirror reacts live to the existing root + quality selection in `ChordBuilder.svelte`, with no new state owner.
- [ ] Tokens only — no hardcoded colors, no `fill="rgb(var(--x))"` in SVG.
- [ ] Suite stays green; no new svelte-check errors. Out-of-scope Phase 2 items (7ths, drag mode, enharmonics, jump-label alignment, voicings) are not included.
