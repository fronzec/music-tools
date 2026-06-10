# Tasks: Animated CAGED Shape Transitions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~230 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Animation constants + Fretboard transitions + FullFretboard restructure | Single PR | Fretboard changes independent of FullFretboard; both depend on FL constants |

## Phase 1: Foundation — Animation Constants

- [x] 1.1 Add `ANIM_DURATION: '0.3s'` and `ANIM_EASING: 'ease-out'` to `FL` in `src/lib/theory/layout.ts`

## Phase 2: Fretboard — Grid Mode Transitions

- [x] 2.1 Add `transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}` inline style to root/tone/other `<circle>` elements in `src/lib/components/Fretboard.svelte`
- [x] 2.2 Wrap label `<text>` in `<g>` with same transition style so labels animate with notes
- [x] 2.3 Add `prefers-reduced-motion` media query block in component `<style>` that disables transitions on note circles and labels
- [x] 2.4 Add `transition: transform` inline style to barre `<rect>` (barre slides when baseFret changes)

## Phase 3: FullFretboard — Shape-Keyed Restructure

- [x] 3.1 Create `allNotes` `$derived.by()` flat list in `<script>` with `stableKey: "${shape}-${stringIndex}"`, iterating `CAGED_ORDER` × string indices, computing `absFret` per note
- [x] 3.2 Create `overlapGroups` `$derived.by()` from `buildPositionMap()` for concentric ring lookup
- [x] 3.3 Replace `{#each [...positionMap.entries()] as [_key, notes] (_key)}` with `{#each allNotes as note (note.stableKey)}` iterating flat list keyed by `stableKey`
- [x] 3.4 Wrap each note (shape + label + diff ring) in `<g transform="translate({cx},{cy})" style="transition: transform {FL.ANIM_DURATION} {FL.ANIM_EASING}">` — child elements at origin `(0,0)`
- [x] 3.5 Restructure overlap rendering: use `overlapGroups` to look up concentric rings at `(0,0)` inside note `<g>`, preserving ring order and per-shape colors
- [x] 3.6 Restructure barre `<rect>` into `<g>` wrapper keyed `${shapeType}-barre` with `transform="translate({bx},{by})"` and transition style
- [x] 3.7 Add `prefers-reduced-motion` media query block in component `<style>` targeting `.fretboard-note-group` to disable transitions
- [x] 3.8 Run `pnpm vitest run` — all 46 FullFretboard tests and 39 layout tests must pass unchanged

## Phase 4: Verify

- [x] 4.1 Run `pnpm build` — confirm TypeScript compiles and Vite bundles without errors
- [x] 4.2 Run `pnpm vitest run` — confirm all existing tests pass (FullFretboard, Fretboard, layout, DualFretboard, CagedTool)
- [x] 4.3 Manual visual check: change root from C→A→G→E→D, verify shapes slide smoothly over 300ms with no flicker
- [x] 4.4 Manual visual check: enable `prefers-reduced-motion: reduce` (browser DevTools), confirm shapes snap instantly
- [x] 4.5 Manual visual check: Dual Compare and Grid views render correctly alongside animated Full Neck
