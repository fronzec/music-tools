# App Shell Delta Spec — Tone Generator

## Purpose

Extend app shell routing to support the Tone Generator view.

## MODIFIED Requirements

### Requirement: View Name Union

The system MUST extend the `ViewName` type to include `'tone-generator'` as a valid view name.

#### Scenario: Type includes tone-generator

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'tone-generator'` is accepted as a valid value

#### Scenario: Existing views remain valid

- GIVEN the `ViewName` type is extended
- WHEN `'home'`, `'caged'`, `'progression'`, or `'note-trainer'` are used
- THEN they remain accepted as valid values

### Requirement: View Routing

The system MUST render the `ToneGenerator` component when `currentView` is `'tone-generator'`. The system MUST wrap the component in `<svelte:boundary>` with the same `errorFallback` pattern used for other views.

#### Scenario: Route to Tone Generator

- GIVEN `currentView` is `'tone-generator'`
- WHEN `App.svelte` renders
- THEN `ToneGenerator` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page to Tone Generator

- GIVEN the user is on the home page
- WHEN the user clicks the Tone Generator card
- THEN `navigate('tone-generator')` is called
- AND `currentView` becomes `'tone-generator'`

#### Scenario: Back to home from Tone Generator

- GIVEN the user is on the Tone Generator view
- WHEN the error fallback "Back to Home" button is clicked
- THEN `currentView` resets to `'home'`
