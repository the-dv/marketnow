# API Design (MVP)

## Objetivo

Definir contratos de servico e operacoes da aplicacao para suportar autenticacao, listas e estimativa de preco regional no MarketNow.

## Principios

- Contratos tipados com TypeScript.
- Erros de dominio previsiveis.
- Autorizacao baseada em sessao + RLS.
- Sem integracoes externas de preco.

## Tipos de Dominio

```ts
export type RegionType = 'state' | 'macro_region' | 'national';
export type Unit = 'un' | 'kg' | 'L';

export type RegionContext = {
  country: 'BR';
  uf?: string;
  macroRegion?: string;
};
```

## Contratos de Servico Interno (sem implementacao)

### `getCurrentPosition()`

Responsabilidade:
- Obter latitude/longitude via navegador.

Assinatura sugerida:
```ts
type Coordinates = { lat: number; lng: number };

declare function getCurrentPosition(): Promise<Coordinates>;
```

Erros esperados:
- `LOCATION_DENIED`
- `LOCATION_UNAVAILABLE`

### `resolveRegionFromCoords(lat, lng)`

Responsabilidade:
- Converter coordenadas em `RegionContext` com UF e macro-regiao quando possivel.

Assinatura sugerida:
```ts
declare function resolveRegionFromCoords(lat: number, lng: number): Promise<RegionContext>;
```

Erros esperados:
- `REGION_RESOLUTION_FAILED`

### `getListWithItems(listId)`

Responsabilidade:
- Retornar lista e itens do usuario autenticado.

Assinatura sugerida:
```ts
type ShoppingListItemDTO = {
  id: string;
  productId: string;
  quantity: number;
  unit: Unit;
};

type ShoppingListDTO = {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'archived';
  items: ShoppingListItemDTO[];
};

declare function getListWithItems(listId: string): Promise<ShoppingListDTO>;
```

Erros esperados:
- `AUTH_REQUIRED`
- `LIST_NOT_FOUND`
- `FORBIDDEN`

### `estimateListTotal(listId, regionContext)`

Responsabilidade:
- Calcular total estimado com fallback regional.

Assinatura sugerida:
```ts
type EstimatedItem = {
  productId: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  priceOrigin: RegionType;
  itemTotal: number;
};

type ListEstimate = {
  listId: string;
  currency: 'BRL';
  items: EstimatedItem[];
  estimatedTotal: number;
};

declare function estimateListTotal(listId: string, regionContext: RegionContext): Promise<ListEstimate>;
```

Erros esperados:
- `AUTH_REQUIRED`
- `LIST_NOT_FOUND`
- `PRICE_NOT_FOUND`

## Operacoes de Aplicacao (CRUD)

### Listas
- `createList(name)`
- `getLists()`
- `updateList(id, { name, status })`
- `deleteList(id)`

Regras:
- Usuario so manipula listas cujo `user_id = auth.uid()`.

### Itens
- `addListItem(listId, productId, quantity, unit)`
- `updateListItem(itemId, { quantity, unit })`
- `removeListItem(itemId)`

Regras:
- Item deve pertencer a lista do usuario autenticado.
- `quantity > 0`.
- `unit` valida e compativel com produto.

## Convencao de Erros

Codigos padrao:
- `AUTH_REQUIRED`
- `FORBIDDEN`
- `LIST_NOT_FOUND`
- `LOCATION_DENIED`
- `PRICE_NOT_FOUND`
- `VALIDATION_ERROR`

Formato sugerido:
```ts
type DomainError = {
  code: string;
  message: string;
};
```
