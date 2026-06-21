# Exploration: diatonic-chord-shapes

> Primary record: engram `sdd/diatonic-chord-shapes/explore`. This file mirrors it for the hybrid file trail.

## Goal
Replace the just-removed per-chord full-neck fretboard (PR #66) in the Diatonic Harmonizer with a per-chord **open-position chord-shape diagram** — the actual playable voicing (finger numbers, open/muted markers, barre, note-name column colored by interval role). Support **all 12 major keys** (Option B) via hand-authored voicings; mockup is visual inspiration only.

## Current state
- `DiatonicHarmonizer.svelte` renders 7 chord cards; the fretboard slot is empty (comment: "fretboards removed; new shape diagrams pending").
- `ChordFretboard.svelte` is a **shared** full-14-fret tone-map (calls `chordPositions()`), **still used by ChordBuilder.svelte** — do NOT modify.
- `layout.ts` geometry is built for a 14-fret neck (`FRET_SP=50`) — wrong scale for a compact shape diagram; shared by 5 components, so do not touch.
- `STANDARD_TUNING = [4,9,2,7,11,4]` (low E→high e, pitch classes) lives in `chord.ts` — canonical source for role math.
- `diatonicTriads(root)` returns 7 `DiatonicTriad` `{ degree, roman, quality, rootPc, rootName, notes }`.
- Prior art: the CAGED `ChordShape` (`frets[6]`, `baseFret`, `intervals[6]`) and `Fretboard.svelte` already handle a fret-window + baseFret offset + barre — model the new diagram on this.
- Color tokens `note-root` / `note-third` / `note-tone` all exist (`tailwind.config.js`, `app.css`); `fill-note-third` is valid. (Risk #1 resolved.)

## Approaches compared
- **A — fully hand-authored 84 voicings** (12 keys × 7 degrees). Pros: perfect quality control; every voicing checkable by the correctness test; sharp keys naturally get barre shapes; no algorithm. Cons: ~504 fret values to enter (mitigated by the test gate). **RECOMMENDED.**
- **B — author natural keys + algorithmically transpose for sharps.** Cons: not all open shapes have clean movable equivalents; vii° doesn't transpose cleanly; adds a silent-error failure mode. Not simpler than the data. Rejected.

## Proposed data model (`src/lib/theory/openVoicings.ts`)
```ts
type StringFret = number | null;   // null=muted, 0=open, >0=fretted (ABSOLUTE fret)
type Finger = 1 | 2 | 3 | 4 | null;
interface BarreSpec { fret: number; fromString: number; toString: number; }
interface OpenVoicing {
  roman: string; name: string; quality: TriadQuality; rootPc: number;
  frets: [StringFret×6];   // low E→high e
  fingers: [Finger×6];
  barre?: BarreSpec;
  baseFret: number;        // 1=open position; >1=barre window start
}
type OpenVoicingMap = Record<NoteName, readonly OpenVoicing[7]>;
export const OPEN_VOICINGS: OpenVoicingMap;
export function getOpenVoicing(keyRoot: NoteName, degree: Degree): OpenVoicing;
```
Absolute frets keep role derivation trivial: `pc=(STANDARD_TUNING[i]+frets[i])%12`.

## Geometry (`src/lib/theory/shapeLayout.ts`, independent of layout.ts)
Compact ~5-fret window with a baseFret offset (for barre shapes up the neck). Pure fns: `slStringY`, `slFretLineX`, `slNoteX(absFret, baseFret)`, `slViewBoxW`, `slViewBoxH`. Left gutter for O/× markers.

## Rendering (`src/lib/components/ChordShapeDiagram.svelte`)
Props: `voicing`, `rootPc`, `chordName?`. Role per played string: `semis=(pc-rootPc+12)%12` → 0=root, 3|4=third, 6|7=fifth → `fill-note-root|third|tone`. Tokens only (tests forbid `#rrggbb`/`rgb`/`hsl`). Test hooks: `data-role`, `data-string`, `data-open`, `data-muted`, `data-barre`, `data-base-fret`.

## Correctness test (`tests/unit/theory/openVoicings.test.ts`)
For each of 12×7: derive expected PCs from `diatonicTriads`; derive played PCs from tuning+frets; assert played ⊆ expected (no out-of-chord notes), root present, ≥3 strings played.

## Wiring
In `DiatonicHarmonizer.svelte` `{#each triads as t}`: `{@const voicing = getOpenVoicing(root, t.degree)}` then `<ChordShapeDiagram {voicing} rootPc={t.rootPc} chordName={t.name} />`. No new state. ChordBuilder/ChordFretboard untouched.

## Open items for the proposal phase
1. ~~Confirm `fill-note-third` token~~ — DONE, exists.
2. baseFret display convention (fret-number label position/style).
3. vii° voicing-selection strategy across all 12 keys (partial 4-string chords acceptable).
4. Authoring sequence (natural keys → flats → sharps), running the correctness test after each key.
5. Size: 84 voicings + new component + tests will far exceed 400 lines → chained-PR / size decision at the apply gate.

**Next recommended:** sdd-propose
