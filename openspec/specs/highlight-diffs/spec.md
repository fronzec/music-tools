# Highlight Diffs Specification

## Purpose

Compute visual diff between two fretboard position sets: classify shared positions as same-interval (green) or different-interval (amber dashed), and produce a highlight map consumed by FullFretboard.

## Requirements

| Requirement | Rule | Happy Path | Edge Cases |
|---|---|---|---|
| **Shared Utility** | `buildPositionMap()` MUST be exported from `src/lib/theory/fretboard.ts` | Accepts `ChordShape[]`, returns `Map<string, NoteEntry[]>` | Empty array → empty map |
| **NoteEntry Type** | `NoteEntry` MUST be exported from `src/lib/theory/fretboard.ts` | Contains `shape`, `color`, `isRoot`, `interval`, `absFret`, `stringIndex` | `interval` may be `null` for muted strings |
| **Diff Map Generation** | `computeDiffPositions()` MUST return `Map<string, { type: 'same' \| 'different' }>` | Intersects keys from both maps; classifies by interval equality | No overlap → empty map |
| **Same Interval** | When both maps have same key AND same interval string, diff MUST classify as `'same'` | Same (fret, string) with matching intervals (e.g. both R) | Root on one side only → `'different'` |
| **Different Interval** | When both maps have same key AND different interval strings, diff MUST classify as `'different'` | Same position, one is R, other is 3 | Same position both null (muted) → not in map (both absent) |
| **Unique Positions** | Positions unique to one fretboard MUST NOT appear in diff map | Position only in top fretboard → no highlight | Barre vs open on same string/fret → still classified if key matches |
| **Key Format** | Position keys MUST be `{absFret},{stringIndex}` | `5,2` means fret 5, string 3 | `0,0` means open E string |

## Scenarios

### Scenario: Identical chord shapes (same intervals)

- GIVEN two C major chord shapes with identical positions and intervals
- WHEN `computeDiffPositions()` runs
- THEN every shared position has `type: 'same'`
- AND no position has `type: 'different'`

### Scenario: Different voicing (different intervals)

- GIVEN top fretboard has C major at position (3,5) = R, bottom has G major at same position = 5
- WHEN `computeDiffPositions()` runs
- THEN position key `"3,5"` has `type: 'different'`
- AND `type: 'same'` positions remain for matching intervals

### Scenario: No overlap between chords

- GIVEN C major shapes on top fretboard and D major shapes on bottom with no shared positions
- WHEN `computeDiffPositions()` runs
- THEN diff map is empty
- AND no highlights render on either fretboard

### Scenario: Position unique to one side

- GIVEN top fretboard has a note at (5,2) and bottom does not
- WHEN `computeDiffPositions()` runs
- THEN `"5,2"` is NOT in the diff map
- AND that note renders normally without a highlight ring

### Scenario: Barre position matching

- GIVEN both fretboards have a barre at base fret 5 on strings 1–3
- WHEN `computeDiffPositions()` computes with `absFret = baseFret + fret`
- THEN barre positions are correctly keyed and classified
- AND diff uses the same `baseFret + fret` logic as `buildPositionMap`

## Notes

- **Key algorithm**: `absFret = baseFret > 0 ? baseFret + fret : fret`
- **Classification**: compare `interval` strings (not note names); `null` intervals excluded from map
- **Shared utility**: pure extraction from `FullFretboard.svelte`; no behavior change
- **Consumers**: `DualFretboard` calls `computeDiffPositions` via `$derived.by()` and passes result to both `FullFretboard` instances
