import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";

const user = await requireAuth();
if (!user) {
  throw new Error("No session");
}

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

const tbody = document.querySelector("#esbocos-body");
if (!tbody) {
  throw new Error("Missing #esbocos-body");
}

const formatStatus = (status) => {
  if (status === "ready") return "pronto";
  return "rascunho";
};

const formatVisibility = (visibility) => {
  if (visibility === "public") return "🌍 Público";
  return "🔒 Privado";
};

const formatAuthor = (row) => {
  if (row.user_id === user.id) return "Você";
  if (!row.user_id) return "-";
  return `${row.user_id.slice(0, 8)}...`;
};

const { data, error } = await supabase
  .from("esbocos")
  .select("id, title, status, visibility, user_id, updated_at")
  // Public for everyone + private only for the owner.
  .or(`visibility.eq.public,user_id.eq.${user.id}`)
  .order("updated_at", { ascending: false });

if (error) throw error;

(data || []).forEach((e) => {
  const tr = document.createElement("tr");

  const canEdit = e.user_id === user.id;

  tr.innerHTML = `
    <td>${e.title || "(sem título)"}</td>
    <td>${formatAuthor(e)}</td>
    <td>${formatStatus(e.status)}</td>
    <td>${formatVisibility(e.visibility)}</td>
    <td>
      <div class="table-actions">
        ${
          canEdit
            ? `<button type="button" data-action="edit" data-id="${e.id}">Editar</button>`
            : `<button type="button" disabled>Editar</button>`
        }
        <button type="button" data-action="view" data-id="${e.id}">Ver</button>
        <button type="button" data-action="print" data-id="${e.id}">Imprimir</button>
        ${
          canEdit
            ? `<button type="button" data-action="delete" data-id="${e.id}">Apagar</button>`
            : `<button type="button" disabled>Apagar</button>`
        }
      </div>
    </td>
  `;

  tbody.appendChild(tr);
});

tbody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  if (action === "edit") {
    window.location.href = `esboco.html?id=${encodeURIComponent(id)}`;
    return;
  }

  if (action === "view") {
    window.location.href = `esboco_print.html?id=${encodeURIComponent(id)}`;
    return;
  }

  if (action === "print") {
    window.location.href = `esboco_print.html?id=${encodeURIComponent(id)}&print=1`;
    return;
  }

  if (action === "delete") {
    const ok = window.confirm(
      "Tem certeza que deseja apagar este esboço?\\n\\nIsso remove também os comentários relacionados."
    );
    if (!ok) return;

    btn.disabled = true;
    try {
      const { error: delError } = await supabase
        .from("esbocos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (delError) throw delError;

      const row = btn.closest("tr");
      if (row) row.remove();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Erro ao apagar esboço.");
      btn.disabled = false;
    }
  }
});
