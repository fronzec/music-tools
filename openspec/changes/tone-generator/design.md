# Design: Tone Generator

## Architecture

Single Svelte 5 component (`ToneGenerator.svelte`) with Web Audio API. No shared state, no stores. Everything is local component state.

### Component Tree
```
App.svelte → ToneGenerator.svelte
```

### Data Flow
```
User click → play(freq, num)
  → stop previous → create OscillatorNode + GainNode
  → connect chain → start()
  → $state: activeString = num

Volume slider → $state: volume → gainNode.gain.value (if playing)
Wave select  → $state: waveType → oscillator.type (if playing)

Unmount → $effect cleanup → stop() + audioCtx.close()
```

## State
| State | Type | Default | Notes |
|-------|------|---------|-------|
| `audioCtx` | `AudioContext \| null` | `null` | Lazy init on first click |
| `oscillator` | `OscillatorNode \| null` | `null` | Current playing oscillator |
| `gainNode` | `GainNode \| null` | `null` | Current gain node |
| `activeString` | `number \| null` | `null` | Currently playing string index |
| `volume` | `number` | `0.3` | Range 0–1 |
| `waveType` | `OscillatorType` | `'sine'` | sine, triangle, sawtooth, square |

## Layout

```
max-w-5xl mx-auto
├── Back button
├── Title: "Tone Generator"
└── Cards:
    ├── "Strings" card: 6 buttons, responsive grid (sm:2 lg:3)
    │   └── Each: string# | note name | freq | Play/Stop
    └── "Sound" card:
        ├── Volume slider (range 0–1, step 0.01, labeled)
        └── Wave type selector (4 buttons, inline-flex group)
```

### String Button States
- **Inactive**: gray border, "▶ Play" text
- **Active (playing)**: blue border + background highlight, "■ Stop" text

## Decisions

1. **Lazy AudioContext**: Browser autoplay policy requires user gesture. Creating on first click satisfies this.
2. **Single oscillator**: No polyphony needed for a reference tone. Stop before playing new ensures clean transitions.
3. **No reduced-motion check**: Audio is not affected by prefers-reduced-motion. Skipping this keeps the component simpler.
4. **Volume/gain binding**: Only update `gainNode.gain.value` when oscillator is active, avoiding null reference errors.

## Test Strategy

Mock AudioContext, OscillatorNode, GainNode via `window.AudioContext` mock. Verify:
- 6 string buttons render with correct labels
- Click calls play (verify oscillator created)
- Second click calls stop
- Volume slider changes gainNode.gain.value
- Wave type buttons exist and change oscillator.type
- Back button navigates home
