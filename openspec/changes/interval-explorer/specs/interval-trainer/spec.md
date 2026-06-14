# Delta for Interval Trainer

## ADDED Requirements

### Requirement: Practice / Explore Mode Toggle

The Interval Trainer MUST render a two-option toggle that switches between Practice mode and Explore mode. The toggle MUST be labeled "Practice" and "Explore". Exactly one mode MUST be active at a time.

The toggle MUST have an accessible `aria-label` (e.g., "Trainer mode"). The active option MUST communicate its state via `aria-pressed` or equivalent (`aria-selected` if implemented as a tab).

Practice mode behavior is unchanged — the quiz, scoring, and answer flow continue to work as specified in the existing Interval Trainer spec. Explore mode renders the `IntervalFretboard` view with root + interval controls and Play button (see the `interval-explorer` spec).

Root note and interval selections are shared between modes so that switching modes does not reset the user's choices.

#### Scenario: Default state — Practice mode is active on mount

- GIVEN the Interval Trainer component is mounted
- WHEN no user interaction has occurred
- THEN Practice mode is the active mode
- AND the quiz UI is visible
- AND the fretboard / Explore UI is NOT rendered

#### Scenario: Switching to Explore mode

- GIVEN the Interval Trainer is in Practice mode
- WHEN the user activates the "Explore" toggle option
- THEN Explore mode becomes active
- AND the fretboard view is rendered
- AND the quiz UI is NOT rendered

#### Scenario: Switching back to Practice mode

- GIVEN the Interval Trainer is in Explore mode
- WHEN the user activates the "Practice" toggle option
- THEN Practice mode becomes active
- AND the quiz UI is rendered
- AND the fretboard view is NOT rendered

#### Scenario: Shared selection state survives mode switch

- GIVEN the Interval Trainer is in Explore mode with root A and interval Minor 3rd selected
- WHEN the user switches to Practice mode and then back to Explore mode
- THEN root A and interval Minor 3rd are still selected

#### Scenario: Toggle is accessible

- GIVEN the Interval Trainer is rendered
- WHEN a screen reader queries the toggle
- THEN both "Practice" and "Explore" options have discernible labels
- AND the currently active option communicates its active state

---

### Requirement: Practice Mode Isolation

The existing Practice mode quiz behavior MUST NOT change as a result of adding the Explore toggle.

Specifically: question generation, answer selection, score tracking, and audio playback from Practice mode MUST produce the same outcomes as before the Explore toggle was introduced.

#### Scenario: Existing Practice tests remain green

- GIVEN the test suite is run after the mode toggle is introduced
- WHEN all existing Interval Trainer unit and component tests execute
- THEN every previously-passing test still passes with no modifications to test files
