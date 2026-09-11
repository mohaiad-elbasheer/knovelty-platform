/* Knovelty Platform — call templates.
   Each template defines the document checklist, section skeleton (with page
   budgets), and milestone offsets (days relative to the call deadline). */

const CALL_TEMPLATES = {
  "msca-pf": {
    id: "msca-pf",
    name: "MSCA Postdoctoral Fellowship",
    funder: "European Commission — Horizon Europe / MSCA",
    shortName: "MSCA PF",
    documents: [
      { title: "Part A — Administrative forms", note: "Funding & Tenders portal forms" },
      { title: "Part B1 — Project proposal", note: "10-page limit, all evaluated sections" },
      { title: "Part B2 — CV of the researcher", note: "CV, publications, career breaks" },
      { title: "Part B2 — Capacity of participating organisations", note: "Host + secondment tables" },
      { title: "Ethics self-assessment", note: "Part A ethics issues table" },
      { title: "Letter of commitment — Host institution", note: "Signed by supervisor / host" },
      { title: "Letter of commitment — Placement / secondment", note: "Only if non-academic placement" }
    ],
    sections: [
      { title: "§1.1 Research objectives & ambition beyond state of the art", criterion: "excellence", pageBudget: 2.5 },
      { title: "§1.2 Soundness of methodology (incl. interdisciplinarity, open science, gender dimension)", criterion: "excellence", pageBudget: 2 },
      { title: "§1.3 Quality of supervision, training & two-way transfer of knowledge", criterion: "excellence", pageBudget: 1.5 },
      { title: "§1.4 Researcher's experience, competences & skills match", criterion: "excellence", pageBudget: 1 },
      { title: "§2.1 Career perspectives & employability measures", criterion: "impact", pageBudget: 1 },
      { title: "§2.2 Dissemination, exploitation & communication", criterion: "impact", pageBudget: 1.5 },
      { title: "§2.3 Contribution to scientific, societal & economic impacts", criterion: "impact", pageBudget: 1 },
      { title: "§3.1 Work plan, work packages, risk assessment & effort", criterion: "implementation", pageBudget: 2 },
      { title: "§3.2 Capacity & role of host institutions", criterion: "implementation", pageBudget: 1 }
    ],
    checklist: [
      "Eligibility: mobility rule verified (researcher's residence history)",
      "Eligibility: PhD awarded ≤ 8 years before call deadline (extensions checked)",
      "Supervisor confirmed and briefed on the call",
      "Portal submission dry-run completed"
    ],
    milestones: [
      { name: "Call analysis complete — criteria decoded", offset: -56 },
      { name: "Host, supervisor & secondments confirmed", offset: -42 },
      { name: "Full draft freeze (Part B1 complete)", offset: -21 },
      { name: "Internal evaluator-style review complete", offset: -14 },
      { name: "Final version & annexes ready (buffer)", offset: -3 },
      { name: "Submission deadline", offset: 0 }
    ]
  },

  "he-ria": {
    id: "he-ria",
    name: "Horizon Europe RIA / IA",
    funder: "European Commission — Horizon Europe",
    shortName: "Horizon RIA",
    documents: [
      { title: "Part A — Administrative forms & budget table", note: "Portal forms, per-partner budget" },
      { title: "Part B — Technical description", note: "45-page limit (sections 1–3)" },
      { title: "Consortium — participant info & roles table", note: "All beneficiaries + affiliated entities" },
      { title: "Letters of intent — associated partners", note: "If associated partners involved" },
      { title: "Ethics self-assessment", note: "Part A ethics issues table" },
      { title: "Data management plan (outline)", note: "Full DMP is a deliverable; outline for proposal" },
      { title: "Security scrutiny declaration", note: "If topic flagged security-sensitive" }
    ],
    sections: [
      { title: "§1.1 Objectives and ambition", criterion: "excellence", pageBudget: 4 },
      { title: "§1.2 Methodology (incl. concept, TRL, open science, data management)", criterion: "excellence", pageBudget: 14 },
      { title: "§2.1 Project's pathways towards impact", criterion: "impact", pageBudget: 4 },
      { title: "§2.2 Measures to maximise impact — D&E&C plan", criterion: "impact", pageBudget: 5 },
      { title: "§2.3 Summary — Key Impact Pathways canvas", criterion: "impact", pageBudget: 1 },
      { title: "§3.1 Work plan, work packages, deliverables & resources", criterion: "implementation", pageBudget: 13 },
      { title: "§3.2 Capacity of participants & consortium as a whole", criterion: "implementation", pageBudget: 3 }
    ],
    checklist: [
      "Topic scope & expected outcomes mapped to proposal objectives",
      "Consortium composition meets eligibility (3 entities, 3 member states/AC)",
      "Budget per partner agreed and entered in Part A",
      "Portal submission dry-run completed"
    ],
    milestones: [
      { name: "Call analysis complete — topic & outcomes decoded", offset: -84 },
      { name: "Consortium confirmed, roles & budget agreed", offset: -56 },
      { name: "Work-package structure frozen", offset: -42 },
      { name: "Full draft freeze (Part B complete)", offset: -21 },
      { name: "Internal evaluator-style review complete", offset: -14 },
      { name: "Final version, budget & annexes ready (buffer)", offset: -3 },
      { name: "Submission deadline", offset: 0 }
    ]
  }
};

const DEFAULT_STAGES = [
  "Ideation",
  "Call analysis",
  "Team & setup",
  "Drafting",
  "Internal review",
  "Polish & compliance",
  "Submitted"
];

const STATUS_ORDER = ["not_started", "drafting", "needs_review", "final"];
const STATUS_LABELS = {
  not_started: "Not started",
  drafting: "Drafting",
  needs_review: "Needs review",
  final: "Final"
};
const STATUS_SCORE = { not_started: 0, drafting: 0.4, needs_review: 0.75, final: 1 };

const CRITERIA = {
  excellence: "Excellence — why this idea?",
  impact: "Impact — who cares?",
  implementation: "Implementation — can we do it?"
};
