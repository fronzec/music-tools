# Home Page Delta Spec — Tone Generator

## Purpose

Add a Tone Generator card to the home page tool grid.

## MODIFIED Requirements

### Requirement: Tool Card Content

The system MUST include an active Tone Generator card between the Note Trainer card and the placeholder cards.

#### Scenario: Tone Generator card exists

- GIVEN the home page renders
- WHEN the card grid is inspected
- THEN a Tone Generator card is present
- AND it uses the same active-card styling as other active cards
- AND it is positioned after the Note Trainer card
- AND it is before the placeholder cards

#### Scenario: Tone Generator card navigates

- GIVEN the user is on the home page
- WHEN the user clicks the Tone Generator card
- THEN `navigate('tone-generator')` is called

### Requirement: Tone Generator Card Content

The Tone Generator card MUST display the 🎵 emoji, the title "Tone Generator", and the description "Reference tones for tuning by ear".

#### Scenario: Tone Generator card content

- GIVEN the home page renders
- WHEN the Tone Generator card is inspected
- THEN it shows the 🎵 emoji, "Tone Generator" title, and "Reference tones for tuning by ear" description
- AND it includes an "Open" button styled like other active cards
