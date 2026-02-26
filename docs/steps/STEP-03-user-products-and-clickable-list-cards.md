# STEP-03 - User Products and Clickable List Cards

## Objetivo

Implementar cadastro de produto por usuario com categoria (alem da seed global) e navegação para lista ao clicar no card.

## Escopo

- AJUSTE A:
  - cadastro de produto custom do usuario com nome + categoria + unidade.
  - exibicao de produtos seed + produtos privados do usuario no seletor de itens.
  - garantir isolamento por RLS para produtos privados.
- AJUSTE B:
  - card da lista clicavel para abrir detalhes da lista.
  - evitar conflito com botoes de arquivar/excluir.

## Fora de escopo

- Importacao em massa de produtos.
- Edicao/remoção de produtos custom nesta etapa.
- Mudancas de design fora do necessario para fluxo.

## Requisitos (Checklist)

- [x] Atualizar modelo de dados para suportar produto privado do usuario.
- [x] Atualizar schema/migracao RLS para produtos privados.
- [x] Implementar action para criar produto custom (nome + categoria + unidade).
- [x] Exibir categorias pre-definidas no cadastro.
- [x] Exibir produtos seed + produtos do usuario ao adicionar item na lista.
- [x] Tornar card de lista clicavel para abrir detalhe.
- [x] Garantir que botoes Arquivar/Excluir nao disparem navegação.
- [x] Atualizar docs relevantes (`data-model`, `ui-guidelines`).
- [x] Rodar `npm run lint` e `npm run build`.
- [x] Commitar referenciando STEP-03.

## Critérios de aceite

- Usuario cadastra produto com nome + categoria (+ unidade).
- Produto criado aparece para o proprio usuario no seletor de itens.
- Produto privado nao aparece para outros usuarios (RLS).
- Clique no card da lista abre detalhe sem depender do botao "Abrir".
- Arquivar/Excluir seguem funcionando sem abrir a lista por engano.

## Arquitetura / Design

- Abordagem escolhida: `products` com `owner_user_id` nullable.
  - `owner_user_id = null` -> produto seed global.
  - `owner_user_id = auth.uid()` -> produto privado do usuario.
- RLS em `products`:
  - leitura: seed global + produtos proprios.
  - escrita: apenas proprio usuario em produtos privados.

## Alterações esperadas (arquivos)

- `supabase/schema.sql`
- `supabase/migrations/20260226_user_pricing_model.sql` (incremental)
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/globals.css`
- `docs/data-model.md`
- `docs/ui-guidelines.md`
- `docs/steps/STEP-03-user-products-and-clickable-list-cards.md`

## Modelo de dados / SQL (se houver)

- Adicionar `products.owner_user_id uuid null references auth.users(id)`.
- Ajustar policy de leitura para:
  - `owner_user_id is null` OU `owner_user_id = auth.uid()`.
- Adicionar policy de insert/update/delete para produtos privados do usuario.

## Segurança / RLS (se houver)

- Produtos seed continuam somente leitura.
- Produto privado do usuario visivel apenas para o proprio dono.
- Insercao de produto custom permitida apenas para `owner_user_id = auth.uid()`.

## UI/UX

- Novo bloco "Cadastrar produto" em tela de lista:
  - input nome
  - select categoria
  - select unidade
- Lista do dashboard:
  - area principal do card vira link clicavel.
  - botoes de acao permanecem separados e evidentes.
- Responsividade mantida para mobile.

## Plano de testes

- Manual:
  - Criar produto custom com categoria e unidade.
  - Confirmar aparecimento no seletor de itens.
  - Confirmar card abre lista ao clicar no bloco principal.
  - Confirmar Arquivar/Excluir nao abrem lista.
  - Testar com dois usuarios para privacidade de produto.
- Automatizado (se aplicável):
  - `npm run lint`
  - `npm run build`

## Riscos e mitigação

- Risco: policy de `products` bloquear leitura seed.
  - Mitigacao: policy explicita com `owner_user_id is null`.
- Risco: regressao de fluxo de adicionar item.
  - Mitigacao: validacao em `actions.ts` e testes manuais de ponta a ponta.

## Decisões e trade-offs

- Escolha de `owner_user_id` em `products` evita nova tabela e simplifica FK em `shopping_list_items`.
- Trade-off: tabela `products` agrega seed e custom, exigindo policy mais cuidadosa.

## Pós-etapa (follow-ups)

- CRUD completo de produtos custom (editar/excluir).
- Busca por nome no seletor de produto para listas grandes.

## Changelog da etapa

- `products` passou a suportar `owner_user_id` para produto custom privado.
- Policies de `products` atualizadas para leitura seed + proprio usuario e escrita apenas do dono.
- Tela de lista ganhou formulario de cadastro de produto (nome, categoria, unidade).
- Seletor de item agora mostra produtos seed e produtos do usuario.
- Dashboard atualizado para navegação por clique no card da lista.
- Ajustes de CSS para acessibilidade/foco e responsividade dos novos blocos.
