# Delta for CAGED Visualizer

## Purpose

Add Full Neck view mode and shape visibility toggles to the CAGED tool. Keep existing Shape Grid as alternative mode.

## ADDED Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **View Mode Toggle** | MUST provide "Full Neck" / "Shape Grid" toggle | Toggle switches modes; Full Neck shows overlay; Shape Grid shows 5 mini-boards | Mode switch preserves chord, quality, label mode |
| **Shape Visibility Bar** | MUST render 5 colored buttons (C, A, G, E, D) in Full Neck mode | All active by default; click toggles on/off | All off → empty fretboard; bar hidden in Shape Grid mode |
| **Full Neck Overlay** | MUST render FullFretboard with visible shapes overlaid | All 5 shapes visible; single shape visible | — |

## MODIFIED Requirements

### Requirement: Simultaneous 5-Shape Display

The system MUST display all 5 CAGED shapes simultaneously in either Full Neck or Shape Grid mode.
(Previously: Displayed only as 5 separate mini-fretboards in a grid)

#### Scenario: Full Neck mode

- GIVEN a root and quality are selected and view mode is "Full Neck"
- WHEN the tool renders
- THEN exactly one FullFretboard is visible with all 5 shapes overlaid

#### Scenario: Shape Grid mode

- GIVEN a root and quality are selected and view mode is "Shape Grid"
- WHEN the tool renders
- THEN exactly 5 mini-fretboards are visible, each labeled with its shape name

### Requirement: Default State

The system MUST load with C Major selected and Full Neck view mode active.
(Previously: Defaulted to Shape Grid view mode)

#### Scenario: Initial load

- GIVEN the user navigates to the CAGED tool
- WHEN the page loads
- THEN the selected root is C, quality is Major, view mode is Full Neck
- AND all 5 C major shapes are displayed on the full fretboard
- AND all shape toggle buttons are in the active state

### Requirement: Responsive Layout

The system MUST adapt layout for mobile/desktop in Shape Grid mode.
(Previously: Applied to all views; now Shape Grid only, Full Neck desktop-only)

#### Scenario: Shape Grid responsive

- GIVEN view mode is "Shape Grid"
- WHEN viewport is ≥ 768px
- THEN mini-fretboards are in a grid; when < 768px, they stack vertically

#### Scenario: Full Neck desktop

- GIVEN view mode is "Full Neck"
- WHEN the tool renders
- THEN the full fretboard is displayed at full width, optimized for desktop

## REMOVED Requirements

None.

## Unchanged Requirements

- Tool Route or State
- Chromatic Note Selector
- Major/Minor Quality Toggle
- State Management (Svelte 5 runes)
- Label Toggle
- Back button
