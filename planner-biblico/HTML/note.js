import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";

const user = await requireAuth();
if (!user) {
  throw new Error("No session");
}

const params = new URLSearchParams(window.location.search);
const YEAR = 2026;
const pad = (value) => String(value).padStart(2, "0");
const getDefaultDateKey = () => {
  const now = new Date();
  if (now.getFullYear() === YEAR) {
    return `${YEAR}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return `${YEAR}-01-01`;
};

const rawDateKey = params.get("day");
const isValidDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");
const dateKey = isValidDateKey(rawDateKey) ? rawDateKey : getDefaultDateKey();

// Header nav: keep "Diario" pointing to a valid day.
const diaryNavLink = document.querySelector('.nav-actions a[href="note.html"]');
if (diaryNavLink) diaryNavLink.href = `note.html?day=${dateKey}`;

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

const fields = {
  observations:
    document.getElementById("observations") ||
    document.getElementById("note-observations"),
  structure:
    document.getElementById("structure") ||
    document.getElementById("note-learnings"),
  christocentric:
    document.getElementById("christocentric") ||
    document.getElementById("note-application"),
  summary: document.getElementById("summary")
};

const statusEl = document.getElementById("saveStatus");
const saveBtn = document.querySelector(".note-actions button.action-btn");
const deleteBtn = document.getElementById("delete-note");
const activeFields = Object.values(fields).filter(Boolean);
let saveTimeout = null;
let currentId = null;

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

async function loadNote() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("date_key", dateKey)
    .limit(1);

  if (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = "erro ao carregar";
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return;

  currentId = row.id || null;

  if (fields.observations) fields.observations.value = row.observations || "";
  if (fields.structure) fields.structure.value = row.structure || "";
  if (fields.christocentric) {
    fields.christocentric.value = row.christocentric || "";
  }
  if (fields.summary) fields.summary.value = row.summary || "";
}

async function saveNote({ silent = false } = {}) {
  if (!silent) setSaveBtnState("saving");
  if (statusEl) statusEl.textContent = "salvando...";

  const basePayload = {
    updated_at: new Date().toISOString()
  };

  if (fields.observations) basePayload.observations = fields.observations.value;
  if (fields.structure) basePayload.structure = fields.structure.value;
  if (fields.christocentric) {
    basePayload.christocentric = fields.christocentric.value;
  }
  if (fields.summary) basePayload.summary = fields.summary.value;

  try {
    if (currentId) {
      const { error } = await supabase
        .from("notes")
        .update(basePayload)
        .eq("id", currentId)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      const insertPayload = {
        user_id: user.id,
        date_key: dateKey,
        ...basePayload
      };

      const { data, error } = await supabase
        .from("notes")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) throw error;
      currentId = data?.id || null;
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = "erro ao salvar";
    if (!silent) {
      setSaveBtnState("error");
      alert(error?.message || "Erro ao salvar diario.");
    }
    return;
  }

  if (statusEl) statusEl.textContent = "salvo";
  if (!silent) setSaveBtnState("saved");
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveNote({ silent: true }), 800);
}

activeFields.forEach((field) => {
  field.addEventListener("input", scheduleSave);
});

if (saveBtn) {
  saveBtn.addEventListener("click", () => saveNote());
}

async function deleteNote() {
  const ok = window.confirm(
    "Tem certeza que deseja apagar esta anotação?\\n\\nEssa ação não pode ser desfeita."
  );
  if (!ok) return;

  if (deleteBtn) deleteBtn.disabled = true;
  if (statusEl) statusEl.textContent = "apagando...";

  try {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("user_id", user.id)
      .eq("date_key", dateKey);

    if (error) throw error;

    currentId = null;
    activeFields.forEach((field) => {
      field.value = "";
    });

    if (statusEl) statusEl.textContent = "apagado";
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = "erro ao apagar";
    alert(error?.message || "Erro ao apagar anotação.");
  } finally {
    if (deleteBtn) deleteBtn.disabled = false;
  }
}

if (deleteBtn) {
  deleteBtn.addEventListener("click", deleteNote);
}

loadNote();
