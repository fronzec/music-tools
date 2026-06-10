# Archive Report: Per-Shape Open/Muted Indicators

**Change**: per-shape-open-muted
**Archived**: 2026-06-10
**Archive location**: `openspec/changes/archive/2026-06-10-per-shape-open-muted/`
**Archive mode**: openspec

## Task Completion Gate

All implementation tasks are marked `[x]` — gate passed. No stale checkboxes required reconciliation.

## Verify Report Status

**Status**: PASS
**Tests**: 322 tests, build clean
**No CRITICAL issues** — archive proceeded normally.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `full-fretboard` | Updated + scenarios replaced | Modified: Open/Muted Strings (per-(baseFret,stringIndex) grouping, removed isOpenPosition guard, animation). Removed: isOpenPosition guard reference, O/× indicators from Static Elements. Replaced 5 old indicator scenarios with 8 new scenarios. |
| `fretboard` | Updated | Modified: Open and Muted String Indicators (barre position support, per-baseFret X positioning). Removed: "Barre position — no indicators" scenario. Added: "Muted string in barre position", "Open string in barre position", "Barre position — open/muted indicators appear" scenarios. |

## Archive Contents

| Artifact | Status |
|----------|--------|
| `proposal.md` | ✅ |
| `specs/full-fretboard/spec.md` (delta) | ✅ |
| `specs/fretboard/spec.md` (delta) | ✅ |
| `design.md` | ✅ |
| `tasks.md` | ✅ (12/12 tasks complete) |
| `verify-report.md` | ✅ (PASS) |
| `archive-report.md` | ✅ (this file) |

## Source of Truth Updated

The following main specs now reflect the new behavior:
- `openspec/specs/full-fretboard/spec.md` — Open/Muted Strings requirement updated; Static Elements updated; scenarios replaced
- `openspec/specs/fretboard/spec.md` — Open and Muted String Indicators updated with barre position support

## Changes Summary

- O/× indicators now group by `(baseFret, stringIndex)` instead of just `stringIndex`
- `isOpenPosition` guard removed — ALL visible shapes show indicators
- Barre shapes show indicators left of the barre fret line
- Indicators animate alongside their shapes on root change
- FullFretboard and Fretboard components both updated for consistency

## Intentional Overrides

None.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
