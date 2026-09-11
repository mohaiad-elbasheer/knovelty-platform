/* Knovelty Platform — dashboard (proposal list + new-proposal flow). */

loadState();

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderUserSwitch() {
  const sel = document.getElementById("user-switch");
  sel.innerHTML = state.users.map(u =>
    `<option value="${u.id}" ${u.id === state.currentUser ? "selected" : ""}>${esc(u.name)}</option>`
  ).join("");
  sel.onchange = () => { state.currentUser = sel.value; saveState(); };
}

function deadlineBadge(p) {
  const d = daysUntil(p.deadline);
  if (d < 0) return `<div class="deadline late">⏱ deadline passed (${fmtDate(p.deadline)})</div>`;
  const cls = d <= 45 ? "warn" : "ok";
  return `<div class="deadline ${cls === "warn" ? "warn" : ""}">⏱ ${d} days to deadline · ${fmtDate(p.deadline)}</div>`;
}

function renderGrid() {
  const grid = document.getElementById("proposal-grid");
  const cards = state.proposals.map(p => {
    const pct = completion(p);
    return `
      <a class="p-card" href="proposal.html?id=${p.id}">
        <div class="acr">${esc(p.acronym)}</div>
        <div class="call">${esc(p.templateName)} · ${esc(CALL_TEMPLATES[p.template].funder)}</div>
        <div class="title">${esc(p.title)}</div>
        ${deadlineBadge(p)}
        <div class="meter"><i style="width:${pct}%"></i></div>
        <div class="meter-label">${pct}% complete · ${esc(p.stages[p.stageIndex])} stage</div>
      </a>`;
  }).join("");
  grid.innerHTML = cards + `
    <button class="p-card new" id="new-proposal-card">＋ New proposal<br><small>from a call template</small></button>`;
  document.getElementById("new-proposal-card").onclick = openNewProposal;
}

function openNewProposal() {
  const root = document.getElementById("modal-root");
  const defaultDeadline = addDays(todayISO(), 90);
  root.innerHTML = `
    <div class="modal-back" id="modal-back">
      <div class="modal" role="dialog" aria-modal="true" aria-label="New proposal">
        <h2>New proposal</h2>
        <label for="np-template">Call template</label>
        <select id="np-template">
          ${Object.values(CALL_TEMPLATES).map(t => `<option value="${t.id}">${esc(t.name)} — ${esc(t.funder)}</option>`).join("")}
        </select>
        <div class="hint">The template generates the full document checklist, section skeleton with page budgets, and a backwards-planned timeline. No blank pages.</div>
        <label for="np-acronym">Acronym</label>
        <input type="text" id="np-acronym" placeholder="e.g. TWIN-BRIDGE" maxlength="24">
        <label for="np-title">Title</label>
        <input type="text" id="np-title" placeholder="Full proposal title">
        <label for="np-deadline">Official call deadline</label>
        <input type="date" id="np-deadline" value="${defaultDeadline}">
        <div class="modal-actions">
          <button class="btn" id="np-cancel">Cancel</button>
          <button class="btn primary" id="np-create">Create workspace</button>
        </div>
      </div>
    </div>`;
  document.getElementById("np-cancel").onclick = closeModal;
  document.getElementById("modal-back").onclick = e => { if (e.target.id === "modal-back") closeModal(); };
  document.getElementById("np-create").onclick = () => {
    const tpl = document.getElementById("np-template").value;
    const acr = document.getElementById("np-acronym").value.trim() || "UNTITLED";
    const title = document.getElementById("np-title").value.trim() || "Untitled proposal";
    const deadline = document.getElementById("np-deadline").value;
    if (!deadline) { document.getElementById("np-deadline").focus(); return; }
    const p = createProposal(tpl, title, acr, deadline);
    state.proposals.unshift(p);
    saveState();
    location.href = "proposal.html?id=" + p.id;
  };
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

document.getElementById("new-proposal-btn").onclick = openNewProposal;
document.getElementById("reset-demo").onclick = () => {
  if (confirm("Reset all platform data to the demo seed? Your changes will be lost.")) resetDemo();
};

renderUserSwitch();
renderGrid();
