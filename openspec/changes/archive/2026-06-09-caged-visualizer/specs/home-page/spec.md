# Home Page Specification

## Purpose

Define the home page that presents a card grid of available tools, including the CAGED Visualizer and placeholders for future tools.

## Requirements

### Requirement: Card Grid Layout

The system MUST render a grid of tool cards on the home page.

#### Scenario: Desktop grid

- GIVEN the viewport is ≥ 768px wide
- WHEN the home page loads
- THEN the cards are arranged in a 2- or 3-column grid

#### Scenario: Mobile grid

- GIVEN the viewport is < 768px wide
- WHEN the home page loads
- THEN the cards are arranged in a single column

### Requirement: Tool Card Content

Each card MUST display an icon/emoji, a title, a short description, and be clickable.

#### Scenario: Card content is complete

- GIVEN the home page renders
- WHEN a tool card is inspected
- THEN it contains an icon, a title, a description, and a clickable area

#### Scenario: Card navigation

- GIVEN the user is on the home page
- WHEN the user clicks a tool card
- THEN the application navigates to the selected tool

### Requirement: CAGED Visualizer Card

The CAGED Visualizer card MUST be the first active card in the grid.

#### Scenario: CAGED card is first

- GIVEN the home page renders
- WHEN the card order is inspected
- THEN the CAGED Visualizer card is the first card in the grid
- AND it is styled as active (not greyed out)

### Requirement: Placeholder Cards

The system MUST render placeholder cards for future tools, styled as inactive/greyed out.

#### Scenario: Placeholder cards are inactive

- GIVEN the home page renders
- WHEN a placeholder card is inspected
- THEN it is visually distinct from active cards (e.g., muted opacity, no hover effects)
- AND it is not clickable

### Requirement: muted.io Aesthetic

The home page MUST follow a clean, minimal, focused design consistent with the muted.io aesthetic.

#### Scenario: Visual consistency

- GIVEN the home page renders
- WHEN the design is inspected
- THEN the layout is clean with ample whitespace
- AND typography is minimal and legible
- AND colors are muted and purposeful

### Requirement: Responsive Behavior

The home page MUST be fully responsive across mobile and desktop.

#### Scenario: Viewport resize

- GIVEN the browser window is resized
- WHEN the width crosses the mobile/desktop breakpoint
- THEN the card grid reflows without horizontal scrolling
- AND text remains readable at all sizes
