# Delta for app-shell

## MODIFIED Requirements

### Requirement: View Name Union

The system MUST extend the `ViewName` type to include `'progression'` as a valid view name.
(Previously: `ViewName = 'home' | 'caged'`)

#### Scenario: Type includes progression

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'progression'` is accepted as a valid value

#### Scenario: Existing views remain valid

- GIVEN the `ViewName` type is extended
- WHEN `'home'` or `'caged'` are used
- THEN they remain accepted as valid values

### Requirement: View Routing

The system MUST render the `ProgressionBuilder` component when `currentView` is `'progression'`. The system MUST wrap the component in `<svelte:boundary>` with the same `errorFallback` pattern used for other views.
(Previously: Only `'home'` and `'caged'` routes existed)

#### Scenario: Route to Progression Builder

- GIVEN `currentView` is `'progression'`
- WHEN `App.svelte` renders
- THEN `ProgressionBuilder` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page

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

## REMOVED Requirements

None.

## RENAMED Requirements

None.
