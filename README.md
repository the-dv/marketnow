# MarketNow

Aplicação web para gerenciamento de listas de compras com autenticação por e-mail e senha, permitindo acompanhamento individual de produtos por usuário. O objetivo é oferecer um fluxo simples e seguro de cadastro, login e recuperação de senha, com persistência via Supabase.

## Aplicação em produção

- Vercel: [https://marketnow.vercel.app](https://marketnow.vercel.app)

## Stack

- Next.js
- React
- Supabase
- Vercel

## Funcionalidades implementadas

- Cadastro com e-mail e senha
- Login
- Redefinição de senha
- Proteção de rotas autenticadas
- Integração com banco via Supabase

## Estrutura do projeto

- `src/app`: rotas e páginas (App Router)
- `src/components`: componentes reutilizáveis de UI
- `src/lib`: clientes/configuração de Supabase, validações e utilitários
- `src/services`: regras de serviço (ex.: precificação e formatação)
- `supabase`: schema, seed e migrations SQL
- `docs`: documentação técnica e operacional

## Como rodar localmente

1. Clonar o repositório:

```bash
git clone https://github.com/the-dv/marketnow.git
cd marketnow
```

2. Instalar dependências:

```bash
npm install
```

3. Criar o arquivo `.env.local` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Executar em desenvolvimento:

```bash
npm run dev
```

## Decisões técnicas

- Next.js App Router para separar claramente rotas públicas e autenticadas.
- Supabase como BaaS para autenticação e persistência com RLS.
- Frontend consumindo apenas chaves públicas e sessão do usuário autenticado.

## Considerações de segurança

- RLS habilitado no Supabase para isolamento de dados por usuário.
- Uso somente de `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend.
- Segredos e variáveis de ambiente protegidos no painel da Vercel.

## Checklist de produção

- Fluxos principais validados em produção (login, cadastro e reset).
- Build e lint executados antes de publicar.
- Variáveis de ambiente revisadas no projeto Vercel.

## Licença

MIT
