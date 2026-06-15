# Delta for Home Page

## MODIFIED Requirements

### Requirement: Tool Card Content

Each card MUST display an icon/emoji, a title, a short description, and be clickable. The system MUST include an active CAGED Visualizer card as the first card. The system MUST include an active Progression Builder card between the CAGED Visualizer card and the placeholder cards. The system MUST include an active Note Trainer card after the Progression Builder card. The system MUST include an active Tone Generator card after the Note Trainer card. The system MUST include an active Interval Trainer card after the Tone Generator card. The system MUST include an active Tab Player card after the Interval Trainer card and before the placeholder cards.

(Previously: Did not include Tab Player card.)

#### Scenario: Card content is complete

- GIVEN the home page renders
- WHEN a tool card is inspected
- THEN it contains an icon, a title, a description, and a clickable area

#### Scenario: Card navigation

- GIVEN the user is on the home page
- WHEN the user clicks an active tool card
- THEN the application navigates to the selected tool

#### Scenario: Progression Builder card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN a Progression Builder card is present
- AND it uses the same active-card styling as the CAGED Visualizer card
- AND it is positioned after the CAGED Visualizer card
- AND it is before the Note Trainer card

#### Scenario: Progression Builder card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Progression Builder card
- THEN `navigate('progression')` is called

#### Scenario: Note Trainer card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN a Note Trainer card is present
- AND it uses the same active-card styling as the CAGED Visualizer card
- AND it is positioned after the Progression Builder card

#### Scenario: Note Trainer card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Note Trainer card
- THEN `navigate('note-trainer')` is called

#### Scenario: Tone Generator card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN a Tone Generator card is present
- AND it uses the same active-card styling as other active cards
- AND it is positioned after the Note Trainer card

#### Scenario: Tone Generator card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Tone Generator card
- THEN `navigate('tone-generator')` is called

#### Scenario: Interval Trainer card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN an Interval Trainer card is present
- AND it uses the same active-card styling as other active cards
- AND it is positioned after the Tone Generator card

#### Scenario: Interval Trainer card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Interval Trainer card
- THEN `navigate('interval-trainer')` is called

#### Scenario: Tab Player card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN a Tab Player card is present
- AND it uses the same active-card styling as other active cards
- AND it is positioned after the Interval Trainer card
- AND it is before the placeholder cards

#### Scenario: Tab Player card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Tab Player card
- THEN `navigate('tab-player')` is called

#### Scenario: Placeholder cards remain inactive

- GIVEN the home page renders
- WHEN a placeholder card is inspected
- THEN it is visually distinct from active cards (muted opacity, no hover effects)
- AND it is not clickable

## ADDED Requirements

### Requirement: Tab Player Card Content

The Tab Player card MUST display an appropriate icon, the title "Tab Player", and a short description conveying reading tabs with visual fretboard guidance and audio playback (e.g., "Read guitar tabs with fretboard highlights and audio playback").

#### Scenario: Tab Player card content

- GIVEN the home page renders
- WHEN the Tab Player card is inspected
- THEN it shows an icon, the title "Tab Player", and the correct description
- AND it includes an "Open" button styled like other active cards
