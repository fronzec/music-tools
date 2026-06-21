# Proposal: Diatonic Harmonizer Open-Position Chord Shapes

## Intent

PR #66 removed the per-chord full-neck fretboard from the Diatonic Harmonizer, leaving each chord card with an empty slot ("fretboards removed; new shape diagrams pending"). Learners can see *which* triads a key contains but no longer see *how to play* them. Replace that empty slot with a per-chord open-position chord-shape diagram — an actual playable voicing (finger numbers 1-4, open `O` / muted `×` markers, barre bar, and a note-name column colored by interval role) for all 12 major keys.

## Scope

### In Scope
- `src/lib/theory/openVoicings.ts` — types + 84 hand-authored voicings (12 keys × 7 degrees) + `getOpenVoicing(keyRoot, degree)` lookup (throws on missing data).
- `src/lib/theory/shapeLayout.ts` — compact ~5-fret-window geometry, independent of `layout.ts`.
- `src/lib/components/ChordShapeDiagram.svelte` — presentational SVG, role-colored via tokens only.
- Wiring into `DiatonicHarmonizer.svelte` (the slot the fretboard vacated; no new state).
- Correctness test over all 84 voicings + component rendering test.

### Out of Scope
- Audio / playback.
- Seventh chords or chord extensions.
- The mockup's 7-in-a-row single-line layout (kept only if trivially compatible with the existing card grid).
- Any change to `ChordFretboard.svelte`, `ChordBuilder.svelte`, or `layout.ts`.

## Capabilities

### New Capabilities
- `diatonic-chord-shapes`: open-position playable voicings for every diatonic triad of all 12 major keys, plus the compact shape-diagram rendering and the voicing-correctness contract.

### Modified Capabilities
- None. (`DiatonicHarmonizer` wiring is additive; no spec-level behavior of existing capabilities changes.)

## Approach

Hand-author all 84 voicings (Option A) keyed by `NoteName` → `[degree 1..7]`. Frets are ABSOLUTE (low E index 0 → high e 5), so role math is trivial: `pc = (STANDARD_TUNING[i] + fret) % 12`. A new isolated geometry module drives a presentational SVG that derives each played string's role (root / third / fifth) at render time and colors it with `fill-note-root` / `fill-note-third` / `fill-note-tone` (all tokens confirmed in `tailwind.config.js`).

### Resolved design decisions
1. **baseFret display convention**: Open-position voicings (`baseFret === 1`) render a thick nut. When a shape sits up the neck (`baseFret > 1`) render a thin top line and a small fret-number label in the left gutter beside the lowest visible fret (e.g. "5fr"). Exposed as `data-base-fret`.
2. **vii° (diminished) strategy**: Use the lowest practical, most common method-book diminished shape per key; partial 4-string voicings are acceptable and standard. First-inversion or non-root-position shapes are allowed as long as the root pitch class is present and all played notes are chord tones.
3. **General voicing-selection rule**: Lowest practical open/barre position; most common pedagogical (method-book) shape; prefer all 6 strings but allow muted strings. Sharp keys (C#, F#, G#, D#, A#) naturally use barre/movable shapes via `baseFret`.
4. **Layout**: Keep the existing chord-card grid unchanged; the diagram occupies the slot the fretboard vacated. Do NOT force the mockup's 7-in-a-row line unless trivially compatible.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/theory/openVoicings.ts` | New | 84 voicings + types + lookup |
| `src/lib/theory/shapeLayout.ts` | New | Compact fret-window geometry |
| `src/lib/components/ChordShapeDiagram.svelte` | New | Presentational SVG diagram |
| `tests/unit/theory/openVoicings.test.ts` | New | Correctness over all 84 |
| `tests/components/ChordShapeDiagram.test.ts` | New | Token/role/marker rendering |
| `src/lib/components/DiatonicHarmonizer.svelte` | Modified | Wire diagram into card slot |
| `ChordFretboard.svelte`, `ChordBuilder.svelte`, `layout.ts` | Untouched | Regression guard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Authoring errors across ~840 fret values | High | Mandatory correctness test (played PCs ⊆ chord tones, root present, ≥3 strings); ship nothing until green |
| Missing voicing in data | Med | `getOpenVoicing` throws with descriptive message; test catches omissions |
| Sharp-key barre shapes sit high on neck | Med | `baseFret` label convention (decision 1) |
| Diagram size: 84 voicings + component + tests far exceed 400-line review budget | High | Chained/stacked PRs — decided at the tasks/apply gate, not here |

## Rollback Plan

All work is additive: 3 new modules + 2 test files + one additive edit to `DiatonicHarmonizer.svelte`. Revert by removing the new files and the single import/slot in the harmonizer; no shared modules touched, so no regression surface.

## Dependencies

- None external. Relies on existing `STANDARD_TUNING`, `diatonicTriads`, `TRIAD_OFFSETS`, and confirmed `note-root`/`note-third`/`note-tone` tokens.

## Success Criteria

- [ ] All 12 major keys show a playable open-position voicing for each of the 7 diatonic triads.
- [ ] Correctness suite passes for all 84 voicings (subset, root present, ≥3 strings).
- [ ] Diagrams use color tokens only (no `#rrggbb`/`rgb`/`hsl`); roles colored correctly.
- [ ] `ChordFretboard`/`ChordBuilder`/`layout.ts` unchanged; their tests still pass.
