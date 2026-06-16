# Delta Spec: Routing & Usage Analytics

## Purpose

Formal requirements for client-side History API routing and Vercel Web Analytics
integration. This change introduces two new capabilities (`client-routing`,
`usage-analytics`) and modifies one existing capability (`app-shell`). All
requirements are phrased as what MUST be true after the change is applied.

---

## NEW Capabilities

---

### Capability: client-routing

---

#### Requirement: Path-to-View Mapping

The system MUST provide a pure function `pathToView(pathname: string): ViewName`
that maps URL pathnames to `ViewName` values. The mapping MUST follow these
rules:

- `/` → `'home'`
- `/<view-name>` → the matching `ViewName` (e.g. `/caged` → `'caged'`)
- Any pathname that does not match a known `ViewName` segment → `'home'` (fallback)

The function MUST cover all 9 views in the `ViewName` union:
`home`, `caged`, `progression`, `note-trainer`, `tone-generator`, `pentatonic`,
`signal-lab`, `interval-trainer`, `tab-player`.

##### Scenario: Root path resolves to home

- GIVEN `pathname` is `'/'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

##### Scenario: Known view path resolves correctly — caged

- GIVEN `pathname` is `'/caged'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'`

##### Scenario: Known view path resolves correctly — progression

- GIVEN `pathname` is `'/progression'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'progression'`

##### Scenario: Known view path resolves correctly — note-trainer

- GIVEN `pathname` is `'/note-trainer'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'note-trainer'`

##### Scenario: Known view path resolves correctly — tone-generator

- GIVEN `pathname` is `'/tone-generator'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'tone-generator'`

##### Scenario: Known view path resolves correctly — pentatonic

- GIVEN `pathname` is `'/pentatonic'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'pentatonic'`

##### Scenario: Known view path resolves correctly — signal-lab

- GIVEN `pathname` is `'/signal-lab'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'signal-lab'`

##### Scenario: Known view path resolves correctly — interval-trainer

- GIVEN `pathname` is `'/interval-trainer'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'interval-trainer'`

##### Scenario: Known view path resolves correctly — tab-player

- GIVEN `pathname` is `'/tab-player'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'tab-player'`

##### Scenario: Unknown path falls back to home

- GIVEN `pathname` is an unrecognised string such as `'/not-a-tool'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

##### Scenario: Empty path falls back to home

- GIVEN `pathname` is `''`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'home'`

##### Scenario: Trailing slash on a known view resolves to that view

- GIVEN `pathname` is `'/caged/'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'` (a single trailing slash is tolerated)

##### Scenario: Leading double slash on a known view resolves to that view

- GIVEN `pathname` is `'//caged'`
- WHEN `pathToView(pathname)` is called
- THEN it returns `'caged'`

---

#### Requirement: View-to-Path Mapping

The system MUST provide a pure function `viewToPath(view: ViewName): string`
that maps `ViewName` values to URL pathnames. The mapping MUST follow these
rules:

- `'home'` → `'/'`
- Any other `ViewName` → `'/' + view` (e.g. `'caged'` → `'/caged'`)

##### Scenario: home view maps to root

- GIVEN `view` is `'home'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/'`

##### Scenario: Non-home view maps to slash-prefixed segment — caged

- GIVEN `view` is `'caged'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/caged'`

##### Scenario: Non-home view maps to slash-prefixed segment — note-trainer

- GIVEN `view` is `'note-trainer'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/note-trainer'`

##### Scenario: Non-home view maps to slash-prefixed segment — tab-player

- GIVEN `view` is `'tab-player'`
- WHEN `viewToPath(view)` is called
- THEN it returns `'/tab-player'`

---

#### Requirement: Round-Trip Correctness

For every `ViewName` `v`, `pathToView(viewToPath(v))` MUST return `v`. The
mapping pair MUST be a lossless round-trip for all valid view names.

##### Scenario: Round-trip for home

- GIVEN `view` is `'home'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'home'`

##### Scenario: Round-trip for caged

- GIVEN `view` is `'caged'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'caged'`

##### Scenario: Round-trip for progression

- GIVEN `view` is `'progression'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'progression'`

##### Scenario: Round-trip for note-trainer

- GIVEN `view` is `'note-trainer'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'note-trainer'`

##### Scenario: Round-trip for tone-generator

- GIVEN `view` is `'tone-generator'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'tone-generator'`

##### Scenario: Round-trip for pentatonic

- GIVEN `view` is `'pentatonic'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'pentatonic'`

##### Scenario: Round-trip for signal-lab

- GIVEN `view` is `'signal-lab'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'signal-lab'`

##### Scenario: Round-trip for interval-trainer

- GIVEN `view` is `'interval-trainer'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'interval-trainer'`

##### Scenario: Round-trip for tab-player

- GIVEN `view` is `'tab-player'`
- WHEN `pathToView(viewToPath(view))` is evaluated
- THEN the result is `'tab-player'`

---

#### Requirement: Browser Back/Forward Navigation

The app MUST listen for `popstate` events on `window`. When a `popstate` event
fires, `currentView` MUST be updated to `pathToView(location.pathname)`. The
`popstate` listener MUST NOT call `history.pushState` — reading pathname and
writing state is the only permitted action.

##### Scenario: Back button navigates to previous tool

- GIVEN the user navigated from `home` to `caged` (pushing `/caged` to history)
- WHEN the user presses the browser back button
- THEN a `popstate` event fires with `location.pathname` = `'/'`
- AND `currentView` becomes `'home'`

##### Scenario: Forward button navigates to next tool

- GIVEN the user pressed back from `caged` to `home`
- WHEN the user presses the browser forward button
- THEN a `popstate` event fires with `location.pathname` = `'/caged'`
- AND `currentView` becomes `'caged'`

##### Scenario: popstate listener does not push state

- GIVEN a `popstate` event fires
- WHEN the listener executes
- THEN `history.pushState` is NOT called
- AND no second `popstate` event is triggered

---

#### Requirement: SPA Fallback Rewrite

A `vercel.json` file MUST exist at the repository root and MUST configure a
rewrite rule that maps all request paths to `/index.html`. This ensures deep
links and page refreshes on `/<view-name>` are served by the SPA rather than
returning a 404.

##### Scenario: Deep link to a tool survives refresh

- GIVEN the user navigates directly to `/<view-name>` (e.g. `/caged`) in the browser
- WHEN the page loads
- THEN the SPA is served and `pathToView('/caged')` initialises `currentView` to `'caged'`
- AND the tool renders without a 404

---

### Capability: usage-analytics

---

#### Requirement: Vercel Web Analytics — Production Only

The app MUST integrate `@vercel/analytics` using its framework-agnostic
`inject()` entry point, invoked once at application bootstrap (`src/main.ts`),
NOT inside any component. It MUST be active in Vercel **production** deployments
only. The activation gate MUST be
`import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production'`, so
that local development (`import.meta.env.PROD` is false) AND Vercel **preview**
deployments (`VITE_VERCEL_ENV !== 'production'`) both leave analytics inactive.
If `VITE_VERCEL_ENV` is unset the gate MUST evaluate false (fail-safe: off). No
cookies are set and no PII is collected.

##### Scenario: Analytics is inactive in development

- GIVEN the app runs in development mode (`import.meta.env.PROD` is false)
- WHEN the app bootstraps
- THEN `inject()` is NOT called and no pageview events are emitted
- AND no tracking requests are sent

##### Scenario: Analytics is inactive in a Vercel preview deployment

- GIVEN a Vercel preview build where `import.meta.env.PROD` is true but `VITE_VERCEL_ENV` is `'preview'`
- WHEN the app bootstraps
- THEN the activation gate evaluates false and `inject()` is NOT called
- AND no tracking requests are sent

##### Scenario: Analytics is active in production

- GIVEN a Vercel production deployment where `import.meta.env.PROD` is true AND `VITE_VERCEL_ENV` is `'production'`
- WHEN the user navigates to `/<view-name>` via `navigate()`
- THEN Vercel Web Analytics records a pageview for that path automatically

##### Scenario: No cookies or PII are collected

- GIVEN the app is running in production
- WHEN any tool is visited
- THEN no cookies are set by the analytics integration
- AND no personally identifiable information is transmitted

#### Requirement: Automatic Pageview Tracking

Per-tool pageviews MUST be captured automatically from `pushState` navigations.
No explicit `track()` calls are required or permitted in v1. Each tool visit
MUST appear as a distinct pageview at its own path in the Vercel analytics
dashboard.

##### Scenario: Navigating to a tool records a distinct pageview

- GIVEN the app is running in production
- WHEN `navigate('interval-trainer')` is called
- THEN `history.pushState` places `'/interval-trainer'` in the address bar
- AND Vercel Web Analytics automatically records a pageview for `'/interval-trainer'`
- AND no explicit `track()` call is made

##### Scenario: Each of the 9 tools produces a distinct analytics path

- GIVEN the user visits `home`, `caged`, `progression`, `note-trainer`,
  `tone-generator`, `pentatonic`, `signal-lab`, `interval-trainer`, `tab-player`
  in sequence
- WHEN each navigation is recorded by Vercel Web Analytics
- THEN 9 distinct paths appear in the dashboard
- AND home is recorded as `'/'`
- AND all other tools are recorded as `'/<view-name>'`

---

## MODIFIED Capability: app-shell

(Previously: `navigate(view)` only assigned `currentView = view`; `currentView`
was initialised to `'home'` unconditionally.)

---

#### Requirement: navigate() Syncs URL

The `navigate(view: ViewName)` function in `App.svelte` MUST remain the single
chokepoint for all view transitions. In addition to updating `currentView`, it
MUST call `history.pushState({}, '', viewToPath(view))` to sync the address bar.

##### Scenario: Switching to a non-home tool updates the address bar

- GIVEN `currentView` is `'home'`
- WHEN `navigate('caged')` is called
- THEN `currentView` becomes `'caged'`
- AND `location.pathname` becomes `'/caged'`

##### Scenario: Navigating to home updates the address bar to root

- GIVEN `currentView` is `'interval-trainer'`
- WHEN `navigate('home')` is called
- THEN `currentView` becomes `'home'`
- AND `location.pathname` becomes `'/'`

##### Scenario: No feedback loop — navigate() never triggers popstate

- GIVEN `navigate('pentatonic')` is called
- WHEN `history.pushState` executes
- THEN no `popstate` event fires (pushState never dispatches popstate)
- AND the popstate listener is NOT invoked

---

#### Requirement: Initial View Derived From Pathname

On application load, `currentView` MUST be initialised to
`pathToView(location.pathname)` instead of the hardcoded value `'home'`. If the
pathname matches a known view, that view renders immediately. If the pathname is
unknown or `/`, `home` renders.

##### Scenario: App loads at root and shows home

- GIVEN the browser address bar shows `'/'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'home'`
- AND the Home page renders

##### Scenario: App loads at a known tool path and shows that tool

- GIVEN the browser address bar shows `'/tab-player'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'tab-player'`
- AND the Tab Player renders without first rendering the home page

##### Scenario: App loads at an unknown path and shows home

- GIVEN the browser address bar shows `'/unknown-tool'`
- WHEN the app initialises
- THEN `currentView` is initialised to `'home'`
- AND the Home page renders

---

## Out of Scope

The following MUST NOT be implemented in this change:

- Custom analytics events via `track()` (requires Vercel Pro plan)
- Slug/alias mapping or any path-to-view indirection beyond the 1:1 segment rule
- Nested routes, query-param state, or per-tool deep-link state
- Cookie consent banner or any privacy infrastructure (analytics is cookieless)
- Any change to visual skin, design tokens, or component layout
- A third-party routing library (History API is sufficient)
- URL normalisation beyond single leading/trailing-slash tolerance (e.g. case-insensitive paths, query string or hash handling)
