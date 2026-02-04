import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";
import { getDefaultDateKey } from "../js/date.js";

let user = null;
let notes = [];
let activeFilter = "all"; // all | bible | daily | free

function wireLogout() {
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
}

const listRoot = document.getElementById("notes-list");
const todayLink = document.getElementById("today-note-link");
const filterBtns = Array.from(document.querySelectorAll('button[data-filter]'));

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function extractLegacyContent(row) {
  const parts = [];

  const observations = (row?.observations ?? "").toString().trim();
  const structure = (row?.structure ?? "").toString().trim();
  const christocentric = (row?.christocentric ?? "").toString().trim();
  const summary = (row?.summary ?? "").toString().trim();

  if (observations) parts.push(`Observações: ${observations}`);
  if (structure) parts.push(`Aprendizados: ${structure}`);
  if (christocentric) parts.push(`Aplicação/Oração: ${christocentric}`);
  if (summary) parts.push(`Resumo: ${summary}`);

  return parts.join(" • ").trim();
}

function normalizeContent(note) {
  const raw = (note?.content ?? "").toString().trim();
  return raw || extractLegacyContent(note) || "";
}

function isBible(note) {
  return Boolean(note?.book && note?.chapter && note?.verse_start);
}

function isDaily(note) {
  return Boolean(note?.date_key) && !isBible(note);
}

function isFree(note) {
  return !isBible(note) && !note?.date_key;
}

function formatBibleRef(note) {
  const book = String(note.book || "").toUpperCase();
  const chapter = Number(note.chapter);
  const start = Number(note.verse_start);
  const end = Number(note.verse_end || note.verse_start);
  if (!book || !chapter || !start) return "(referência inválida)";
  const range = end > start ? `:${start}–${end}` : `:${start}`;
  return `${book} ${chapter}${range}`;
}

function buildNoteHref(note) {
  if (isBible(note)) {
    const book = String(note.book || "").toUpperCase();
    const chapter = Number(note.chapter);
    const start = Number(note.verse_start);
    const end = Number(note.verse_end || note.verse_start);
    const range = end > start ? `${start}-${end}` : String(start);
    return `note.html?ref=${book}.${chapter}.${range}`;
  }

  if (note?.date_key) return `note.html?day=${note.date_key}`;
  return `note.html?id=${note.id}`;
}

function formatUpdatedAt(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString();
}

function applyFilter(list) {
  if (activeFilter === "bible") return list.filter(isBible);
  if (activeFilter === "daily") return list.filter(isDaily);
  if (activeFilter === "free") return list.filter(isFree);
  return list;
}

function setActiveFilter(next) {
  activeFilter = next;
  filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.filter === next));
  render();
}

function renderEmpty(message) {
  if (!listRoot) return;
  listRoot.innerHTML = "";
  const card = el("div", "note-card");
  const p = el("p", "status");
  p.textContent = message;
  card.appendChild(p);
  listRoot.appendChild(card);
}

function render() {
  if (!listRoot) return;
  listRoot.innerHTML = "";

  const filtered = applyFilter(notes);
  if (!filtered.length) {
    renderEmpty("Nenhuma anotação encontrada para este filtro.");
    return;
  }

  filtered.forEach((note) => {
    const card = el("div", "note-card");

    const title = el("h3");
    title.textContent = isBible(note) ? formatBibleRef(note) : note.date_key || "Anotação livre";
    card.appendChild(title);

    const meta = el("p", "status");
    const updated = formatUpdatedAt(note.updated_at || note.created_at);
    meta.textContent = updated ? `Atualizado: ${updated}` : "";
    card.appendChild(meta);

    const preview = el("div", "doc-block");
    const content = normalizeContent(note);
    preview.textContent = content ? content.slice(0, 320) : "(sem conteúdo)";
    card.appendChild(preview);

    const actions = el("div", "table-actions");

    const openBtn = el("button");
    openBtn.type = "button";
    openBtn.textContent = "Abrir";
    openBtn.addEventListener("click", () => {
      window.location.href = buildNoteHref(note);
    });
    actions.appendChild(openBtn);

    const delBtn = el("button");
    delBtn.type = "button";
    delBtn.textContent = "Apagar";
    delBtn.addEventListener("click", async () => {
      const ok = window.confirm("Deseja apagar esta anotação?\n\nEssa ação não pode ser desfeita.");
      if (!ok) return;

      delBtn.disabled = true;
      try {
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("user_id", user.id)
          .eq("id", note.id);

        if (error) throw error;
        notes = notes.filter((n) => n.id !== note.id);
        render();
      } catch (err) {
        console.error(err);
        alert(err?.message || "Erro ao apagar anotação.");
      } finally {
        delBtn.disabled = false;
      }
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    listRoot.appendChild(card);
  });
}

async function loadNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id,content,book,chapter,verse_start,verse_end,date_key,observations,structure,christocentric,summary,updated_at,created_at"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  notes = data || [];
}

async function init() {
  wireLogout();

  // "Anotação do dia" sempre aponta para uma data válida (ano corrente do plano).
  const today = getDefaultDateKey();
  if (todayLink) todayLink.href = `note.html?day=${today}`;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => setActiveFilter(btn.dataset.filter || "all"));
  });

  setActiveFilter("all");

  try {
    user = await requireAuth();
  } catch (error) {
    console.error("Auth required:", error);
    return;
  }

  await loadNotes();
  render();
}

init().catch((error) => {
  console.error(error);
  renderEmpty("Erro ao carregar anotações.");
});

