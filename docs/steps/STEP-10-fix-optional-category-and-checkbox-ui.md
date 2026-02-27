# STEP-10 - Fix Optional Category And Checkbox UI

## Objetivo

Corrigir definitivamente a regra de negocio de categoria opcional em produtos, garantindo persistencia de `category_id = NULL`, e limpar o layout da coluna de checkbox em `/lists/:id`.

## Escopo

- Criar migracao Supabase nova para remover `NOT NULL` de `public.products.category_id`.
- Validar integridade da FK de categoria (`category_id -> categories.id`) mesmo sendo nullable.
- Ajustar backend/action para mapear "Sem categoria" para `NULL` sem fallback indevido.
- Melhorar feedback de erro (usuario amigavel + log detalhado em dev).
- Ajustar UI da coluna de checkbox: sem header textual, largura minima e sem padding excessivo.

## Fora de escopo

- Refatoracao completa de fluxo de precificacao.
- Alteracao de regras de RLS fora do dominio de produtos.
- Mudancas estruturais no dashboard.

## Requisitos (Checklist)

- [x] Nova migracao criada em `/supabase/migrations` com `ALTER COLUMN category_id DROP NOT NULL`.
- [x] FK de `products.category_id` permanece valida para valores nao nulos.
- [x] `createUserProductAction` aceita categoria opcional e persiste `NULL` para "Sem categoria".
- [x] Nenhum fallback automatico para primeira categoria.
- [x] Mensagem amigavel para usuario em erro de save.
- [x] Log detalhado de erro Supabase em dev (`message`, `code`, `details`, `hint`).
- [x] Dropdown mostra "Sem categoria" como opcao nula real.
- [x] Refresh mantem produtos nulos com "Sem categoria" selecionado.
- [x] Header da coluna checkbox sem texto "Comprado".
- [x] Checkbox alinhado verticalmente e coluna enxuta sem padding excessivo.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-10`.

## Criterios de aceite

- Inserir produto sem categoria nao retorna erro `23502`.
- Produto sem categoria persiste e reaparece com "Sem categoria" apos refresh.
- Produto com categoria selecionada continua salvando normalmente.
- Coluna de checkbox fica visualmente limpa, sem titulo textual e alinhada.
- Build e lint sem erros.

## Arquitetura / Design

- Camada SQL garante opcionalidade no schema (fonte de verdade).
- Action server continua valida ownership e converte marcador de UI para `NULL`.
- Grid mantem 6 colunas, com primeira coluna minimizada para checkbox.

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-10-fix-optional-category-and-checkbox-ui.md`
- `supabase/migrations/20260227_fix_optional_category_id.sql` (novo)
- `docs/manual-steps.md`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/create-product-form.tsx` (se necessario)
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/globals.css`

## Modelo de dados / SQL

- `public.products.category_id`: nullable.
- FK de categoria preservada para valores nao nulos.

## Seguranca / RLS

- RLS de `products` inalterada (`owner_user_id = auth.uid()` para escrita).
- Nenhuma abertura adicional de acesso.

## UI/UX

- Coluna de checkbox minimalista e alinhada.
- Sem texto tecnico no header do checkbox.
- Feedback de erro sem quebrar layout.

## Plano de testes

- Manual:
  - Criar produto com "Sem categoria".
  - Refresh e validar select em "Sem categoria".
  - Criar produto com categoria definida.
  - Validar coluna checkbox sem header textual e alinhada.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: ambiente cloud sem migracao aplicada continuar em `NOT NULL`.
  - Mitigacao: instrucoes explicitas no `manual-steps.md` e query de verificacao.
- Risco: UI enviar string vazia inesperada.
  - Mitigacao: sentinela estavel (`__none__`) convertida server-side para `NULL`.

## Decisoes e trade-offs

- Decisao: manter sentinela `__none__` no front para diferenciar explicitamente opcao nula.
  - Trade-off: pequena complexidade extra, maior previsibilidade na serializacao do form.
- Decisao: coluna checkbox sem header textual.
  - Trade-off: layout mais limpo, menor redundancia visual.

## Pos-etapa (follow-ups)

- Cobertura automatizada para create/update de categoria nula.
- Teste e2e visual da grade de produtos.

## Changelog curto

- Migracao SQL nova criada para remover `NOT NULL` em `products.category_id` preservando FK.
- Fluxo de formulario reforcado com sentinela `__none__` mapeada para `NULL` no backend.
- Grade de produtos sem header textual na coluna de checkbox.
- Coluna de checkbox e acoes ajustadas para alinhamento vertical e menor espaco lateral.
- `manual-steps.md` atualizado com instrucoes de aplicacao no Supabase Cloud.
