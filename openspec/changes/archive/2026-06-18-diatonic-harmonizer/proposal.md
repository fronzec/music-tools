# Proposal: Diatonic Harmonizer (the 7 triads of a major key)

## Intent

Chord Builder teaches how ONE root plus stacked thirds becomes ONE named chord. It answers "what is this chord?". It does NOT answer the next question a theory student asks: "given a KEY, what chords belong to it?". Diatonic Harmonizer is a new top-level tool that answers exactly that. Pick any major key; the tool stands on each of the 7 scale notes (C D E F G A B for C major), stacks diatonic thirds using ONLY scale notes, and shows the triad that falls out of each degree — its name, its Roman-numeral degree, its quality, its notes, and a full-neck fretboard diagram. The quality is never chosen by the user: it EMERGES from which scale notes land, producing the fixed pattern **I maj, ii min, iii min, IV maj, V maj, vi min, vii° dim** in every major key. Seeing that pattern hold across all 12 keys is the whole lesson.

## Business Problem

The app's owner is a guitar student whose teacher assigned homework: harmonize major keys other than C by hand. Today there is nothing in the app to CHECK that homework. Chord Builder is root-relative (one chord at a time); it cannot show the key as a palette of 7 related chords, nor reveal that the maj/min/min/maj/maj/min/dim pattern is fixed. A student grinding this by hand has no fast, trustworthy way to verify their work, so errors go uncaught and the underlying insight — that diatonic quality is a consequence of scale geometry, not a choice — stays implicit. Filling this gap turns the app into a self-checking harmony reference and makes the existing tools compound: intervals are the vocabulary, Chord Builder is the grammar of one chord, Diatonic Harmonizer is the grammar of a whole key.

## Scope

### In Scope (MVP)

- A **new top-level tool**, Diatonic Harmonizer, reachable from the home page and at its own URL `/diatonic-harmonizer`.
- **Major key only.** A root selector across all 12 chromatic roots, REUSING the existing `RootSelector` component to pick the major key.
- Display of the **7 diatonic triads** of the selected major scale, in degree order I → vii°.
- **One card per chord**, each showing: the chord **name** (e.g. "Dm"), the **Roman-numeral degree** (`I ii iii IV V vi vii°`), the **quality** (maj / min / dim), the chord's **notes**, and a **full-neck fretboard diagram** REUSING the existing `ChordFretboard.svelte` component for that triad.
- A **new pure theory module** `src/lib/theory/diatonics.ts`: the major-scale intervals `[0, 2, 4, 5, 7, 9, 11]` and a function that, given a major-key root, returns the 7 diatonic triads each with its degree number, Roman label, quality, root, and notes. Pure, no DOM, no audio. Fully unit-tested first (strict TDD).
- A **new presentational component** `src/lib/components/DiatonicHarmonizer.svelte`.
- Required routing/registry integration so the tool is navigable, deep-linkable, and counted by analytics (see Affected Areas).

### Out of Scope (named explicitly)

- **Minor keys and modes.** v1 is MAJOR keys only. The natural-minor / modal harmonizations are a meaningfully different palette (different quality pattern) and are deferred; the theory module is designed to extend without committing the UI now.
- **Audio / playback.** No Play button, no arpeggio, no block chord. v1 is visual only.
- **7th chords / extensions** (maj7, m7, V7, m7♭5, …). v1 stacks diatonic TRIADS only (root + 3rd + 5th).
- **Progression building / strumming / function labels** (tonic / subdominant / dominant naming, cadence suggestions). Out — this tool DISPLAYS the key's palette; it does not compose with it.
- **Enharmonic key spelling** (deciding F♯ major vs G♭ major spelling per note). v1 uses the project's existing `semitoneToNoteName` spelling, same as every other tool; "correct" key-signature spelling is deferred.

## Capabilities

### New Capabilities

- `diatonic-harmonizer`: a key-palette tool. Pick a major key; the tool shows its 7 diatonic triads in degree order, each as a card with chord name, Roman-numeral degree, quality, notes, and a full-neck fretboard diagram. Read-only, visual, no audio.
- `diatonic-harmony-theory`: a pure module (`src/lib/theory/diatonics.ts`) mapping a major-key root → the 7 diatonic triads with degree, Roman label, quality, root, and notes. Reusable by future features (minor keys, 7ths, progression suggestions).

### Modified Capabilities

- `app-shell`: gains a `'diatonic-harmonizer'` `ViewName`, a route branch in `App.svelte`, and a home-registry entry. The exhaustiveness guard in `routing.ts` REQUIRES the union and the `VIEW_NAMES` array to stay in sync.

## Approach

1. **Theory first (strict TDD).** Add `src/lib/theory/diatonics.ts`:
   - `MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]` — semitone offsets of the major scale from its root.
   - A function (e.g. `diatonicTriads(rootName)`) that, for each scale degree `i` (0–6), builds the triad by stacking diatonic thirds — the 1st, 3rd, and 5th SCALE notes from that degree (indices `i`, `i+2`, `i+4`, wrapping mod 7 with octave carry). It then classifies the resulting triad into a `TriadQuality` (`'maj' | 'min' | 'dim'`) by inspecting the semitone gaps (root→3rd, 3rd→5th: 4+3 = maj, 3+4 = min, 3+3 = dim), and returns each as `{ degree: 1..7, roman: 'I'|'ii'|…|'vii°', quality, rootPc, rootName, notes }`. For a well-formed major scale this MUST yield the fixed pattern `maj, min, min, maj, maj, min, dim` — asserted directly in tests across all 12 roots.
   - Each triad's offsets for the fretboard come from REUSING `TRIAD_OFFSETS[quality]` in `src/lib/theory/chords.ts`; degree labels from `TRIAD_DEGREES[quality]`; note names already flow through `semitoneToNoteName` (`src/lib/theory/notes.ts`). Pure, no DOM. Unit-tested for all 12 major roots, the fixed quality pattern, and the Roman labels BEFORE any UI exists.
2. **Presentational component.** Add `DiatonicHarmonizer.svelte` owning the `$state` for the selected major-key root, hosting `RootSelector`, and rendering the 7 triads (from a flat `$derived` over `diatonicTriads`) as a row/grid of cards. Each card shows name, Roman degree, quality, notes, and `<ChordFretboard rootPc={triad.rootPc} offsets={TRIAD_OFFSETS[triad.quality]} degrees={TRIAD_DEGREES[triad.quality]} rootName={triad.rootName} chordName={triad.name} />`. No audio. Tokens only.
3. **Routing/registry integration** (guarded, see Affected Areas) so the tool is live.
4. **Tokens, not colors.** Cards and any SVG use the semantic design-token system only; the SVG color discipline is already handled inside the reused `ChordFretboard.svelte`.

Rationale for a STANDALONE tool over a mode inside Chord Builder: the two answer different questions. Chord Builder is root-relative — it explains a SINGLE chord's construction and lets the user pick its quality. Diatonic Harmonizer is key-relative — it shows a FIXED palette of 7 chords whose qualities are NOT chosen but DERIVED from the scale. Folding key-harmonization into Chord Builder would overload a tool whose single responsibility is one-chord construction and would muddy its root+quality model. Screaming Architecture / single responsibility says this is its own tool that REUSES the proven theory and fretboard primitives.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/diatonics.ts` | New | `MAJOR_SCALE_INTERVALS` + `diatonicTriads(rootName)` → 7 triads with degree/Roman/quality/notes; unit-tested first |
| `src/lib/components/DiatonicHarmonizer.svelte` | New | Tool wrapper: major-key root `$state`, `RootSelector`, 7 chord cards each embedding `<ChordFretboard>`; no audio |
| `src/lib/types/chord.ts` | Modified | Add `'diatonic-harmonizer'` to the `ViewName` union |
| `src/lib/routing.ts` | Modified | **REQUIRED**: add `'diatonic-harmonizer'` to `VIEW_NAMES` — the compile-time exhaustiveness guard fails `tsc` otherwise |
| `src/App.svelte` | Modified | Add a `'diatonic-harmonizer'` route branch with `<svelte:boundary>`, matching the other tools |
| `src/lib/data/tools.ts` | Modified | Add an `active` entry (`view: 'diatonic-harmonizer'`) in the **Fretboard & Theory** category, alongside Chord Builder |
| `src/lib/theory/chords.ts` | Reuse | `TRIAD_OFFSETS`, `TRIAD_DEGREES`, `TriadQuality`, `chordTones` for building/labeling each triad |
| `src/lib/theory/notes.ts` | Reuse | `semitoneToNoteName`, `noteNameToSemitone` |
| `src/lib/components/ChordFretboard.svelte` | Reuse | Renders each diatonic triad's full neck given `rootPc` + `offsets` + `degrees` — as-is |
| `src/lib/components/RootSelector.svelte` | Reuse | Major-key root selection UI |
| `src/lib/types/chord.ts` | Reuse | `NoteName`, `CHROMATIC` |
| `tests/unit/` | New | Unit tests for `diatonics.ts` (all 12 roots, fixed quality pattern, Roman labels) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Forgetting to add `'diatonic-harmonizer'` to `VIEW_NAMES` after the union edit | Med | The exhaustiveness guard fails `tsc` — caught at build, called out as a required step here |
| Quality classification off-by-one (mislabels iii or vii°) | Med | Classify by measuring the two semitone gaps (4+3 maj, 3+4 min, 3+3 dim), not by hardcoding per index; assert the full `maj,min,min,maj,maj,min,dim` pattern for ALL 12 roots in tests |
| Roman-numeral casing/symbol wrong (`vii°` vs `VII`) | Low | Drive Roman labels from quality (lowercase for min/dim, uppercase for maj, `°` suffix for dim); unit-tested |
| Diatonic-third stacking wraps the scale incorrectly (octave carry) | Med | Build triads from scale-degree indices `i, i+2, i+4` mod 7 with explicit octave carry; tested against known C-major answers (C E G, D F A, … B D F) |
| 7 full-neck fretboards on one screen look cluttered / heavy | Med | Reuse the existing compact `ChordFretboard`; lay cards out in a responsive grid; this is the decided visual — consistent with the tool family |
| Enharmonic spelling looks "wrong" to a strict theory eye (e.g. A♯ vs B♭ in some keys) | Low | Out of scope for v1; uses the project-wide `semitoneToNoteName` spelling, same as every other tool; documented as a known deferral |
| Scope creep toward minor keys / modes / 7ths / audio / progressions | Med | All explicitly out; theory module designed to extend (quality classifier already generalizes) without committing UI now |
| Change exceeds the ~400-line budget | Med | Theory pure and small, component presentational, fretboard + selector reused wholesale, wiring is the standard 4-place registration; single PR expected |

## Rollback Plan

The tool is additive. Revert by deleting `diatonics.ts`, `DiatonicHarmonizer.svelte`, and their tests, then removing `'diatonic-harmonizer'` from the `ViewName` union AND from `VIEW_NAMES` (kept in sync so `tsc` passes), dropping the `App.svelte` route branch, and removing the `tools.ts` registry entry. No shared module is mutated destructively — `chords.ts`, `notes.ts`, `ChordFretboard.svelte`, and `RootSelector.svelte` are only consumed, not changed — so reverting restores the prior tool set exactly. The `/diatonic-harmonizer` analytics path simply stops appearing.

## Dependencies

- None new. The theory primitives (`TRIAD_OFFSETS`, `TRIAD_DEGREES`, `chordTones`, `semitoneToNoteName`), the `ChordFretboard.svelte` component, the `RootSelector.svelte` component, and the routing/registry/analytics plumbing are all already merged. A new `/diatonic-harmonizer` route gets a Vercel Analytics pageview automatically — no extra work.

## Constraints

- **Strict TDD active.** Test runner: vitest (`npm test -- --run`). The `diatonics.ts` module is pure and fully unit-tested BEFORE any UI is wired.
- **Rebrand-ready / token-based** — cards and any SVG use semantic design tokens, NO hardcoded colors. SVG color discipline is already enforced inside the reused `ChordFretboard.svelte` (Tailwind `fill-*`/`stroke-*` classes, never `fill="rgb(var(--x))"`).
- **Single PR**, target ~under 400 lines.
- Generated artifacts (code, docs, identifiers, UI copy) in **English**.
- **Conventional commits**, no AI attribution.
- Existing suite must stay green; **no new svelte-check errors**.
- Minimal and idiomatic: flat `$state` / `$derived` runes, presentational/stateful split, pure theory isolated from components.

## Success Criteria

- [ ] Diatonic Harmonizer appears as an `active` tool in the **Fretboard & Theory** home category and opens at `/diatonic-harmonizer`.
- [ ] Picking a major-key root (via `RootSelector`) shows that key's 7 diatonic triads in degree order I → vii°.
- [ ] Each chord card shows the chord name, the Roman-numeral degree, the quality (maj / min / dim), the chord's notes, and a full-neck `ChordFretboard` diagram for that triad.
- [ ] The quality pattern is `maj, min, min, maj, maj, min, dim` (I ii iii IV V vi vii°) for EVERY one of the 12 major keys — derived, never hardcoded per key.
- [ ] `src/lib/theory/diatonics.ts` is pure and unit-tested for all 12 major roots, the fixed quality pattern, and the Roman labels, written BEFORE the UI.
- [ ] `'diatonic-harmonizer'` is in both the `ViewName` union and `VIEW_NAMES`; `tsc` passes (exhaustiveness guard satisfied).
- [ ] No audio anywhere in the tool; no minor keys, no modes, no 7ths/extensions, no progression features (all explicitly deferred).
- [ ] Tokens only — no hardcoded colors. Suite stays green; no new svelte-check errors.
