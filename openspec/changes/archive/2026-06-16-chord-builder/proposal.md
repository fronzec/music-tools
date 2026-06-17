# Proposal: Chord Builder (graphical chord construction via a chromatic ruler)

## Intent

The app already teaches the **building blocks** (Interval Trainer: hear and name single intervals) and the **end result** (CAGED Visualizer / chord shapes: where a finished chord sits on the fretboard). Nothing teaches the **construction in between** — how a root note plus stacked thirds becomes a *named* chord. Chord Builder is a new top-level tool that closes that pedagogical gap by showing, graphically, that a chord is just intervals measured from a root. The core visual is a **chromatic ruler**: a 12-semitone strip on which chord tones light up at their exact offsets, so the learner literally *sees* that a major 3rd spans 4 semitones and a minor 3rd spans 3.

## Business Problem

This is a teaching app, and there is a hole in the learning path: a guitarist can drill intervals and can memorize chord shapes, but the bridge — *why* C-E-G is "C major" and *what changes* when it becomes "C minor" — is left implicit. That gap forces rote memorization of shapes instead of understanding construction. Filling it makes the existing tools compound: intervals become the vocabulary, Chord Builder becomes the grammar, and the fretboard tools become the application. It also gives the app a clear "next step" story for users who have outgrown the ear trainer.

## Scope

### In Scope (MVP)

- A **new top-level tool**, Chord Builder, reachable from the home page and at its own URL `/chord-builder`.
- **Root selection** by REUSING the existing `RootSelector` component.
- A **quality toggle** with four triads only: **maj / min / dim / aug**.
- A **chromatic ruler**: a horizontal strip of 12 semitones measured from the root, with the chord tones lit at their exact semitone offsets (e.g. C major = 0, 4, 7; diminished = 0, 3, 6; augmented = 0, 4, 8).
- On the ruler / around it, the MVP shows: the **formula** (1-3-5), the **interval jumps** between adjacent tones (e.g. +4 then +3 for major), the **note names**, and the resolved **chord name**.
- **Animated marker slide on quality change** — switching maj→min visibly drops the 3rd marker from offset 4 to offset 3 and flips the name; the slide *is* the lesson. MUST respect `prefers-reduced-motion` (no motion → instant, accessible state change).
- A **Play** button that sounds the chord first as an **arpeggio (note by note)** and then as a **block**, REUSING `midiToFreq` and the existing note-player infrastructure (`src/lib/audio/playNote.ts`).
- A **new pure theory module** `src/lib/theory/chords.ts`: triad quality → semitone offsets, and (offsets + root) → note names and chord name. Fully unit-tested first (strict TDD).
- Required routing/registry integration so the tool is navigable, deep-linkable, and counted by analytics (see Affected Areas).

### Out of Scope (Phase 2 — named explicitly)

- **Mirroring the chord onto the fretboard** — showing where these tones land on the neck. Deferred to keep the MVP small; the ruler alone delivers the construction insight.
- **7th chords / extensions** (maj7, 7, dim7, m7b5, 9, etc.). MVP is triads only; the theory module is designed to extend but the UI does not expose them yet.
- **Exploratory drag mode** — dragging the 3rd/5th markers freely and having the tool *name* whatever the user builds. This needs the inverse `intervals → chord name` function (recognition, not generation) and is a meaningfully larger problem; deferred.

## Capabilities

### New Capabilities

- `chord-builder`: a graphical chord-construction tool. Pick a root and a triad quality; a chromatic ruler shows the chord tones at their semitone offsets, the formula, the interval jumps, the note names, and the chord name; quality changes animate the markers; a Play button arpeggiates then blocks the chord.
- `chord-formula-theory`: a pure module (`src/lib/theory/chords.ts`) mapping triad quality → semitone offsets and (offsets + root) → note names + chord name. Reusable by Phase 2 features.

### Modified Capabilities

- `app-shell`: gains a `'chord-builder'` `ViewName`, a route branch in `App.svelte`, and a home-registry entry. The exhaustiveness guard in `routing.ts` REQUIRES the union and the `VIEW_NAMES` array to stay in sync.

## Approach

1. **Theory first (strict TDD).** Add `src/lib/theory/chords.ts` exporting:
   - a triad table: `'maj' → [0, 4, 7]`, `'min' → [0, 3, 7]`, `'dim' → [0, 3, 6]`, `'aug' → [0, 4, 8]`;
   - `chordTones(rootPc, offsets)` → note names via the existing `semitoneToNoteName` (`src/lib/theory/notes.ts`);
   - `chordName(root, quality)` → e.g. `"C major"`, `"C dim"`, etc.
   Pure, no DOM, no audio. Unit-tested for all four qualities and all 12 roots before any UI is wired.
2. **Chromatic-ruler component** (new, presentational Svelte 5). Takes root + offsets as props; renders 12 semitone slots, lights the chord tones, annotates the interval jumps and formula. Driven by `$derived` from root + quality. Marker positions animate on change; gated by `prefers-reduced-motion`.
3. **Tool wrapper component** (new): owns the `$state` for root and quality, hosts `RootSelector`, the quality toggle, the ruler, and the Play button. Play computes MIDI from the root + offsets and reuses `midiToFreq` + the existing note player to do arpeggio-then-block.
4. **Routing/registry integration** (guarded, see Affected Areas) so the tool is live.
5. **Tokens, not colors.** The ruler uses the semantic design-token system only.

Rationale for the ruler over alternatives: a vertical stacked-thirds tower or a horizontal flow can show *which* notes are in the chord, but only the ruler visualizes interval **size** — that the major 3rd is wider than the minor 3rd by exactly one semitone — which is the deepest insight and the whole reason the tool exists.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/chords.ts` | New | Pure triad table + `chordTones` / `chordName`; unit-tested first |
| `src/lib/components/ChromaticRuler.svelte` | New | Presentational 12-semitone ruler; lit chord tones, formula, jumps; animated, reduced-motion aware |
| `src/lib/components/ChordBuilder.svelte` | New | Tool wrapper: root + quality state, `RootSelector`, quality toggle, ruler, Play (arpeggio then block) |
| `src/lib/types/chord.ts` | Modified | Add `'chord-builder'` to the `ViewName` union |
| `src/lib/routing.ts` | Modified | **REQUIRED**: add `'chord-builder'` to `VIEW_NAMES` — the compile-time exhaustiveness guard fails `tsc` otherwise |
| `src/App.svelte` | Modified | Add a `'chord-builder'` route branch with `<svelte:boundary>`, matching the other tools |
| `src/lib/data/tools.ts` | Modified | Add an `active` entry (`view: 'chord-builder'`) in the **Fretboard & Theory** category |
| `src/lib/theory/notes.ts`, `intervals.ts` | Reuse | `semitoneToNoteName`, `CHROMATIC`, `midiToFreq` |
| `src/lib/audio/playNote.ts` | Reuse | Existing note player for arpeggio + block playback |
| `src/lib/components/RootSelector.svelte` | Reuse | Root selection UI |
| `tests/unit/` | New | Unit tests for the chord-formula module |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Forgetting to add `'chord-builder'` to `VIEW_NAMES` after the union edit | Med | The exhaustiveness guard fails `tsc` — caught at build, called out as a required step here |
| CSS variables don't resolve in SVG presentation attributes | Med | Known gotcha: if the ruler uses SVG, use Tailwind `fill-*`/`stroke-*` classes, **never** `fill="rgb(var(--x))"` |
| Hardcoded colors break rebrand-readiness | Med | Ruler MUST use semantic tokens (surface/accent/note-root/note-tone/…); reviewed before merge |
| Animation ignores `prefers-reduced-motion` | Low | Gate the slide on the media query; reduced-motion gets an instant, accessible state change |
| Marker-slide animation distracts from the lesson instead of teaching it | Low | Keep the slide short and tied 1:1 to the offset delta; the moving 3rd is the focal point |
| Scope creep toward fretboard mirroring / 7ths / drag mode | Med | Explicitly Phase 2; theory module designed to extend without committing the UI now |
| Change exceeds the ~400-line budget | Med | Keep ruler presentational, theory pure, wrapper thin; defer all Phase 2 items |

## Rollback Plan

The tool is additive. Revert by deleting `chords.ts`, `ChromaticRuler.svelte`, `ChordBuilder.svelte`, and their tests, then removing `'chord-builder'` from the `ViewName` union AND from `VIEW_NAMES` (kept in sync so `tsc` passes), dropping the `App.svelte` route branch, and removing the `tools.ts` registry entry. No shared module is mutated destructively, so reverting restores the prior tool set exactly. The `/chord-builder` analytics path simply stops appearing.

## Dependencies

- None new. All theory, audio, routing, and registry primitives already merged. The recently shipped routing/analytics change means `/chord-builder` gets a Vercel Analytics pageview automatically — no extra work.

## Constraints

- **Strict TDD active** — the chord-formula module is pure and fully unit-tested before any UI.
- **Rebrand-ready / token-based** — the ruler MUST use semantic design tokens, NO hardcoded colors. SVG gotcha: CSS variables do not resolve in SVG presentation attributes; use Tailwind `fill-*`/`stroke-*` classes.
- **Conventional commits**, no AI attribution.
- Existing suite must stay green; **no new svelte-check errors**.
- Minimal and idiomatic: flat `$state` / `$derived` runes, presentational/stateful split, pure theory isolated from components.

## Success Criteria

- [ ] Chord Builder appears as an `active` tool in the **Fretboard & Theory** home category and opens at `/chord-builder`.
- [ ] Picking a root (via `RootSelector`) and toggling maj/min/dim/aug updates the ruler, formula (1-3-5), interval jumps, note names, and chord name correctly.
- [ ] The chromatic ruler lights chord tones at the correct semitone offsets for all four triads (maj 0-4-7, min 0-3-7, dim 0-3-6, aug 0-4-8).
- [ ] Changing quality animates the markers (e.g. the 3rd sliding from offset 4 to 3); `prefers-reduced-motion` yields an instant, accessible change.
- [ ] Play sounds the chord as an arpeggio then a block, reusing `midiToFreq` + the existing note player.
- [ ] `src/lib/theory/chords.ts` is pure and unit-tested for all four qualities across all 12 roots, written before the UI.
- [ ] `'chord-builder'` is in both the `ViewName` union and `VIEW_NAMES`; `tsc` passes (exhaustiveness guard satisfied).
- [ ] Ruler uses semantic design tokens only — no hardcoded colors, no `fill="rgb(var(--x))"` in SVG.
- [ ] Suite stays green; no new svelte-check errors. Phase 2 items (fretboard mirror, 7ths/extensions, drag mode) are not included.
