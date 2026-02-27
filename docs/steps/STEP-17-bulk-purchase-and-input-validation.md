# STEP-17 - Bulk Purchase And Input Validation

## Objetivo

Adicionar fluxo de compra em massa na secao "Meus produtos" com modal em 2 etapas e reforcar validacao/mascara de campos numericos (preco e quantidade).

## Escopo

- Checkbox de header para "marcar todos" com estado checked/unchecked/indeterminate.
- Modal de 2 etapas:
  - Etapa 1: decidir entre "sim, salvar precos" ou "nao, apenas marcar".
  - Etapa 2: lista de produtos com inputs de preco em BRL.
- Compra em massa por server action com payload em lote.
- Operacao em lote no banco via funcao SQL RPC para evitar atualizacao parcial.
- Mascara BRL e bloqueio de caracteres invalidos em inputs de preco.
- Validacao numerica de quantidade com decimal permitido e bloqueio de letras/simbolos.

## Requisitos (Checklist)

- [x] Checkbox de header adicionado na coluna de checkbox de "Meus produtos".
- [x] Header checkbox mostra estado checked quando todos estao comprados.
- [x] Header checkbox mostra estado indeterminate quando apenas parte esta comprada.
- [x] Clicar para marcar todos abre modal (sem persistir imediatamente).
- [x] Fechar/cancelar modal nao altera estado no banco.
- [x] Etapa 1 do modal implementada com opcoes "Sim, salvar precos" e "Nao, apenas marcar".
- [x] Etapa 1 -> "Nao, apenas marcar" marca todos em lote e fecha modal.
- [x] Etapa 1 -> "Sim, salvar precos" avanca para Etapa 2.
- [x] Etapa 2 lista produtos com input de valor por linha.
- [x] Inputs de preco usam mascara BRL e nao aceitam letras.
- [x] Etapa 2 preenche valores iniciais com referencia de `user_product_prices` por `product_id` quando houver.
- [x] Etapa 2 permite valor vazio (salva `paid_price` apenas para preenchidos).
- [x] "Salvar valores" executa compra em lote e atualiza UI/total.
- [x] Action server de bulk adicionada com payload `listId + items`.
- [x] Operacao de bulk executa em batch (sem loop de N chamadas no client).
- [x] Funcao SQL RPC criada para consolidar operacao em transacao no banco.
- [x] Quantidade aceita apenas numerico/decimal e bloqueia letras/simbolos invalidos.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-17`.

## Criterios de aceite

- Clicar em "selecionar todos" abre modal da etapa 1.
- Cancelar/fechar modal nao altera itens comprados.
- "Nao, apenas marcar" marca todos como comprados em lote.
- "Sim, salvar precos" abre etapa 2 com inputs mascarados.
- Inputs de preco nao aceitam letras e mantem formato BRL.
- Inputs de quantidade nao aceitam letras.
- Salvar valores em lote atualiza total e total por categoria sem inconsistencias.

## Plano de testes

- Clicar "selecionar todos" e validar abertura da etapa 1 do modal.
- Cancelar modal (X, Esc, backdrop) e validar que nada muda.
- Confirmar "Nao, apenas marcar" e validar todos comprados.
- Confirmar "Sim, salvar precos" e validar etapa 2 com lista de produtos.
- Testar digitacao com letras em preco e quantidade (deve bloquear/sanitizar).
- Salvar valores em etapa 2 e validar total/total por categoria.
- Executar `npm run lint`.
- Executar `npm run build`.
