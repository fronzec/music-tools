# Usage Analytics Specification

## Purpose

Define cookieless usage analytics for the app via Vercel Web Analytics. Per-tool pageviews are captured automatically from History API navigations so site usage is observable, with no cookies, no PII, and no custom events. Analytics is active in Vercel production deployments only.

## Requirements

### Requirement: Vercel Web Analytics — Production Only

The app MUST integrate `@vercel/analytics` using its framework-agnostic
`inject()` entry point, invoked once at application bootstrap (`src/main.ts`),
NOT inside any component. It MUST be active in Vercel **production** deployments
only. The activation gate MUST be
`import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production'`, so
that local development (`import.meta.env.PROD` is false) AND Vercel **preview**
deployments (`VITE_VERCEL_ENV !== 'production'`) both leave analytics inactive.
If `VITE_VERCEL_ENV` is unset the gate MUST evaluate false (fail-safe: off). No
cookies are set and no PII is collected.

#### Scenario: Analytics is inactive in development

- GIVEN the app runs in development mode (`import.meta.env.PROD` is false)
- WHEN the app bootstraps
- THEN `inject()` is NOT called and no pageview events are emitted
- AND no tracking requests are sent

#### Scenario: Analytics is inactive in a Vercel preview deployment

- GIVEN a Vercel preview build where `import.meta.env.PROD` is true but `VITE_VERCEL_ENV` is `'preview'`
- WHEN the app bootstraps
- THEN the activation gate evaluates false and `inject()` is NOT called
- AND no tracking requests are sent

#### Scenario: Analytics is active in production

- GIVEN a Vercel production deployment where `import.meta.env.PROD` is true AND `VITE_VERCEL_ENV` is `'production'`
- WHEN the user navigates to `/<view-name>` via `navigate()`
- THEN Vercel Web Analytics records a pageview for that path automatically

#### Scenario: No cookies or PII are collected

- GIVEN the app is running in production
- WHEN any tool is visited
- THEN no cookies are set by the analytics integration
- AND no personally identifiable information is transmitted

### Requirement: Automatic Pageview Tracking

Per-tool pageviews MUST be captured automatically from `pushState` navigations.
No explicit `track()` calls are required or permitted in v1. Each tool visit
MUST appear as a distinct pageview at its own path in the Vercel analytics
dashboard.

#### Scenario: Navigating to a tool records a distinct pageview

- GIVEN the app is running in production
- WHEN `navigate('interval-trainer')` is called
- THEN `history.pushState` places `'/interval-trainer'` in the address bar
- AND Vercel Web Analytics automatically records a pageview for `'/interval-trainer'`
- AND no explicit `track()` call is made

#### Scenario: Each of the 9 tools produces a distinct analytics path

- GIVEN the user visits `home`, `caged`, `progression`, `note-trainer`,
  `tone-generator`, `pentatonic`, `signal-lab`, `interval-trainer`, `tab-player`
  in sequence
- WHEN each navigation is recorded by Vercel Web Analytics
- THEN 9 distinct paths appear in the dashboard
- AND home is recorded as `'/'`
- AND all other tools are recorded as `'/<view-name>'`
