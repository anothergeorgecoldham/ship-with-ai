---
name: Feature request
about: Propose a small change to the Ship with AI site (used to kick off the live demo, Beat 0)
title: "Add Episode 3 lesson page / update the feedback widget"
labels: enhancement
assignees: ''
---

## What

Add a short lesson page (or update an existing one) covering the Episode 3 talking point, and
tighten the feedback widget's markup so it reads cleanly next to the new content.

## Why

Attendees cloning the repo after the talk should find the lesson content matches what was shown
live, including whatever the widget looked like by the end of the demo.

## Acceptance criteria

- [ ] New/updated page renders under the site nav with a short, translation-friendly write-up
- [ ] Feedback widget still submits and renders a submission end-to-end
- [ ] `npm run build` succeeds locally

## Notes for the assignee

Assign this to the Copilot coding agent. It's expected to draft a small PR — keep the change
scoped to one page and/or the widget, not a site-wide rewrite.
