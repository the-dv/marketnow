# STEP-14 - Price Reference and Totals by Category

## Objetivo

Melhorar a UX da tela `/lists/:id` com foco em:
- exibicao inline do valor pago por item;
- reaproveitamento automatico da ultima referencia de preco por `product_id`;
- resumo de total por categoria acima do total final.

## Escopo

- Ajustar linha de produto para mostrar `Valor: R$ X,XX` na mesma linha do nome em desktop.
- Reusar automaticamente referencia de `user_product_prices` ao marcar item como comprado.
- Abrir modal de preco apenas quando nao houver referencia para o produto.
- Permitir editar valor clicando no texto inline de valor.
- Remover texto do header da coluna de acoes mantendo a coluna da lixeira.
- Adicionar bloco "Total por categoria" antes de "Total estimado" no card final.

## Fora de escopo

- Mudancas de regra de calculo do total final.
- Compartilhamento de referencia por nome de produto (fora do `product_id`).
- Refatoracao de arquitetura de pricing.

## Requisitos (Checklist)

- [x] `Valor: R$ X,XX` exibido na mesma linha do nome em desktop.
- [x] Em mobile, linha do nome/valor pode quebrar sem quebrar o grid.
- [x] Reuso automatico de referencia por `product_id` ao marcar comprado novamente.
- [x] Modal abre somente quando nao ha referencia salva para o produto.
- [x] Clique no valor inline abre modal para editar preco pago.
- [x] Header da coluna de acoes fica sem texto.
- [x] Card final inclui "Total por categoria" acima do "Total estimado".
- [x] Totais por categoria consideram apenas itens comprados com `paid_price`.
- [x] Total final permanece com a mesma base/calculo atual.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-14`.

## Criterios de aceite

- Ao marcar comprado com referencia existente, item e atualizado sem abrir modal.
- Ao marcar comprado sem referencia, modal de preco abre normalmente.
- Ao clicar em `Valor: R$ ...`, modal abre para editar e salvar novo valor.
- Header nao exibe "Acoes" e o icone de lixeira segue funcional.
- Card inferior mostra lista de totais por categoria e, em seguida, o total estimado final.

## Plano de testes

- Marcar item como comprado, informar preco e marcar "salvar como referencia".
- Desmarcar e marcar novamente o mesmo item: validar auto-preenchimento sem modal.
- Clicar em `Valor: R$ ...`, editar e salvar: validar atualizacao de `paid_price` e total.
- Validar alinhamento inline do valor na linha do nome (desktop) e quebra controlada no mobile.
- Validar header sem texto na coluna de acoes.
- Validar bloco "Total por categoria" e total final no card inferior.
- Executar `npm run lint`.
- Executar `npm run build`.

## Alteracoes esperadas (arquivos)

- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/globals.css`
- `docs/steps/STEP-14-price-reference-and-totals-by-category.md`

## Changelog curto

- Exibicao inline de valor pago adicionada na coluna de nome.
- Reuso automatico de referencia de preco por `product_id` ao marcar comprado.
- Acao de editar valor via clique no texto `Valor: ...`.
- Header da coluna de acoes removido.
- Resumo "Total por categoria" adicionado acima do total estimado.
