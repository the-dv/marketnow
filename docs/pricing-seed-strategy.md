# Pricing Strategy (User-First)

## Principio central

A seed regional/nacional (`regional_prices`) **nao e a verdade principal** do app. Ela existe apenas como sugestao inicial/fallback.

A verdade principal para sugestao de preco e o historico do proprio usuario (`user_product_prices`).

## Prioridade de sugestao por item

1. Ultimo preco pago pelo proprio usuario para o produto.
2. Media historica do proprio usuario para o produto (quando houver).
3. Seed fallback:
   - UF (`state`)
   - macro-regiao (`macro_region`)
   - nacional (`national`)

Se nenhuma camada retornar preco, o sistema retorna `PRICE_NOT_FOUND`.

## Fluxo de compra real

Quando o usuario marca item como comprado:

1. Pergunta: "Voce pagou quanto?"
2. Pergunta: "Salvar este valor para usar como referencia futura?"

Resultados:

- Se `sim`:
  - registra preco pago do item da compra em `shopping_list_items.paid_price`
  - grava historico pessoal em `user_product_prices`

- Se `nao`:
  - registra somente o preco pago daquela compra em `shopping_list_items.paid_price`
  - nao grava historico em `user_product_prices`

## Isolamento de dados

- Preco salvo por usuario **nao e compartilhado** com outros usuarios.
- Nao existe media global de usuarios no MVP.

## Calculo do total estimado

Para cada item:

- `suggested_price = user_last || user_avg || seed_fallback`
- `item_total = suggested_price * quantity`

Para a lista:

- `estimated_total = sum(item_total)`

## Papel da seed

- `regional_prices` continua obrigatoria para fallback inicial.
- `regional_prices` e catalogo read-only para cliente autenticado.
- Seed nunca sobrescreve historico individual do usuario quando existe dado pessoal.

