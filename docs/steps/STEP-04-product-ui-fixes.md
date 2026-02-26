# STEP-04 - Product UI Fixes

## Objetivo

Corrigir a tela `/lists/:id` para manter apenas o fluxo de cadastro de produto no topo, remover totalmente o bloco legacy "Adicionar item" e simplificar o cabecalho.

## Escopo

- Remover 100% a UI do bloco legacy "Adicionar item" (dropdown + quantidade + unidade + botao).
- Remover imports/handlers/logica associados somente a esse bloco.
- Corrigir fluxo "Cadastrar produto" com:
  - nome obrigatorio
  - categoria opcional
  - unidade com default `un`
  - feedback de sucesso/erro
  - limpeza do formulario apos sucesso
- Ajustar cabecalho da lista:
  - remover linha tecnica de fallback
  - manter status com badge azul
- Ajustar schema/migracao para permitir `products.category_id` nulo.

## Fora de escopo

- Reintroduzir bloco de adicionar item nesta etapa.
- CRUD completo de produtos custom (editar/excluir).
- Mudancas de regra de precificacao.

## Requisitos (Checklist)

- [x] Remover bloco legacy "Adicionar item" da UI de `/lists/:id`.
- [x] Remover logica associada ao bloco legacy (handler/import/query especificos).
- [x] Manter "Itens da lista" visivel e funcional.
- [x] Corrigir cadastro de produto com categoria opcional.
- [x] Persistir produto custom privado no Supabase.
- [x] Exibir feedback de sucesso/erro no cadastro de produto.
- [x] Limpar formulario apos sucesso.
- [x] Remover linha tecnica de fallback seed no cabecalho.
- [x] Exibir status com badge azul.
- [x] Permitir `products.category_id` nulo em schema/migracao.
- [x] Atualizar docs relevantes (`data-model`, `ui-guidelines`, `manual-steps`).
- [x] Executar `npm run lint` e `npm run build`.

## Criterios de aceite

- Em `/lists/:id` aparecem apenas:
  - Header (titulo + status)
  - Total estimado
  - Cadastrar produto
  - Itens da lista
- Nao existe mais bloco "Adicionar item".
- Cadastro de produto funciona com:
  - nome apenas
  - nome + categoria
- Sem erro de runtime/console relacionado ao bloco removido.
- `npm run lint` e `npm run build` OK.

## Arquitetura / Design

- `CreateProductForm` client com `useActionState` para feedback e reset.
- Server action de cadastro retorna estado de sucesso/erro.
- Removida query dedicada a produtos para dropdown legacy.

## Alteracoes esperadas (arquivos)

- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/create-product-form.tsx`
- `src/app/globals.css`
- `supabase/schema.sql`
- `supabase/migrations/20260226_user_pricing_model.sql`
- `docs/data-model.md`
- `docs/ui-guidelines.md`
- `docs/manual-steps.md`
- `docs/steps/STEP-04-product-ui-fixes.md`

## Modelo de dados / SQL (se houver)

- `products.category_id` alterado para nullable.
- Categories seed mantidas.
- Produtos seed e produtos custom seguem no mesmo modelo com `owner_user_id`.

## Seguranca / RLS (se houver)

- Mantida privacidade de produto custom via `owner_user_id = auth.uid()`.
- Seed global (`owner_user_id is null`) segue read-only.
- Sem permissao de escrita global por client.

## UI/UX

- Fluxo principal da tela: cadastrar produto e acompanhar itens existentes.
- Mensagens de feedback claras no formulario.
- Cabecalho limpo, sem informacao tecnica de fallback.

## Plano de testes

- Manual:
  - Criar lista e abrir `/lists/:id`.
  - Cadastrar produto so com nome (sem categoria).
  - Cadastrar produto com nome + categoria.
  - Confirmar ausencia total do bloco "Adicionar item".
  - Confirmar "Itens da lista" segue visivel (vazio ou com itens).
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: regressao de schema para ambiente ja provisionado.
  - Mitigacao: migracao incremental com `drop not null`.
- Risco: usuario sem caminho para adicionar item nesta etapa.
  - Mitigacao: decisao explicita do escopo atual; follow-up em proxima etapa.

## Decisoes e trade-offs

- Decisao: remover totalmente o bloco legacy, mesmo sem novo bloco substituto nesta etapa.
  - Trade-off: tela fica consistente com a diretriz atual, mas sem criacao imediata de item.

## Pos-etapa (follow-ups)

- Reintroduzir adicao de item com novo desenho aprovado.
- CRUD de produtos custom (editar/excluir).

## Changelog da etapa

- Removido bloco legacy "Adicionar item" da tela de lista.
- Removida logica server associada ao bloco legacy.
- Cabecalho simplificado com badge de status.
- Cadastro de produto corrigido com categoria opcional e feedback de formulario.
- SQL ajustado para `category_id` opcional em produtos.
