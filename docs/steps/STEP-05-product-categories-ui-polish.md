# STEP-05 - Product Categories UI Polish

## Objetivo

Ajustar a tela `/lists/:id` para consolidar o cadastro de produtos do usuario com categoria opcional, exibir os produtos cadastrados imediatamente e limpar detalhes tecnicos da UI.

## Escopo

- Garantir cadastro de produto sem categoria (`category_id` opcional de ponta a ponta).
- Exibir secao "Meus produtos" separada de "Itens da lista".
- Atualizar categorias pre-definidas para o conjunto oficial e ordem definida.
- Remover texto tecnico do card "Total estimado".
- Aplicar gradiente global sutil mantendo paleta branco/azul/preto.
- Atualizar documentacao da etapa e docs operacionais impactados.

## Fora de escopo

- Reintroduzir fluxo de adicionar item via novo formulario nesta etapa.
- CRUD completo de produtos (editar/excluir).
- Mudancas de regra de calculo de precificacao por usuario.

## Requisitos (Checklist)

- [x] Cadastro de produto aceita "Sem categoria" e salva com sucesso.
- [x] Persistencia com `products.category_id` nullable garantida em schema/migracao.
- [x] Secao "Meus produtos" lista nome, categoria (ou "Sem categoria") e unidade.
- [x] Lista de "Meus produtos" atualiza sem reload manual apos salvar produto.
- [x] Dropdown de categoria usa exatamente: Alimentos, Bebidas, Higiene, Limpeza, Utilidades, Outros.
- [x] Seed SQL atualizada para garantir categorias oficiais e slugs consistentes.
- [x] Card "Total estimado" sem texto tecnico de prioridade de fallback.
- [x] Background global com gradiente bem sutil (cinza claro -> azul muito claro).
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado na branch atual com referencia `STEP-05`.

## Criterios de aceite

- Em `/lists/:id`, cadastro com apenas nome + unidade salva sem exigir categoria.
- Em `/lists/:id`, cadastro com nome + categoria + unidade salva normalmente.
- A secao "Meus produtos" mostra imediatamente os produtos cadastrados apos submit bem-sucedido.
- "Itens da lista" permanece visivel e independente da listagem de produtos.
- Card "Total estimado" mostra somente titulo/valor (sem texto tecnico).
- UI global apresenta gradiente discreto, sem descaracterizar a paleta do projeto.

## Arquitetura / Design

- Server component da pagina concentra leitura de `categories` e `products` do usuario autenticado.
- `CreateProductForm` permanece com `useActionState` e `router.refresh()` para sincronizar listagens apos sucesso.
- Categorias sao carregadas por slug permitido e ordenadas no frontend por ordem de negocio.

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-05-product-categories-ui-polish.md`
- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/create-product-form.tsx` (se necessario)
- `src/app/lists/[listId]/actions.ts` (se necessario)
- `src/app/globals.css`
- `supabase/seed.sql`
- `supabase/migrations/20260226_categories_alignment.sql` (novo)
- `docs/data-model.md`
- `docs/ui-guidelines.md`
- `docs/manual-steps.md`

## Modelo de dados / SQL (se houver)

- Garantir `products.category_id` opcional (`NULL` permitido).
- Garantir seed de categorias oficiais:
  - `alimentos`
  - `bebidas`
  - `higiene`
  - `limpeza`
  - `utilidades`
  - `outros`

## Seguranca / RLS (se houver)

- Politicas de `products` permanecem:
  - leitura para seed global (`owner_user_id is null`) e itens proprios.
  - escrita apenas para `owner_user_id = auth.uid()`.
- Nenhuma exposicao adicional de dados entre usuarios.

## UI/UX

- Manter mobile-first e cards simples.
- Exibir "Meus produtos" com leitura rapida (nome/categoria/unidade).
- Mensagens de sucesso/erro objetivas no cadastro.
- Remover copy tecnica de fallback do card de total.

## Plano de testes

- Manual:
  - Abrir `/lists/:id` com usuario autenticado.
  - Cadastrar produto apenas com nome (categoria vazia) e confirmar sucesso.
  - Cadastrar produto com nome + categoria e confirmar sucesso.
  - Verificar se ambos aparecem em "Meus produtos" sem recarregar manualmente.
  - Confirmar que "Itens da lista" continua visivel.
  - Confirmar ausencia do texto tecnico no card "Total estimado".
  - Confirmar gradiente global sutil na pagina.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: ambientes antigos ainda com `category_id not null`.
  - Mitigacao: migracao incremental garantindo `drop not null`.
- Risco: categorias extras legadas no banco confundirem dropdown.
  - Mitigacao: filtro por slugs oficiais e ordenacao deterministica na UI.

## Decisoes e trade-offs

- Decisao: manter `category_id` nulo para "Sem categoria" em vez de forcar "Outros".
  - Trade-off: exige tratamento explicito de null na UI, mas evita classificacao automatica incorreta.
- Decisao: listar somente produtos do usuario em "Meus produtos".
  - Trade-off: seed global nao aparece nessa secao, mas a experiencia fica alinhada ao objetivo do bloco.

## Pos-etapa (follow-ups)

- Permitir associar produto cadastrado diretamente a item da lista em novo fluxo dedicado.
- Adicionar filtros e busca em "Meus produtos" quando volume aumentar.

## Changelog curto

- Tela `/lists/:id` passou a exibir secao "Meus produtos" separada de "Itens da lista".
- Card "Total estimado" foi simplificado, removendo texto tecnico.
- Categorias oficiais alinharam para: Alimentos, Bebidas, Higiene, Limpeza, Utilidades, Outros.
- Seed e migracao SQL atualizadas para sustentar categoria opcional e catalogo padrao.
- `npm run lint` e `npm run build` executados com sucesso.
