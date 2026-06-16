# Rebranding guide

How to change the visual identity (the "skin") of Music Tools.

The UI is built on a **semantic design-token system**. A rebrand is a change to a
small set of token values — not a rewrite of components. No component hardcodes a
colour or font; everything reads from tokens.

## The single source of truth

All tokens live in one place: the `:root` block in [`src/app.css`](../src/app.css).

```css
:root {
  /* Colours are space-separated RGB triplets (not #hex) so they compose with
     alpha — e.g. rgb(var(--accent-rgb) / 0.2) — and Tailwind's /opacity. */
  --surface-rgb: 11 11 13;        /* page / device chassis background */
  --surface-raised-rgb: 22 22 25; /* cards sitting on the surface */
  --hairline-rgb: 42 42 49;       /* borders, rules, engraving lines */
  --ink-rgb: 233 231 226;         /* primary text */
  --muted-rgb: 141 138 132;       /* secondary / muted text */
  --accent-rgb: 255 158 44;       /* brand accent (amber today) */
  --accent-soft-rgb: 255 192 107; /* lit / highlighted accent */
  --accent-deep-rgb: 179 94 0;    /* darker accent shade (LED hot core) */

  --font-display: 'IBM Plex Sans', system-ui, sans-serif;   /* headings, body */
  --font-technical: 'IBM Plex Mono', ui-monospace, monospace; /* labels, badges */
}
```

Change these values and the **whole UI follows**: palette, the ambient glow, the
noise grain, the indicator LEDs, cards, buttons, focus states.

## How to rebrand

### Option A — change the palette in place (most common)

1. Edit the `--*-rgb` values in `src/app.css`. Keep the **space-separated RGB
   triplet** format (`R G B`, no commas, no `#`).
   - Example: amber → teal accent: `--accent-rgb: 20 184 166;`
     and pick matching `--accent-soft-rgb` / `--accent-deep-rgb` lighter/darker shades.
2. Nothing else to touch for colour. Verify visually (see below).

### Option B — swap fonts

1. Install the new font (self-hosted, only the weights used):
   `pnpm add @fontsource/<family>`
2. Import the weights in [`src/main.ts`](../src/main.ts) (replace the existing
   `@fontsource/...` lines).
3. Update `--font-display` / `--font-technical` in `src/app.css`.

### Option C — multiple themes (light/dark or named brands)

Add a scoped block that overrides the tokens, and toggle a class on a container:

```css
.theme-daylight {
  --surface-rgb: 248 247 244;
  --ink-rgb: 24 24 27;
  --accent-rgb: 37 99 235;
  /* …override only what differs… */
}
```

Tokens cascade, so any subtree with `class="theme-daylight"` re-skins itself.

## How the tokens reach the UI

- **Tailwind utilities** ([`tailwind.config.js`](../tailwind.config.js)) map to the
  variables with the `<alpha-value>` placeholder, which is what makes the
  `/opacity` modifier work:
  - colours: `bg-surface`, `bg-surface-raised`, `border-hairline`, `text-ink`,
    `text-muted`, `text-accent`, `text-accent-soft`, and opacity variants like
    `bg-accent/10`, `border-hairline/60`.
  - fonts (role-based, **not** the global `sans`/`mono`): `font-display`,
    `font-technical`.
  - effects: `shadow-led`, `shadow-led-sm`, `shadow-panel-raised`,
    `animate-led-pulse`, `animate-rack-in`.
- **CSS helpers** (`src/app.css`): `.surface-grain` (noise texture overlay) and
  `.indicator-led` (lit LED) read the accent token directly.
- **Inline gradients** (e.g. the home page ambient glow) use
  `rgb(var(--accent-rgb) / <alpha>)` — never a literal colour.

## Notes for the AI

Read this before doing a rebrand or extending the skin to new components.

- **Never hardcode a colour, shadow, or font** in a component or in CSS. Add or
  reuse a token. If you need a new conceptual colour, add a `--*-rgb` token first,
  then a Tailwind mapping — do not inline a hex/rgba.
- **Use the semantic class names** (`bg-surface`, `text-accent`, …). They are named
  by ROLE, not by aesthetic, on purpose: a rebrand must never require renaming
  classes. Do not introduce aesthetic-specific names (no `bg-studio-*`, `bg-amber-*`).
- **Colour tokens are RGB triplets.** Keep the `R G B` format so alpha composition
  (`rgb(var(--accent-rgb) / 0.2)`) and Tailwind's `<alpha-value>` keep working.
- **Do not override Tailwind's global `font-sans` / `font-mono`.** Other tools
  (e.g. `LegendPanel`, `TabPlayer`) use `font-mono`. The skin uses the dedicated
  `font-display` / `font-technical` roles instead.
- **When skinning a new component**, reuse the existing semantic classes and the
  `.surface-grain` / `.indicator-led` helpers. Match the patterns in
  `HomePage.svelte` and `ToolCard.svelte`.
- **The studio skin is dark by design** (a pedalboard has no light variant). If a
  rebrand needs light mode, use Option C (a `.theme-*` scope), don't add `dark:`
  variants to skinned components.
- **Respect `prefers-reduced-motion`.** New animations must be disabled under the
  guard in `src/app.css` (add the animation class to that media query).
- **Accessibility:** keep accent-on-surface and muted-on-surface text within WCAG
  contrast. Decorative layers (glow, grain, meters, LEDs) must stay `aria-hidden`.
- **Verification is visual.** Styling is not covered by behavioural tests. After a
  change: run the test suite (structure/behaviour must stay green), `npm run build`,
  then deploy a Vercel **preview** (`npx vercel --yes`) and confirm by eye before
  merging. Do not rely on tests to catch a wrong colour.

## Files involved

| File | Role |
| --- | --- |
| `src/app.css` | Token definitions (`:root`), `.surface-grain`, `.indicator-led`, reduced-motion guard |
| `tailwind.config.js` | Maps tokens → utilities (`<alpha-value>`), fonts, shadows, animations |
| `src/main.ts` | `@fontsource` imports (font files) |
| `src/lib/components/HomePage.svelte` | Reference implementation of the skin (background, header, sections) |
| `src/lib/components/ToolCard.svelte` | Reference implementation of a skinned card |
