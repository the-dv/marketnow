# STEP-12 - UI Toasts, Layout Alignment and Category Fallback

## Objetivo

Melhorar UX da tela `/lists/:id` com notificacoes em toast, ajustar alinhamento visual da grade de produtos e corrigir o fluxo de "Sem categoria" para fallback em `Outros` sem escrita em `categories` durante runtime.

## Escopo

- Substituir feedback inline persistente por toast flutuante (sucesso/erro, auto-dismiss, empilhado).
- Reordenar layout da tela para exibir "Total estimado" abaixo de "Meus produtos".
- Alinhar header/body da grade com o mesmo template de colunas e coluna de checkbox enxuta.
- Garantir fallback de "Sem categoria" para `categories.slug = 'outros'` com `SELECT` apenas (sem `upsert`).

## Fora de escopo

- Alteracoes de regra de preco.
- Refatoracao ampla de design system.
- Mudancas de schema adicionais alem das ja previstas nas migracoes existentes.

## Requisitos (Checklist)

- [x] Toast provider global implementado sem biblioteca pesada.
- [x] Toast aparece no canto superior direito e some automaticamente (3s).
- [x] Toast empilha multiplas mensagens.
- [x] Variacao visual de toast para sucesso e erro.
- [x] Feedback inline removido do fluxo de cadastro/edicao/exclusao/compra em `/lists/:id`.
- [x] Card "Total estimado" movido para abaixo de "Meus produtos".
- [x] Header da grade sem texto na coluna de checkbox.
- [x] Header e body com mesmo grid de colunas (`[checkbox] [nome] [categoria] [qtd] [unid] [acoes]`).
- [x] Coluna checkbox compacta, sem padding lateral excessivo e centralizada.
- [x] Inputs/selects padronizados com altura visual consistente (`h-10` equivalente).
- [x] Runtime sem `upsert/insert` em `categories` via usuario autenticado.
- [x] "Sem categoria" mapeia para categoria `outros` por `SELECT` de slug.
- [x] Se `outros` nao existir, erro amigavel orienta aplicar seed/migration.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-12`.

## Criterios de aceite

- Salvar produto com "Sem categoria" funciona sem erro de RLS em `categories`.
- Em ambiente sem categoria `outros`, usuario recebe erro claro orientando seed/migration.
- Atualizar produto (nome/categoria/qtd/unid), excluir e marcar/desmarcar compra exibem toast e nao deixam mensagem fixa ocupando layout.
- "Total estimado" aparece abaixo da secao "Meus produtos".
- Header "Nome" permanece alinhado com input da coluna de nome e checkbox fica compacto/centralizado.

## Alteracoes esperadas (arquivos)

- `src/components/toast-provider.tsx` (novo)
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/lists/[listId]/create-product-form.tsx`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/actions.ts`
- `docs/steps/STEP-12-ui-toasts-layout-alignment.md`

## Seguranca / RLS

- Mantida a politica de leitura autenticada em `categories`.
- Removida dependencia de escrita runtime em `categories` para evitar erro `42501` por RLS.
- Fallback de categoria depende de seed/migracao previa (`outros` existente).

## Plano de testes

- Manual:
  - Salvar produto com "Sem categoria" e confirmar sucesso.
  - Simular ausencia de `outros` (ambiente sem seed) e validar erro amigavel.
  - Atualizar produto e confirmar toast de sucesso.
  - Excluir produto e confirmar toast de sucesso.
  - Marcar/desmarcar compra e validar toasts.
  - Conferir ordem de layout e alinhamento da grade (desktop/mobile).
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Changelog curto

- Criado provider/hook de toast global com auto-dismiss e empilhamento.
- Removido feedback inline fixo das acoes de produto em `/lists/:id`.
- Reordenado layout para exibir "Total estimado" abaixo de "Meus produtos".
- Ajustado CSS da grade para colunas sincronizadas entre header e linhas e checkbox compacto.
- Refatorado fallback de categoria para resolver `outros` via `SELECT` somente, sem `upsert` runtime.
