# Full Fretboard — Delta Spec: Fix Open/Muted Indicators

## MODIFIED Requirements

### Requirement: Open/Muted String Indicators

The system MUST compute and render one deduplicated set of O/× indicators per string,
aggregated across all visible shapes, as a compact horizontal row centered at the nut
area. Each indicator MUST be colored by its shape's entry in `SHAPE_COLORS`.

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Per-String Deduplication** | MUST compute indicators as `Array<{ shape: CagedShape, type: 'open' \| 'muted' }>` per string (0-5), iterating visible shapes in CAGED order | String 0 open in C and A, muted in G → `[{C, open}, {A, open}, {G, muted}]` | No visible shapes at open position → no indicators rendered |
| **Horizontal Row Layout** | MUST render indicators per string as a horizontal row using `FL.INDICATOR_SP` (12px) center-to-center spacing and `FL.INDICATOR_FS` (8px) font size; row SHALL be centered at the nut horizontal midpoint (`LEFT_PAD + NUT_W / 2`) | 3 indicators per string → 3 glyphs spaced 12px apart | 5 indicators (max) → row extends ~36px each side of center |
| **Shape Color Coding** | Each indicator MUST use `SHAPE_COLORS[shape]` as its `fill` | C open → blue O; G muted → green × | All five shapes → five distinct colors in CAGED order |
| **CAGED Order** | Indicators MUST render in CAGED order (C, A, G, E, D) left to right per string, matching the z-order convention | C at leftmost, D at rightmost | — |
| **Precedence per Shape** | For each shape: `fret === null` → × (muted), `fret === 0` → O (open), `fret > 0` → no indicator | Mixed open/muted per string → only relevant shapes shown | String with all fretted notes → empty row (no indicators) |
| **Vertical Position** | MUST render indicators above the nut, tight to each string: `y = stringY(i) - L.ROOT_R - 2` | Same vertical offset as previous implementation | — |
| **Open Position Only** | Indicators MUST render only when `isOpenPosition` is true (at least one visible shape at `baseFret === 0`) | Open position → indicators visible | Barre-only position → no indicators |
| **No Overlap** | MUST NOT render overlapping indicators — one glyph per visible per-shape open/muted state per string | Clear visual separation of shape indicators | — |

### Scenario: All five shapes in open position

- GIVEN all five CAGED shapes visible with `baseFret === 0`
- AND high E string is open (fret 0) in C, A, G, E and muted (fret null) in D
- WHEN FullFretboard renders
- THEN high E string shows a horizontal row: [O C-color] [O A-color] [O G-color] [O E-color] [× D-color]
- AND indicators are spaced 12px apart, center-to-center

### Scenario: Partial shape visibility

- GIVEN only C and G shapes visible with `baseFret === 0`
- AND low E string is open (fret 0) in C and muted (fret null) in G
- WHEN FullFretboard renders
- THEN low E string shows exactly two indicators: [O C-color] [× G-color]

### Scenario: All-fretted string (no indicators)

- GIVEN all visible shapes have a fretted note (fret > 0) on string 3
- WHEN FullFretboard renders
- THEN string 3 shows no indicator row

### Scenario: Non-open position (no indicators)

- GIVEN all visible shapes have `baseFret > 0`
- WHEN FullFretboard renders
- THEN no O/× indicators are rendered anywhere

### Scenario: Indicators do not animate

- GIVEN a root change occurs in open position
- WHEN the fretboard re-renders
- THEN O/× indicators remain static (no CSS transition), consistent with Static Elements requirement
