# Knovelty Platform

A collaborative research-proposal workspace for MSCA and Horizon Europe calls —
plan, draft, track, and complete proposals in one place. Phase 1 prototype.

Concept, screens, data model, and roadmap: see [`docs/PLATFORM_CONCEPT.md`](docs/PLATFORM_CONCEPT.md).

This repository is independent of the Knovelty website; it inherits only the brand
identity (colors, typography, logo).

## Running / testing

No build step, no backend. Either:

- open `index.html` directly in a browser,
- serve the folder (`python3 -m http.server`) and visit it, or
- use the GitHub Pages deployment of this repo.

All data lives in the browser's `localStorage`, seeded on first load with two demo
proposals (TWIN-BRIDGE, an MSCA PF mid-drafting; RESILIENT-5.0, a Horizon RIA in
setup). "Reset demo data" in the dashboard footer restores the seed. The "Acting as"
switcher in the top bar simulates the three demo collaborators.

## Structure

```
├── index.html        # Dashboard: proposal cards + new-proposal flow
├── proposal.html     # Workspace: Overview / Documents / Sections / Canvas / Timeline
├── css/platform.css  # Stylesheet (Knovelty brand tokens)
├── js/
│   ├── templates.js  # Call templates (MSCA PF, Horizon RIA), stages, statuses
│   ├── store.js      # State, localStorage persistence, completion roll-up, seed
│   ├── app.js        # Dashboard logic
│   └── workspace.js  # Workspace logic (all five tabs)
├── images/           # Knovelty logo
└── docs/             # Concept document
```

## What's implemented

- Proposal creation from call templates: full document checklist, section skeleton
  with page budgets, and backwards-planned milestones — never a blank page
- Seven default lifecycle stages, editable per proposal (Overview → "Edit stages")
- One status vocabulary everywhere: Not started → Drafting → Needs review → Final;
  completion % computed from item statuses, sections weighted by page budget
- Document hub: owner, status, due date, link to Drive/Overleaf (track, don't trap)
- Section board: drag-and-drop Kanban, page budget vs. actual with overrun flags,
  comments, and review verdicts (approve → Final / request changes → Drafting)
- Brainstorm canvas: sticky notes under the three award criteria, promotable into
  sections with a back-link
- Timeline: auto-planned milestones (editable), overdue highlighting
- Activity feed and review queue on the workspace overview

Phase 2 (real multi-user backend, auth, notifications, AI assist) is scoped in the
concept document and reuses this data model unchanged.
