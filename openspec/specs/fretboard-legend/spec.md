# Fretboard Legend Specification

## Purpose

Define the standalone legend panel that explains CAGED shape color coding, fretboard symbols, string indicators, and dual-mode diff highlights.

## Requirements

### Requirement: Shape Colors Display

The system MUST display the 5 CAGED shape colors with their shape name label and hex color code.

#### Scenario: Shape colors visible

- GIVEN `legendOpen` is `true`
- WHEN the legend panel renders
- THEN 5 entries are visible: C, A, G, E, D
- AND each entry shows a colored dot, the shape name, and the hex code
- AND colors match `SHAPE_COLORS` from `layout.ts`

### Requirement: Symbol Meanings Display

The system MUST display the meaning of fretboard note symbols.

#### Scenario: Symbols visible

- GIVEN `legendOpen` is `true`
- WHEN the legend panel renders
- THEN three symbol entries are visible
- AND "◆" is labeled "Root note"
- AND "●" is labeled "Chord tone"
- AND "○" is labeled "Non-root / overlap"

### Requirement: String Indicators Display

The system MUST display the meaning of open and muted string indicators.

#### Scenario: Indicators visible

- GIVEN `legendOpen` is `true`
- WHEN the legend panel renders
- THEN two indicator entries are visible
- AND "O" is labeled "Open string"
- AND "×" is labeled "Muted string"

### Requirement: Diff Highlights Display

The system MUST display diff highlight legend entries ONLY when `viewMode` is `'dual'`. In non-dual modes, the diff section MUST be hidden.

#### Scenario: Diff highlights in dual mode

- GIVEN `legendOpen` is `true` and `viewMode` is `'dual'`
- WHEN the legend panel renders
- THEN two diff entries are visible
- AND "🟢" is labeled "Same interval"
- AND "🟠" is labeled "Different interval"

#### Scenario: No diff highlights in full mode

- GIVEN `legendOpen` is `true` and `viewMode` is `'full'`
- WHEN the legend panel renders
- THEN the diff section is NOT visible
- AND only shape colors, symbols, and indicators are shown

#### Scenario: No diff highlights in grid mode

- GIVEN `legendOpen` is `true` and `viewMode` is `'grid'`
- WHEN the legend panel renders
- THEN the diff section is NOT visible
- AND only shape colors, symbols, and indicators are shown

### Requirement: Collapsible Behavior

The system MUST support smooth show/hide transitions for the legend panel when toggled.

#### Scenario: Panel opens

- GIVEN `legendOpen` transitions from `false` to `true`
- WHEN the toggle is clicked
- THEN the panel animates from hidden to visible
- AND the animation completes within 300ms

#### Scenario: Panel closes

- GIVEN `legendOpen` transitions from `true` to `false`
- WHEN the toggle is clicked
- THEN the panel animates from visible to hidden
- AND the animation completes within 300ms

### Requirement: Accessibility

The system MUST support accessibility attributes for screen readers and keyboard users.

#### Scenario: Toggle accessibility

- GIVEN the legend panel is rendered
- WHEN the toggle button is focused
- THEN `aria-expanded` reflects `legendOpen` state
- AND `aria-controls` references the legend panel

#### Scenario: Panel accessibility

- GIVEN the legend panel is rendered
- WHEN the panel is visible
- THEN `aria-label` is present on the panel container
- AND the panel is keyboard-navigable

