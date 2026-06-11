# Tasks: Tone Generator

## 1. Types
- [x] 1.1 Add `'tone-generator'` to `ViewName` union in `src/lib/types/chord.ts`

## 2. Component
- [x] 2.1 Create `src/lib/components/ToneGenerator.svelte`
  - Layout: back button, title, Strings card (6 buttons), Sound card (volume + wave type)
  - Web Audio: lazy `AudioContext`, `play(freq, num)`, `stop()`, `$effect` cleanup
  - Active state: highlight playing button, show "Stop" text

## 3. Routing
- [x] 3.1 Import `ToneGenerator` in `src/App.svelte`
- [x] 3.2 Add `{:else if currentView === 'tone-generator'}` branch with `<svelte:boundary>`

## 4. Home Page
- [x] 4.1 Add Tone Generator card to `src/lib/components/HomePage.svelte`
  - Emoji: 🎵, title: "Tone Generator", description: "Reference tones for tuning by ear"
- [x] 4.2 Place after Note Trainer card, before placeholder cards
- [x] 4.3 Update HomePage test: adjust `Open` button count from 3 to 4

## 5. Tests
- [x] 5.1 Create `tests/components/ToneGenerator.test.ts`
  - Renders 6 string buttons
  - Click plays (verify mock oscillator.start called)
  - Click again stops (verify mock oscillator.stop called)
  - Volume slider updates gainNode.gain.value
  - Wave type selector changes oscillator.type
  - Back button navigates home
