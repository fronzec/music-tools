# Tasks: CAGED Chord Visualizer

## Review Workload Forecast

| Field                   | Value                     |
| ----------------------- | ------------------------- |
| Estimated changed lines | 1900–2200                 |
| 400-line budget risk    | High                      |
| Chained PRs recommended | Yes                       |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy       | ask-on-risk               |
| Chain strategy          | pending                   |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                  | Likely PR | Base | Est. Lines |
| ---- | ------------------------------------- | --------- | ---- | ---------- |
| 1    | Foundation: scaffold + types + theory | PR 1      | main | ~300       |
| 2    | Static chord data (120 shapes)        | PR 2      | main | ~1000      |
| 3    | Fretboard SVG component               | PR 3      | main | ~250       |
| 4    | CAGED tool + Home page                | PR 4      | main | ~350       |

**Note**: PR 2 is data-heavy (~900 of 1000 lines are static shape values). Candidate for `size:exception` — data validated by tests, not nuanced logic.

## Phase 1: Foundation — PR 1

- [x] 1.1 Scaffold: `package.json`, `vite.config.ts`, `svelte.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `.prettierrc`, `eslint.config.js`, `index.html` — Vite+Svelte5+Tailwind v3+Vitest+ESLint+Prettier. Verify: `pnpm dev`, `pnpm build`, `pnpm vitest run`
- [x] 1.2 Types: `src/lib/types/chord.ts` — ChordShape, NoteName, CagedShape, LabelMode, FretPosition, CHROMATIC, CAGED_ORDER, STANDARD_TUNING
- [x] 1.3 Theory: `src/lib/theory/notes.ts` (semitone↔name, interval calc), `src/lib/theory/tuning.ts` (tuning constant)
- [x] 1.4 Layout math: `src/lib/theory/layout.ts` — stringY(), fretLineX(), noteX(), viewBoxW, viewBoxH
- [x] 1.5 Tests: `tests/unit/theory/notes.test.ts` — semitone↔name, interval calc. Dep: 1.3. Run: `pnpm vitest run`
- [x] 1.6 Tests: `tests/unit/theory/layout.test.ts` — coordinate functions. Dep: 1.4. Run: `pnpm vitest run`
- [x] 1.7 App shell: `src/main.ts`, `src/App.svelte`, `src/app.css` — entry point, currentView routing, Tailwind directives

## Phase 2: Chord Data — PR 2 ✅ COMPLETE

- [x] 2.1 Data + lookup: `src/lib/data/caged-shapes.json` (120 pre-computed shapes), `src/lib/data/chords.ts` (getShapes, getAllRoots, getAllQualities, validate), `scripts/generate-caged-shapes.ts` (regeneration script)
- [x] 2.2 Validation: `tests/unit/data/chords.test.ts` — 36 tests: 120 shape count, CAGED order, null consistency, baseFret anchoring, rootString validation, interval correctness, known open chord verification, uniqueness. Run: `pnpm vitest run`

## Phase 3: Fretboard SVG — PR 3

- [ ] 3.1 SVG component: `src/lib/components/Fretboard.svelte` — strings, fret lines, markers (3/5/7/9/12/15), note dots (root=blue/R=11, tone=green/R=8, other=outline/R=5), barre indicator, open(O)/muted(X) markers, interval/note labels, viewBox scaling
- [ ] 3.2 Tests: `tests/components/Fretboard.test.ts` — SVG element count, note colors, barre line, labels, a11y aria-label. Dep: 3.1 (needs @testing-library/svelte in devDeps). Run: `pnpm vitest run`

## Phase 4: CAGED Tool + Home — PR 4

- [ ] 4.1 State: `src/lib/state/caged-state.svelte.ts` — $state(selectedRoot=C, selectedQuality=major, labelMode=intervals, currentView=home), $derived(shapes)
- [ ] 4.2 ChordSelector.svelte: 12 chromatic note buttons, selected highlight (bg-blue-500), onSelect callback
- [ ] 4.3 MajorMinorToggle.svelte: segmented pill toggle Major/Minor, active indicator
- [ ] 4.4 ShapeCard.svelte: shape label ("C shape") + Fretboard component
- [ ] 4.5 CagedTool.svelte: orchestrator — selector + toggle + 5 ShapeCards + label toggle
- [ ] 4.6 ToolCard.svelte: icon/title/description card, active (hover scale) / inactive (opacity-50) states
- [ ] 4.7 HomePage.svelte: responsive card grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- [ ] 4.8 Tests: `tests/components/ChordSelector.test.ts` (click G#→onSelect('G#')) + `tests/components/ShapeCard.test.ts` (label+Fretboard renders). Run: `pnpm vitest run`

## Phase 5: Polish

- [ ] 5.1 Responsive: verify mobile (stacked mini-fretboards) vs desktop (grid); horizontal scroll fallback
- [ ] 5.2 a11y: ARIA on Fretboard (role="img", aria-label describing chord + shape), keyboard nav for note buttons
- [ ] 5.3 Final integration: `pnpm build && pnpm vitest run` — zero errors, static site emits
