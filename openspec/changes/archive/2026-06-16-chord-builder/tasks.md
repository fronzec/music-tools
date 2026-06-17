# Tasks: Chord Builder

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~426 |
| Production lines only | ~241 |
| Test lines | ~185 |
| 400-line budget risk | Medium (overage is tests) |
| Chained PRs recommended | No |
| Suggested split | Single PR + `size:exception` |
| Delivery strategy | single-pr |
| Chain strategy | n/a (single PR) |

Decision needed before apply: No (user decided: single PR + `size:exception`)
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Medium — production code ~241 lines (under budget); overage is strict-TDD test lines (~185); exception accepted.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature: theory module + ruler + wrapper + audio + integration | PR 1 | ~426 lines, size:exception; production code well under 400 |

---

## Implementation Order Summary

```
1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1 → 5.2 → 6.1 → 6.2 → 7.1 → 7.2 → 7.3 → 7.4 → 8.1 → 8.2 → 8.3 → 8.4
```

Strict TDD order: failing test → minimal implementation → green — per layer, bottom-up:
1. Pure theory (chords.ts) — tests first
2. Chromatic ruler component — tests first
3. playChord additive method — test first
4. ChordBuilder wrapper — tests first
5. Integration edits (types + routing + app + registry) — paired atomic edit
6. Full verification

---

## Phase 1: Pure Theory Module — `src/lib/theory/chords.ts` (TDD — tests first)

Spec: Section 1 — TriadQuality type, TRIAD_OFFSETS, TRIAD_FORMULA, TRIAD_INTERVAL_JUMPS, chordTones, chordName, chordMidi

> **Design reconciliation note.** The design (ADR-1) proposes a consolidated `TRIADS` table + `getTriad` total function as the primary API. The spec requires the named exports `TRIAD_OFFSETS`, `TRIAD_FORMULA`, `TRIAD_INTERVAL_JUMPS`, `chordTones`, `chordName`, and `chordMidi` as individually importable constants/functions. The implementation MUST satisfy BOTH: export all spec-required names (the tested surface) AND may derive them from / alongside the `TRIADS` table and `getTriad` helper if desired. `TriadQuality` uses the short-form values locked in the spec: `'maj' | 'min' | 'dim' | 'aug'`.

- [x] 1.1 Write **failing** `tests/unit/chords.test.ts`
  - Import `TriadQuality`, `TRIAD_OFFSETS`, `TRIAD_FORMULA`, `TRIAD_INTERVAL_JUMPS`, `chordTones`, `chordName`, `chordMidi` from `$lib/theory/chords`
  - `TRIAD_OFFSETS`: assert each of the four qualities returns the correct tuple:
    - `maj` → `[0, 4, 7]`; `min` → `[0, 3, 7]`; `dim` → `[0, 3, 6]`; `aug` → `[0, 4, 8]`
  - `TRIAD_FORMULA`: assert exact Unicode strings:
    - `maj` → `'1 - 3 - 5'`; `min` → `'1 - ♭3 - 5'`; `dim` → `'1 - ♭3 - ♭5'`; `aug` → `'1 - 3 - ♯5'`
  - `TRIAD_INTERVAL_JUMPS`: assert jump arrays:
    - `maj` → `['+4', '+3']`; `min` → `['+3', '+4']`; `dim` → `['+3', '+3']`; `aug` → `['+4', '+4']`
  - `chordTones`:
    - C major (rootPc=0, offsets=[0,4,7]) → `['C', 'E', 'G']`
    - C minor (rootPc=0, offsets=[0,3,7]) → `['C', 'D#', 'G']`
    - C diminished (rootPc=0, offsets=[0,3,6]) → `['C', 'D#', 'F#']`
    - C augmented (rootPc=0, offsets=[0,4,8]) → `['C', 'E', 'G#']`
    - G major (rootPc=7, offsets=[0,4,7]) → `['G', 'B', 'D']`
    - A# minor (rootPc=10, offsets=[0,3,7]) → `['A#', 'C#', 'F']`
    - All 12 roots × 4 qualities: loop asserts result is array of 3 valid note name strings
  - `chordName`:
    - `('C', 'maj')` → `'C major'`; `('C', 'min')` → `'C minor'`
    - `('C', 'dim')` → `'C diminished'`; `('C', 'aug')` → `'C augmented'`
    - `('F#', 'min')` → `'F# minor'`; `('A#', 'dim')` → `'A# diminished'`; `('G#', 'aug')` → `'G# augmented'`
    - All 12 roots × 4 qualities: result non-empty and matches `"{root} {word}"` pattern
  - `chordMidi`:
    - `(0, [0,4,7], 4)` → `[60, 64, 67]`
    - `(7, [0,4,7])` (default octave=4) → `[67, 71, 74]`
    - `(0, [0,4,8], 4)` → `[60, 64, 68]`
  - All assertions must FAIL (red) before implementation; no production file created yet

- [x] 1.2 Implement `src/lib/theory/chords.ts`
  - Export `TriadQuality` type: `'maj' | 'min' | 'dim' | 'aug'`
  - Export `TRIAD_OFFSETS`: `Record<TriadQuality, readonly [0, number, number]>`
    - `{ maj: [0,4,7], min: [0,3,7], dim: [0,3,6], aug: [0,4,8] } as const`
  - Export `TRIAD_FORMULA`: `Record<TriadQuality, string>`
    - `{ maj: '1 - 3 - 5', min: '1 - ♭3 - 5', dim: '1 - ♭3 - ♭5', aug: '1 - 3 - ♯5' } as const`
  - Export `TRIAD_INTERVAL_JUMPS`: `Record<TriadQuality, readonly [string, string]>`
    - `{ maj: ['+4','+3'], min: ['+3','+4'], dim: ['+3','+3'], aug: ['+4','+4'] } as const`
  - Export `chordTones(rootPc: number, offsets: readonly number[]): string[]`
    - Pure: `offsets.map(o => semitoneToNoteName(rootPc + o))` (mod-12 handled by `semitoneToNoteName`)
    - Import `semitoneToNoteName` from `$lib/theory/notes`
  - Export `chordName(rootName: string, quality: TriadQuality): string`
    - Mapping: `{ maj: 'major', min: 'minor', dim: 'diminished', aug: 'augmented' }`
    - Returns `` `${rootName} ${QUALITY_WORDS[quality]}` ``
  - Export `chordMidi(rootPc: number, offsets: readonly number[], octave = 4): number[]`
    - Root MIDI: `(octave + 1) * 12 + rootPc`
    - Returns `offsets.map(o => rootMidi + o)`
  - Optional (design): may also export `TRIADS` table + `getTriad` as a convenience total function; these are additive and do NOT replace the required named exports above
  - All Phase 1 tests must pass (green); run `npm test` — full suite (834 + new) stays green

  Commit: `feat(theory): add chords.ts pure theory module with triad types and functions`

---

## Phase 2: Chromatic Ruler Component (TDD — tests first)

Spec: Section 2 — ChromaticRuler.svelte (presentational)

- [x] 2.1 Write **failing** `tests/components/ChromaticRuler.test.ts`
  - Import and render `ChromaticRuler` with props: `rootPc: number`, `quality: TriadQuality`, `reducedMotion: boolean`
  - **Slot count:** assert exactly 12 semitone slot cells are rendered for any root/quality combination
  - **Chord tone highlighting (maj):** slots at offset positions 0, 4, 7 have the note-root/note-tone token class; all others have the inactive token class
  - **Chord tone highlighting (min):** offsets 0, 3, 7 are highlighted
  - **Chord tone highlighting (dim):** offsets 0, 3, 6 are highlighted
  - **Chord tone highlighting (aug):** offsets 0, 4, 8 are highlighted
  - **No hardcoded colors:** assert no class or inline style in the rendered markup contains `#`, `rgb(`, `hsl(`, `fill="`, `stroke="` (string match on outerHTML)
  - **Interval jump annotations:** quality=maj → jump label `'+4'` between root and third, `'+3'` between third and fifth
  - **Jump annotations (dim):** both jumps show `'+3'`
  - **Formula display:** quality=min → element containing `'1 - ♭3 - 5'`; quality=aug → element containing `'1 - 3 - ♯5'`
  - **Note name labels (C major):** labels contain `'C'`, `'E'`, `'G'` at offsets 0, 4, 7
  - **Note name labels (G minor, rootPc=7):** labels contain `'G'`, `'A#'`, `'D'` at offsets 0, 3, 7
  - **Chord name display:** rootPc=5 (F), quality=maj → element containing `'F major'`; quality changes to dim → `'C diminished'` (use rootPc=0)
  - **Marker slide — reducedMotion=false:** transition utility class IS present on marker elements
  - **Marker slide — reducedMotion=true:** transition utility class IS NOT present (no animation)
  - **Prop-driven:** mount with rootPc=0, quality=maj; re-render with rootPc=7; assert note names and chord name update to G major without any internal mutation (purely prop-driven)
  - **Key by index (load-bearing):** when quality changes maj→min, the third marker element (positional index 1) updates its position rather than being destroyed and recreated — assert by checking the element identity or `data-marker-index` attribute stays consistent
  - All assertions must FAIL (red) before implementation

- [x] 2.2 Implement `src/lib/components/ChromaticRuler.svelte`
  - Props via `$props()`: `rootPc: number`, `quality: TriadQuality`, `reducedMotion?: boolean = false`
  - `$derived` values: `offsets = TRIAD_OFFSETS[quality]`, `formula = TRIAD_FORMULA[quality]`, `jumps = TRIAD_INTERVAL_JUMPS[quality]`, `notes = chordTones(rootPc, offsets)`, `name = chordName(CHROMATIC[rootPc], quality)`, `degrees` aligned with offsets (derive from quality/formula or a local map)
  - DOM structure (12 slot cells + absolutely-positioned markers): CSS/flexbox track, no SVG
  - 12 slot cells: `{#each Array.from({length:12},(_,i)=>i) as s (s)}` — each cell shows semitone index label; chord-tone cells get highlighted token class; non-chord-tone cells get inactive token class; determine via `TRIAD_OFFSETS[quality].includes(s)`
  - Markers: `{#each offsets as offset, i (i)}` — key MUST be positional index `i`, NOT `offset`; this is load-bearing for the CSS slide animation (same DOM node updates, Svelte does not tear down/rebuild)
  - Each marker: `class` includes `bg-note-root` (i===0) or `bg-note-tone` (i>0); includes transition utility only when `!reducedMotion`; `style` drives `transform: translateX(...)` or `left: calc(offset/12 * 100%)`; `aria-label="{notes[i]} ({degree})"` for accessibility; shows degree label text
  - Jump annotations: `{#each jumps as jump, i (i)}` — render between chord-tone markers; show `jump` string sourced from `TRIAD_INTERVAL_JUMPS`
  - Formula: display `formula` from `TRIAD_FORMULA[quality]`
  - Chord name: display `name` from `chordName(CHROMATIC[rootPc], quality)`
  - No hardcoded hex/rgb/hsl/SVG fill values anywhere; all color via Tailwind semantic token utilities (`bg-note-root`, `bg-note-tone`, `border-hairline`, `bg-surface-*`, `text-accent-*`)
  - Svelte 5 runes only: `$props()`, `$derived`, no `on:` syntax, no `createEventDispatcher`, no `<slot>`
  - All Phase 2 tests must pass (green); run `npm test` — full suite stays green

  Commit: `feat(components): add ChromaticRuler presentational component`

---

## Phase 3: playChord Additive Method on NotePlayer (TDD — test first)

Spec: Section 3 — Play Button (block chord phase), ADR-4

- [x] 3.1 Write **failing** test for `playChord` in `tests/unit/playNote.test.ts` (or the existing playNote test file)
  - `createNotePlayer()` return value exposes a `playChord(freqs: number[]): void` method
  - When called, schedules all provided frequencies at the SAME start time (simultaneous strike, not staggered)
  - Does NOT throw in jsdom (AudioContext absent or stubbed — match existing pattern for `playSequence` tests)
  - `playSequence` and `dispose` remain unchanged (no regressions on existing playNote tests)
  - Test must FAIL (red) before implementation

- [x] 3.2 Add `playChord` to `src/lib/audio/playNote.ts`
  - Additive only: do NOT modify `playSequence`, `dispose`, or any existing logic
  - New method on the object returned by `createNotePlayer()`:
    ```ts
    function playChord(freqs: number[]): void {
      if (!ctx) ctx = new AudioContext();
      const t = ctx.currentTime;
      freqs.forEach((freq) => scheduleNote(ctx!, freq, t));
    }
    ```
  - Reuses the existing `scheduleNote` envelope and context lifecycle
  - Export type for the returned player object must now include `playChord` (update the interface/type if one exists)
  - All Phase 3 tests must pass (green); existing `playNote` tests must stay green

  Commit: `feat(audio): add playChord simultaneous-strike method to NotePlayer`

---

## Phase 4: ChordBuilder Stateful Wrapper (TDD — tests first)

Spec: Section 3 — ChordBuilder.svelte (stateful), audio arpeggio+block, back navigation, Svelte 5 runes

- [x] 4.1 Write **failing** `tests/components/ChordBuilder.test.ts`
  - **Initial state:** mount `ChordBuilder` with a navigate spy; assert root=C, quality=maj; chord name element contains `'C major'`; formula element contains `'1 - 3 - 5'`; note name elements contain `'C'`, `'E'`, `'G'`
  - **Quality toggle present:** assert exactly 4 toggle controls labeled `maj`, `min`, `dim`, `aug`; one is in active/aria-pressed state
  - **Quality change (maj→dim):** click dim toggle; assert chord name = `'C diminished'`, formula = `'1 - ♭3 - ♭5'`, ruler reflects offsets 0,3,6
  - **Toggle back (maj):** after switching to min, switch back to maj; assert ruler restores major offsets 0,4,7 and chord name = `'C major'`
  - **Root change via RootSelector:** interact with RootSelector to select G; assert chord name = `'G major'`, notes = `'G'`, `'B'`, `'D'`
  - **Play button exists:** assert a play control is present and has an accessible aria-label; it must be keyboard-activatable
  - **Play triggers arpeggio:** inject a fake player (via optional `player` prop defaulting to `createNotePlayer()` — see injectable-prop seam); activate play; assert `fakePlayer.playSequence` is called with the arpeggio frequencies for C, E, G (use `vi.spyOn` or a manual spy)
  - **Play triggers block chord:** after arpeggio, assert `fakePlayer.playChord` is scheduled (either via a stubbed `setTimeout` or by advancing fake timers with `vi.useFakeTimers`)
  - **No autoplay on mount:** mount without user interaction; assert neither `playSequence` nor `playChord` is called
  - **Back navigation:** activate the back-to-home control; assert the `navigate` prop is called with `'home'`
  - **Svelte 5 compliance:** no `on:click`, no `createEventDispatcher`, no `<slot>` in the component source (assert via source code inspection or compilation absence of deprecation warnings)
  - **Play — correct MIDI for current state:** set root=F# (rootPc=6), quality=min; activate play; assert `playSequence` is called with frequencies corresponding to `chordMidi(6, [0,3,7])` mapped through `midiToFreq`
  - All assertions must FAIL (red) before implementation

- [x] 4.2 Implement `src/lib/components/ChordBuilder.svelte`
  - Props: `{ navigate: (view: ViewName) => void; player?: ReturnType<typeof createNotePlayer> }` via `$props()` — injectable player seam for testing
  - State: `let root = $state<NoteName>('C')`, `let quality = $state<TriadQuality>('maj')`
  - Derived: `const triad = $derived(getTriad(root, quality))` (use `getTriad` from `chords.ts` OR derive inline from the required exports); `const rootPc = $derived(CHROMATIC.indexOf(root))`
  - Player: `const _player = player ?? createNotePlayer()` — use injected player in tests, real player in production
  - `reducedMotion` state read via `$effect` on mount (guard: `typeof window !== 'undefined' && window.matchMedia?.(...).matches === true`)
  - `play()` function:
    - Compute `freqs = triad.offsets.map(o => midiToFreq(ROOT_MIDI + rootPc + o))` where `ROOT_MIDI = 60`
    - Call `_player.playSequence(freqs)` — arpeggio
    - Schedule block: `blockTimer = setTimeout(() => _player.playChord(freqs), freqs.length * 700 + 150)`
  - `$effect` teardown: `clearTimeout(blockTimer); _player.dispose()`
  - Template structure:
    - Back-to-home button: `onclick={() => navigate('home')}`, visible label
    - Title and short description
    - `<RootSelector notes={CHROMATIC} selected={root} onSelect={(n) => (root = n)} label="..." buttonAriaLabel="..." />`
    - Quality toggle: 4 buttons for `maj`, `min`, `dim`, `aug`; `aria-pressed={quality === q.id}`; `onclick={() => (quality = q.id)}`; active state uses accent token class; `onclick` syntax (no `on:click`)
    - `<ChromaticRuler {rootPc} {quality} {reducedMotion} />`
    - Chord name display (`triad.name`)
    - Formula display from `TRIAD_FORMULA[quality]`
    - Note names display (`triad.notes.join(' ')` or individual spans)
    - Play button: `onclick={play}`, `aria-label="Play chord"`
  - Svelte 5 runes only: `$state`, `$derived`, `$effect`, `$props()`; no `on:` event syntax; no `createEventDispatcher`; no `<slot>`
  - No hardcoded colors; all color via semantic token Tailwind utilities
  - All Phase 4 tests must pass (green); run `npm test` — full suite stays green

  Commit: `feat(components): add ChordBuilder stateful wrapper with arpeggio+block playback`

---

## Phase 5: Integration Edits — Types + Routing + App + Registry (paired atomic)

Spec: Section 4 — ViewName extension, VIEW_NAMES, routing, App.svelte branch, tools.ts entry

> **Paired constraint (task 5.1):** `ViewName` union and `VIEW_NAMES` array MUST be updated together in the same commit. The compile-time exhaustiveness guard in `routing.ts` makes adding to the union without the array a `tsc` error — the two are permanently coupled. This is a deliberate safeguard; do NOT split them across commits.

- [x] 5.1 **[PAIRED — must edit together]** Extend `ViewName` union AND `VIEW_NAMES` array
  - `src/lib/types/chord.ts`: add `| 'chord-builder'` to the `ViewName` union
  - `src/lib/routing.ts`: add `'chord-builder'` to the `VIEW_NAMES` array
  - These two edits MUST be in the same commit; `tsc` enforces their sync via the exhaustiveness guard `_UnionIsSubsetOfArray`
  - After edit: `pathToView('/chord-builder')` returns `'chord-builder'` and `viewToPath('chord-builder')` returns `'/chord-builder'` (derived automatically from `VIEW_NAMES` logic — no routing code change needed)
  - Verify `npm run build` (tsc) passes; run `npm test` — routing round-trip tests for `chord-builder` now pass

  Commit: `feat(routing): add chord-builder to ViewName union and VIEW_NAMES`

- [x] 5.2 Add `ChordBuilder` route branch in `src/App.svelte`
  - Import `ChordBuilder from '$lib/components/ChordBuilder.svelte'` at the top of the script
  - Add route branch in the view switch/if-chain:
    ```svelte
    {:else if currentView === 'chord-builder'}
      <svelte:boundary failed={errorFallback}>
        <ChordBuilder {navigate} />
      </svelte:boundary>
    ```
  - Match the exact `<svelte:boundary failed={errorFallback}>` pattern used by all other tool branches
  - No other changes to `App.svelte`
  - Run `npm test` — full suite stays green

  Commit: `feat(app): add chord-builder route branch with svelte:boundary`

- [x] 5.3 Add `tools.ts` active registry entry
  - `src/lib/data/tools.ts`: add an active entry to the **Fretboard & Theory** category (`id: 'fretboard-theory'` or whichever key that category uses):
    ```ts
    {
      status: 'active',
      view: 'chord-builder',
      title: 'Chord Builder',
      description: 'See how a root plus stacked thirds becomes a named chord',
      icon: '🎹',
    },
    ```
  - Place alongside existing active entries (CAGED Visualizer, Scales Explorer, Note Trainer, Tab Player)
  - Existing entries must remain unmodified and all three (CAGED, Scales, etc.) must still be present
  - `tsc` enforces that `view` is a valid `ViewName` — the Phase 5.1 union change enables this
  - Run `npm test` — full suite stays green

  Commit: `feat(home): add Chord Builder active entry to Fretboard & Theory category`

---

## Phase 6: No-Op Type Export (if needed)

Spec: Section 4, Requirement: TriadQuality Added to Type System

- [x] 6.1 Verify `TriadQuality` is importable from its module
  - `TriadQuality` is already exported from `src/lib/theory/chords.ts` (Phase 1.2)
  - Confirm it can be imported in `ChordBuilder.svelte` and `ChromaticRuler.svelte` without error
  - If the spec requires re-export from `src/lib/types/chord.ts`, add: `export type { TriadQuality } from '$lib/theory/chords'` — additive only, does not affect `ChordQuality` or any existing type
  - Run `npx svelte-check` — no new type errors

  > Note: this task may be a no-op if the direct import path from `chords.ts` satisfies all consumers. Check and skip if unnecessary.

  Commit (if needed): `feat(types): re-export TriadQuality from types/chord for convenience`

---

## Phase 7: Full Verification

Spec: Section 5 — test coverage, no hardcoded colors, suite stays green, Phase 2 items absent

- [x] 7.1 Run `npm test` — full Vitest suite must pass. Baseline is 834 tests + all new chord-builder tests. Zero regressions. Verify new test file counts:
  - `tests/unit/chords.test.ts` — theory module scenarios (covers all spec Section 1 requirements)
  - `tests/components/ChromaticRuler.test.ts` — ruler component scenarios
  - `tests/components/ChordBuilder.test.ts` — wrapper scenarios including play stub, navigation

- [x] 7.2 Run `npm run build` (which invokes `tsc --noEmit`)
  - Must succeed with zero errors
  - The `VIEW_NAMES` exhaustiveness guard is enforced by `tsc`, NOT the test runner — this is the definitive check that the union/array are in sync
  - Confirms `TriadQuality` as `Record<TriadQuality, ...>` keys are exhaustive (all four qualities present)
  - Confirms `tools.ts` entry `view: 'chord-builder'` is a valid `ViewName`

- [x] 7.3 Run `npx svelte-check --tsconfig ./tsconfig.json` — zero new errors
  - Confirms component prop types are correct
  - Confirms `$props()` destructuring is type-safe
  - Confirms no `on:click` / `<slot>` Svelte 4 syntax lingering

- [x] 7.4 Confirm Phase 2 items are absent (quick source scan):
  - No fretboard or neck visualization component is imported or rendered in `ChordBuilder.svelte`
  - No 7th/9th/extended chord types exist in `chords.ts`
  - No drag/recognition mode logic in any new file
  - No `<svelte:component this={FretboardVisualizer}` or equivalent in `App.svelte` for chord-builder

---

## Spec Requirements Coverage

| Requirement (Spec Section) | Tasks |
|---|---|
| **Section 1** | |
| TriadQuality type (`'maj'\|'min'\|'dim'\|'aug'`) | 1.1, 1.2 |
| TRIAD_OFFSETS table (all 4 qualities) | 1.1, 1.2 |
| TRIAD_FORMULA table (all 4 formula strings) | 1.1, 1.2 |
| TRIAD_INTERVAL_JUMPS table (all 4 jump arrays) | 1.1, 1.2 |
| `chordTones` pure function | 1.1, 1.2 |
| `chordName` pure function | 1.1, 1.2 |
| `chordMidi` pure function | 1.1, 1.2 |
| **Section 2** | |
| Exactly 12 semitone slots rendered | 2.1, 2.2 |
| Chord tone highlighting (all 4 qualities) | 2.1, 2.2 |
| No hardcoded colors | 2.1, 2.2 |
| Interval jump annotations from TRIAD_INTERVAL_JUMPS | 2.1, 2.2 |
| Formula display from TRIAD_FORMULA | 2.1, 2.2 |
| Note name labels from chordTones | 2.1, 2.2 |
| Chord name display from chordName | 2.1, 2.2 |
| Animated marker slide on quality change (key by index) | 2.1, 2.2 |
| prefers-reduced-motion gate (prop-driven, self-contained) | 2.1, 2.2 |
| Presentational props API (stateless, $derived) | 2.1, 2.2 |
| **Section 3** | |
| Root + quality $state, defaults (C/maj) | 4.1, 4.2 |
| Root selection via RootSelector | 4.1, 4.2 |
| Quality toggle (4 options, one active) | 4.1, 4.2 |
| Play button — arpeggio then block chord | 3.1, 3.2, 4.1, 4.2 |
| No autoplay on mount | 4.1, 4.2 |
| Back-to-home navigation | 4.1, 4.2 |
| Svelte 5 runes only (no on:, no createEventDispatcher, no slot) | 4.1, 4.2 |
| **Section 4** | |
| TriadQuality type importable (additive) | 1.2, 6.1 |
| ViewName union extended with 'chord-builder' | 5.1 |
| VIEW_NAMES array extended (exhaustiveness guard) | 5.1 |
| pathToView/viewToPath round-trip for chord-builder | 5.1 |
| App.svelte route branch with svelte:boundary | 5.2 |
| Home page Fretboard & Theory active entry | 5.3 |
| **Section 5** | |
| Unit tests for chords.ts | 1.1, 7.1 |
| No hardcoded colors in ChromaticRuler + ChordBuilder | 2.2, 4.2, 7.3 |
| Existing suite stays green (834+ tests) | 7.1 |
| Phase 2 items absent | 7.4 |
