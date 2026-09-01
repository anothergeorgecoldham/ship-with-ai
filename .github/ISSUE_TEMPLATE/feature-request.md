---
name: Feature request
about: Propose a small change to the Ship with AI site (used to kick off the live demo, Beat 0)
title: "Add Episode 3 lesson page / update the feedback widget"
labels: enhancement
assignees: ''
---

## What

Add a short lesson page (or update an existing one) covering the Episode 3 talking point. Add a
short "topic" field to the feedback widget and persist it with each submission by updating
`src/lib/feedback.js`.

Activate the production workflow by copying `.github/demo/deploy.yml` to
`.github/workflows/deploy.yml`. Use the provided workflow unchanged so the review exercise has a
consistent starting point.

## Why

Attendees cloning the repo after the talk should find the lesson content matches what was shown
live, including whatever the widget looked like by the end of the demo.

## Acceptance criteria

- [ ] New/updated page renders under the site nav with a short, translation-friendly write-up
- [ ] Feedback widget captures the topic and renders a submission end-to-end
- [ ] `.github/workflows/deploy.yml` is activated from the provided demo workflow
- [ ] `npm run build` succeeds locally

## Notes for the assignee

Assign this to the Copilot coding agent. Keep the content and widget changes focused; do not
redesign the site, change dependencies or the lockfile, or harden the provided workflow before
review.
