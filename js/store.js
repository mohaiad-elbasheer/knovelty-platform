/* Knovelty Platform — state, persistence (localStorage), and demo seed data. */

const STORE_KEY = "knovelty-platform-v1";

let state = null;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(iso) {
  const ms = new Date(iso + "T23:59:59") - new Date();
  return Math.ceil(ms / 86400000);
}

function addDays(iso, days) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      // Keep stable IDs so existing assignments, comments and activity survive.
      const personas = {
        ma: { name: "Mohaiad", initials: "MA" },
        lr: { name: "Alessio", initials: "AB" },
        sk: { name: "Karen", initials: "KA" }
      };
      state.users.forEach(user => {
        if (personas[user.id]) Object.assign(user, personas[user.id]);
      });
      saveState();
      return state;
    }
  } catch (e) { /* corrupted state falls through to reseed */ }
  state = seedState();
  saveState();
  return state;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function resetDemo() {
  localStorage.removeItem(STORE_KEY);
  location.reload();
}

function getProposal(id) {
  return state.proposals.find(p => p.id === id);
}

function getUser(id) {
  return state.users.find(u => u.id === id);
}

function currentUser() {
  return getUser(state.currentUser) || state.users[0];
}

function logActivity(proposal, text) {
  proposal.activity.unshift({ ts: Date.now(), user: state.currentUser, text });
  proposal.activity = proposal.activity.slice(0, 60);
}

/* Completion %: every item rolls up through one computation.
   Sections are weighted by page budget so a 14-page methodology
   moves the needle more than a half-page risk table. */
function completion(proposal) {
  let earned = 0, total = 0;
  proposal.items.forEach(it => {
    const w = it.kind === "section" ? Math.max(it.pageBudget || 1, 0.5) : 1;
    total += w;
    earned += w * (STATUS_SCORE[it.status] || 0);
  });
  return total ? Math.round((earned / total) * 100) : 0;
}

function countByStatus(proposal, status) {
  return proposal.items.filter(it => it.status === status).length;
}

function overdueItems(proposal) {
  const today = todayISO();
  return proposal.items.filter(it => it.due && it.due < today && it.status !== "final");
}

function createProposal(templateId, title, acronym, deadline) {
  const tpl = CALL_TEMPLATES[templateId];
  const p = {
    id: uid(),
    title, acronym, deadline,
    template: templateId,
    templateName: tpl.name,
    stages: DEFAULT_STAGES.slice(),
    stageIndex: 0,
    items: [],
    ideas: [],
    milestones: [],
    comments: [],
    activity: [],
    created: todayISO()
  };
  tpl.documents.forEach(d => p.items.push({
    id: uid(), kind: "document", title: d.title, note: d.note,
    status: "not_started", owner: null, link: "", due: null
  }));
  tpl.sections.forEach(s => p.items.push({
    id: uid(), kind: "section", title: s.title, criterion: s.criterion,
    pageBudget: s.pageBudget, pageActual: 0,
    status: "not_started", owner: null, link: "", due: null
  }));
  tpl.checklist.forEach(c => p.items.push({
    id: uid(), kind: "checklist", title: c,
    status: "not_started", owner: null, link: "", due: null
  }));
  tpl.milestones.forEach(m => p.milestones.push({
    id: uid(), name: m.name, due: addDays(deadline, m.offset), done: false, auto: true
  }));
  logActivityAs(p, "ma", "created the workspace from template “" + tpl.name + "”");
  return p;
}

function logActivityAs(proposal, userId, text) {
  proposal.activity.unshift({ ts: Date.now(), user: userId, text });
}

/* ---------- demo seed ---------- */

function seedState() {
  const users = [
    { id: "ma", initials: "MA", name: "Mohaiad", color: "#6A0DAD" },
    { id: "lr", initials: "AB", name: "Alessio", color: "#C2410C" },
    { id: "sk", initials: "KA", name: "Karen", color: "#00997A" }
  ];
  state = { users, currentUser: "ma", proposals: [] };

  /* Proposal 1 — MSCA PF, mid-drafting */
  const p1 = createProposal("msca-pf", "Digital-twin monitoring of ageing bridge infrastructure", "TWIN-BRIDGE", addDays(todayISO(), 34));
  p1.stageIndex = 3; // Drafting
  const secs = p1.items.filter(i => i.kind === "section");
  const docs = p1.items.filter(i => i.kind === "document");
  const chk = p1.items.filter(i => i.kind === "checklist");

  const set = (it, props) => Object.assign(it, props);
  set(secs[0], { status: "final", owner: "ma", pageActual: 2.5 });
  set(secs[1], { status: "drafting", owner: "ma", pageActual: 1.4 });
  set(secs[2], { status: "drafting", owner: "lr", pageActual: 1.7, due: addDays(todayISO(), 5) });
  set(secs[3], { status: "final", owner: "ma", pageActual: 1 });
  set(secs[4], { status: "needs_review", owner: "lr", pageActual: 0.9 });
  set(secs[5], { status: "final", owner: "sk", pageActual: 1.5 });
  set(secs[6], { status: "drafting", owner: "lr", pageActual: 0.4 });
  set(secs[7], { status: "needs_review", owner: "ma", pageActual: 2.1 });
  set(docs[0], { status: "drafting", owner: "ma" });
  set(docs[1], { status: "drafting", owner: "ma", link: "https://docs.google.com/document/d/demo-part-b1" });
  set(docs[2], { status: "final", owner: "ma", link: "https://docs.google.com/document/d/demo-cv" });
  set(docs[3], { status: "drafting", owner: "sk" });
  set(docs[5], { status: "needs_review", owner: "sk", due: addDays(todayISO(), -2) });
  set(chk[0], { status: "final", owner: "ma" });
  set(chk[1], { status: "final", owner: "ma" });
  set(chk[2], { status: "final", owner: "sk" });

  p1.ideas = [
    { id: uid(), text: "Transfer of lab-scale digital-twin method to field scale is the novelty claim — position hard against 3 cited SoA papers", criterion: "excellence", author: "ma", promotedTo: secs[0].id, archived: false },
    { id: uid(), text: "Two-way secondment with host's robotics lab strengthens the training dimension", criterion: "excellence", author: "lr", promotedTo: null, archived: false },
    { id: uid(), text: "EU infrastructure maintenance backlog — quantify the € figure in the opening impact paragraph", criterion: "impact", author: "sk", promotedTo: null, archived: false },
    { id: uid(), text: "Open sensor dataset as an exploitable result — check IP position with host first", criterion: "impact", author: "ma", promotedTo: null, archived: false },
    { id: uid(), text: "Risk: sensor procurement lead time ~10 weeks — mitigation: pre-order in month 1", criterion: "implementation", author: "lr", promotedTo: secs[7].id, archived: false }
  ];
  p1.comments = [
    { id: uid(), itemId: secs[4].id, user: "ma", ts: Date.now() - 7200000, text: "Career-development narrative reads generic — tie each measure to the fellowship's WP outputs.", verdict: null },
    { id: uid(), itemId: secs[7].id, user: "lr", ts: Date.now() - 3600000, text: "WP table is solid. Risk table: add the procurement risk from the canvas.", verdict: null },
    { id: uid(), itemId: docs[5].id, user: "sk", ts: Date.now() - 86400000, text: "Draft letter received from the dean's office — uploading to Drive tomorrow.", verdict: null }
  ];
  p1.activity = [
    { ts: Date.now() - 3600000, user: "lr", text: "commented on “" + secs[7].title + "”" },
    { ts: Date.now() - 7200000, user: "lr", text: "marked “" + secs[4].title + "” as Needs review" },
    { ts: Date.now() - 86400000, user: "ma", text: "marked “" + secs[3].title + "” as Final" },
    { ts: Date.now() - 259200000, user: "ma", text: "advanced stage to Drafting" }
  ].concat(p1.activity);
  // a couple of milestones already met
  p1.milestones[0].done = true;
  p1.milestones[1].done = true;

  /* Proposal 2 — Horizon RIA, early stage */
  const p2 = createProposal("he-ria", "Resilient human-centric manufacturing networks for Industry 5.0", "RESILIENT-5.0", addDays(todayISO(), 96));
  p2.stageIndex = 2; // Team & setup
  const secs2 = p2.items.filter(i => i.kind === "section");
  const docs2 = p2.items.filter(i => i.kind === "document");
  const chk2 = p2.items.filter(i => i.kind === "checklist");
  set(secs2[0], { status: "drafting", owner: "ma", pageActual: 1.8 });
  set(secs2[2], { status: "drafting", owner: "lr", pageActual: 0.6 });
  set(docs2[2], { status: "drafting", owner: "ma" });
  set(chk2[0], { status: "final", owner: "ma" });
  set(chk2[1], { status: "drafting", owner: "ma" });
  p2.ideas = [
    { id: uid(), text: "Human-robot collaboration testbed at 3 factory sites = credible demonstrator story", criterion: "implementation", author: "ma", promotedTo: null, archived: false },
    { id: uid(), text: "ESG reporting angle links directly to the topic's expected outcome #2", criterion: "impact", author: "ma", promotedTo: null, archived: false }
  ];
  p2.activity = [
    { ts: Date.now() - 172800000, user: "ma", text: "advanced stage to Team & setup" }
  ].concat(p2.activity);
  p2.milestones[0].done = true;

  state.proposals = [p1, p2];
  return state;
}
