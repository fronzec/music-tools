# App Shell Specification

## Purpose

Define the application shell including view routing and the ViewName type union that controls navigation between tools.

## Requirements

### Requirement: View Name Union

The system MUST extend the `ViewName` type to include `'progression'` as a valid view name. The system MUST extend the `ViewName` type to include `'note-trainer'` as a valid view name. The system MUST extend the `ViewName` type to include `'tone-generator'` as a valid view name. The system MUST extend the `ViewName` type to include `'interval-trainer'` as a valid view name. The system MUST extend the `ViewName` type to include `'tab-player'` as a valid view name.

(Previously: Did not include `'tone-generator'`, `'note-trainer'`, `'interval-trainer'`, `'tab-player'`.)

#### Scenario: Type includes note-trainer

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'note-trainer'` is accepted as a valid value

#### Scenario: Type includes tone-generator

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'tone-generator'` is accepted as a valid value

#### Scenario: Type includes interval-trainer

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'interval-trainer'` is accepted as a valid value

#### Scenario: Type includes tab-player

- GIVEN the `ViewName` type is defined
- WHEN a variable is typed as `ViewName`
- THEN `'tab-player'` is accepted as a valid value

#### Scenario: Existing views remain valid

- GIVEN the `ViewName` type is extended
- WHEN `'home'`, `'caged'`, `'progression'`, `'note-trainer'`, `'tone-generator'`, or `'interval-trainer'` are used
- THEN they remain accepted as valid values

### Requirement: View Routing

The system MUST render the `ProgressionBuilder` component when `currentView` is `'progression'`. The system MUST render the `NoteTrainer` component when `currentView` is `'note-trainer'`. The system MUST render the `ToneGenerator` component when `currentView` is `'tone-generator'`. The system MUST render the `IntervalTrainer` component when `currentView` is `'interval-trainer'`. The system MUST render the `TabPlayer` component when `currentView` is `'tab-player'`. The system MUST wrap each component in `<svelte:boundary>` with the same `errorFallback` pattern used for other views.

(Previously: Did not route `'tone-generator'`, `'note-trainer'`, `'interval-trainer'`, `'tab-player'`.)

#### Scenario: Route to Note Trainer

- GIVEN `currentView` is `'note-trainer'`
- WHEN `App.svelte` renders
- THEN `NoteTrainer` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Route to Tone Generator

- GIVEN `currentView` is `'tone-generator'`
- WHEN `App.svelte` renders
- THEN `ToneGenerator` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Route to Interval Trainer

- GIVEN `currentView` is `'interval-trainer'`
- WHEN `App.svelte` renders
- THEN `IntervalTrainer` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page to Interval Trainer

- GIVEN the user is on the home page
- WHEN the user clicks the Interval Trainer card
- THEN `navigate('interval-trainer')` is called
- AND `currentView` becomes `'interval-trainer'`

#### Scenario: Back to home from Interval Trainer

- GIVEN the user is on the Interval Trainer view
- WHEN the back-to-home control is activated
- THEN `navigate('home')` is called
- AND `currentView` resets to `'home'`

#### Scenario: Navigation from home page to Note Trainer

- GIVEN the user is on the home page
- WHEN the user clicks the Note Trainer card
- THEN `navigate('note-trainer')` is called
- AND `currentView` becomes `'note-trainer'`

#### Scenario: Navigation from home page to Tone Generator

- GIVEN the user is on the home page
- WHEN the user clicks the Tone Generator card
- THEN `navigate('tone-generator')` is called
- AND `currentView` becomes `'tone-generator'`

#### Scenario: Back to home from Note Trainer

- GIVEN the user is on the Note Trainer view
- WHEN the error fallback "Back to Home" button is clicked
- THEN `currentView` resets to `'home'`

#### Scenario: Back to home from Tone Generator

- GIVEN the user is on the Tone Generator view
- WHEN the error fallback "Back to Home" button is clicked
- THEN `currentView` resets to `'home'`

#### Scenario: Route to Tab Player

- GIVEN `currentView` is `'tab-player'`
- WHEN `App.svelte` renders
- THEN `TabPlayer` is mounted inside a `<svelte:boundary>`
- AND the error fallback snippet handles crashes

#### Scenario: Navigation from home page to Tab Player

- GIVEN the user is on the home page
- WHEN the user clicks the Tab Player card
- THEN `navigate('tab-player')` is called
- AND `currentView` becomes `'tab-player'`

#### Scenario: Back to home from Tab Player

- GIVEN the user is on the Tab Player view
- WHEN the back-to-home control is activated
- THEN `navigate('home')` is called
- AND `currentView` resets to `'home'`

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

### Requirement: navigate() Syncs URL

The `navigate(view: ViewName)` function in `App.svelte` MUST remain the single
chokepoint for all view transitions. In addition to updating `currentView`, it
MUST call `history.pushState({}, '', viewToPath(view))` to sync the address bar.

(Previously: `navigate(view)` only assigned `currentView = view` and did not touch the URL.)

#### Scenario: Switching to a non-home tool updates the address bar

- GIVEN `currentView` is `'home'`
- WHEN `navigate('caged')` is called
- THEN `currentView` becomes `'caged'`
- AND `location.pathname` becomes `'/caged'`

#### Scenario: Navigating to home updates the address bar to root

- GIVEN `currentView` is `'interval-trainer'`
- WHEN `navigate('home')` is called
- THEN `currentView` becomes `'home'`
- AND `location.pathname` becomes `'/'`

#### Scenario: No feedback loop — navigate() never triggers popstate

- GIVEN `navigate('pentatonic')` is called
- WHEN `history.pushState` executes
- THEN no `popstate` event fires (pushState never dispatches popstate)
- AND the popstate listener is NOT invoked

### Requirement: Initial View Derived From Pathname

On application load, `currentView` MUST be initialised to
`pathToView(location.pathname)` instead of the hardcoded value `'home'`. If the
pathname matches a known view, that view renders immediately. If the pathname is
unknown or `/`, `home` renders.

(Previously: `currentView` was initialised to `'home'` unconditionally.)

#### Scenario: App loads at root and shows home

- GIVEN the browser address bar shows `'/'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'home'`
- AND the Home page renders

#### Scenario: App loads at a known tool path and shows that tool

- GIVEN the browser address bar shows `'/tab-player'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'tab-player'`
- AND the Tab Player renders without first rendering the home page

#### Scenario: App loads at an unknown path and shows home

- GIVEN the browser address bar shows `'/unknown-tool'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'home'`
- AND the Home page renders
