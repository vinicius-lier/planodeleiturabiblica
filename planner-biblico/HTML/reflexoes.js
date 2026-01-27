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

// Header nav: keep "Diario" pointing to a valid day.
const diaryNavLink = document.querySelector('.nav-actions a[href="note.html"]');
if (diaryNavLink) diaryNavLink.href = `note.html?day=${getDefaultDateKey()}`;

// "Nova Anotacao" should also open a valid day (today by default).
const newNoteLink = document.getElementById("new-note-link");
if (newNoteLink) newNoteLink.href = `note.html?day=${getDefaultDateKey()}`;

// Header nav: logout (Supabase signOut + redirect to index.html).
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

const listRoot = document.getElementById("reflexoes-list");
if (!listRoot) {
  throw new Error("Missing reflexoes list root");
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function hasAnyContent(note) {
  const fields = [note.observations, note.structure, note.christocentric, note.summary];
  return fields.some((v) => (v ?? "").toString().trim().length > 0);
}

function formatDateKey(dateKey) {
  // Keep it simple and stable.
  return dateKey || "(sem data)";
}

function formatUpdatedAt(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString();
}

function renderEmpty(message) {
  listRoot.innerHTML = "";
  const card = el("div", "note-card");
  const p = el("p", "status");
  p.textContent = message;
  card.appendChild(p);
  listRoot.appendChild(card);
}

function renderNotes(notes) {
  listRoot.innerHTML = "";

  if (!notes.length) {
    renderEmpty("Nenhuma reflexão encontrada.");
    return;
  }

  notes.forEach((note) => {
    const card = el("div", "note-card");

    const title = el("h3");
    title.textContent = formatDateKey(note.date_key);
    card.appendChild(title);

    const meta = el("p", "status");
    const state = hasAnyContent(note) ? "Preenchida" : "Sem conteúdo";
    const updated = formatUpdatedAt(note.updated_at);
    meta.textContent = updated ? `${state} • Atualizado: ${updated}` : state;
    card.appendChild(meta);

    const actions = el("div", "table-actions");
    const openBtn = el("button");
    openBtn.type = "button";
    openBtn.textContent = "Abrir";
    openBtn.addEventListener("click", () => {
      window.location.href = `note.html?day=${note.date_key}`;
    });
    actions.appendChild(openBtn);
    card.appendChild(actions);

    listRoot.appendChild(card);
  });
}

async function loadNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("id,date_key,observations,structure,christocentric,summary,updated_at")
    .eq("user_id", user.id)
    .order("date_key", { ascending: false });

  if (error) {
    console.error(error);
    renderEmpty("Erro ao carregar reflexões.");
    return;
  }

  renderNotes(data || []);
}

loadNotes();
