# API Design (MVP)

## Objetivo

Definir contratos internos para listas e precificacao user-first.

## Tipos principais

```ts
type Unit = 'un' | 'kg' | 'L';
type RegionContext = { country: 'BR'; uf?: string; macroRegion?: string };
type SuggestedPriceOrigin =
  | 'user_last_price'
  | 'user_avg_price'
  | 'seed_state'
  | 'seed_macro_region'
  | 'seed_national';
```

## Servicos internos

### `estimateListTotal(listId, regionContext)`

Prioridade de sugestao:
1. Ultimo preco do usuario em `user_product_prices`
2. Media do usuario em `user_product_prices`
3. Fallback seed `regional_prices` (UF -> macro-regiao -> BR)

Saida por item:

```ts
type EstimatedItem = {
  itemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  suggestedPriceOrigin: SuggestedPriceOrigin;
  itemTotal: number;
  paidPrice?: number;
  purchasedAt?: string;
};
```

### `markListItemPurchasedAction(formData)`

Entrada:
- `listId`
- `itemId`
- `paidPrice`
- `saveReference` (boolean)

Comportamento:
- sempre grava valor pago da compra em `shopping_list_items`.
- se `saveReference=true`, grava historico em `user_product_prices`.

## CRUD da lista

- `createList(name)`
- `updateList(id, { name, status })`
- `deleteList(id)`
- `createListItem(listId, productId, quantity, unit)`
- `updateListItem(itemId, quantity, unit)`
- `deleteListItem(itemId)`
- `markListItemPurchased(...)`

## Regras de autorizacao

- Tabelas de usuario usam `auth.uid()` + RLS.
- Catalogo (`categories`, `products`, `regional_prices`) leitura autenticada.
- Nao ha endpoint para gravar preco global.

## Erros de dominio

- `AUTH_REQUIRED`
- `FORBIDDEN`
- `LIST_NOT_FOUND`
- `LIST_ITEM_NOT_FOUND`
- `VALIDATION_ERROR`
- `PRICE_NOT_FOUND`

