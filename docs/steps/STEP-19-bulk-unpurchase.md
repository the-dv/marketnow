# STEP-19 - Bulk Unpurchase pelo Checkbox do Header

## Objetivo

Corrigir o comportamento do checkbox geral em `/lists/:id` para suportar:

- marcar todos (fluxo existente com modal de precos);
- desmarcar todos (novo fluxo com confirmacao simples, sem modal de precos).

## Checklist

- [x] Checkbox do header continua abrindo modal de "Marcar todos" quando nao esta tudo comprado.
- [x] Checkbox do header abre confirmacao de "Desmarcar todos" quando todos estao comprados.
- [x] Cancelar na confirmacao de desmarcar todos nao altera estado.
- [x] Nova server action `unpurchaseAllListItemsAction(listId)` criada.
- [x] Action faz update em batch de `shopping_list_items` limpando `purchased_at`, `paid_price`, `paid_currency`.
- [x] Action valida ownership da lista antes do update (RLS + verificacao de dono).
- [x] Fluxo de desmarcar todos nao toca `user_product_prices`.
- [x] Migracao idempotente criada para garantir policy de update de `shopping_list_items`.
- [x] `docs/manual-steps.md` atualizado com instrucao de aplicacao da migracao e query de verificacao.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-19`.

## Criterios de Aceite

- Clicar no checkbox geral com todos comprados abre confirmacao:
  - Texto: "Desmarcar todos como comprados? Isso removera os valores pagos desta lista."
  - Botoes: "Desmarcar todos" e "Cancelar".
- Confirmar desmarcar todos:
  - limpa `purchased_at`, `paid_price`, `paid_currency` de todos os itens da lista;
  - nao remove historico de `user_product_prices`;
  - atualiza UI: header unchecked, itens desmarcados e total recalculado.
- Cancelar confirmacao nao persiste alteracoes.
- Lint e build finalizam sem erro.

## Plano de Testes Manuais

1. Com 3 itens comprados com `paid_price`, clicar checkbox geral (estado checked).
2. Confirmar que abre modal de desmarcar todos (nao modal de precos).
3. Clicar `Cancelar` e validar que nada muda.
4. Clicar novamente e confirmar `Desmarcar todos`.
5. Validar que todos itens ficam desmarcados e total/total por categoria atualizam.
6. Validar no banco que `user_product_prices` continua com historico intacto.
7. Executar `npm run lint`.
8. Executar `npm run build`.
