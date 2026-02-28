# Architecture - MarketNow

## Objetivo

Definir arquitetura do MVP com foco em:
- autenticacao por email/senha + reset
- isolamento de dados por usuario
- precificacao user-first com fallback seed regional

## Camadas

### UI (Next.js App Router)
- Login (`/login`)
- Dashboard de listas (`/dashboard`)
- Detalhe da lista (`/lists/:id`)
- Estados de sugestao de preco, compra concluida e fallback

### Services

#### `location-service`
- Resolve contexto regional (`uf`, `macroRegion`) para fallback da seed.
- Nao define preco principal; apenas contexto de fallback.

#### `pricing-service`
- Implementa prioridade oficial de sugestao:
1. ultimo preco do usuario
2. media historica do usuario
3. seed regional/nacional
- Calcula total estimado da lista.
- Nao compartilha historico entre usuarios.

### Data Access (Supabase)
- `supabaseBrowserClient`: auth client-side e chamadas permitidas por RLS.
- `supabaseServerClient`: leitura/escrita server-side com sessao do usuario.

### Banco (dominio de preco)
- Historico do usuario: `user_product_prices` (fonte principal).
- Registro de compra da lista: `shopping_list_items.paid_price`.
- Seed fallback: `regional_prices`.

## Fluxo principal de preco

1. Usuario monta lista.
2. Sistema calcula sugestao de cada item (prioridade user-first).
3. Sistema exibe total estimado da lista.
4. Usuario marca item como comprado e informa preco pago.
5. Opcional: usuario decide salvar como referencia futura.
6. Se salvar, grava em `user_product_prices`.

## Responsabilidades e limites

- UI nao calcula preco final por conta propria; usa `pricing-service`.
- Seed regional nao substitui historico do usuario.
- Nenhum preco pessoal vira media global no MVP.
- Sem integracoes externas de preco.
