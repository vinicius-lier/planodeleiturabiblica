import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";

const user = await requireAuth();
if (!user) {
  throw new Error("No session");
}

const YEAR = 2026;
const pad = (value) => String(value).padStart(2, "0");
const getDefaultDateKey = () => {
  const now = new Date();
  if (now.getFullYear() === YEAR) {
    return `${YEAR}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return `${YEAR}-01-01`;
};

const diaryNavLink = document.querySelector('.nav-actions a[href="note.html"]');
if (diaryNavLink) diaryNavLink.href = `note.html?day=${getDefaultDateKey()}`;

document.querySelectorAll(".logout-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
      window.location.href = "index.html";
    }
  });
});

const printBtn = document.getElementById("print-btn");
if (printBtn) {
  printBtn.addEventListener("click", () => window.print());
}

const notesRoot = document.getElementById("docs-notes");
const outlinesRoot = document.getElementById("docs-esbocos");

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function addField(container, label, value) {
  const text = (value ?? "").toString().trim();
  if (!text) return;

  const h = el("h4");
  h.style.margin = "0 0 0.35rem";
  h.style.color = "var(--primary)";
  h.textContent = label;

  const body = el("div", "doc-block");
  body.textContent = text;

  container.appendChild(h);
  container.appendChild(body);
}

function renderEmpty(root, message) {
  if (!root) return;
  const card = el("div", "note-card");
  const p = el("p");
  p.style.margin = "0";
  p.style.color = "var(--text-muted)";
  p.textContent = message;
  card.appendChild(p);
  root.appendChild(card);
}

function renderNotes(notes) {
  if (!notesRoot) return;
  notesRoot.innerHTML = "";

  if (!notes.length) {
    renderEmpty(notesRoot, "Nenhuma anotação encontrada.");
    return;
  }

  notes.forEach((note) => {
    const card = el("div", "note-card");

    const title = el("h3");
    title.style.margin = "0 0 0.5rem";
    title.style.color = "var(--primary)";
    title.textContent = note.date_key || "(sem data)";
    card.appendChild(title);

    addField(card, "Observações", note.observations);
    addField(card, "Aprendizados", note.structure);
    addField(card, "Aplicação / Oração", note.christocentric);
    addField(card, "Resumo", note.summary);

    notesRoot.appendChild(card);
  });
}

function renderOutlines(outlines) {
  if (!outlinesRoot) return;
  outlinesRoot.innerHTML = "";

  if (!outlines.length) {
    renderEmpty(outlinesRoot, "Nenhum esboço encontrado.");
    return;
  }

  outlines.forEach((o) => {
    const card = el("div", "note-card");

    const title = el("h3");
    title.style.margin = "0 0 0.35rem";
    title.style.color = "var(--primary)";
    title.textContent = o.title || "Sem título";
    card.appendChild(title);

    const meta = el("p");
    meta.style.margin = "0 0 0.75rem";
    meta.style.color = "var(--text-muted)";
    const parts = [];
    if (o.base_text) parts.push(o.base_text);
    if (o.scheduled_for) parts.push(`Data: ${o.scheduled_for}`);
    if (o.audience) parts.push(`Local: ${o.audience}`);
    if (o.status) parts.push(`Status: ${o.status}`);
    meta.textContent = parts.join(" | ");
    card.appendChild(meta);

    addField(card, "Introdução", o.intro);
    addField(card, "Desenvolvimento", o.development);
    addField(card, "Aplicações", o.applications);
    addField(card, "Conclusão", o.conclusion);

    outlinesRoot.appendChild(card);
  });
}

async function loadData() {
  const [notesRes, outlinesRes] = await Promise.all([
    supabase
      .from("notes")
      .select("id,date_key,observations,structure,christocentric,summary,updated_at")
      .eq("user_id", user.id)
      .order("date_key", { ascending: true }),
    supabase
      .from("esbocos")
      .select(
        "id,title,base_text,scheduled_for,audience,intro,development,applications,conclusion,status,updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
  ]);

  if (notesRes.error) {
    console.error(notesRes.error);
    renderEmpty(notesRoot, "Erro ao carregar anotações.");
  } else {
    renderNotes(notesRes.data || []);
  }

  if (outlinesRes.error) {
    console.error(outlinesRes.error);
    renderEmpty(outlinesRoot, "Erro ao carregar esboços.");
  } else {
    renderOutlines(outlinesRes.data || []);
  }
}

loadData();
