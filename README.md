# Planner Bíblico 2026 (DNMS)

Webapp em HTML/CSS/JavaScript (vanilla) com autenticação e persistência via Supabase.

## Módulos

- Login/Cadastro (`planner-biblico/HTML/index.html`)
- Planner anual (marcar leituras concluídas) (`planner-biblico/HTML/planner.html`)
- Bíblia (leitor via API + highlights/anotações) (`planner-biblico/HTML/biblia.html`)
- Anotações (lista + filtros) (`planner-biblico/HTML/reflexoes.html`)
- Editor de anotação (livre/do dia/por versículo) (`planner-biblico/HTML/note.html`)
- Esboços (lista de esboços públicos + seus esboços) (`planner-biblico/HTML/esbocos.html`)
- Editor de esboço (`planner-biblico/HTML/esboco.html`)
- Documento de impressão/PDF do esboço (`planner-biblico/HTML/esboco_print.html`)
- Documentos (visão para imprimir/salvar PDF das suas anotações + esboços) (`planner-biblico/HTML/documentos.html`)

## Fluxos principais

- **Planner**
  - Clique no *card do dia* (fora da checkbox) abre direto a **Bíblia** no **livro + 1º capítulo do dia**.
  - Clique na **checkbox** só marca/desmarca o progresso (não navega).
- **Bíblia**
  - Consome texto via `bible-api.com` com `translation=almeida` (domínio público).
  - Não salva o texto bíblico no banco (apenas metadados de marcação/anotação).
  - Cada versículo exibido é clicável e expõe um ID `BOOK.CHAPTER.VERSE` (ex: `JHN.3.16`).
  - Menu contextual oferece:
    - marcação por cor (amarelo, verde, azul ou vermelho) com feedback textual (status pendente/sucesso/erro);
    - botão “Criar anotação” que leva a `note.html?ref=BOOK.CHAPTER.VERSE`, preenchendo o formulário;
    - ação “Remover marcação” que limpa o destaque.
  - Deep links suportados:
    - Query: `biblia.html?book=JHN&chapter=3&verse=16`
    - Hash: `biblia.html#JHN.3.16` (também aceita formato `JHN.3.NVI` e ignora a tradução)
- **Anotações**
  - Anotação do dia: `note.html?day=2026-02-01`
  - Anotação vinculada a versículo: `note.html?ref=JHN.3.16` (citação no topo + link de volta para a Bíblia)
  - Anotação livre: `note.html` (ao salvar, fixa `?id=...` na URL)

## Estrutura

```
planner-biblico/
  Assets/
  css/
    app.css
    biblia.css
    print.css
  HTML/
    index.html
    planner.html
    biblia.html
    note.html
    reflexoes.html
    esbocos.html
    esboco.html
    esboco_print.html
    documentos.html
  js/
    supabase.js
    auth.js
    date.js
    login.js
    biblia.js
    print.js
  supabase/
    rls_and_comments.sql
```

## Dados e persistência

- `notes` é a tabela única de anotações (livres, do dia ou bíblicas). O mesmo modelo atende:
  - Anotação livre: `book`, `chapter` e `verse_*` vazios.
  - Anotação do dia: `date_key` = `YYYY-MM-DD`.
  - Anotação de versículo: preenche `book`, `chapter`, `verse_start` e `verse_end`.
  - As páginas do app reutilizam esse modelo e apenas mudam o filtro (`note.html`, `reflexoes.html`, `planner.html`).
- `highlights` guarda marcações coloridas por usuário (`user_id`, `book`, `chapter`, `verse`, `color`). O frontend
  aplica a cor nos elementos de leitura e exibe o status de ação.
- `reading_progress` continua sendo a fonte do planner anual, com RLS garantindo isolamento por `user_id`.

O SQL de `planner-biblico/supabase/rls_and_comments.sql` cria ou atualiza as políticas necessárias (notes, highlights, reading_progress, esbocos e esboco_comments). Use-o como referência ao provisionar o banco.

## Rodar localmente

1. Sirva os arquivos por HTTP (não use `file://` porque os módulos ES não carregam corretamente).

Opção A (Python):

```bash
python -m http.server 5500
```

Opção B (Node):

```bash
npx http-server -p 5500
```

2. Abra no navegador:

- `http://localhost:5500/planner-biblico/HTML/index.html`

## Supabase (obrigatório)

O frontend usa Supabase como fonte única de dados (RLS faz a segurança).

- Cliente: `planner-biblico/js/supabase.js`
- Policies SQL: `planner-biblico/supabase/rls_and_comments.sql`

Tabelas usadas pelo app:

- `reading_progress` (progresso do planner) - privado por usuário
- `notes` (anotações livres / do dia / por versículo) - sempre privado
- `highlights` (marcações de versículos) - privado por usuário
- `esbocos` (esboços) - `visibility` pode ser `private` ou `public`
- `esboco_comments` (comentários) - apenas em esboços públicos

Depois de criar as tabelas, aplique o arquivo `rls_and_comments.sql` no SQL Editor do Supabase.

### Troubleshooting: highlights (marcação por cores)

Se aparecer “Erro ao salvar destaque” na Bíblia:

- Confirme que a tabela `highlights` existe (o app usa `upsert` em `user_id,book,chapter,verse`).
- Aplique `planner-biblico/supabase/rls_and_comments.sql` (cria a tabela e policies de select/insert/update/delete com RLS).
- Verifique se você está logado (sem sessão, o app não tenta salvar highlights).

## Observações

- Este projeto é frontend puro (sem frameworks).
- A página do planner usa Tailwind via CDN apenas para o layout dela (sem build).
