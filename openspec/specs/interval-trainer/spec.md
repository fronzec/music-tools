# Interval Trainer Specification

## Purpose

Ear-training quiz tool with visual exploration mode. Plays two notes ascending, asks the user to identify the interval from a multiple-choice panel (Practice mode), gives immediate feedback, and tracks score. Also offers a visual Explore mode: pick a root + interval, see all occurrences across the fretboard, and hear the interval from a fixed reference octave.

## Requirements

### Requirement: Practice / Explore Mode Toggle

The Interval Trainer MUST render a two-option toggle that switches between Practice mode and Explore mode. The toggle MUST be labeled "Practice" and "Explore". Exactly one mode MUST be active at a time.

The toggle MUST have an accessible `aria-label` (e.g., "Trainer mode"). The active option MUST communicate its state via `aria-pressed` or equivalent (`aria-selected` if implemented as a tab).

Practice mode behavior is unchanged — the quiz, scoring, and answer flow continue to work as specified in the existing Interval Trainer spec. Explore mode renders the `IntervalFretboard` view with root + interval controls and Play button (see the `interval-explorer` spec).

Root note and interval selections are shared between modes so that switching modes does not reset the user's choices.

#### Scenario: Default state — Practice mode is active on mount

- GIVEN the Interval Trainer component is mounted
- WHEN no user interaction has occurred
- THEN Practice mode is the active mode
- AND the quiz UI is visible
- AND the fretboard / Explore UI is NOT rendered

#### Scenario: Switching to Explore mode

- GIVEN the Interval Trainer is in Practice mode
- WHEN the user activates the "Explore" toggle option
- THEN Explore mode becomes active
- AND the fretboard view is rendered
- AND the quiz UI is NOT rendered

#### Scenario: Switching back to Practice mode

- GIVEN the Interval Trainer is in Explore mode
- WHEN the user activates the "Practice" toggle option
- THEN Practice mode becomes active
- AND the quiz UI is rendered
- AND the fretboard view is NOT rendered

#### Scenario: Shared selection state survives mode switch

- GIVEN the Interval Trainer is in Explore mode with root A and interval Minor 3rd selected
- WHEN the user switches to Practice mode and then back to Explore mode
- THEN root A and interval Minor 3rd are still selected

#### Scenario: Toggle is accessible

- GIVEN the Interval Trainer is rendered
- WHEN a screen reader queries the toggle
- THEN both "Practice" and "Explore" options have discernible labels
- AND the currently active option communicates its active state

---

### Requirement: Practice Mode Isolation

The existing Practice mode quiz behavior MUST NOT change as a result of adding the Explore toggle.

Specifically: question generation, answer selection, score tracking, and audio playback from Practice mode MUST produce the same outcomes as before the Explore toggle was introduced.

#### Scenario: Existing Practice tests remain green

- GIVEN the test suite is run after the mode toggle is introduced
- WHEN all existing Interval Trainer unit and component tests execute
- THEN every previously-passing test still passes with no modifications to test files

---

### Requirement: Question Generation

The system MUST generate a new question by selecting a random root note in the range A3–A4 (MIDI 57–69) and a random interval from the 12-entry chromatic interval table. It MUST compute the second note by adding the interval's semitone count to the root's MIDI value.

#### Scenario: New question picks distinct root and interval

- GIVEN the quiz is initialized or the user advances to the next question
- WHEN a new question is generated
- THEN `rootNote` is a note within MIDI range 57–69
- AND `targetInterval` is one of the 12 chromatic intervals (1–12 semitones)
- AND the second note's MIDI value equals `rootNote.midi + targetInterval.semitones`

#### Scenario: Root note varies across questions

- GIVEN multiple consecutive questions are generated
- WHEN root notes are observed
- THEN the root note is not always the same value (random selection produces variety)

### Requirement: Audio Playback

The system MUST play the root note followed by the second note sequentially (ascending direction) when a new question is generated. Each note MUST use an anti-click envelope via the `playNote` module. A replay control MUST re-trigger the same two-note sequence without generating a new question.

#### Scenario: Two notes play on question start

- GIVEN a new question has been generated with root MIDI R and interval S semitones
- WHEN the component mounts or the question is first shown
- THEN `playNote` is called for the root frequency followed by `playNote` for the second frequency
- AND the second call is offset in time (sequential, not simultaneous)

#### Scenario: Replay re-plays the same pair

- GIVEN a question is active and the user has not yet answered
- WHEN the user activates the replay control
- THEN the same root + second note sequence plays again
- AND no new question is generated
- AND the current answer choices remain unchanged

#### Scenario: Replay is accessible

- GIVEN a question is active
- WHEN the replay control is rendered
- THEN it has an `aria-label` describing its function (e.g. "Replay interval")
- AND it is reachable and activatable via keyboard

### Requirement: Multiple-Choice Answer Panel

The system MUST present exactly 4 answer buttons per question: 1 correct interval name and 3 plausible distractors. Distractors MUST be drawn from the remaining 11 intervals, contain no duplicates, and the set of 4 MUST be shuffled randomly.

#### Scenario: Panel shows 4 buttons

- GIVEN a question is active
- WHEN the answer panel is rendered
- THEN exactly 4 buttons are visible
- AND each button displays one interval name from the 12-entry table
- AND the correct interval name is among the 4

#### Scenario: No duplicate choices

- GIVEN a question is generated
- WHEN the 4 choices are assembled
- THEN all 4 interval names are distinct

#### Scenario: Choices are shuffled

- GIVEN multiple questions are generated for the same target interval
- WHEN choice positions are observed
- THEN the correct answer does not always appear in the same button position

#### Scenario: Answer buttons are accessible

- GIVEN the answer panel is rendered
- WHEN a button is inspected
- THEN it has an `aria-label` that includes the interval name
- AND it is focusable and activatable via keyboard (Enter/Space)

### Requirement: Answer Checking and Feedback

When the user selects an answer, the system MUST compare it to the target interval. A correct answer MUST increment the correct count and total count, and display positive feedback. A wrong answer MUST increment only the total count and reveal the correct interval name.

#### Scenario: Correct answer — feedback and score

- GIVEN a question is active and the target interval is "Perfect Fifth"
- WHEN the user clicks "Perfect Fifth"
- THEN the correct counter increments by 1
- AND the total counter increments by 1
- AND positive feedback is displayed (e.g. a success indicator)
- AND the correct interval name is shown or confirmed

#### Scenario: Wrong answer — feedback and correct reveal

- GIVEN a question is active and the target interval is "Perfect Fifth"
- WHEN the user clicks any other interval name
- THEN only the total counter increments by 1
- AND the correct counter does not change
- AND the correct answer ("Perfect Fifth") is visually revealed to the user

#### Scenario: Buttons are disabled after answer

- GIVEN the user has selected an answer
- WHEN the answer panel is inspected
- THEN further clicks on answer buttons have no effect (buttons are disabled or inert)

### Requirement: Score Tracking and Next Question

The system MUST display a running score as `correct / total`. A "Next" control MUST advance to a fresh question, resetting feedback state and re-enabling answer buttons.

#### Scenario: Score display updates after each answer

- GIVEN the user has answered N questions with C correct
- WHEN the score display is rendered
- THEN it shows the format `C / N`

#### Scenario: Score is announced to assistive technology

- GIVEN the score display is updated
- WHEN the DOM is inspected
- THEN the score region has an appropriate aria attribute (e.g. `aria-live="polite"`)

#### Scenario: Next control advances the question

- GIVEN the user has answered the current question
- WHEN the user activates the "Next" control
- THEN a new question is generated (new root, new target interval)
- AND the answer panel resets to 4 new shuffled choices
- AND feedback state is cleared
- AND answer buttons are re-enabled

#### Scenario: Next control is accessible

- GIVEN a question has been answered
- WHEN the "Next" control is rendered
- THEN it has an `aria-label` (e.g. "Next question")
- AND it is reachable and activatable via keyboard

### Requirement: Back-to-Home Navigation

The system MUST provide a back-to-home control that calls `navigate('home')` when activated, matching the pattern used by Note Trainer and Tone Generator.

#### Scenario: Back navigation

- GIVEN the user is on the Interval Trainer view
- WHEN the user activates the back-to-home control
- THEN `navigate('home')` is called
- AND the home page renders
