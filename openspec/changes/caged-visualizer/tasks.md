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

## Phase 3: Fretboard SVG — PR 3 ✅ COMPLETE

- [x] 3.1 SVG component: `src/lib/components/Fretboard.svelte` — strings, fret lines, markers (3/5/7/9/12/15), note dots (root=blue/R=11, tone=green/R=8, other=outline/R=5), barre indicator, open(O)/muted(×) markers, interval/note labels, viewBox scaling
- [x] 3.2 Tests: `tests/components/Fretboard.test.ts` — 27 tests: SVG rendering, string/fret line count, fret markers, note colors (root/tone/other), interval/note/both labels, open/muted indicators, barre indicator, viewBox calculation, width override. Dep: 3.1. Run: `pnpm vitest run`

## Phase 4: CAGED Tool + Home — PR 4 ✅ COMPLETE

- [x] 4.1 State: Inline `$state` in CagedTool.svelte (selectedRoot=C, selectedQuality=major, labelMode=intervals) + `$derived(shapes)` from getShapes. No separate state module needed — follows App.svelte pattern.
- [x] 4.2 ChordSelector: 12 chromatic note buttons with active highlight (bg-blue-600 text-white), integrated inline in CagedTool.svelte
- [x] 4.3 MajorMinorToggle: Segmented pill toggle Major/Minor with active indicator (bg-white shadow-sm), integrated inline in CagedTool.svelte
- [x] 4.4 ShapeCard.svelte: Created — shape label ("C shape"), fret range label ("frets 1–3"), embedded Fretboard component
- [x] 4.5 CagedTool.svelte: Orchestrator — chord selector + quality toggle + label mode toggle + 5 ShapeCards grid + back button
- [x] 4.6 ToolCard: Integrated into HomePage.svelte inline — active card (button with hover:shadow-md), placeholder cards (opacity-60, non-clickable)
- [x] 4.7 HomePage.svelte: Responsive card grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3), title+subtitle, 1 active card + 2 placeholders
- [x] 4.8 Tests: `tests/components/CagedTool.test.ts` (14 tests) + `tests/components/HomePage.test.ts` (10 tests). Run: `pnpm vitest run` — 134 total passing

## Phase 5: Polish ✅ COMPLETE

- [x] 5.1 Responsive: verified and polished all breakpoints — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` on shape grid + card grid, responsive padding/gaps, `max-w` scaling on ShapeCard
- [x] 5.2 a11y: Full ARIA pass — `aria-label`/`aria-pressed` on chord buttons, `role="radiogroup"`/`role="radio"`/`aria-checked` on quality and label toggles, `role="img"` + `aria-label` + `<title>`/`<desc>` on Fretboard SVG, `aria-label` on CAGED card and back button, `id` heading for screen readers, `role="group"` on chord selector, focus-visible ring in CSS base layer, auto-focus first chord button on tool mount
- [x] 5.3 Final integration: `pnpm build && pnpm vitest run` — zero errors, static site emits. Added `<title>`, `<meta>`, emoji favicon, `<noscript>` fallback, loading placeholder, error boundary in App.svelte.
