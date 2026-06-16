# 🎸 Music Tools

Interactive tools for learning music theory and guitar — explore the CAGED
system, build chord progressions, train fretboard notes, and more. Built as a
single-page app with Svelte 5 (runes), Vite, and Tailwind CSS.

## Tools

| Tool | What it does |
|------|--------------|
| **CAGED Visualizer** | Understand the CAGED system across the fretboard |
| **Progression Builder** | Build chord progressions and practice transitions step by step |
| **Note Trainer** | Learn every note on the fretboard with visual patterns and quizzes |
| **Tone Generator** | Reference tones for tuning by ear |
| _Scales Explorer_ | _Planned — explore scales across the fretboard_ |
| _Chord Library_ | _Planned — browse chord voicings and variations_ |

Navigation is client-side state (no router/URLs). Dark mode is supported via a
theme toggle.

## Design & theming

The UI uses a semantic **design-token system** (CSS variables in `src/app.css`),
so the visual identity can be changed in one place. To re-skin the app, see
[`docs/rebranding.md`](docs/rebranding.md) — it includes notes for AI agents.

## Tech Stack

- **Svelte 5** with runes (`runes: true`) — no SvelteKit, plain `vite-plugin-svelte`
- **Vite 8** — dev server and bundler
- **TypeScript 6** — `tsc --noEmit` type-checks before every build
- **Tailwind CSS 3** (+ PostCSS, autoprefixer)
- **Vitest 4** + `@testing-library/svelte` + jsdom — tests live in `tests/`
- **ESLint 10** + **Prettier 3** (with `prettier-plugin-svelte`)

Requires **Node 22+**.

## Getting Started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (Vite, HMR)
```

Open the URL Vite prints (default http://localhost:5173).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check (`tsc --noEmit`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
src/
├── main.ts                 # entry point — mounts App
├── App.svelte              # top-level view switch + error boundaries
├── app.css                 # Tailwind entry + global styles
├── lib/
│   ├── components/         # Svelte components (tools, fretboard, UI)
│   ├── theory/             # music theory domain logic (fretboard, CAGED)
│   ├── data/               # static chord/note data
│   ├── types/              # shared TypeScript types
│   ├── utils/              # presentation/layout helpers
│   └── theme.svelte.ts     # dark-mode theme state (runes)
└── tests/                  # Vitest specs (mirrors src structure)
```

The codebase follows a layered separation: **theory** (domain) → **utils**
(presentation helpers) → **components** (rendering). Keep domain logic out of
components.

## Deployment

Deployed to **Vercel** as a static SPA. Vercel auto-detects the Vite framework
(build → `dist/`), so no `vercel.json` is required.

To deploy a production build:

```bash
npx vercel --prod
```

> Use `npx vercel` — the `vercel` binary is not assumed to be on `PATH`.

The first run links the project (creates a local `.vercel/` directory, which is
git-ignored). Subsequent `npx vercel --prod` runs publish directly.

## Testing

```bash
npm run test          # one-shot
npm run test:watch    # watch mode
```

Tests use Vitest with the jsdom environment and Testing Library for Svelte.
Specs live under `tests/` and are matched by `tests/**/*.{test,spec}.ts`.
