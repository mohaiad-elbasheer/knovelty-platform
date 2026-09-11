# The Knovelty Platform — Concept Document

**Status:** Concept for review · **Version:** 0.1 · **Date:** 21 July 2026

A concept for an all-in-one workspace where research proposals — Marie Skłodowska-Curie,
Horizon Europe, and beyond — are planned, drafted, tracked, and completed collaboratively.

---

## 01 · Vision — one proposal, one workspace

EU proposal writing has a structured pain: every call has the same anatomy (Excellence,
Impact, Implementation), hard deadlines, a scatter of documents across email and Drive,
and contributors who never quite know *where are we?* The Knovelty Platform turns that
structure into software.

> **The organizing principle:** a proposal is not a folder of files — it is a
> **workspace organized around a lifecycle**. Everything (documents, sections, ideas,
> people, deadlines) hangs off the stage the proposal is currently in, so the answer to
> "where are we?" is always one glance away.

Three design values follow:

- **Templates over blank pages.** Because MSCA and Horizon Europe structures are known,
  picking a call type pre-populates the entire document checklist, section skeleton, and
  page budgets.
- **Track, don't trap.** In v1 the platform tracks documents that live where teams
  actually write (Drive, Overleaf, Word) — link + owner + status — rather than forcing a
  new editor on anyone.
- **Modular by section.** Each Part B section is a self-contained unit with an owner, a
  page budget, and a status — so work can be handed to a colleague cleanly and reviewed
  independently.

## 02 · Personas

| Persona | Example | Needs |
|---|---|---|
| **Lead applicant / Coordinator** | Researcher preparing an MSCA PF; consortium coordinator on a Horizon RIA | Full picture: completion %, blockers, who owes what, days to deadline. Sets up the workspace, assigns sections, runs review. |
| **Contributor** | Co-applicant, partner org, supervisor | A clear bounded task: "Section 2.2, four pages, due Friday." |
| **Reviewer / Mentor** | Senior colleague or Knovelty consultant | A queue of sections marked *Needs review*, the award criteria alongside the text, lightweight verdicts. |

## 03 · The lifecycle spine

Seven explicit stages, always visible at the top of the workspace (it is the navigation,
not decoration). Each stage carries its own checklist; the coordinator advances stages
deliberately, and each transition is timestamped in the activity feed.

1. **Ideation** — brainstorm canvas, idea capture, fit-to-call check
2. **Call analysis** — decode the call text, award criteria, eligibility
3. **Team & setup** — consortium, roles, CVs, letters of support
4. **Drafting** — section-by-section writing against page budgets
5. **Internal review** — evaluator-style reads, verdicts, revisions
6. **Polish & compliance** — page limits, formatting, annexes, final checks
7. **Submitted** — archive, outcome tracking, lessons learned

**Status taxonomy** — every trackable item uses one four-state vocabulary platform-wide:
`Not started` → `Drafting` → `Needs review` → `Final`.

## 04 · Screens

1. **Home dashboard** — proposal cards: call name, deadline countdown (amber under 45
   days), computed completion %, current stage. New proposals start from a call template,
   never a blank page.
2. **Workspace home** — health tiles (completion %, days to deadline, review queue,
   blocked items) + activity feed. Completion is computed from item statuses, weighted by
   page budget for sections — never self-reported.
3. **Document hub** — every required document (Part B sections, CV, letters of support,
   ethics annex…) as a tracked row: owner, status chip, page limit, link to where the
   file actually lives (Drive/Overleaf/upload). Pre-populated from the call template.
4. **Section board** — Kanban of Part B sections across the four statuses. Each card:
   owner, page budget vs. actual (amber flag on overrun), comments. Dragging to *Needs
   review* notifies the reviewer; verdicts move the card forward or back with comments.
5. **Brainstorm canvas** — sticky notes in columns that ARE the award criteria
   (Excellence / Impact / Implementation), so ideas are born pre-sorted by the
   evaluator's lens. Strong ideas are **promoted** into real sections with a back-link.

Plus a timeline view: milestones auto-planned backwards from the call deadline (draft
freeze T−3 weeks, internal review T−2 weeks, submission buffer T−3 days), editable.

## 05 · Data model

Eight entities. `Item` is the workhorse: documents, sections, and checklist entries are
all Items with a `kind`, which lets one status vocabulary and one roll-up computation
serve the whole platform.

| Entity | Purpose | Key fields / notes |
|---|---|---|
| `CallTemplate` | A funder's call structure, reusable | Ships with MSCA PF, Horizon RIA/IA, ERC StG presets; defines TemplateItems + default milestone offsets |
| `Proposal` | One workspace | `stage` ∈ seven lifecycle stages; completion % computed, not stored |
| `Item` | Any trackable unit | `kind` ∈ document \| section \| checklist; `status` ∈ not_started \| drafting \| needs_review \| final; `link_url`; `page_budget` / `page_actual`; `due` |
| `Idea` | Canvas sticky note | `criterion` ∈ excellence \| impact \| implementation; `promoted_to` → Item |
| `User` / `Membership` | People + role per proposal | `role` ∈ coordinator \| contributor \| reviewer — drives permissions and review routing |
| `Comment` | Discussion on any Item | @mentions; review verdicts are typed comments (approve / request changes) |
| `Milestone` | Timeline entry | Auto-suggested backwards from deadline; editable |
| `Activity` | Append-only event log | Status changes, stage transitions, comments → activity feed |

## 06 · Defining user flows

- **A — New proposal from template:** pick call template → set title/acronym/deadline →
  platform generates checklist + section skeleton + page budgets → milestones
  auto-planned backwards → invite team, assign owners → workspace live at *Ideation*.
- **B — Section review cycle:** owner drafts (*Drafting*) → requests review (*Needs
  review*, reviewer notified) → verdict: approve → *Final* (rolls up to completion %),
  or request changes → comments attached, back to *Drafting*.
- **C — Brainstorm to draft:** ideas on canvas under the three criteria → discussion,
  weak ideas archived → strong idea promoted to a section Item → back-link kept.

## 07 · Roadmap

**Phase 1 — clickable prototype (next):** new `platform/` area of this site, plain
HTML/CSS/JS matching Knovelty branding, all five screens interactive, state in
`localStorage`, two seeded demo proposals (MSCA PF + Horizon RIA), call templates as
hardcoded JSON. Usable solo immediately; doubles as the living design spec.

**Phase 2 — multi-user platform:** Next.js + Supabase (auth, Postgres per §05, file
storage, realtime); real invitations, roles, notifications; Drive/Overleaf link
previews; AI assist layer (call-text analysis, evaluator-style section critique,
abstract sharpening). Separate deployment; the Phase 1 data model carries over unchanged.

## 08 · Open questions

1. **Document strategy confirmed?** v1 tracks + links (recommended) rather than
   embedding an editor.
2. **Which call templates first?** Proposed: MSCA PF and Horizon Europe RIA; ERC,
   national schemes, PRIN as follow-up JSON presets.
3. **Stage names** — does the seven-stage pipeline match how you actually work, or
   should stages be editable per proposal?
4. **Where it lives** — prototype under `platform/` linked from the site, or unlisted
   until it matures?
