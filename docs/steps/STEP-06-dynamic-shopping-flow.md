# STEP-06 - Dynamic Shopping Flow

## Objetivo

Transformar a secao "Meus produtos" em uma lista de compra interativa na tela `/lists/:id`, com captura de preco pago ao marcar comprado e persistencia de estado no Supabase.

## Escopo

- Habilitar cadastro rapido de produto por tecla Enter no campo de nome.
- Tornar "Meus produtos" interativa com checkbox de comprado por item.
- Abrir modal ao marcar comprado para capturar preco pago e opcao de salvar referencia.
- Persistir evento de compra por usuario/lista/produto em tabela existente (`shopping_list_items`).
- Persistir historico em `user_product_prices` quando usuario optar por salvar referencia.
- Manter categoria opcional no cadastro de produto.
- Garantir atualizacao imediata da tela apos acoes (sem refresh manual do usuario).

## Fora de escopo

- CRUD completo de produtos (editar, excluir, merge).
- Refatoracao ampla de servicos de precificacao.
- Integracao com APIs externas de preco.

## Requisitos (Checklist)

- [x] Digitar nome e pressionar Enter cria produto do usuario imediatamente.
- [x] Cadastro via Enter limpa o input e mantem foco no campo de nome.
- [x] Categoria permanece opcional (Sem categoria permitido).
- [x] "Meus produtos" exibe checkbox "Comprado" em cada produto.
- [x] Marcar comprado abre modal com preco + opcao salvar referencia.
- [x] Confirmar salva compra persistida para a lista atual.
- [x] Confirmar com "salvar referencia" grava em `user_product_prices` do usuario.
- [x] Cancelar modal nao altera estado do checkbox.
- [x] Desmarcar checkbox remove estado comprado sem prompt.
- [x] Estado comprado persiste apos refresh.
- [x] Lint e build executados com sucesso.
- [x] Commit realizado com referencia `STEP-06`.

## Criterios de aceite

- Produto criado por Enter aparece em "Meus produtos" sem reload manual.
- Cada item de "Meus produtos" possui checkbox funcional de compra.
- Ao marcar checkbox, modal solicita preco e opcao de referencia antes de persistir.
- Ao cancelar no modal, checkbox permanece desmarcado.
- Ao confirmar, estado comprado aparece imediatamente e se mantem apos recarregar a pagina.
- Ao desmarcar checkbox, estado comprado e preco pago sao removidos para aquele item/lista.

## Arquitetura / Design

- Estado "comprado" do MVP sera persistido em `shopping_list_items` por par `(shopping_list_id, product_id)`.
- `shopping_list_items` sera tratado como checkin da lista atual (quantidade default = 1).
- Acoes de compra/descompra ficam em server actions com validacao de ownership da lista.
- Componente client dedicado para "Meus produtos" controla modal, feedback e submit.

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-06-dynamic-shopping-flow.md`
- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/create-product-form.tsx`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/my-products-list.tsx` (novo)
- `src/app/globals.css`
- `supabase/schema.sql`
- `supabase/migrations/20260226_dynamic_shopping_flow.sql` (novo)
- `docs/manual-steps.md`

## Modelo de dados / SQL

- Reuso de `shopping_list_items` para persistencia de compra por lista/produto.
- Reuso de `user_product_prices` para historico por usuario quando habilitado.
- Nova migracao para consolidar unicidade por `(shopping_list_id, product_id)` e evitar duplicidade no fluxo de checkbox.

## Seguranca / RLS

- Acoes server-side validam autenticacao e ownership da lista (`user_id = auth.uid()`).
- Gravacao de historico em `user_product_prices` respeita RLS por usuario.
- Nao ha compartilhamento de preco entre usuarios.

## UI/UX

- Fluxo mobile-first, visual limpo branco/azul/preto.
- Modal simples para captura de preco pago.
- Feedback textual claro para sucesso/erro.
- Sem textos tecnicos de regra interna no front principal.

## Plano de testes

- Manual:
  - Abrir `/lists/:id`.
  - Cadastrar produto por Enter com categoria vazia.
  - Cadastrar produto com categoria selecionada.
  - Marcar checkbox e confirmar compra com preco valido.
  - Marcar checkbox e cancelar no modal (estado nao deve mudar).
  - Confirmar compra com "salvar referencia" ligado e validar persistencia.
  - Desmarcar checkbox e validar limpeza do estado comprado.
  - Recarregar pagina e validar persistencia de estado.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: duplicidade antiga de `shopping_list_items` por lista/produto.
  - Mitigacao: migracao de dedupe e indice unico.
- Risco: erro de parse de preco com virgula.
  - Mitigacao: parser dedicado que normaliza virgula/ponto antes de salvar.

## Decisoes e trade-offs

- Decisao: usar `shopping_list_items` como estado persistente de checkin do MVP.
  - Trade-off: sem tabela nova, implementacao mais simples; sem granularidade de historico de eventos de check/uncheck.
- Decisao: desmarcar checkbox limpa estado comprado sem confirmacao.
  - Trade-off: fluxo mais rapido; menor protecao contra clique acidental.

## Pos-etapa (follow-ups)

- Historico de compras por lista com timeline dedicada.
- Undo toast para desmarcacao acidental.

## Changelog curto

- Fluxo de cadastro rapido por Enter ativado no formulario de produto.
- "Meus produtos" virou lista interativa com checkbox de comprado.
- Modal de compra implementado com captura de preco e opcao de salvar referencia.
- Persistencia de compra por lista/produto implementada em `shopping_list_items`.
- Historico opcional salvo em `user_product_prices`.
- Migracao SQL adicionada para dedupe e indice unico por `(shopping_list_id, product_id)`.
- `npm run lint` e `npm run build` executados com sucesso.
