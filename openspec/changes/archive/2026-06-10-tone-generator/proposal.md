# Proposal: Tone Generator for Ear Training

## Intent

Musicians tuning by ear need a reliable reference pitch. This adds a tone generator that plays standard guitar string frequencies (E2–E4) via Web Audio API. Step 1 of a tuner tool; microphone-based tuner comes later.

## Scope

### In Scope
- Single `ToneGenerator.svelte` component with 6 guitar string buttons
- Web Audio API playback (OscillatorNode + GainNode), lazy AudioContext init
- Volume slider, wave type selector (sine/triangle/sawtooth/square)
- Route at `'tone-generator'`, card on HomePage
- Unit tests for component behavior

### Out of Scope
- Microphone-based tuner (future change)
- Visual frequency analyzer
- Custom tunings beyond standard EADGBE
- Persisting user preferences (volume/wave type)

## Capabilities

### New Capabilities
- `tone-generator`: Reference tone playback for 6 standard guitar strings with volume and wave type controls

### Modified Capabilities
- `app-shell`: Add `'tone-generator'` to `ViewName` union and routing
- `home-page`: Add Tone Generator card to tool grid

## Approach

Web Audio API with `<button>`-triggered `AudioContext` creation (browser autoplay policy). One `OscillatorNode` + `GainNode` per playback; stop previous before starting new. Svelte 5 `$effect` cleanup on unmount. Follow existing card-based layout pattern (max-w-5xl, back button, card grid).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/types/chord.ts` | Modified | Add `'tone-generator'` to ViewName |
| `src/lib/components/ToneGenerator.svelte` | New | Main component |
| `src/App.svelte` | Modified | Add import + route |
| `src/lib/components/HomePage.svelte` | Modified | Add tool card |
| `tests/components/ToneGenerator.test.ts` | New | Component tests |
| `tests/components/HomePage.test.ts` | Modified | Update Open button count |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AudioContext blocked by browser autoplay policy | Low | Lazy init on user click |
| Oscillator not stopped on unmount | Low | $effect cleanup |
| MatchMedia not available in jsdom | Med | Guard in component, mock in tests |

## Rollback Plan

Remove `'tone-generator'` from ViewName, delete the component file, remove import/route from App.svelte, remove card from HomePage.svelte. No data migration needed.

## Dependencies

None. Web Audio API is browser-native.

## Success Criteria

- [ ] Clicking a string button plays the correct frequency
- [ ] Clicking again stops playback
- [ ] Volume slider adjusts gain in real time
- [ ] Wave type selector changes oscillator waveform
- [ ] Back button navigates to home
- [ ] All tests pass, build is clean
