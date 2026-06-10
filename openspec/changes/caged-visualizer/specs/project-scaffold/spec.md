# Project Scaffold Specification

## Purpose

Bootstrap the greenfield music-tools project with a Svelte 5, TypeScript, Vite, and Tailwind CSS v3 scaffold, configured for testing, linting, and formatting.

## Requirements

### Requirement: Vite + Svelte 5 + TypeScript Setup

The system MUST provide a Vite-based Svelte 5 project using TypeScript with runes mode enabled.

#### Scenario: Dev server starts

- GIVEN the project is scaffolded
- WHEN `pnpm dev` is executed
- THEN the dev server starts on the default Vite port
- AND the browser loads the application without errors

#### Scenario: Production build succeeds

- GIVEN the project is scaffolded
- WHEN `pnpm build` is executed
- THEN a static site is emitted to the `dist/` directory
- AND the build completes with zero errors and zero warnings

### Requirement: Tailwind CSS v3 Integration

The system MUST integrate Tailwind CSS v3 with PostCSS, configured for the project's source paths.

#### Scenario: Tailwind classes compile

- GIVEN a component uses Tailwind utility classes
- WHEN the dev server or build runs
- THEN the generated CSS contains the used utility styles
- AND unused styles are purged in production builds

### Requirement: Vitest Test Runner

The system MUST configure Vitest for unit testing with Vite integration and at least one passing test file.

#### Scenario: Tests run and pass

- GIVEN the project is scaffolded
- WHEN `pnpm vitest run` is executed
- THEN all tests execute and pass
- AND coverage can be collected with a single command flag

#### Scenario: Component tests render

- GIVEN a Svelte component has a test file
- WHEN the test mounts the component with `@testing-library/svelte`
- THEN the component renders in the test environment
- AND assertions against DOM elements succeed

### Requirement: ESLint + Prettier Configuration

The system MUST configure ESLint and Prettier for TypeScript and Svelte files with consistent formatting rules.

#### Scenario: Lint passes cleanly

- GIVEN source code follows project conventions
- WHEN `pnpm lint` runs
- THEN ESLint reports zero errors and zero warnings

#### Scenario: Format is idempotent

- GIVEN source code is committed
- WHEN `pnpm format` runs
- THEN no files are modified (already formatted)

### Requirement: Project Directory Structure

The system MUST organize source code into a clean, domain-oriented directory structure.

#### Scenario: Directory structure is correct

- GIVEN the project is scaffolded
- WHEN `ls src/` is executed
- THEN directories exist: `lib/components/`, `lib/data/`, `lib/theory/`, `routes/` (or equivalent)
- AND the `App.svelte` entry point is at the project root or `src/`

### Requirement: Package Manager

The system MUST use pnpm as the package manager, with a `pnpm-lock.yaml` file.

#### Scenario: Dependencies install via pnpm

- GIVEN a fresh clone
- WHEN `pnpm install` runs
- THEN all dependencies resolve and the lockfile is created or updated
