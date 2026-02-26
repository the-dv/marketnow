# Security Considerations - MarketNow

## Objetivo

Garantir isolamento de dados por usuario e impedir compartilhamento indevido de historico de preco.

## Principios

- RLS obrigatorio em tabelas acessadas pelo client.
- Menor privilegio.
- Seed de catalogo read-only para cliente.
- Historico de preco sempre no escopo do usuario.

## Tabelas por tipo de acesso

### Escopo do usuario (ownership por `auth.uid()`)
- `profiles`
- `shopping_lists`
- `shopping_list_items`
- `user_product_prices`

### Catalogo read-only (autenticado)
- `categories`
- `products`
- `regional_prices`

## Regras criticas

1. `user_product_prices`:
- usuario so le/escreve/apaga os proprios registros.
- nunca compartilhar com outros usuarios.

2. `shopping_list_items.paid_price`:
- registra preco pago da compra daquela lista/item.
- pode existir sem gravar em `user_product_prices`.

3. `regional_prices`:
- somente fallback seed.
- sem escrita pelo client autenticado.

## Policies (resumo)

- `shopping_lists_*_own`
- `shopping_list_items_*_own`
- `user_product_prices_*_own`
- `categories_select_authenticated`
- `products_select_authenticated`
- `regional_prices_select_authenticated`

As policies completas estao em `supabase/schema.sql`.

## Chaves e segredos

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` permitido no client.
- `service_role` somente backend/migracao.
- nunca expor segredo em bundle frontend.

## Validacoes de entrada

- `quantity > 0`
- `unit in ('un', 'kg', 'L')`
- `paid_price > 0` para compras concluídas
- `currency = BRL` para historico no MVP

