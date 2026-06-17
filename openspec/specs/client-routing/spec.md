# Client Routing Specification

## Purpose

Define client-side routing for the single-page app using the History API. Each tool maps 1:1 to a distinct URL path (the path segment IS the `ViewName`), so deep links, page refresh, and browser back/forward all resolve to the correct tool — and so per-tool usage is observable from the pathname.

## Requirements

### Requirement: Path-to-View Mapping

The system MUST provide a pure function `pathToView(pathname: string): ViewName`
that maps URL pathnames to `ViewName` values. The mapping MUST follow these
rules:

- `/` → `'home'`
- `/<view-name>` → the matching `ViewName` (e.g. `/caged` → `'caged'`)
- Any pathname that does not match a known `ViewName` segment → `'home'` (fallback)

The function MUST cover all 10 views in the `ViewName` union:
`home`, `caged`, `progression`, `note-trainer`, `tone-generator`, `pentatonic`,
`signal-lab`, `interval-trainer`, `tab-player`, `chord-builder`.

#### Scenario: Root path resolves to home

- GIVEN `pathname` is `'/'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

#### Scenario: Known view path resolves correctly — caged

- GIVEN `pathname` is `'/caged'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'`

#### Scenario: Known view path resolves correctly — progression

- GIVEN `pathname` is `'/progression'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'progression'`

#### Scenario: Known view path resolves correctly — note-trainer

- GIVEN `pathname` is `'/note-trainer'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'note-trainer'`

#### Scenario: Known view path resolves correctly — tone-generator

- GIVEN `pathname` is `'/tone-generator'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'tone-generator'`

#### Scenario: Known view path resolves correctly — pentatonic

- GIVEN `pathname` is `'/pentatonic'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'pentatonic'`

#### Scenario: Known view path resolves correctly — signal-lab

- GIVEN `pathname` is `'/signal-lab'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'signal-lab'`

#### Scenario: Known view path resolves correctly — interval-trainer

- GIVEN `pathname` is `'/interval-trainer'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'interval-trainer'`

#### Scenario: Known view path resolves correctly — tab-player

- GIVEN `pathname` is `'/tab-player'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'tab-player'`

#### Scenario: Known view path resolves correctly — chord-builder

- GIVEN `pathname` is `'/chord-builder'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'chord-builder'`

#### Scenario: Unknown path falls back to home

- GIVEN `pathname` is an unrecognised string such as `'/not-a-tool'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

#### Scenario: Empty path falls back to home

- GIVEN `pathname` is `''`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

#### Scenario: Trailing slash on a known view resolves to that view

- GIVEN `pathname` is `'/caged/'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'` (a single trailing slash is tolerated)

#### Scenario: Leading double slash on a known view resolves to that view

- GIVEN `pathname` is `'//caged'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'`

### Requirement: View-to-Path Mapping

The system MUST provide a pure function `viewToPath(view: ViewName): string`
that maps `ViewName` values to URL pathnames. The mapping MUST follow these
rules:

- `'home'` → `'/'`
- Any other `ViewName` → `'/' + view` (e.g. `'caged'` → `'/caged'`)

#### Scenario: home view maps to root

- GIVEN `view` is `'home'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/'`

#### Scenario: Non-home view maps to slash-prefixed segment — caged

- GIVEN `view` is `'caged'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/caged'`

#### Scenario: Non-home view maps to slash-prefixed segment — note-trainer

- GIVEN `view` is `'note-trainer'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/note-trainer'`

#### Scenario: Non-home view maps to slash-prefixed segment — tab-player

- GIVEN `view` is `'tab-player'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/tab-player'`

#### Scenario: Non-home view maps to slash-prefixed segment — chord-builder

- GIVEN `view` is `'chord-builder'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/chord-builder'`

### Requirement: Round-Trip Correctness

For every `ViewName` `v`, `pathToView(viewToPath(v))` MUST return `v`. The
mapping pair MUST be a lossless round-trip for all valid view names. The set of
runtime `ViewName` values backing the mapping MUST be kept in sync with the
`ViewName` union by a compile-time exhaustiveness check (a missing or extra
entry MUST fail `tsc`).

#### Scenario: Round-trip for every view

- GIVEN any `view` in the `ViewName` union
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result equals the original `view`

#### Scenario: Forgotten route fails the build

- GIVEN a new member is added to the `ViewName` union without a corresponding runtime entry
- WHEN the project is type-checked (`tsc`)
- THEN compilation fails on the exhaustiveness guard

### Requirement: Browser Back/Forward Navigation

The app MUST listen for `popstate` events on `window`. When a `popstate` event
fires, `currentView` MUST be updated to `pathToView(location.pathname)`. The
`popstate` listener MUST NOT call `history.pushState` — reading pathname and
writing state is the only permitted action.

#### Scenario: Back button navigates to previous tool

- GIVEN the user navigated from `home` to `caged` (pushing `/caged` to history)
- WHEN the user presses the browser back button
- THEN a `popstate` event fires with `location.pathname` = `'/'`
- AND `currentView` becomes `'home'`

#### Scenario: Forward button navigates to next tool

- GIVEN the user pressed back from `caged` to `home`
- WHEN the user presses the browser forward button
- THEN a `popstate` event fires with `location.pathname` = `'/caged'`
- AND `currentView` becomes `'caged'`

#### Scenario: popstate listener does not push state

- GIVEN a `popstate` event fires
- WHEN the listener executes
- THEN `history.pushState` is NOT called
- AND no second `popstate` event is triggered

### Requirement: SPA Fallback Rewrite

A `vercel.json` file MUST exist at the repository root and MUST configure a
rewrite rule that maps all request paths to `/index.html`. This ensures deep
links and page refreshes on `/<view-name>` are served by the SPA rather than
returning a 404.

#### Scenario: Deep link to a tool survives refresh

- GIVEN the user navigates directly to `/<view-name>` (e.g. `/caged`) in the browser
- WHEN the page loads
- THEN the SPA is served and `pathToView('/caged')` initialises `currentView` to `'caged'`
- AND the tool renders without a 404
