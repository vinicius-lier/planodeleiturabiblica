import { supabase } from "./supabase.js";
import { requireAuth } from "./auth.js";

const bookPickerEl = document.getElementById("bookPicker");
const openBookPickerBtn = document.getElementById("openBookPicker");
const closeBookPickerBtn = document.getElementById("closeBookPicker");
const bookButtonsEl = document.getElementById("bookButtons");

const chapterPickerEl = document.getElementById("chapterPicker");
const openChapterPickerBtn = document.getElementById("openChapterPicker");
const closeChapterPickerBtn = document.getElementById("closeChapterPicker");
const chapterButtonsEl = document.getElementById("chapterButtons");

const versePickerEl = document.getElementById("versePicker");
const openVersePickerBtn = document.getElementById("openVersePicker");
const closeVersePickerBtn = document.getElementById("closeVersePicker");
const verseButtonsEl = document.getElementById("verseButtons");

const prevChapterBtn = document.getElementById("prevChapterBtn");
const nextChapterBtn = document.getElementById("nextChapterBtn");
const loadBtn = document.getElementById("loadBtn");

const referenceEl = document.getElementById("reference");
const versesEl = document.getElementById("verses");

const verseMenuEl = document.getElementById("verseMenu");
const closeVerseMenuBtn = document.getElementById("closeVerseMenu");
const verseMenuTitleEl = document.getElementById("verseMenuTitle");
const createNoteFromVerseBtn = document.getElementById("createNoteFromVerse");
const removeHighlightBtn = document.getElementById("removeHighlight");
const verseMenuStatusEl = document.getElementById("verseMenuStatus");
const colorChipBtns = Array.from(document.querySelectorAll(".color-chip[data-color]"));

// Livros (códigos padrão USFX/osis; compatível com bible.com e open-bibles)
// Fonte conceitual: https://github.com/seven1m/open-bibles (bible-api.com é construído a partir dele)
const books = [
  // Antigo Testamento
  { label: "Gênesis", code: "GEN", chapters: 50, group: "AT" },
  { label: "Êxodo", code: "EXO", chapters: 40, group: "AT" },
  { label: "Levítico", code: "LEV", chapters: 27, group: "AT" },
  { label: "Números", code: "NUM", chapters: 36, group: "AT" },
  { label: "Deuteronômio", code: "DEU", chapters: 34, group: "AT" },
  { label: "Josué", code: "JOS", chapters: 24, group: "AT" },
  { label: "Juízes", code: "JDG", chapters: 21, group: "AT" },
  { label: "Rute", code: "RUT", chapters: 4, group: "AT" },
  { label: "1 Samuel", code: "1SA", chapters: 31, group: "AT" },
  { label: "2 Samuel", code: "2SA", chapters: 24, group: "AT" },
  { label: "1 Reis", code: "1KI", chapters: 22, group: "AT" },
  { label: "2 Reis", code: "2KI", chapters: 25, group: "AT" },
  { label: "1 Crônicas", code: "1CH", chapters: 29, group: "AT" },
  { label: "2 Crônicas", code: "2CH", chapters: 36, group: "AT" },
  { label: "Esdras", code: "EZR", chapters: 10, group: "AT" },
  { label: "Neemias", code: "NEH", chapters: 13, group: "AT" },
  { label: "Ester", code: "EST", chapters: 10, group: "AT" },
  { label: "Jó", code: "JOB", chapters: 42, group: "AT" },
  { label: "Salmos", code: "PSA", chapters: 150, group: "AT" },
  { label: "Provérbios", code: "PRO", chapters: 31, group: "AT" },
  { label: "Eclesiastes", code: "ECC", chapters: 12, group: "AT" },
  { label: "Cânticos", code: "SNG", chapters: 8, group: "AT" },
  { label: "Isaías", code: "ISA", chapters: 66, group: "AT" },
  { label: "Jeremias", code: "JER", chapters: 52, group: "AT" },
  { label: "Lamentações", code: "LAM", chapters: 5, group: "AT" },
  { label: "Ezequiel", code: "EZK", chapters: 48, group: "AT" },
  { label: "Daniel", code: "DAN", chapters: 12, group: "AT" },
  { label: "Oséias", code: "HOS", chapters: 14, group: "AT" },
  { label: "Joel", code: "JOL", chapters: 3, group: "AT" },
  { label: "Amós", code: "AMO", chapters: 9, group: "AT" },
  { label: "Obadias", code: "OBA", chapters: 1, group: "AT" },
  { label: "Jonas", code: "JON", chapters: 4, group: "AT" },
  { label: "Miquéias", code: "MIC", chapters: 7, group: "AT" },
  { label: "Naum", code: "NAM", chapters: 3, group: "AT" },
  { label: "Habacuque", code: "HAB", chapters: 3, group: "AT" },
  { label: "Sofonias", code: "ZEP", chapters: 3, group: "AT" },
  { label: "Ageu", code: "HAG", chapters: 2, group: "AT" },
  { label: "Zacarias", code: "ZEC", chapters: 14, group: "AT" },
  { label: "Malaquias", code: "MAL", chapters: 4, group: "AT" },

  // Novo Testamento
  { label: "Mateus", code: "MAT", chapters: 28, group: "NT" },
  { label: "Marcos", code: "MRK", chapters: 16, group: "NT" },
  { label: "Lucas", code: "LUK", chapters: 24, group: "NT" },
  { label: "João", code: "JHN", chapters: 21, group: "NT" },
  { label: "Atos", code: "ACT", chapters: 28, group: "NT" },
  { label: "Romanos", code: "ROM", chapters: 16, group: "NT" },
  { label: "1 Coríntios", code: "1CO", chapters: 16, group: "NT" },
  { label: "2 Coríntios", code: "2CO", chapters: 13, group: "NT" },
  { label: "Gálatas", code: "GAL", chapters: 6, group: "NT" },
  { label: "Efésios", code: "EPH", chapters: 6, group: "NT" },
  { label: "Filipenses", code: "PHP", chapters: 4, group: "NT" },
  { label: "Colossenses", code: "COL", chapters: 4, group: "NT" },
  { label: "1 Tessalonicenses", code: "1TH", chapters: 5, group: "NT" },
  { label: "2 Tessalonicenses", code: "2TH", chapters: 3, group: "NT" },
  { label: "1 Timóteo", code: "1TI", chapters: 6, group: "NT" },
  { label: "2 Timóteo", code: "2TI", chapters: 4, group: "NT" },
  { label: "Tito", code: "TIT", chapters: 3, group: "NT" },
  { label: "Filemom", code: "PHM", chapters: 1, group: "NT" },
  { label: "Hebreus", code: "HEB", chapters: 13, group: "NT" },
  { label: "Tiago", code: "JAS", chapters: 5, group: "NT" },
  { label: "1 Pedro", code: "1PE", chapters: 5, group: "NT" },
  { label: "2 Pedro", code: "2PE", chapters: 3, group: "NT" },
  { label: "1 João", code: "1JN", chapters: 5, group: "NT" },
  { label: "2 João", code: "2JN", chapters: 1, group: "NT" },
  { label: "3 João", code: "3JN", chapters: 1, group: "NT" },
  { label: "Judas", code: "JUD", chapters: 1, group: "NT" },
  { label: "Apocalipse", code: "REV", chapters: 22, group: "NT" },
];

let selectedBook = books.find((b) => b.code === "JHN") ?? books[0];
let selectedChapter = 3;
let selectedVerse = null;

let user = null;
let openMenuVerse = null; // { ref, book, chapter, verse }

const chapterCache = new Map();
const highlightCache = new Map(); // key: "BOOK.CHAPTER" => Map(verse -> color)
const colorLabels = {
  yellow: "amarelo",
  green: "verde",
  blue: "azul",
  red: "vermelho"
};
let verseMenuStatusTimer = null;

init().catch((error) => {
  console.error(error);
  if (versesEl) versesEl.innerHTML = `<div class="loading">Erro ao inicializar a Bíblia</div>`;
});

async function init() {
  try {
    user = await requireAuth();
  } catch (error) {
    console.error("Auth required:", error);
    return;
  }

  const initial = parseRouteFromLocation();
  if (initial.bookCode) {
    selectedBook = books.find((b) => b.code === initial.bookCode) ?? selectedBook;
  }
  if (initial.chapter) selectedChapter = initial.chapter;
  if (initial.verse) selectedVerse = initial.verse;

  renderBookButtons();
  setBook(selectedBook.code, { autoLoad: false, preserveChapter: true });
  setChapter(selectedChapter, { autoLoad: false, preserveVerse: true });

  openVersePickerBtn.disabled = true;

  // Context menu (versículo)
  if (verseMenuEl) {
    verseMenuEl.addEventListener("click", (e) => {
      if (e.target === verseMenuEl) closeVerseMenu();
    });
  }

  if (closeVerseMenuBtn) closeVerseMenuBtn.addEventListener("click", closeVerseMenu);
  if (createNoteFromVerseBtn)
    createNoteFromVerseBtn.addEventListener("click", openNoteForSelectedVerse);
  if (removeHighlightBtn) removeHighlightBtn.addEventListener("click", removeSelectedHighlight);

  colorChipBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const color = btn.dataset.color;
      if (!color) return;
      await setSelectedHighlightColor(color);
    });
  });

  // Top actions
  openBookPickerBtn.addEventListener("click", () => openPicker(bookPickerEl));
  closeBookPickerBtn.addEventListener("click", () => closePicker(bookPickerEl));
  bookPickerEl.addEventListener("click", (e) => {
    if (e.target === bookPickerEl) closePicker(bookPickerEl);
  });

  openChapterPickerBtn.addEventListener("click", () => openPicker(chapterPickerEl));
  closeChapterPickerBtn.addEventListener("click", () => closePicker(chapterPickerEl));
  chapterPickerEl.addEventListener("click", (e) => {
    if (e.target === chapterPickerEl) closePicker(chapterPickerEl);
  });

  openVersePickerBtn.addEventListener("click", () => openPicker(versePickerEl));
  closeVersePickerBtn.addEventListener("click", () => closePicker(versePickerEl));
  versePickerEl.addEventListener("click", (e) => {
    if (e.target === versePickerEl) closePicker(versePickerEl);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeVerseMenu();
    closePicker(bookPickerEl);
    closePicker(chapterPickerEl);
    closePicker(versePickerEl);
  });

  loadBtn.addEventListener("click", () => loadChapter({ force: true }));
  prevChapterBtn.addEventListener("click", () => setChapter(selectedChapter - 1, { autoLoad: true }));
  nextChapterBtn.addEventListener("click", () => setChapter(selectedChapter + 1, { autoLoad: true }));

  loadChapter();
}

function renderBookButtons() {
  bookButtonsEl.innerHTML = "";

  const groups = [
    { key: "AT", label: "Antigo Testamento" },
    { key: "NT", label: "Novo Testamento" },
  ];

  const rootFrag = document.createDocumentFragment();

  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "book-group";

    const title = document.createElement("h3");
    title.className = "book-group-title";
    title.textContent = group.label;
    section.appendChild(title);

    const row = document.createElement("div");
    row.className = "button-row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", group.label);

    const frag = document.createDocumentFragment();
    for (const book of books.filter((b) => b.group === group.key)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = book.label;
      btn.dataset.book = book.code;
      btn.addEventListener("click", () => {
        setBook(book.code, { autoLoad: false });
        closePicker(bookPickerEl);
        openPicker(chapterPickerEl);
      });
      frag.appendChild(btn);
    }
    row.appendChild(frag);
    section.appendChild(row);

    rootFrag.appendChild(section);
  }

  bookButtonsEl.appendChild(rootFrag);
}

function setBook(bookCode, { autoLoad, preserveChapter } = { autoLoad: true, preserveChapter: false }) {
  const found = books.find((b) => b.code === bookCode);
  if (!found) return;

  closeVerseMenu();
  selectedBook = found;
  if (preserveChapter) {
    selectedChapter = clamp(selectedChapter || 1, 1, selectedBook.chapters);
  } else {
    selectedChapter = 1;
    selectedVerse = null;
  }

  for (const btn of bookButtonsEl.querySelectorAll("button[data-book]")) {
    btn.classList.toggle("active", btn.dataset.book === selectedBook.code);
  }

  renderChapterButtons();
  updateHeader();
  updateChapterNavButtons();
  syncUrl();

  if (autoLoad) loadChapter();
}

function renderChapterButtons() {
  chapterButtonsEl.innerHTML = "";

  const frag = document.createDocumentFragment();
  for (let chapter = 1; chapter <= selectedBook.chapters; chapter += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-btn";
    btn.textContent = String(chapter);
    btn.dataset.chapter = String(chapter);
    btn.addEventListener("click", () => {
      setChapter(chapter, { autoLoad: true });
      closePicker(chapterPickerEl);
    });
    frag.appendChild(btn);
  }

  chapterButtonsEl.appendChild(frag);
  updateChapterButtonsActive();
}

function setChapter(chapter, { autoLoad, preserveVerse } = { autoLoad: true, preserveVerse: false }) {
  const normalized = Number.parseInt(chapter, 10);
  if (Number.isNaN(normalized)) return;

  closeVerseMenu();
  selectedChapter = clamp(normalized, 1, selectedBook.chapters);
  if (!preserveVerse) selectedVerse = null;

  updateHeader();
  updateChapterNavButtons();
  updateChapterButtonsActive();
  syncUrl();

  if (autoLoad) loadChapter();
}

function updateChapterButtonsActive() {
  for (const btn of chapterButtonsEl.querySelectorAll("button[data-chapter]")) {
    btn.classList.toggle("active", Number(btn.dataset.chapter) === selectedChapter);
  }
}

function updateHeader() {
  referenceEl.textContent = `${selectedBook.label} ${selectedChapter}`;
}

function updateChapterNavButtons() {
  prevChapterBtn.disabled = selectedChapter <= 1;
  nextChapterBtn.disabled = selectedChapter >= selectedBook.chapters;
}

async function loadChapter({ force } = { force: false }) {
  updateHeader();
  openVersePickerBtn.disabled = true;
  versesEl.innerHTML = `<div class="loading">Carregando...</div>`;

  const book = selectedBook.code;
  const chapter = selectedChapter;
  const cacheKey = `${book}.${chapter}`;

  let verses = null;
  if (!force && chapterCache.has(cacheKey)) {
    verses = chapterCache.get(cacheKey)?.verses || null;
  }

  try {
    if (!verses) {
      const res = await fetch(`https://bible-api.com/${book}+${chapter}?translation=almeida`);
      if (!res.ok) {
        if (res.status === 429) throw new Error("HTTP 429");
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data?.verses?.length) throw new Error("Resposta inesperada da API");

      verses = data.verses;
      chapterCache.set(cacheKey, { verses });
    }

    renderVerses(verses);
    await loadHighlightsForCurrentChapter();
  } catch (err) {
    if (String(err?.message || "").includes("429")) {
      versesEl.innerHTML = `<div class="loading">Muitas requisições. Aguarde alguns segundos e tente novamente.</div>`;
    } else {
      versesEl.innerHTML = `<div class="loading">Erro ao carregar capítulo</div>`;
    }
    console.error(err);
  }
}

function renderVerses(verses) {
  versesEl.innerHTML = "";
  verseButtonsEl.innerHTML = "";

  // Capítulo grande (como no bible.com)
  const chap = document.createElement("div");
  chap.className = "chapter-start";
  chap.textContent = String(selectedChapter);
  versesEl.appendChild(chap);

  const text = document.createElement("div");
  text.className = "reading-text";
  versesEl.appendChild(text);

  const verseButtonsFrag = document.createDocumentFragment();

  for (const v of verses) {
    const verseRef = `${selectedBook.code}.${selectedChapter}.${v.verse}`;
    const verseId = verseRef;

    // Botão no picker de versículos
    const verseBtn = document.createElement("button");
    verseBtn.type = "button";
    verseBtn.className = "chapter-btn";
    verseBtn.textContent = String(v.verse);
    verseBtn.dataset.verse = String(v.verse);
    verseBtn.addEventListener("click", () => {
      closePicker(versePickerEl);
      scrollToVerse(verseId, v.verse);
    });
    verseButtonsFrag.appendChild(verseBtn);

    // Verso em linha (layout de leitura)
    const verseSpan = document.createElement("span");
    verseSpan.className = "reading-verse";
    verseSpan.id = verseId;
    verseSpan.dataset.ref = verseRef;
    verseSpan.dataset.bookCode = selectedBook.code;
    verseSpan.dataset.book = v.book_name;
    verseSpan.dataset.chapter = String(v.chapter);
    verseSpan.dataset.verse = String(v.verse);

    const sup = document.createElement("sup");
    sup.className = "verse-num";
    sup.textContent = String(v.verse);

    const verseText = document.createElement("span");
    verseText.textContent = String(v.text || "").trim();

    verseSpan.appendChild(sup);
    verseSpan.appendChild(document.createTextNode(" "));
    verseSpan.appendChild(verseText);
    verseSpan.appendChild(document.createTextNode(" "));

    verseSpan.addEventListener("click", () => onVerseClick(verseRef, v.verse));

    text.appendChild(verseSpan);
  }

  verseButtonsEl.appendChild(verseButtonsFrag);
  openVersePickerBtn.disabled = false;

  // Seleção/scroll opcional vindo da URL
  if (selectedVerse) {
    const existsInChapter = verses.some((v) => v.verse === selectedVerse);
    if (existsInChapter) {
      const verseId = `${selectedBook.code}.${selectedChapter}.${selectedVerse}`;
      scrollToVerse(verseId, selectedVerse);
      return;
    }
    selectedVerse = null;
  }

  syncUrl();
}

function scrollToVerse(verseId, verseNumber) {
  const el = document.getElementById(verseId);
  if (!el) return;

  selectVerse(verseNumber);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectVerse(verseNumber) {
  selectedVerse = verseNumber;
  syncUrl();

  for (const btn of verseButtonsEl.querySelectorAll("button[data-verse]")) {
    btn.classList.toggle("active", Number(btn.dataset.verse) === selectedVerse);
  }

  for (const verseEl of versesEl.querySelectorAll(".reading-verse[data-verse]")) {
    verseEl.classList.toggle("selected", Number(verseEl.dataset.verse) === selectedVerse);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function syncUrl() {
  const bookCode = selectedBook?.code ?? "";
  if (!bookCode || !selectedChapter) return;

  const parts = [bookCode, String(selectedChapter)];
  if (selectedVerse) parts.push(String(selectedVerse));
  const hash = `#${parts.join(".")}`;

  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
}

async function loadHighlightsForCurrentChapter() {
  if (!user?.id) return;

  const book = selectedBook.code;
  const chapter = selectedChapter;
  const cacheKey = `${book}.${chapter}`;

  // Optimistic: apply cached highlights immediately (if any), then refresh from Supabase.
  if (highlightCache.has(cacheKey)) {
    applyHighlightsFromCache();
  }

  try {
    const { data, error } = await supabase
      .from("highlights")
      .select("verse,color")
      .eq("user_id", user.id)
      .eq("book", book)
      .eq("chapter", chapter);

    if (error) throw error;

    const map = new Map();
    for (const row of data || []) {
      const verseNum = Number(row.verse);
      const color = String(row.color || "").trim();
      if (!Number.isFinite(verseNum) || verseNum < 1) continue;
      if (!color) continue;
      map.set(verseNum, color);
    }

    highlightCache.set(cacheKey, map);
    applyHighlightsFromCache();
    syncVerseMenuState();
  } catch (error) {
    console.error("Erro ao carregar highlights:", error);
    const hint = hintForSupabaseError(error);
    showVerseMenuStatus(
      `Highlights indisponíveis: ${formatSupabaseError(error)}${hint ? ` — ${hint}` : ""}`,
      { variant: "error" }
    );
  }
}

function applyHighlightsFromCache() {
  const cacheKey = `${selectedBook.code}.${selectedChapter}`;
  const map = highlightCache.get(cacheKey) || new Map();

  for (const verseEl of versesEl.querySelectorAll(".reading-verse[data-verse]")) {
    const verseNum = Number(verseEl.dataset.verse);
    const color = map.get(verseNum) || null;
    setVerseHighlightClass(verseEl, color);
  }
}

function setVerseHighlightClass(el, color) {
  if (!el) return;
  el.classList.remove("hl-yellow", "hl-green", "hl-blue", "hl-red");
  if (!color) return;
  if (color === "yellow") el.classList.add("hl-yellow");
  if (color === "green") el.classList.add("hl-green");
  if (color === "blue") el.classList.add("hl-blue");
  if (color === "red") el.classList.add("hl-red");
}

function onVerseClick(ref, verseNumber) {
  selectVerse(verseNumber);
  openMenuVerse = { ref, book: selectedBook.code, chapter: selectedChapter, verse: verseNumber };

  if (verseMenuTitleEl) verseMenuTitleEl.textContent = ref;
  syncVerseMenuState();
  openVerseMenu();
}

function syncVerseMenuState() {
  if (!openMenuVerse) return;

  const cacheKey = `${openMenuVerse.book}.${openMenuVerse.chapter}`;
  const map = highlightCache.get(cacheKey) || new Map();
  const currentColor = map.get(openMenuVerse.verse) || null;

  colorChipBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.color === currentColor);
  });

  if (removeHighlightBtn) removeHighlightBtn.disabled = !currentColor;
}

function showVerseMenuStatus(message = "", { variant = "info", persist = false } = {}) {
  if (!verseMenuStatusEl) return;
  verseMenuStatusEl.textContent = message;
  verseMenuStatusEl.dataset.variant = variant;
  verseMenuStatusEl.hidden = !message;

  if (verseMenuStatusTimer) {
    clearTimeout(verseMenuStatusTimer);
    verseMenuStatusTimer = null;
  }

  if (message && !persist) {
    verseMenuStatusTimer = setTimeout(() => {
      if (verseMenuStatusEl) verseMenuStatusEl.hidden = true;
    }, 2200);
  }
}

function formatSupabaseError(error) {
  if (!error) return "erro desconhecido";
  const code = error.code ? ` (${error.code})` : "";
  const message = (error.message || error.error_description || "").toString().trim();
  const details = (error.details || "").toString().trim();
  const base = `${message || "erro ao salvar"}${code}`;

  if (details && details !== message) return `${base}: ${details}`;
  return base;
}

function hintForSupabaseError(error) {
  const msg = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  const code = (error?.code || "").toString().toLowerCase();

  if (msg.includes("relation") && msg.includes("highlights") && msg.includes("does not exist")) {
    return "Crie a tabela `highlights` e aplique `planner-biblico/supabase/rls_and_comments.sql` no Supabase.";
  }

  if (msg.includes("permission denied") || code === "42501") {
    return "Confira RLS/policies da tabela `highlights` (select/insert/update/delete para `authenticated`).";
  }

  return "";
}

async function setSelectedHighlightColor(color) {
  if (!user?.id || !openMenuVerse) return;

  const { book, chapter, verse } = openMenuVerse;
  const cacheKey = `${book}.${chapter}`;

  const verseEl = document.getElementById(openMenuVerse.ref);
  const cached = highlightCache.get(cacheKey) || new Map();
  const previousColor = cached.get(verse) || null;
  cached.set(verse, color);
  highlightCache.set(cacheKey, cached);
  setVerseHighlightClass(verseEl, color);
  syncVerseMenuState();
  showVerseMenuStatus("Salvando destaque...", { variant: "pending", persist: true });

  try {
    const payload = {
      user_id: user.id,
      book,
      chapter,
      verse,
      color
    };

    const { error } = await supabase
      .from("highlights")
      .upsert(payload, { onConflict: "user_id,book,chapter,verse" });

    if (error) throw error;

    showVerseMenuStatus(`Verso marcado em ${colorLabels[color] || color}`, {
      variant: "success"
    });
    return;
  } catch (error) {
    console.error("Erro ao salvar highlight:", error);
    if (previousColor) {
      cached.set(verse, previousColor);
      setVerseHighlightClass(verseEl, previousColor);
    } else {
      cached.delete(verse);
      setVerseHighlightClass(verseEl, null);
    }
    highlightCache.set(cacheKey, cached);
    syncVerseMenuState();
    const hint = hintForSupabaseError(error);
    showVerseMenuStatus(
      `Erro ao salvar destaque: ${formatSupabaseError(error)}${hint ? ` — ${hint}` : ""}`,
      { variant: "error" }
    );
    return;
  }
}

async function removeSelectedHighlight() {
  if (!user?.id || !openMenuVerse) return;

  const { book, chapter, verse } = openMenuVerse;
  const cacheKey = `${book}.${chapter}`;

  const verseEl = document.getElementById(openMenuVerse.ref);
  const cached = highlightCache.get(cacheKey) || new Map();
  const previousColor = cached.get(verse) || null;
  cached.delete(verse);
  highlightCache.set(cacheKey, cached);
  setVerseHighlightClass(verseEl, null);
  syncVerseMenuState();
  showVerseMenuStatus("Removendo destaque...", { variant: "pending", persist: true });

  try {
    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("user_id", user.id)
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse", verse);

    if (error) throw error;

    showVerseMenuStatus("Destaque removido", { variant: "success" });
    return;
  } catch (error) {
    console.error("Erro ao remover highlight:", error);
    if (previousColor) {
      cached.set(verse, previousColor);
      highlightCache.set(cacheKey, cached);
      setVerseHighlightClass(verseEl, previousColor);
      syncVerseMenuState();
    }
    const hint = hintForSupabaseError(error);
    showVerseMenuStatus(
      `Erro ao remover destaque: ${formatSupabaseError(error)}${hint ? ` — ${hint}` : ""}`,
      { variant: "error" }
    );
    return;
  }
}

function openNoteForSelectedVerse() {
  if (!openMenuVerse) return;
  const params = new URLSearchParams({ ref: openMenuVerse.ref });
  window.location.href = `note.html?${params.toString()}`;
}

function parseRouteFromLocation() {
  const params = new URLSearchParams(window.location.search);

  const qpBook = params.get("book");
  const qpChapter = params.get("chapter");
  const qpVerse = params.get("verse");
  const qpRef = params.get("ref");

  const rawHash = decodeURIComponent((window.location.hash || "").replace(/^#/, "").trim());
  const hashLast = rawHash.includes("/") ? rawHash.split("/").pop() : rawHash;
  const refNormalized = (qpRef || hashLast || "").trim();

  const result = {
    bookCode: qpBook ? qpBook.toUpperCase() : null,
    chapter: qpChapter ? Number.parseInt(qpChapter, 10) : null,
    verse: qpVerse ? Number.parseInt(qpVerse, 10) : null,
  };

  if (!refNormalized) return result;

  // Exemplo do bible.com: JHN.1.NVI (vamos ignorar tradução e usar Almeida)
  const tokens = refNormalized.split(".").filter(Boolean);
  if (tokens.length < 2) return result;

  const bookToken = tokens[0].toUpperCase();
  const chapterToken = tokens[1];
  const maybeThird = tokens[2];

  const byCode = books.find((b) => b.code === bookToken);
  if (byCode) result.bookCode = byCode.code;

  const parsedChapter = Number.parseInt(chapterToken, 10);
  if (!Number.isNaN(parsedChapter)) result.chapter = parsedChapter;

  const parsedThird = Number.parseInt(maybeThird, 10);
  if (!Number.isNaN(parsedThird)) result.verse = parsedThird;

  return result;
}

function openPicker(picker) {
  closeVerseMenu();
  closePicker(bookPickerEl);
  closePicker(chapterPickerEl);
  closePicker(versePickerEl);

  picker.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePicker(picker) {
  if (!picker || picker.hidden) return;

  picker.hidden = true;

  const anyOpen =
    !bookPickerEl.hidden || !chapterPickerEl.hidden || !versePickerEl.hidden || !verseMenuEl.hidden;
  if (!anyOpen) document.body.style.overflow = "";
}

function openVerseMenu() {
  if (!verseMenuEl) return;
  closePicker(bookPickerEl);
  closePicker(chapterPickerEl);
  closePicker(versePickerEl);

  verseMenuEl.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeVerseMenu() {
  if (!verseMenuEl || verseMenuEl.hidden) return;

  verseMenuEl.hidden = true;

  const anyOpen =
    !bookPickerEl.hidden || !chapterPickerEl.hidden || !versePickerEl.hidden || !verseMenuEl.hidden;
  if (!anyOpen) document.body.style.overflow = "";
}
