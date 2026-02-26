# Pricing Seed Strategy

## Objetivo

Definir a estrategia de precificacao estimada do MarketNow usando exclusivamente base seed propria, sem integracoes externas de preco.

## Fonte de Dados de Preco

- Origem unica: tabela `regional_prices` no Supabase.
- Nao usar Google Shopping.
- Nao usar APIs pagas de preco.

## Hierarquia de Fallback

Para cada item da lista:
1. Buscar preco por UF (`region_type='state'`).
2. Se ausente, buscar por macro-regiao (`region_type='macro_region'`).
3. Se ausente, buscar nacional (`region_type='national', region_code='BR'`).
4. Se ausente em todas as camadas, retornar erro de seed (`PRICE_NOT_FOUND`).

## Algoritmo de Calculo

Definicao:
- `item_price = price(UF) || price(macro_regiao) || price(nacional)`
- `item_total = item_price * quantity`
- `list_total = soma(item_total)`

Saida recomendada por item:
- `product_id`
- `quantity`
- `unit`
- `unit_price`
- `price_origin` (`state | macro_region | national`)
- `item_total`

Saida recomendada da lista:
- `list_id`
- `currency` (`BRL`)
- `items_subtotal[]`
- `estimated_total`

## Normalizacao de Unidades no MVP

Unidades suportadas:
- `un`
- `kg`
- `L`

Regra MVP:
- `shopping_list_items.unit` deve ser compativel com `products.default_unit`.
- Incompatibilidade de unidade deve ser bloqueada por validacao.

Evolucao futura:
- Conversao de unidades com fator explicito por produto (ex.: g -> kg, ml -> L).

## Politica de Seed e Versionamento

Campos de rastreabilidade:
- `source` (ex.: `marketnow_seed_v1`)
- `effective_date`

Diretrizes:
- Atualizar seed por versao identificavel.
- Manter historico por `effective_date` para auditoria.
- Garantir que todo produto ativo tenha pelo menos preco nacional valido.

## Qualidade de Dados

Validacoes minimas:
- `avg_price > 0`
- `currency = BRL`
- Consistencia de `region_type` e `region_code`
- Cobertura minima de produtos e preco nacional

## Nao Escopo no MVP

- Predicao dinamica de preco por serie temporal.
- Integracao com cupons/ofertas de varejo.
- Atualizacao automatica por crawler externo.
