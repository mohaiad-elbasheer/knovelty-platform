/* Knovelty Platform — proposal workspace: overview, documents, sections,
   canvas, timeline. One page, tab-switched, everything persisted on change. */

loadState();

const params = new URLSearchParams(location.search);
const proposal = getProposal(params.get("id"));
if (!proposal) location.href = "index.html";

let activeTab = location.hash.replace("#", "") || "overview";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function commit(activityText) {
  if (activityText) logActivity(proposal, activityText);
  saveState();
  render();
}

function relTime(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "now";
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

function ownerBtn(item) {
  const u = item.owner ? getUser(item.owner) : null;
  const label = u ? esc(u.initials) : "＋";
  const style = u ? `style="background:${u.color}"` : "";
  const title = u ? esc(u.name) : "Assign owner";
  return `<button class="owner ${u ? "" : "unassigned"}" ${style} title="${title}" data-own="${item.id}">${label}</button>`;
}

function statusChip(item) {
  return `<button class="chip c-${item.status}" data-chip="${item.id}" title="Click to change status">${STATUS_LABELS[item.status]}</button>`;
}

function cycleOwner(item) {
  const ids = [null].concat(state.users.map(u => u.id));
  const next = ids[(ids.indexOf(item.owner) + 1) % ids.length];
  item.owner = next;
  commit(next ? `assigned “${item.title}” to ${getUser(next).name}` : `unassigned “${item.title}”`);
}

function setStatus(item, status) {
  if (item.status === status) return;
  item.status = status;
  commit(`marked “${item.title}” as ${STATUS_LABELS[status]}`);
}

function cycleStatus(item) {
  const next = STATUS_ORDER[(STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length];
  setStatus(item, next);
}

/* ---------- head + tabs ---------- */

function renderHead() {
  const d = daysUntil(proposal.deadline);
  const dCls = d < 0 ? "late" : d <= 45 ? "warn" : "";
  document.getElementById("ws-head").innerHTML = `
    <div>
      <div class="eyebrow"><a href="index.html" style="color:inherit;text-decoration:none">← All proposals</a></div>
      <h1>${esc(proposal.acronym)} <span style="font-weight:600;color:var(--muted);font-size:0.9rem">· ${esc(proposal.templateName)}</span></h1>
      <div class="sub">${esc(proposal.title)}</div>
    </div>
    <div style="text-align:right">
      <div class="deadline ${dCls}" style="font-size:0.82rem;font-weight:700;color:${d < 0 ? "var(--red)" : d <= 45 ? "var(--amber)" : "var(--teal)"}">
        ⏱ ${d < 0 ? "Deadline passed" : d + " days to deadline"} · ${fmtDate(proposal.deadline)}
      </div>
      <div class="meter" style="width:190px;margin-left:auto"><i style="width:${completion(proposal)}%"></i></div>
      <div class="meter-label">${completion(proposal)}% complete</div>
    </div>`;
}

function renderTabs() {
  const reviewCount = countByStatus(proposal, "needs_review");
  const tabs = [
    ["overview", "Overview", null],
    ["documents", "Documents", null],
    ["sections", "Sections", reviewCount ? reviewCount + " to review" : null],
    ["canvas", "Canvas", null],
    ["timeline", "Timeline", null]
  ];
  document.getElementById("ws-tabs").innerHTML = tabs.map(([id, label, badge]) =>
    `<button class="tab ${activeTab === id ? "on" : ""}" data-tab="${id}">${label}${badge ? `<span class="count">${badge}</span>` : ""}</button>`
  ).join("");
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    activeTab = b.dataset.tab;
    location.hash = activeTab;
    render();
  });
}

/* ---------- overview ---------- */

function renderOverview() {
  const pct = completion(proposal);
  const review = proposal.items.filter(i => i.status === "needs_review");
  const overdue = overdueItems(proposal);
  const nextMile = proposal.milestones.filter(m => !m.done && m.due >= todayISO()).sort((a, b) => a.due.localeCompare(b.due))[0];

  const tiles = `
    <div class="tile-grid">
      <div class="tile"><div class="big">${pct}%</div><div class="lbl">Overall completion</div><div class="meter"><i style="width:${pct}%"></i></div></div>
      <div class="tile"><div class="big">${Math.max(daysUntil(proposal.deadline), 0)}</div><div class="lbl">Days to deadline</div>
        ${nextMile ? `<div class="extra warn">Next: ${esc(nextMile.name)} · ${fmtDate(nextMile.due)}</div>` : `<div class="extra ok">No upcoming milestones</div>`}</div>
      <div class="tile"><div class="big">${review.length}</div><div class="lbl">Items need review</div>${review.length ? `<div class="extra" style="color:var(--brand)">Review queue below</div>` : `<div class="extra ok">Queue clear</div>`}</div>
      <div class="tile"><div class="big">${overdue.length}</div><div class="lbl">Overdue items</div>${overdue.length ? `<div class="extra warn">Needs attention</div>` : `<div class="extra ok">On track</div>`}</div>
    </div>`;

  const stages = proposal.stages.map((s, i) => {
    const cls = i < proposal.stageIndex ? "done" : i === proposal.stageIndex ? "current" : "";
    return `<div class="stage ${cls}">
      <div class="dot-row"><span class="dot"></span>${i < proposal.stages.length - 1 ? '<span class="bar"></span>' : ""}</div>
      <div class="s-name">${esc(s)}</div>
      <div class="s-when">${i < proposal.stageIndex ? "done" : i === proposal.stageIndex ? "current stage" : ""}</div>
    </div>`;
  }).join("");

  const canAdvance = proposal.stageIndex < proposal.stages.length - 1;
  const pipeline = `
    <div class="panel">
      <h3>Lifecycle
        <span>
          <button class="btn small" id="edit-stages">Edit stages</button>
          ${canAdvance ? `<button class="btn small primary" id="advance-stage">Advance to “${esc(proposal.stages[proposal.stageIndex + 1])}” →</button>` : ""}
        </span>
      </h3>
      <div class="pipeline-scroll"><div class="pipeline">${stages}</div></div>
    </div>`;

  const queue = review.length ? review.map(it => `
    <li><span class="txt"><b>${esc(it.title)}</b> · ${it.kind}</span>
      <span class="when">${ownerBtn(it)}</span></li>`).join("") : `<li><span class="txt">Nothing waiting for review.</span></li>`;

  const feed = proposal.activity.slice(0, 12).map(a => {
    const u = getUser(a.user);
    return `<li><span class="who" style="color:${u ? u.color : "inherit"}">${u ? esc(u.initials) : "?"}</span>
      <span class="txt">${esc(a.text)}</span><span class="when">${relTime(a.ts)}</span></li>`;
  }).join("") || `<li><span class="txt">No activity yet.</span></li>`;

  document.getElementById("ws-body").innerHTML = tiles + pipeline + `
    <div class="two-col">
      <div class="panel"><h3>Review queue</h3><ul class="feed">${queue}</ul></div>
      <div class="panel"><h3>Activity</h3><ul class="feed">${feed}</ul></div>
    </div>`;

  if (canAdvance) document.getElementById("advance-stage").onclick = () => {
    proposal.stageIndex++;
    commit(`advanced stage to ${proposal.stages[proposal.stageIndex]}`);
  };
  document.getElementById("edit-stages").onclick = openStageEditor;
  bindItemButtons();
}

function openStageEditor() {
  openModal(`
    <h2>Edit lifecycle stages</h2>
    <p class="hint" style="margin-bottom:4px">One stage per line, in order. The seven defaults fit most EU calls — reshape them if your process differs. The current stage is preserved by name where possible.</p>
    <label for="st-text">Stages</label>
    <textarea id="st-text">${esc(proposal.stages.join("\n"))}</textarea>
    <div class="modal-actions">
      <button class="btn" id="st-default">Restore defaults</button>
      <button class="btn" data-close>Cancel</button>
      <button class="btn primary" id="st-save">Save</button>
    </div>`);
  document.getElementById("st-default").onclick = () => {
    document.getElementById("st-text").value = DEFAULT_STAGES.join("\n");
  };
  document.getElementById("st-save").onclick = () => {
    const lines = document.getElementById("st-text").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const currentName = proposal.stages[proposal.stageIndex];
    proposal.stages = lines;
    const kept = lines.indexOf(currentName);
    proposal.stageIndex = kept >= 0 ? kept : Math.min(proposal.stageIndex, lines.length - 1);
    closeModal();
    commit("edited the lifecycle stages");
  };
}

/* ---------- documents ---------- */

function docRow(it) {
  const today = todayISO();
  const isOverdue = it.due && it.due < today && it.status !== "final";
  const bits = [];
  if (it.note) bits.push(esc(it.note));
  if (it.link) bits.push(`<a href="${esc(it.link)}" target="_blank" rel="noopener">open document ↗</a>`);
  if (it.due) bits.push(isOverdue ? `<span class="due-late">due ${fmtDate(it.due)} — overdue</span>` : `due ${fmtDate(it.due)}`);
  return `
    <div class="doc-row ${isOverdue ? "overdue" : ""}">
      <div class="d-main">
        <div class="d-title">${esc(it.title)}</div>
        ${bits.length ? `<div class="d-note">${bits.join(" · ")}</div>` : ""}
      </div>
      <div class="d-actions">
        <button class="btn ghost small" data-link="${it.id}" title="Set link to Drive / Overleaf">🔗</button>
        <button class="btn ghost small" data-due="${it.id}" title="Set due date">📅</button>
        ${ownerBtn(it)}
        ${statusChip(it)}
      </div>
    </div>`;
}

function renderDocuments() {
  const docs = proposal.items.filter(i => i.kind === "document");
  const chk = proposal.items.filter(i => i.kind === "checklist");
  document.getElementById("ws-body").innerHTML = `
    <div class="doc-group">
      <h3>Required documents — pre-populated from “${esc(proposal.templateName)}”</h3>
      ${docs.map(docRow).join("")}
      <button class="btn small" id="add-doc">＋ Add document</button>
    </div>
    <div class="doc-group">
      <h3>Compliance checklist</h3>
      ${chk.map(docRow).join("")}
      <button class="btn small" id="add-chk">＋ Add checklist item</button>
    </div>
    <p class="hint" style="color:var(--muted);font-size:0.76rem;max-width:70ch">
      The platform tracks status, owner and deadline — the documents themselves live where you write them (Drive, Overleaf, Word). Use 🔗 to attach the link.
    </p>`;
  document.getElementById("add-doc").onclick = () => addItemFlow("document", "Add document");
  document.getElementById("add-chk").onclick = () => addItemFlow("checklist", "Add checklist item");
  bindItemButtons();
}

function addItemFlow(kind, title) {
  openModal(`
    <h2>${title}</h2>
    <label for="ai-title">Title</label>
    <input type="text" id="ai-title" placeholder="e.g. Letter of support — industrial partner">
    <div class="modal-actions">
      <button class="btn" data-close>Cancel</button>
      <button class="btn primary" id="ai-save">Add</button>
    </div>`);
  document.getElementById("ai-save").onclick = () => {
    const t = document.getElementById("ai-title").value.trim();
    if (!t) return;
    proposal.items.push({ id: uid(), kind, title: t, note: "", status: "not_started", owner: null, link: "", due: null });
    closeModal();
    commit(`added ${kind} “${t}”`);
  };
}

/* ---------- sections (kanban) ---------- */

function renderSections() {
  const secs = proposal.items.filter(i => i.kind === "section");
  const cols = STATUS_ORDER.map(status => {
    const cards = secs.filter(s => s.status === status).map(s => {
      const over = s.pageActual > s.pageBudget;
      const cmts = proposal.comments.filter(c => c.itemId === s.id).length;
      return `
        <div class="kan-card ${over ? "over-budget" : ""}" draggable="true" data-card="${s.id}">
          <div class="kc-t">${esc(s.title)}</div>
          <div class="kc-m">
            ${ownerBtn(s)}
            <span class="pages ${over ? "over" : ""}">${s.pageActual || 0} / ${s.pageBudget} pp${over ? " ⚠" : ""}</span>
            ${cmts ? `<span class="cmt">💬 ${cmts}</span>` : ""}
          </div>
        </div>`;
    }).join("");
    return `
      <div class="kan-col" data-col="${status}">
        <div class="head"><span>${STATUS_LABELS[status]}</span><span>${secs.filter(s => s.status === status).length}</span></div>
        ${cards}
      </div>`;
  }).join("");
  document.getElementById("ws-body").innerHTML = `
    <div class="kanban">${cols}</div>
    <p class="hint" style="color:var(--muted);font-size:0.76rem;margin-top:14px">
      Drag a card between columns to change its status — dropping into “Needs review” puts it in the reviewer's queue. Click a card for pages, comments and review verdicts.
    </p>`;
  bindKanban();
  bindItemButtons();
}

function bindKanban() {
  let draggedId = null;
  document.querySelectorAll("[data-card]").forEach(card => {
    card.addEventListener("dragstart", () => { draggedId = card.dataset.card; card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", e => {
      if (e.target.closest("[data-own]")) return;
      openSectionModal(card.dataset.card);
    });
  });
  document.querySelectorAll("[data-col]").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const item = proposal.items.find(i => i.id === draggedId);
      if (item) setStatus(item, col.dataset.col);
    });
  });
}

function openSectionModal(id) {
  const it = proposal.items.find(i => i.id === id);
  if (!it) return;
  const cmts = proposal.comments.filter(c => c.itemId === id).sort((a, b) => a.ts - b.ts);
  const cmtHtml = cmts.map(c => {
    const u = getUser(c.user);
    return `<li>
      <div class="c-head">
        <span class="c-who" style="color:${u ? u.color : "inherit"}">${u ? esc(u.name) : "?"}</span>
        <span class="c-when">${relTime(c.ts)}</span>
        ${c.verdict === "approve" ? `<span class="c-verdict approve">APPROVED</span>` : ""}
        ${c.verdict === "changes" ? `<span class="c-verdict changes">CHANGES REQUESTED</span>` : ""}
      </div>
      <div>${esc(c.text)}</div>
    </li>`;
  }).join("") || `<li style="color:var(--muted)">No comments yet.</li>`;

  openModal(`
    <h2 style="font-size:0.98rem">${esc(it.title)}</h2>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${statusChip(it)} ${ownerBtn(it)}</div>
    <label for="sm-pages">Pages written (budget: ${it.pageBudget} pp)</label>
    <input type="number" id="sm-pages" min="0" step="0.1" value="${it.pageActual || 0}">
    <label for="sm-link">Link (Drive / Overleaf)</label>
    <input type="url" id="sm-link" value="${esc(it.link)}" placeholder="https://…">
    ${it.status === "needs_review" ? `
      <div class="review-actions">
        <span style="flex:1"><b>Review verdict</b> — as ${esc(currentUser().name)}</span>
        <button class="btn small primary" id="rv-approve">Approve → Final</button>
        <button class="btn small" id="rv-changes">Request changes</button>
      </div>` : ""}
    <label>Comments</label>
    <ul class="cmt-list">${cmtHtml}</ul>
    <textarea id="sm-comment" placeholder="Add a comment… (@mention colleagues)" style="min-height:60px"></textarea>
    <div class="modal-actions">
      <button class="btn" data-close>Close</button>
      <button class="btn primary" id="sm-save">Save</button>
    </div>`);

  const saveFields = () => {
    it.pageActual = parseFloat(document.getElementById("sm-pages").value) || 0;
    it.link = document.getElementById("sm-link").value.trim();
    const txt = document.getElementById("sm-comment").value.trim();
    if (txt) {
      proposal.comments.push({ id: uid(), itemId: it.id, user: state.currentUser, ts: Date.now(), text: txt, verdict: null });
      logActivity(proposal, `commented on “${it.title}”`);
    }
  };
  document.getElementById("sm-save").onclick = () => { saveFields(); closeModal(); commit(); };
  const rvA = document.getElementById("rv-approve");
  if (rvA) rvA.onclick = () => {
    saveFields();
    proposal.comments.push({ id: uid(), itemId: it.id, user: state.currentUser, ts: Date.now(), text: "Approved in review.", verdict: "approve" });
    it.status = "final";
    closeModal();
    commit(`approved “${it.title}” — marked Final`);
  };
  const rvC = document.getElementById("rv-changes");
  if (rvC) rvC.onclick = () => {
    saveFields();
    proposal.comments.push({ id: uid(), itemId: it.id, user: state.currentUser, ts: Date.now(), text: "Changes requested — see comments.", verdict: "changes" });
    it.status = "drafting";
    closeModal();
    commit(`requested changes on “${it.title}” — back to Drafting`);
  };
}

/* ---------- canvas ---------- */

function renderCanvas() {
  const cols = Object.entries(CRITERIA).map(([crit, label]) => {
    const stickies = proposal.ideas.filter(i => i.criterion === crit && !i.archived).map(i => {
      const target = i.promotedTo ? proposal.items.find(x => x.id === i.promotedTo) : null;
      return `
        <div class="sticky by-${i.author} ${i.promotedTo ? "promoted" : ""}">
          ${esc(i.text)}
          <div class="s-foot">
            <span class="who">${esc((getUser(i.author) || {}).initials || "?")}</span>
            ${target ? `<span class="promo">→ promoted to ${esc(target.title.split(" ")[0])}</span>` : ""}
            <span class="spacer"></span>
            ${!i.promotedTo ? `<button class="btn ghost small" data-promote="${i.id}" title="Promote to a section">↑ section</button>` : ""}
            <button class="btn ghost small" data-archive="${i.id}" title="Archive idea">✕</button>
          </div>
        </div>`;
    }).join("");
    return `
      <div class="crit-col">
        <div class="head">${esc(label)}</div>
        ${stickies}
        <button class="sticky-add" data-add-idea="${crit}">＋ Add idea</button>
      </div>`;
  }).join("");
  document.getElementById("ws-body").innerHTML = `
    <div class="canvas-zone">${cols}</div>
    <p class="hint" style="color:var(--muted);font-size:0.76rem;margin-top:14px">
      The columns are the award criteria — ideas are born already sorted by the lens an evaluator will apply. Promote a strong idea into a real section; it keeps a back-link so nothing valuable dies on the whiteboard.
    </p>`;

  document.querySelectorAll("[data-add-idea]").forEach(b => b.onclick = () => {
    const crit = b.dataset.addIdea;
    openModal(`
      <h2>New idea — ${esc(CRITERIA[crit])}</h2>
      <textarea id="idea-text" placeholder="One idea per sticky. Concrete beats clever."></textarea>
      <div class="modal-actions">
        <button class="btn" data-close>Cancel</button>
        <button class="btn primary" id="idea-save">Add to canvas</button>
      </div>`);
    document.getElementById("idea-save").onclick = () => {
      const t = document.getElementById("idea-text").value.trim();
      if (!t) return;
      proposal.ideas.push({ id: uid(), text: t, criterion: crit, author: state.currentUser, promotedTo: null, archived: false });
      closeModal();
      commit("added an idea to the canvas");
    };
  });

  document.querySelectorAll("[data-promote]").forEach(b => b.onclick = () => {
    const idea = proposal.ideas.find(i => i.id === b.dataset.promote);
    const secs = proposal.items.filter(i => i.kind === "section");
    openModal(`
      <h2>Promote idea to a section</h2>
      <p class="hint">“${esc(idea.text)}”</p>
      <label for="pr-target">Attach to existing section, or create a new one</label>
      <select id="pr-target">
        <option value="">— New section from this idea —</option>
        ${secs.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join("")}
      </select>
      <div class="modal-actions">
        <button class="btn" data-close>Cancel</button>
        <button class="btn primary" id="pr-save">Promote</button>
      </div>`);
    document.getElementById("pr-save").onclick = () => {
      const target = document.getElementById("pr-target").value;
      if (target) {
        idea.promotedTo = target;
        const s = proposal.items.find(i => i.id === target);
        proposal.comments.push({ id: uid(), itemId: target, user: state.currentUser, ts: Date.now(), text: "From canvas: " + idea.text, verdict: null });
        closeModal();
        commit(`promoted a canvas idea into “${s.title}”`);
      } else {
        const t = idea.text.length > 60 ? idea.text.slice(0, 57) + "…" : idea.text;
        const ns = { id: uid(), kind: "section", title: "§new — " + t, criterion: idea.criterion, pageBudget: 1, pageActual: 0, status: "not_started", owner: state.currentUser, link: "", due: null };
        proposal.items.push(ns);
        idea.promotedTo = ns.id;
        closeModal();
        commit(`promoted a canvas idea into new section “${ns.title}”`);
      }
    };
  });

  document.querySelectorAll("[data-archive]").forEach(b => b.onclick = () => {
    const idea = proposal.ideas.find(i => i.id === b.dataset.archive);
    idea.archived = true;
    commit("archived a canvas idea");
  });
}

/* ---------- timeline ---------- */

function renderTimeline() {
  const today = todayISO();
  const miles = proposal.milestones.slice().sort((a, b) => a.due.localeCompare(b.due));
  const rows = miles.map(m => {
    const late = !m.done && m.due < today;
    return `
      <div class="mile-row ${m.done ? "done" : ""} ${late ? "late" : ""}">
        <input type="checkbox" ${m.done ? "checked" : ""} data-mile="${m.id}" aria-label="Mark milestone done">
        <span class="m-name ${m.done ? "done-txt" : ""}">${esc(m.name)}</span>
        ${m.auto ? `<span class="m-auto">auto-planned</span>` : ""}
        <span class="m-date">${late ? `<span class="late-txt">${fmtDate(m.due)} — overdue</span>` : fmtDate(m.due)}</span>
      </div>`;
  }).join("");
  document.getElementById("ws-body").innerHTML = `
    ${rows}
    <button class="btn small" id="add-mile" style="margin-top:6px">＋ Add milestone</button>
    <p class="hint" style="color:var(--muted);font-size:0.76rem;margin-top:14px">
      Milestones were planned backwards from the official deadline (${fmtDate(proposal.deadline)}) when the workspace was created — draft freeze, internal review, submission buffer. Edit freely; “auto-planned” only marks their origin.
    </p>`;
  document.querySelectorAll("[data-mile]").forEach(cb => cb.onchange = () => {
    const m = proposal.milestones.find(x => x.id === cb.dataset.mile);
    m.done = cb.checked;
    commit(cb.checked ? `completed milestone “${m.name}”` : `reopened milestone “${m.name}”`);
  });
  document.getElementById("add-mile").onclick = () => {
    openModal(`
      <h2>Add milestone</h2>
      <label for="ml-name">Name</label>
      <input type="text" id="ml-name" placeholder="e.g. Budget figures confirmed">
      <label for="ml-date">Due date</label>
      <input type="date" id="ml-date" value="${todayISO()}">
      <div class="modal-actions">
        <button class="btn" data-close>Cancel</button>
        <button class="btn primary" id="ml-save">Add</button>
      </div>`);
    document.getElementById("ml-save").onclick = () => {
      const name = document.getElementById("ml-name").value.trim();
      const due = document.getElementById("ml-date").value;
      if (!name || !due) return;
      proposal.milestones.push({ id: uid(), name, due, done: false, auto: false });
      closeModal();
      commit(`added milestone “${name}”`);
    };
  };
}

/* ---------- shared plumbing ---------- */

function bindItemButtons() {
  document.querySelectorAll("[data-chip]").forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    cycleStatus(proposal.items.find(i => i.id === b.dataset.chip));
  });
  document.querySelectorAll("[data-own]").forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    cycleOwner(proposal.items.find(i => i.id === b.dataset.own));
  });
  document.querySelectorAll("[data-link]").forEach(b => b.onclick = () => {
    const it = proposal.items.find(i => i.id === b.dataset.link);
    const url = prompt("Link to where this document lives (Drive, Overleaf, …):", it.link || "https://");
    if (url === null) return;
    it.link = url.trim() === "https://" ? "" : url.trim();
    commit(it.link ? `linked a document to “${it.title}”` : null);
  });
  document.querySelectorAll("[data-due]").forEach(b => b.onclick = () => {
    const it = proposal.items.find(i => i.id === b.dataset.due);
    const d = prompt("Due date (YYYY-MM-DD), empty to clear:", it.due || "");
    if (d === null) return;
    it.due = /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? d.trim() : null;
    commit(it.due ? `set a due date on “${it.title}”` : null);
  });
}

function openModal(inner) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `<div class="modal-back" id="modal-back"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`;
  root.querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);
  document.getElementById("modal-back").onclick = e => { if (e.target.id === "modal-back") closeModal(); };
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function renderUserSwitch() {
  const sel = document.getElementById("user-switch");
  sel.innerHTML = state.users.map(u =>
    `<option value="${u.id}" ${u.id === state.currentUser ? "selected" : ""}>${esc(u.name)}</option>`
  ).join("");
  sel.onchange = () => { state.currentUser = sel.value; saveState(); };
}

function render() {
  renderHead();
  renderTabs();
  ({
    overview: renderOverview,
    documents: renderDocuments,
    sections: renderSections,
    canvas: renderCanvas,
    timeline: renderTimeline
  }[activeTab] || renderOverview)();
}

renderUserSwitch();
render();
