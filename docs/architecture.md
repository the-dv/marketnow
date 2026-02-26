# Architecture - MarketNow

## Objetivo

Definir a arquitetura do MVP do MarketNow com separacao clara de responsabilidades, fluxo principal do produto e restricoes de escopo.

## Visao de Alto Nivel

Camadas:
- UI (Next.js): paginas, componentes e estados de interface.
- Services: regras de negocio para localizacao e precificacao.
- Data Access: clientes Supabase para browser e server.
- Domain Types: contratos de tipos compartilhados entre camadas.

## Separacao de Responsabilidades

### UI Layer
Responsavel por:
- Fluxo de autenticacao (Magic Link).
- Telas de dashboard e listas de compras.
- Exibicao de itens e total estimado.
- Estados de carregamento, erro e fallback.

Nao responsavel por:
- Regra de calculo de preco.
- Regra de fallback regional.
- Acesso direto com privilegios administrativos.

### Services Layer

#### `locationService`
Responsavel por:
- Obter coordenadas com geolocalizacao do navegador.
- Resolver localizacao para contexto regional (UF e macro-regiao).
- Definir fallback quando geolocalizacao/reverse geocoding falhar.

#### `pricingService`
Responsavel por:
- Resolver preco do item por prioridade regional.
- Calcular total por item e total da lista.
- Reportar origem do preco aplicado (`state`, `macro_region`, `national`).

### Data Access Layer

#### `supabaseBrowserClient`
- Operacoes autenticadas do usuario final.
- Leitura/escrita de listas e itens conforme RLS.
- Leitura autenticada de catalogo (`products`, `regional_prices`).

#### `supabaseServerClient`
- Operacoes server-side.
- Uso opcional de `service_role` em tarefas administrativas controladas.

### Domain Types
Tipos centrais previstos:
- `User`
- `ShoppingList`
- `ShoppingListItem`
- `Product`
- `RegionalPrice`
- `RegionContext`
- `RegionType = 'state' | 'macro_region' | 'national'`
- `Unit = 'un' | 'kg' | 'L'`

## Fluxo Geral do App

1. Login
- Usuario informa email.
- Supabase envia Magic Link.
- Callback valida sessao e redireciona para dashboard.

2. Dashboard
- Usuario visualiza listas existentes.
- Pode criar, renomear e remover lista.

3. Lista
- Usuario adiciona/remove itens e quantidades.
- Cada item referencia um produto do catalogo seed.

4. Calculo Total
- App resolve contexto regional do usuario.
- `pricingService` busca preco por prioridade:
  1. UF
  2. Macro-regiao
  3. Nacional
- App exibe total estimado e origem do fallback quando aplicavel.

## Fluxo de Localizacao

1. Browser retorna latitude/longitude.
2. Reverse geocoding mapeia para UF.
3. UF mapeia para macro-regiao brasileira.
4. Precificacao usa UF; se ausente, macro-regiao; se ausente, nacional.

## Decisoes de MVP

- Sem integracao com provedores externos de preco.
- Base de precos exclusivamente seed interna no Supabase.
- Leitura de `products` e `regional_prices` apenas para usuarios autenticados.
- `profiles` incluida no modelo em formato minimo para extensibilidade.

## Nao-Objetivos do MVP

- Colaboracao em tempo real entre usuarios.
- Historico de variacao de preco com analise temporal avancada.
- Granularidade de precificacao por cidade/bairro.
- Integracoes comerciais externas de marketplace.
