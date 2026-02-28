# MarketNow

MarketNow e uma aplicacao web de lista de compras inteligente com autenticacao por email/senha (Supabase), CRUD de listas/itens e estimativa de total por item.

## Regra de Preco (fonte de verdade)

- Fonte principal: historico do proprio usuario (`user_product_prices`).
- Seed regional/nacional (`regional_prices`) e apenas fallback.
- Prioridade da sugestao:
1. Ultimo preco pago pelo usuario.
2. Media historica do usuario para o produto.
3. Seed por UF -> macro-regiao -> nacional.

## Stack

- Next.js
- TypeScript
- Supabase (Auth + Database)
- Vercel (free plan)

## Rodar localmente

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run start
```

Testes unitarios:

```bash
npm run test
```

## Variaveis de ambiente

Crie `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup do banco (Supabase)

1. Execute `supabase/schema.sql`.
2. Se seu projeto ja tinha o schema antigo, execute tambem `supabase/migrations/20260226_user_pricing_model.sql`.
3. Execute `supabase/seed.sql` para popular `categories`, `products` e `regional_prices` (fallback).

Para passos externos detalhados (Supabase Auth, SQL e Vercel), consulte:
- `docs/manual-steps.md`

## Fluxo de compra implementado

- O item mostra sugestao de preco e origem.
- Ao marcar como comprado, o usuario informa quanto pagou.
- Opcional: salvar esse valor como referencia futura.
- Se salvar, grava em `user_product_prices` (escopo exclusivo do usuario).
- O valor pago do item fica em `shopping_list_items.paid_price` para registrar a compra daquela lista.

## Deploy na Vercel (free)

1. Conectar o repositorio na Vercel.
2. Configurar variaveis:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy padrao de Next.js.

## Nota importante

Nao usamos Google Shopping nem APIs pagas de preco. A seed interna e apenas sugestao inicial/fallback e nunca substitui o historico do proprio usuario como fonte principal.
