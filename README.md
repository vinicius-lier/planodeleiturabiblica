# Planner Biblico 2026 (DNMS)

Webapp em HTML/CSS/JavaScript (vanilla) com autenticacao e persistencia via Supabase.

## Modulos

- Login/Cadastro (`planner-biblico/HTML/index.html`)
- Planner anual (marcar leituras concluidas) (`planner-biblico/HTML/planner.html`)
- Diario (editor da anotacao do dia) (`planner-biblico/HTML/note.html`)
- Reflexoes (lista privada das anotacoes) (`planner-biblico/HTML/reflexoes.html`)
- Contribuicoes (lista de esbocos publicos + seus esbocos) (`planner-biblico/HTML/esbocos.html`)
- Editor de esboco (`planner-biblico/HTML/esboco.html`)
- Documento de impressao/PDF do esboco (`planner-biblico/HTML/esboco_print.html`)
- Documentos (visao para imprimir/salvar PDF das suas anotacoes + esbocos) (`planner-biblico/HTML/documentos.html`)

## Estrutura

```
planner-biblico/
  Assets/
  css/
    app.css
    print.css
  HTML/
    index.html
    planner.html
    note.html
    reflexoes.html
    esbocos.html
    esboco.html
    esboco_print.html
    documentos.html
  js/
    supabase.js
    auth.js
    login.js
    print.js
  supabase/
    rls_and_comments.sql
```

## Rodar localmente

1. Sirva os arquivos por HTTP (nao use `file://` porque os modulos ES nao carregam corretamente).

Opcao A (Python):

```bash
python -m http.server 5500
```

Opcao B (Node):

```bash
npx http-server -p 5500
```

2. Abra no navegador:

- `http://localhost:5500/planner-biblico/HTML/index.html`

## Supabase (obrigatorio)

O frontend usa Supabase como fonte unica de dados (RLS faz a seguranca).

- Cliente: `planner-biblico/js/supabase.js`
- Policies SQL: `planner-biblico/supabase/rls_and_comments.sql`

Tabelas usadas pelo app:

- `reading_progress` (progresso do planner) - privado por usuario
- `notes` (anotacoes/reflexoes) - sempre privado
- `esbocos` (esbocos) - `visibility` pode ser `private` ou `public`
- `esboco_comments` (comentarios) - apenas em esbocos publicos

Depois de criar as tabelas, aplique o arquivo `rls_and_comments.sql` no SQL Editor do Supabase.

## Observacoes

- Este projeto e frontend puro (sem frameworks).
- A pagina do planner usa Tailwind via CDN apenas para o layout dela (sem build).

