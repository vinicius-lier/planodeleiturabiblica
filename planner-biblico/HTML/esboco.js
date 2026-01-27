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

// Header nav: make "Diario" land on a valid day.
const diaryNavLink = document.querySelector('.nav-actions a[href="note.html"]');
if (diaryNavLink) diaryNavLink.href = `note.html?day=${getDefaultDateKey()}`;

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

const metaInputs = document.querySelectorAll(".esboco-meta input");
const titleEl = metaInputs[0] || null;
const baseTextEl = metaInputs[1] || null;
const dateEl = metaInputs[2] || null;
const audienceEl = metaInputs[3] || null;
const visibilityEl = document.getElementById("visibility");

const textareas = document.querySelectorAll(".esboco-card textarea");
const introEl = textareas[0] || null;
const developmentEl = textareas[1] || null;
const applicationsEl = textareas[2] || null;
const conclusionEl = textareas[3] || null;

const saveBtn = document.querySelector(".note-actions .action-btn");
const listBtn = document.querySelector(".note-actions .action-btn.secondary");

let currentId = null;
let currentStatus = "draft";
let saveTimeout = null;

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

function buildPayload(statusOverride) {
  const payload = {
    user_id: user.id,
    status: statusOverride || currentStatus || "draft",
    visibility: (visibilityEl && visibilityEl.value) || "private",
    updated_at: new Date().toISOString()
  };

  if (titleEl) payload.title = titleEl.value.trim() || "Sem título";
  if (baseTextEl) payload.base_text = baseTextEl.value.trim();
  if (dateEl && dateEl.value) payload.scheduled_for = dateEl.value;
  if (audienceEl) payload.audience = audienceEl.value.trim();

  if (introEl) payload.intro = introEl.value;
  if (developmentEl) payload.development = developmentEl.value;
  if (applicationsEl) payload.applications = applicationsEl.value;
  if (conclusionEl) payload.conclusion = conclusionEl.value;

  return payload;
}

async function saveOutline(statusOverride, { silent = false } = {}) {
  if (!silent) setSaveBtnState("saving");
  const payload = buildPayload(statusOverride);

  try {
    if (currentId) {
      const { error } = await supabase
        .from("esbocos")
        .update(payload)
        .eq("id", currentId)
        .eq("user_id", user.id);

      if (error) throw error;

      currentStatus = payload.status;
      if (!silent) setSaveBtnState("saved");
      return;
    }

    const { data, error } = await supabase
      .from("esbocos")
      .insert(payload)
      .select("id,status")
      .single();

    if (error) throw error;

    currentId = data?.id || null;
    currentStatus = data?.status || payload.status;
    if (!silent) setSaveBtnState("saved");
  } catch (error) {
    console.error(error);
    if (!silent) {
      setSaveBtnState("error");
      alert(error?.message || "Erro ao salvar esboço.");
    }
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveOutline(undefined, { silent: true }), 800);
}

async function loadOutline(id) {
  const { data, error } = await supabase
    .from("esbocos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return;

  currentId = row.id;
  currentStatus = row.status || "draft";

  if (titleEl) titleEl.value = row.title || "";
  if (baseTextEl) baseTextEl.value = row.base_text || "";
  if (dateEl) dateEl.value = row.scheduled_for || "";
  if (audienceEl) audienceEl.value = row.audience || "";
  if (visibilityEl) visibilityEl.value = row.visibility || "private";

  if (introEl) introEl.value = row.intro || "";
  if (developmentEl) developmentEl.value = row.development || "";
  if (applicationsEl) applicationsEl.value = row.applications || "";
  if (conclusionEl) conclusionEl.value = row.conclusion || "";
}

async function listOutlines() {
  const { data, error } = await supabase
    .from("esbocos")
    .select("id,title,status,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function handleListClick() {
  window.location.href = "esbocos.html";
}

const inputs = [
  titleEl,
  baseTextEl,
  dateEl,
  audienceEl,
  visibilityEl,
  introEl,
  developmentEl,
  applicationsEl,
  conclusionEl
].filter(Boolean);

inputs.forEach((field) => {
  field.addEventListener("input", scheduleSave);
  field.addEventListener("change", scheduleSave);
});

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    await saveOutline("ready");
  });
}

if (listBtn) {
  listBtn.addEventListener("click", handleListClick);
}

// If we came from the list table, open the requested outline.
const params = new URLSearchParams(window.location.search);
const outlineId = params.get("id");
if (outlineId) {
  loadOutline(outlineId).catch(console.error);
}
