import { supabase } from "../js/supabase.js";
import { requireAuth } from "../js/auth.js";

let user = null;
let id = null;
let autoPrint = false;
let row = null;

function formatUserId(value) {
  if (!value) return "-";
  if (value === user.id) return "Você";
  return `${value.slice(0, 8)}...`;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function formatReference(c) {
  const book = (c.ref_book || "").trim();
  const chapter = c.ref_chapter;
  const verses = (c.ref_verses || "").trim();

  if (!book) return "";
  if (chapter && verses) return `${book} ${chapter}:${verses}`;
  if (chapter) return `${book} ${chapter}`;
  return `${book}${verses ? ` ${verses}` : ""}`;
}

async function loadComments() {
  const { data: rows, error } = await supabase
    .from("esboco_comments")
    .select("id,user_id,content,ref_book,ref_chapter,ref_verses,created_at")
    .eq("esboco_id", id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return rows || [];
}

function mountCommentsUI() {
  const container = document.createElement("section");
  container.className = "comments";

  const title = document.createElement("h2");
  title.textContent = "Comentários";
  container.appendChild(title);

  const form = document.createElement("div");
  form.className = "comment-form";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Escreva um comentário...";
  form.appendChild(textarea);

  const refRow = document.createElement("div");
  refRow.className = "comment-ref";

  const refBook = document.createElement("input");
  refBook.placeholder = "Livro (ex: João)";
  refRow.appendChild(refBook);

  const refChapter = document.createElement("input");
  refChapter.placeholder = "Capítulo";
  refChapter.inputMode = "numeric";
  refRow.appendChild(refChapter);

  const refVerses = document.createElement("input");
  refVerses.placeholder = "Versículo(s) (ex: 16–18)";
  refRow.appendChild(refVerses);

  form.appendChild(refRow);

  const actions = document.createElement("div");
  actions.className = "comment-actions";

  const status = document.createElement("span");
  status.style.color = "#6b7280";
  status.style.fontSize = "0.9rem";
  status.textContent = "";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "comment-btn";
  btn.textContent = "Enviar";

  actions.appendChild(status);
  actions.appendChild(btn);
  form.appendChild(actions);

  const list = document.createElement("div");
  list.className = "comment-list";

  container.appendChild(form);
  container.appendChild(list);

  const doc = document.querySelector(".document");
  if (doc && doc.parentElement) {
    doc.parentElement.insertBefore(container, doc.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  let comments = [];

  const render = () => {
    list.innerHTML = "";

    if (!comments.length) {
      const empty = document.createElement("div");
      empty.className = "comment-card";
      empty.textContent = "Nenhum comentário ainda.";
      list.appendChild(empty);
      return;
    }

    comments.forEach((c) => {
      const card = document.createElement("div");
      card.className = "comment-card";

      const meta = document.createElement("div");
      meta.className = "comment-meta";

      const left = document.createElement("span");
      left.textContent = formatUserId(c.user_id);

      const right = document.createElement("span");
      right.textContent = formatDateTime(c.created_at);

      meta.appendChild(left);
      meta.appendChild(right);
      card.appendChild(meta);

      const ref = formatReference(c);
      if (ref) {
        const refLine = document.createElement("div");
        refLine.className = "comment-refline";
        refLine.textContent = ref;
        card.appendChild(refLine);
      }

      const body = document.createElement("p");
      body.className = "comment-body";
      body.textContent = c.content || "";
      card.appendChild(body);

      if (c.user_id === user.id) {
        const delWrap = document.createElement("div");
        delWrap.className = "comment-actions";

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "comment-btn danger";
        delBtn.textContent = "Apagar";

        delBtn.addEventListener("click", async () => {
          const ok = window.confirm("Apagar este comentário?");
          if (!ok) return;
          delBtn.disabled = true;

          try {
            const { error: delError } = await supabase
              .from("esboco_comments")
              .delete()
              .eq("id", c.id)
              .eq("user_id", user.id);

            if (delError) throw delError;

            comments = comments.filter((x) => x.id !== c.id);
            render();
          } catch (err) {
            console.error(err);
            alert(err?.message || "Erro ao apagar comentário.");
            delBtn.disabled = false;
          }
        });

        delWrap.appendChild(delBtn);
        card.appendChild(delWrap);
      }

      list.appendChild(card);
    });
  };

  const refresh = async () => {
    try {
      comments = await loadComments();
    } catch (err) {
      console.error(err);
      status.textContent = "Erro ao carregar comentários.";
      comments = [];
    }
    render();
  };

  const parseChapter = () => {
    const raw = (refChapter.value || "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  };

  btn.addEventListener("click", async () => {
    const content = (textarea.value || "").trim();
    const book = (refBook.value || "").trim();
    const chapter = parseChapter();
    const verses = (refVerses.value || "").trim();

    if (!content) {
      status.textContent = "Digite um comentário.";
      return;
    }

    if ((chapter || verses) && !book) {
      status.textContent = "Informe o livro para usar referência bíblica.";
      return;
    }

    status.textContent = "Enviando...";
    btn.disabled = true;

    try {
      const payload = {
        esboco_id: id,
        user_id: user.id,
        content,
        ref_book: book || null,
        ref_chapter: chapter,
        ref_verses: verses || null
      };

      const { data: inserted, error: insError } = await supabase
        .from("esboco_comments")
        .insert(payload)
        .select("id,user_id,content,ref_book,ref_chapter,ref_verses,created_at")
        .single();

      if (insError) throw insError;

      textarea.value = "";
      refBook.value = "";
      refChapter.value = "";
      refVerses.value = "";

      status.textContent = "Enviado ✓";
      setTimeout(() => {
        status.textContent = "";
      }, 1200);

      if (inserted) {
        comments = [...comments, inserted];
        render();
      } else {
        await refresh();
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Erro ao enviar.";
      alert(err?.message || "Erro ao enviar comentário.");
    } finally {
      btn.disabled = false;
    }
  });

  refresh().catch(console.error);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  id = params.get("id");
  autoPrint = params.get("print") === "1";

  if (!id) throw new Error("Missing id param");

  try {
    user = await requireAuth();
  } catch (error) {
    console.error("Auth required:", error);
    return;
  }

  if (!user) return;

  const { data, error } = await supabase
    .from("esbocos")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;

  row = Array.isArray(data) ? data[0] : null;
  if (!row) throw new Error("Esboço não encontrado");

  document.getElementById("title").textContent = row.title || "";
  document.getElementById("base_text").textContent = row.base_text || "";
  document.getElementById("date").textContent = row.scheduled_for || "";
  document.getElementById("audience").textContent = row.audience || "";
  document.getElementById("intro").textContent = row.intro || "";
  document.getElementById("development").textContent = row.development || "";
  document.getElementById("applications").textContent = row.applications || "";
  document.getElementById("conclusion").textContent = row.conclusion || "";
  document.getElementById("user").textContent =
    row.user_id === user.id ? user.email : row.user_id;

  // Only public outlines can be commented.
  if (row.visibility === "public") {
    mountCommentsUI();
  }

  if (autoPrint) {
    // Give the browser a moment to paint the page and load the logo before printing.
    setTimeout(() => window.print(), 350);
  }
}

init().catch((error) => {
  console.error(error);
  alert(error?.message || "Erro ao carregar esboço.");
});
