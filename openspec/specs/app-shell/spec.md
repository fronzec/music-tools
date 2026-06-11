# App Shell Specification

## Purpose

Define the application shell including view routing and the ViewName type union that controls navigation between tools.

## Requirements

### Requirement: View Name Union

The system MUST extend the `ViewName` type to include `'progression'` as a valid view name. The system MUST extend the `ViewName` type to include `'note-trainer'` as a valid view name.

(Previously: Did not include `'note-trainer'`.)

#### Scenario: Type includes note-trainer

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'note-trainer'` is accepted as a valid value

#### Scenario: Existing views remain valid

- GIVEN the `ViewName` type is extended
- WHEN `'home'`, `'caged'`, or `'progression'` are used
- THEN they remain accepted as valid values

### Requirement: View Routing

The system MUST render the `ProgressionBuilder` component when `currentView` is `'progression'`. The system MUST render the `NoteTrainer` component when `currentView` is `'note-trainer'`. The system MUST wrap each component in `<svelte:boundary>` with the same `errorFallback` pattern used for other views.

(Previously: Did not route `'note-trainer'`.)

#### Scenario: Route to Note Trainer

- GIVEN `currentView` is `'note-trainer'`
- WHEN `App.svelte` renders
- THEN `NoteTrainer` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page to Note Trainer

- GIVEN the user is on the home page
- WHEN the user clicks the Note Trainer card
- THEN `navigate('note-trainer')` is called
- AND `currentView` becomes `'note-trainer'`

#### Scenario: Back to home from Note Trainer

- GIVEN the user is on the Note Trainer view
- WHEN the error fallback "Back to Home" button is clicked
- THEN `currentView` resets to `'home'`

#### Scenario: Route to Progression Builder

- GIVEN `currentView` is `'progression'`
- WHEN `App.svelte` renders
- THEN `ProgressionBuilder` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page to Progression Builder

- GIVEN the user is on the home page
- WHEN the user clicks the Progression Builder card
- THEN `navigate('progression')` is called
- AND `currentView` becomes `'progression'`

#### Scenario: Back to home from Progression Builder

- GIVEN the user is on the Progression Builder view
- WHEN the error fallback "Back to Home" button is clicked
- THEN `currentView` resets to `'home'`

#### Scenario: Invalid view name

- GIVEN `currentView` is set to an unknown value
- WHEN `App.svelte` renders
- THEN nothing is rendered (no branch matches)
