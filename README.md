# MarketNow

MarketNow e uma aplicacao web de lista de compras inteligente focada em estimativa de custo por regiao no Brasil. O usuario cria listas, adiciona itens e recebe o total estimado com base em precos medios regionais mantidos em base seed propria.

## Escopo da Fase Atual

Esta fase cobre somente documentacao, planejamento e estruturacao tecnica. Nao inclui implementacao de paginas, componentes ou logica de aplicacao.

## Stack Obrigatoria

- Next.js
- TypeScript
- Supabase (Auth + Database)
- Deploy: Vercel (plano gratuito)

## Como rodar localmente (padrao Next.js)

1. Instalar dependencias:

```bash
npm install
```

2. Executar ambiente de desenvolvimento:

```bash
npm run dev
```

3. Build de producao:

```bash
npm run build
npm run start
```

## Configuracao Supabase (variaveis de ambiente)

Criar `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Regras de uso:
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: permitidas no client.
- `SUPABASE_SERVICE_ROLE_KEY`: uso exclusivo server-side, apenas quando estritamente necessario.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Deploy na Vercel (Free Plan)

1. Conectar repositorio na Vercel.
2. Definir as variaveis de ambiente no projeto Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente server-side)
3. Executar deploy com configuracao padrao para Next.js.
4. Validar autenticacao, RLS e fluxo de fallback de preco apos deploy.

## Nota Importante sobre Precos

Os precos exibidos no MarketNow sao estimativas calculadas exclusivamente a partir de base seed propria de precos medios regionais. Nao ha integracao com Google Shopping nem uso de APIs pagas de preco no MVP.

## Documentacao Tecnica

- `docs/architecture.md`
- `docs/data-model.md`
- `docs/auth-flow.md`
- `docs/pricing-seed-strategy.md`
- `docs/api-design.md`
- `docs/ui-guidelines.md`
- `docs/development-roadmap.md`
- `docs/security-considerations.md`
