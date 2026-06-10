# Proposal: CAGED Chord Visualizer

## Intent

Build the first learning tool for music-tools — a CAGED chord visualizer that helps guitarists see how chord shapes connect across the fretboard. Bootstrap the greenfield Svelte 5 project alongside it. No login, no friction; open the URL and the tool works (muted.io model).

## Scope

### In Scope

- **Project bootstrap**: Vite + Svelte 5 (runes) + TypeScript + Tailwind CSS scaffold with Vitest, ESLint, Prettier
- **Home page**: Card-based tool grid (muted.io style) with state-driven routing (`currentView`)
- **Static chord data**: 120 pre-computed CAGED shapes as TypeScript/JSON (`src/lib/data/caged-shapes.ts`)
- **SVG fretboard component**: Reusable component with strings, frets, markers, note dots, interval labels
- **Chord selector**: Note button row (12 chromatic notes) + major/minor segmented toggle
- **5-shape display**: All CAGED positions as simultaneous mini-fretboards with root/chord-tone/non-tone indicators
- **Responsive layout**: Horizontal fretboard on desktop, stacked on mobile

### Out of Scope

- Sound playback (audio generation of chords)
- Left-handed fretboard orientation
- User accounts, login, or persistence
- Additional tools beyond CAGED visualizer (placeholder cards only)
- Hash-based URL routing (state-based only for MVP)
- Sharp/flat notation toggle (use enharmonic equivalents only when needed)

## Capabilities

### New Capabilities

- `project-scaffold`: Vite + Svelte 5 + TypeScript + Tailwind CSS project, Vitest/ESLint/Prettier config, App shell with state-driven routing (`currentView: 'home' | 'caged'`), home page with card grid navigation
- `chord-data`: Static CAGED shape dataset (120 shapes), TypeScript types (`ChordShape`, `ChordVoicing`), lookup utilities by root + quality
- `fretboard`: Reusable SVG fretboard component — string/fret lines, fret markers (3/5/7/9/12/15), note dots (root=large blue, chord-tone=medium green, non-chord=small outline), interval labels (R/3/5/b3), barre indicators, muted/open string markers
- `caged-visualizer`: Chord selector (chromatic note buttons + major/minor pill toggle), 5 mini-fretboard simultaneous display, interaction state via Svelte 5 runes, interval/note-name label toggle

### Modified Capabilities

None (greenfield project).

## Approach

1. **Scaffold** with `pnpm create vite` (Svelte 5 + TypeScript), add Tailwind CSS v4, Vitest, ESLint, Prettier
2. **Data first**: Author `caged-shapes.ts` — 120 pre-validated shapes. No runtime music-theory computation. Eliminates G→B string quirk bugs.
3. **Bottom-up components**: Build `Fretboard.svelte` as reusable SVG; then `ChordSelector.svelte` + `MiniFretboard.svelte`; assemble in `CagedTool.svelte`
4. **Home last**: Card grid with placeholder tool cards + real CAGED card, wired via `currentView` state
5. **Static site**: `vite build` produces deployable static assets

## Affected Areas

| Area                  | Impact | Description                                                  |
| --------------------- | ------ | ------------------------------------------------------------ |
| `/` (root)            | New    | Vite + Svelte 5 project scaffold, config files               |
| `src/app/`            | New    | App shell, home page, routing state                          |
| `src/lib/components/` | New    | Fretboard, ChordSelector, ToolCard, ShapeCard, MiniFretboard |
| `src/lib/data/`       | New    | Static CAGED shape dataset, TypeScript types                 |
| `src/lib/state/`      | New    | Svelte 5 rune-based state (`cagedState`)                     |

## Risks

| Risk                                      | Likelihood | Mitigation                                                   |
| ----------------------------------------- | ---------- | ------------------------------------------------------------ |
| CAGED shape data errors                   | Med        | Pre-computed, manually validate against known chord diagrams |
| SVG fretboard layout bugs                 | Low        | Uniform 60px fret spacing simplifies coordinate math         |
| Responsive horizontal fretboard on mobile | Med        | Vertical stack + horizontal scroll fallback                  |
| Review budget exceeded (400 lines)        | Med        | Split into chained PRs: PR#1 bootstrap, PR#2 CAGED tool      |

## Rollback Plan

Delete project directory (greenfield). If partial deployment, revert to previous static build artifact.

## Dependencies

- Node.js ≥ 20, pnpm (package manager)
- No external runtime dependencies beyond Svelte 5, Tailwind CSS, Vite

## Success Criteria

- [ ] `pnpm dev` starts dev server; home page loads with tool cards
- [ ] `pnpm build` produces static site without errors
- [ ] `pnpm vitest run` passes all tests
- [ ] Clicking "CAGED Visualizer" card navigates to the tool
- [ ] Selecting any note + major/minor shows 5 fretboard shapes with correct chord tones highlighted
- [ ] Root notes visible as larger blue dots, chord tones green, non-chord tones as outlines
- [ ] Fretboard renders correctly on mobile (≤ 375px width)
