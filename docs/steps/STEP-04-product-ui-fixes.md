# STEP-04 - Product UI Fixes

## Objetivo

Corrigir o fluxo da tela `/lists/:id` para priorizar cadastro de produto do usuario, remover o bloco antigo quebrado de adicao por seed e simplificar o cabecalho.

## Escopo

- Remover UI antiga de "Adicionar item" baseada em dropdown de seed.
- Corrigir fluxo "Cadastrar produto" com:
  - nome obrigatorio
  - categoria opcional
  - unidade com default `un`
  - feedback de sucesso/erro
  - limpeza de formulario apos sucesso
- Criar novo bloco "Adicionar item" baseado em produtos do usuario.
- Ajustar cabecalho da lista (remover info tecnica de fallback e usar badge de status).
- Ajustar schema/migracao para permitir `category_id` nulo em produtos custom.
- Atualizar documentacao impactada.

## Fora de escopo

- CRUD completo de produtos custom (editar/excluir).
- Busca/autocomplete de produtos.
- Mudancas de regra de precificacao.

## Requisitos (Checklist)

- [x] Remover bloco antigo quebrado de "Adicionar item" com seed.
- [x] Implementar cadastro de produto com categoria opcional.
- [x] Garantir persistencia de produto custom privado no Supabase.
- [x] Exibir feedback de sucesso/erro no cadastro de produto.
- [x] Limpar formulario apos salvar produto com sucesso.
- [x] Implementar novo bloco "Adicionar item" com produtos do usuario.
- [x] Mostrar estado vazio: "Cadastre um produto acima para comecar" quando nao houver produtos.
- [x] Simplificar cabecalho e remover linha de fallback seed.
- [x] Mostrar status com badge/pilula azul.
- [x] Permitir `products.category_id` nulo em schema/migracao.
- [x] Atualizar docs de modelo/UI conforme necessario.
- [x] Executar `npm run lint` e `npm run build`.

## Critérios de aceite

- Usuario salva produto com apenas nome (sem categoria).
- Usuario salva produto com nome + categoria.
- Produto novo aparece imediatamente para adicionar item.
- Bloco antigo quebrado nao existe mais.
- Clique de adicionar item funciona no novo bloco.
- Cabecalho nao mostra fallback tecnico e exibe badge de status.
- Build e lint passam.

## Arquitetura / Design

- Novo formulario client para cadastro de produto com `useActionState` para feedback e reset.
- Server actions retornam estado de sucesso/erro em vez de falha silenciosa.
- Query de produtos para adicionar item prioriza produtos do usuario.

## Alterações esperadas (arquivos)

- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/page.tsx`
- `src/app/globals.css`
- `supabase/schema.sql`
- `supabase/migrations/20260226_user_pricing_model.sql`
- `docs/data-model.md` (se necessario)
- `docs/ui-guidelines.md` (se necessario)
- `docs/steps/STEP-04-product-ui-fixes.md`

## Modelo de dados / SQL (se houver)

- Ajustar `products.category_id` para nullable.
- Manter categories seed.
- Manter produtos seed e produtos do usuario com `owner_user_id`.

## Segurança / RLS (se houver)

- Mantem privacidade de produtos custom via `owner_user_id = auth.uid()`.
- Seed global (`owner_user_id is null`) continua read-only.
- Sem abertura de escrita global por client.

## UI/UX

- Fluxo de produto custom em primeiro plano.
- Mensagens de feedback objetivas.
- Estado vazio orientando proximo passo.
- Cabecalho mais limpo e menos tecnico.

## Plano de testes

- Manual:
  - Criar lista e abrir `/lists/:id`.
  - Cadastrar produto so com nome.
  - Cadastrar produto com nome + categoria.
  - Ver produto em "Adicionar item".
  - Adicionar item com quantidade.
  - Confirmar ausencia do bloco antigo quebrado.
  - Validar cabecalho simplificado e badge de status.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigação

- Risco: formulario sem feedback claro.
  - Mitigacao: estado server action com mensagens explicitas.
- Risco: regressao de schema para quem ja aplicou SQL.
  - Mitigacao: migracao incremental com `drop not null`.

## Decisões e trade-offs

- Uso de `useActionState` no cadastro de produto para UX melhor sem introduzir nova camada de estado global.
- Novo bloco de adicionar item limitado a produtos do usuario para reforcar fluxo principal.

## Pós-etapa (follow-ups)

- Permitir edicao/exclusao de produtos custom.
- Busca por nome nos produtos do usuario.
- Melhorias de acessibilidade com mensagens ARIA para feedback de form.

## Changelog da etapa

- Removido fluxo antigo quebrado de adicionar item com lista seed geral.
- Criado fluxo de cadastro de produto com nome obrigatorio, categoria opcional e unidade default `un`.
- Implementado feedback de sucesso/erro e reset de formulario apos salvar.
- Novo bloco de adicionar item agora usa produtos do usuario; seed nao e obrigatoria no fluxo.
- Cabecalho simplificado com badge de status e sem linha tecnica de fallback.
- SQL atualizado para `products.category_id` nullable (schema e migracao).
- Documentacao de modelo e UI atualizada.
