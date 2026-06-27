# Exploration: diatonic-sweep-practice

## Current State

The Diatonic Harmonizer (`src/lib/components/DiatonicHarmonizer.svelte`) renders seven diatonic triad cards per key. Each card shows: chord name + Roman numeral, a stacked-thirds construction diagram (text), and a `ChordShapeDiagram` SVG (compact 5-fret window, colored dots per role). There is also a `HarmonyMatrix` section and a `RootSelector`. **No audio exists today** — the test file explicitly comments "No AudioContext stub needed — DiatonicHarmonizer has no audio."

The 84 hand-authored `OpenVoicing` objects (12 keys × 7 degrees) in `openVoicings.ts` each carry `frets[6]` (absolute fret per string, null = muted), `baseFret`, `rootPc`, `quality`, `roman`, `name`.

`STANDARD_TUNING = [4, 9, 2, 7, 11, 4]` is in `src/lib/types/chord.ts`.

## Affected Areas

- `src/lib/components/DiatonicHarmonizer.svelte` — primary extension point; add play button + audio state
- `src/lib/audio/playNote.ts` — `playSequence` is directly reusable; STEP is hardcoded (gap if tempo control wanted)
- `src/lib/theory/openVoicings.ts` — 84 voicings already contain all fret data; no data changes needed
- `src/lib/types/chord.ts` — `STANDARD_TUNING` exists; need to add `OPEN_MIDI_NOTES = [40, 45, 50, 55, 59, 64]` (E2, A2, D3, G3, B3, E4)
- `src/lib/theory/intervals.ts` — `midiToFreq()` is already exported; fully reusable
- New pure module `src/lib/theory/arpeggioFreqs.ts` — `voicingToFreqs(voicing): number[]` (~15 lines)
- New test file for `arpeggioFreqs.ts`
- `tests/components/DiatonicHarmonizer.test.ts` — add AudioContext stub and button tests

## Approaches

| Approach | Description | Pros | Cons | Effort | Estimated Lines |
|---|---|---|---|---|---|
| **Slice A — Play button per card** | "▶" button per chord card; derives frequencies from voicing; calls `playSequence()` at fixed step | Zero new visual component; purely additive; reuses all existing audio infrastructure | Fixed tempo (0.7s = slow for real sweep); no direction control; no animation | Low | ~100–130 |
| **Slice B — Play + direction + tempo** | Extends A with ascending/descending toggle and tempo control; requires parameterizing `createNotePlayer` | Meaningful practice tool | Changes audio module API; more state in harmonizer; audio test updates | Medium | ~200–280 total |
| **Slice C — Full sweep practice panel** | Mode toggle, new `ArpeggioFretboard.svelte`, active-note animation, BPM slider | Full-featured | Exceeds 400-line budget as single PR; needs chained PRs; timing sync complexity | High | ~400–500 |

## Key Technical Findings

**Audio is ready**: `playNote.ts` exports `playSequence(freqs: number[])` which plays notes staggered by `STEP = 0.7s`. This is structurally correct for sweep audio. The only gap is the hardcoded step — for tempo control, either `createNotePlayer({ step?: number })` or a new `playSequenceAt(freqs, step)` method is needed.

**Arpeggio frequencies are fully derivable**: `freq = midiToFreq(OPEN_MIDI_NOTES[stringIndex] + fret)` for each non-null fret. `midiToFreq` exists in `intervals.ts`. `OPEN_MIDI_NOTES = [40, 45, 50, 55, 59, 64]` is a 3-line addition. The whole `voicingToFreqs` utility is ~15 lines.

**No new arpeggio data needed**: the 84 `OpenVoicing` objects are sufficient. Muted strings are skipped naturally.

**`IntervalFretboard` is NOT reusable for sweep**: it shows all occurrences of pitch classes across the full neck — wrong for showing specific voicing positions. A new thin `ArpeggioFretboard.svelte` (~80–100 lines, reusing `layout.ts` geometry) would be needed for Slice C visual.

**`ChordShapeDiagram` is already in each card**: it already shows the exact voicing shape. No new static visual needed for Slice A.

## Recommendation

**Slice A** as the first PR. It is the minimum viable feature — a guitarist can hear each diatonic arpeggio by clicking "▶". The open questions (tempo, direction, animation) are deferred until Slice A proves the concept. Estimated ~100–130 lines with tests: well within budget.

The **one domain question** that must be resolved before proposing: do we use existing open-position voicings as-is for the sweep (muted strings = gaps in the sweep, which is not guitarist-natural), or do we need separate arpeggio-specific shapes with contiguous strings? This is purely a guitar-pedagogy decision, not a code decision.

## Risks

1. **Muted strings break sweep-picking continuity**: existing voicings (e.g. B dim: `[null,2,0,null,0,1]`) have interior muted strings. A real sweep uses adjacent strings. Skipping muted strings produces a musically valid sequence but not a "sweepable" guitar shape. Proposal phase must decide whether to use existing voicings or author new contiguous-string arpeggio shapes.
2. **Hardcoded STEP = 0.7s**: this is ~40 BPM per note — too slow for practice. Even Slice A probably needs a customizable step, which makes the audio module change unavoidable. This could bump Slice A over ~160 lines (adds audio API change + test updates).
3. **`openspec/config.yaml` is stale**: says Vitest is not installed; in reality ~1762 tests exist with Vitest. All new pure utilities must have tests.
4. **No per-string octave constant**: `OPEN_MIDI_NOTES` must be added somewhere canonical (proposal must pick the right home).
5. **Active-note animation in Slice C**: Web Audio schedules in the future; syncing visual animation to scheduled note playback requires careful coordination (polling `ctx.currentTime` or `setTimeout` approximation). Medium-complexity state management.

## Open Questions for Proposal Phase

1. Use existing voicings as-is (muted = gap in sweep) OR author contiguous-string arpeggio shapes?
2. Is 0.7s/note acceptable for v1, or is tempo control (BPM) a v1 requirement?
3. Ascending only, or also descending in v1?
4. Inline "▶" per card (additive) or a dedicated "Sweep Practice" tab/section?
5. Should `OPEN_MIDI_NOTES` live in `chord.ts` alongside `STANDARD_TUNING`, or in a new `arpeggioFreqs.ts`?
6. Active-note visual highlighting in v1 or deferred to Slice C?

## Ready for Proposal

Yes. Scope is well-defined for Slice A. The proposal phase should resolve the domain question about voicing continuity (question 1) and confirm tempo requirements (question 2) before committing to scope.
