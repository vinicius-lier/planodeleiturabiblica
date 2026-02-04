import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";
import { getDefaultDateKey, getValidDateKey } from "../js/date.js";

let user = null;
let mode = "free"; // "free" | "daily" | "bible"
let currentId = null;
let dateKey = null;
let bibleRef = null; // { book, chapter, verseStart, verseEnd, ref }

const pageTitleEl = document.getElementById("pageTitle");
const pageDescriptionEl = document.getElementById("pageDescription");

const contextCardEl = document.getElementById("noteContextCard");
const refLinkEl = document.getElementById("noteRefLink");
const quoteEl = document.getElementById("noteQuote");

const contentEl = document.getElementById("note-content");
const backToBibleLinkEl = document.getElementById("back-to-bible");

const saveBtn = document.querySelector(".note-actions button.action-btn");
const deleteBtn = document.getElementById("delete-note");

let saveTimeout = null;

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

function setSaveBtnState(state) {
  if (!saveBtn) return;
  if (!saveBtn.dataset.originalText) saveBtn.dataset.originalText = saveBtn.textContent;

  if (state === "saving") {
    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";
    return;
  }

  if (state === "saved") {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvo ✓";
    setTimeout(() => {
      if (!saveBtn) return;
      saveBtn.textContent = saveBtn.dataset.originalText || "Salvar";
    }, 1200);
    return;
  }

  if (state === "error") {
    saveBtn.disabled = false;
    saveBtn.textContent = "Erro ao salvar";
    setTimeout(() => {
      if (!saveBtn) return;
      saveBtn.textContent = saveBtn.dataset.originalText || "Salvar";
    }, 2000);
  }
}

function extractLegacyContent(row) {
  const parts = [];

  const observations = (row?.observations ?? "").toString().trim();
  const structure = (row?.structure ?? "").toString().trim();
  const christocentric = (row?.christocentric ?? "").toString().trim();
  const summary = (row?.summary ?? "").toString().trim();

  if (observations) parts.push(`Observações:\n${observations}`);
  if (structure) parts.push(`Aprendizados:\n${structure}`);
  if (christocentric) parts.push(`Aplicação / Oração:\n${christocentric}`);
  if (summary) parts.push(`Resumo:\n${summary}`);

  return parts.join("\n\n").trim();
}

function parseBibleRefFromParams(params) {
  const rawRef = (params.get("ref") || "").trim().replace(/^#/, "");
  if (!rawRef) return null;

  const tokens = rawRef.split(".").filter(Boolean);
  if (tokens.length < 2) return null;

  const book = String(tokens[0] || "").trim().toUpperCase();
  const chapter = Number.parseInt(tokens[1], 10);

  // Aceita #BOOK.CHAPTER.VERSE e #BOOK.CHAPTER.VERSE_START-VERSE_END.
  let verseToken = String(tokens[2] || "").trim();
  if (!/^\d/.test(verseToken) && tokens.length >= 4) {
    // compat com formatos do tipo BOOK.CHAPTER.NVI
    verseToken = String(tokens[3] || "").trim();
  }

  const normalized = verseToken.replace("–", "-");
  const rangeParts = normalized.split("-").filter(Boolean);
  const verseStart = Number.parseInt(rangeParts[0] || "", 10);
  const verseEnd = Number.parseInt(rangeParts[rangeParts.length - 1] || "", 10);

  if (!book || Number.isNaN(chapter) || Number.isNaN(verseStart) || Number.isNaN(verseEnd)) {
    return null;
  }

  const safeChapter = Math.max(1, chapter);
  const safeStart = Math.max(1, verseStart);
  const safeEnd = Math.max(safeStart, verseEnd);

  return {
    book,
    chapter: safeChapter,
    verseStart: safeStart,
    verseEnd: safeEnd,
    ref: `${book}.${safeChapter}.${safeStart}${safeEnd !== safeStart ? `-${safeEnd}` : ""}`
  };
}

function formatBibleRefDisplay(ref) {
  const range = ref.verseEnd !== ref.verseStart ? `:${ref.verseStart}–${ref.verseEnd}` : `:${ref.verseStart}`;
  return `${ref.book} ${ref.chapter}${range}`;
}

function getBibleHref(ref) {
  return `biblia.html#${ref.book}.${ref.chapter}.${ref.verseStart}`;
}

function setModeUI() {
  const isBible = mode === "bible";

  if (contextCardEl) contextCardEl.hidden = !isBible;
  if (backToBibleLinkEl) backToBibleLinkEl.hidden = !isBible;

  if (mode === "daily") {
    const key = dateKey || getDefaultDateKey();
    if (pageTitleEl) pageTitleEl.textContent = `Anotação do Dia`;
    if (pageDescriptionEl) pageDescriptionEl.textContent = key;
    return;
  }

  if (mode === "bible" && bibleRef) {
    if (pageTitleEl) pageTitleEl.textContent = "Anotação do Versículo";
    if (pageDescriptionEl) pageDescriptionEl.textContent = "Reflexão a partir do texto bíblico.";

    if (refLinkEl) {
      refLinkEl.textContent = formatBibleRefDisplay(bibleRef);
      refLinkEl.href = getBibleHref(bibleRef);
    }

    if (backToBibleLinkEl) backToBibleLinkEl.href = getBibleHref(bibleRef);
    return;
  }

  if (pageTitleEl) pageTitleEl.textContent = "Anotação";
  if (pageDescriptionEl) pageDescriptionEl.textContent = "Anotação livre.";
}

async function loadBibleQuote() {
  if (!bibleRef || !quoteEl) return;

  quoteEl.textContent = "Carregando versículo...";

  try {
    const res = await fetch(
      `https://bible-api.com/${bibleRef.book}+${bibleRef.chapter}?translation=almeida`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const verses = Array.isArray(data?.verses) ? data.verses : [];

    const selected = verses.filter((v) => {
      const n = Number(v?.verse);
      return Number.isFinite(n) && n >= bibleRef.verseStart && n <= bibleRef.verseEnd;
    });

    if (!selected.length) {
      quoteEl.textContent = "Não foi possível carregar o texto do versículo.";
      return;
    }

    const text = selected
      .map((v) => `${v.verse} ${String(v.text || "").trim()}`.trim())
      .join(" ");

    quoteEl.textContent = text;
  } catch (error) {
    console.error(error);
    quoteEl.textContent = "Erro ao carregar o texto do versículo.";
  }
}

async function loadNoteById(id) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;
  return data;
}

async function loadNoteForDailyKey(key) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("date_key", key)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) ? data[0] : null;
}

async function loadNoteForBibleRef(ref) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("book", ref.book)
    .eq("chapter", ref.chapter)
    .eq("verse_start", ref.verseStart)
    .eq("verse_end", ref.verseEnd)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) ? data[0] : null;
}

function setEditorContentFromRow(row) {
  if (!contentEl) return;
  const raw = (row?.content ?? "").toString().trim();
  contentEl.value = raw || extractLegacyContent(row) || "";
}

async function loadInitialNote(noteId) {
  currentId = null;
  if (contentEl) contentEl.value = "";

  if (mode === "bible" && bibleRef) {
    const row = await loadNoteForBibleRef(bibleRef);
    if (row) {
      currentId = row.id || null;
      setEditorContentFromRow(row);
    }
    await loadBibleQuote();
    return;
  }

  if (mode === "daily") {
    const key = dateKey || getDefaultDateKey();
    dateKey = key;
    const row = await loadNoteForDailyKey(key);
    if (row) {
      currentId = row.id || null;
      setEditorContentFromRow(row);
    }
    return;
  }

  if (noteId) {
    const row = await loadNoteById(noteId);
    if (row) {
      currentId = row.id || null;
      setEditorContentFromRow(row);

      // Se o usuário abriu por id, respeitamos o tipo real da anotação no banco.
      if (row.book && row.chapter && row.verse_start) {
        bibleRef = {
          book: String(row.book).toUpperCase(),
          chapter: Number(row.chapter),
          verseStart: Number(row.verse_start),
          verseEnd: Number(row.verse_end || row.verse_start),
          ref: `${String(row.book).toUpperCase()}.${Number(row.chapter)}.${Number(row.verse_start)}`
        };
        mode = "bible";
      } else if (row.date_key) {
        dateKey = String(row.date_key);
        mode = "daily";
      }
      setModeUI();
      if (mode === "bible") await loadBibleQuote();
    }
  }
}

function buildPayload() {
  const payload = {
    content: (contentEl?.value ?? "").toString(),
    updated_at: new Date().toISOString(),
    date_key: null,
    book: null,
    chapter: null,
    verse_start: null,
    verse_end: null
  };

  if (mode === "daily") {
    payload.date_key = dateKey || getDefaultDateKey();
  }

  if (mode === "bible" && bibleRef) {
    payload.book = bibleRef.book;
    payload.chapter = bibleRef.chapter;
    payload.verse_start = bibleRef.verseStart;
    payload.verse_end = bibleRef.verseEnd;
  }

  return payload;
}

async function saveCurrentNote({ silent = false } = {}) {
  if (!user?.id) return;
  if (!contentEl) return;

  if (!silent) setSaveBtnState("saving");

  const payload = buildPayload();

  try {
    if (currentId) {
      const { error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", currentId)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, ...payload })
        .select("id")
        .single();

      if (error) throw error;
      currentId = data?.id || null;

      // Se for anotação livre, fixa a URL com id para permitir recarregar/deletar.
      if (mode === "free" && currentId) {
        const next = new URL(window.location.href);
        next.searchParams.set("id", currentId);
        history.replaceState(null, "", next.toString());
      }
    }
  } catch (error) {
    console.error(error);
    if (!silent) {
      setSaveBtnState("error");
      alert(error?.message || "Erro ao salvar anotação.");
    }
    return;
  }

  if (!silent) setSaveBtnState("saved");
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveCurrentNote({ silent: true }), 800);
}

async function deleteCurrentNote() {
  if (!user?.id) return;

  const ok = window.confirm(
    "Deseja apagar esta anotação?\n\nEssa ação não pode ser desfeita."
  );
  if (!ok) return;

  if (deleteBtn) deleteBtn.disabled = true;

  try {
    if (currentId) {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", currentId)
        .eq("user_id", user.id);

      if (error) throw error;
    }

    currentId = null;
    if (contentEl) contentEl.value = "";
  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao apagar anotação.");
  } finally {
    if (deleteBtn) deleteBtn.disabled = false;
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const dayParam = params.get("day");
  const idParam = params.get("id");

  bibleRef = parseBibleRefFromParams(params);
  if (bibleRef) {
    mode = "bible";
  } else if (dayParam) {
    mode = "daily";
    dateKey = getValidDateKey(dayParam);
  } else {
    mode = "free";
  }

  wireLogout();
  setModeUI();

  try {
    user = await requireAuth();
  } catch (error) {
    console.error("Auth required:", error);
    return;
  }

  if (!user) return;

  await loadInitialNote(idParam);

  if (contentEl) contentEl.addEventListener("input", scheduleSave);
  if (saveBtn) saveBtn.addEventListener("click", () => saveCurrentNote());
  if (deleteBtn) deleteBtn.addEventListener("click", deleteCurrentNote);
}

init().catch((error) => {
  console.error(error);
});

